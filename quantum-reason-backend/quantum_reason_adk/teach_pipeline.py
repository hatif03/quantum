"""Sequential K2 teach pipeline: plan → diagram lesson → compile → explain."""

import json
import logging
from typing import Any, Optional

from .k2_client import StreamEventCallback, stream_chat
from .prompts.diagram_generator import PROMPT as DIAGRAM_CORRECTION_PROMPT
from .prompts.diagram_lesson import PROMPT as DIAGRAM_LESSON_PROMPT
from .prompts.lesson_planner import PROMPT as LESSON_PLANNER_PROMPT
from .prompts.math_explainer import PROMPT as MATH_EXPLAINER_PROMPT
from .logging.session_logger import SessionLogger
from .response_extractors import (
    build_diagram_lesson_fallback,
    extract_diagram_lesson,
    extract_json_object,
    extract_lesson_plan,
    extract_tikz,
    is_valid_tikz,
    normalize_tikz_string,
)
from .shared_libraries.config import config
from .tools.latex_compiler import validate_tikz_compilation
from .tools.tikz_validation import tikz_passes_precheck

logger = logging.getLogger(__name__)

PARSE_FALLBACK_SUMMARY = (
    "Lesson outline could not be fully parsed; diagrams and math below may be incomplete."
)

CORRECTION_SUFFIX = (
    "\n\n**Operating Mode**: Mode 2: Code Correction. "
    "Fix the failed TikZ using the compilation log. Output status report then ```tikz``` block only."
)


async def _emit_step(
    on_event: Optional[StreamEventCallback], step: str
) -> None:
    if on_event is None:
        return
    result = on_event({"type": "step", "step": step})
    if result is not None:
        await result


async def _emit_partial(
    on_event: Optional[StreamEventCallback], payload: dict[str, Any]
) -> None:
    if on_event is None:
        return
    result = on_event({"type": "partial", **payload})
    if result is not None:
        await result


def build_safe_summary(
    *,
    lesson_summary: str = "",
    plan: Optional[dict[str, Any]] = None,
    parse_ok: bool = True,
) -> str:
    """User-facing summary only — never raw K2 chain-of-thought."""
    if lesson_summary and lesson_summary.strip():
        return lesson_summary.strip()

    if plan:
        name = plan.get("process_name") or plan.get("processName") or ""
        goals = plan.get("teaching_goals") or plan.get("teachingGoals") or []
        if name and str(name).strip():
            summary = str(name).strip()
            if goals and isinstance(goals[0], str):
                summary += f" — {goals[0]}"
            return summary

    if not parse_ok:
        return PARSE_FALLBACK_SUMMARY

    return ""


def _build_user_message(
    user_prompt: str,
    *,
    examples: Optional[list] = None,
    style_hint: Optional[str] = None,
    extra: Optional[str] = None,
) -> str:
    parts = [user_prompt]
    if style_hint:
        parts.append(f"\nStyle hint: {style_hint}")
    if extra:
        parts.append(extra)
    if examples:
        parts.append("\n\nRelevant examples from knowledge base:\n")
        parts.append(json.dumps(examples, indent=2, default=str)[:8000])
    return "\n".join(parts)


def _normalize_panels(lesson: dict[str, Any]) -> list[dict[str, Any]]:
    panels = lesson.get("panels") or []
    if not isinstance(panels, list):
        return []
    max_panels = config.teach.max_panels
    normalized: list[dict[str, Any]] = []
    for idx, raw in enumerate(panels[:max_panels]):
        if not isinstance(raw, dict):
            continue
        tikz = normalize_tikz_string(str(raw.get("tikz") or raw.get("tikz_code") or ""))
        if not tikz or not is_valid_tikz(tikz):
            continue
        normalized.append(
            {
                "id": raw.get("id") or f"panel_{idx + 1}",
                "title": raw.get("title") or f"Step {idx + 1}",
                "caption": raw.get("caption") or "",
                "tikz": tikz,
                "annotation_latex": raw.get("annotation_latex")
                or raw.get("annotationLatex")
                or [],
                "linked_step_index": raw.get("linked_step_index")
                if raw.get("linked_step_index") is not None
                else raw.get("linkedStepIndex"),
            }
        )
    return normalized


async def _compile_panel(
    panel: dict[str, Any],
    *,
    user_prompt: str,
    lesson_text: str = "",
    session_log: Optional[SessionLogger] = None,
    on_event: Optional[StreamEventCallback] = None,
) -> dict[str, Any]:
    """Compile panel TikZ; retry with K2 correction on failure."""
    code = panel.get("tikz") or ""
    ok_pre, code = tikz_passes_precheck(code)
    if not ok_pre and lesson_text:
        recovered = extract_tikz(lesson_text)
        if recovered:
            ok_pre, code = tikz_passes_precheck(recovered)
    if not ok_pre:
        panel["compile_ok"] = False
        panel["compile_errors"] = ["Invalid or corrupt TikZ (JSON escape damage)"]
        if session_log:
            session_log.log_panel_compile(
                str(panel.get("id")),
                tikz=code or panel.get("tikz") or "",
                ok=False,
                errors=panel["compile_errors"],
            )
        return panel

    panel["tikz"] = code
    retries = config.teach.compile_retries
    last_log = ""

    for attempt in range(retries + 1):
        result = validate_tikz_compilation(code)
        png = result.get("png_base64")
        analysis = result.get("analysis") or {}
        errors = list(analysis.get("errors") or [])
        if result.get("error"):
            errors.append(str(result["error"]))
        last_log = (result.get("log_content") or "")[-4000:]

        log_text = result.get("log_content") or ""
        ok = bool(result.get("success")) and png and is_valid_tikz(code)
        if ok and log_text and "begintikzpicture" in log_text.lower():
            ok = False
            errors.append("Compiled output looks like corrupt TikZ text")
        if ok:
            panel["image_url"] = png
            panel["image_width"] = result.get("png_width")
            panel["image_height"] = result.get("png_height")
            panel["compile_ok"] = True
            if session_log:
                session_log.log_panel_compile(
                    str(panel.get("id")),
                    tikz=code,
                    ok=True,
                    log_content=log_text,
                )
            return panel

        if attempt >= retries:
            panel["compile_ok"] = False
            panel["compile_errors"] = errors
            if session_log:
                session_log.log_panel_compile(
                    str(panel.get("id")),
                    tikz=code,
                    ok=False,
                    log_content=last_log,
                    errors=errors,
                )
            return panel

        correction_user = (
            f"Original user request: {user_prompt}\n\n"
            f"Panel: {panel.get('id')} — {panel.get('title')}\n\n"
            f"Failed TikZ:\n```tikz\n{code}\n```\n\n"
            f"Compilation errors:\n{json.dumps(errors, indent=2)}\n\n"
            f"Log excerpt:\n{last_log[-2000:]}"
        )
        text = await stream_chat(
            system=DIAGRAM_CORRECTION_PROMPT + CORRECTION_SUFFIX,
            user=correction_user,
            phase="tikz_correction",
            on_event=on_event,
        )
        fixed = extract_tikz(text)
        if fixed:
            code = fixed
            panel["tikz"] = code

    panel["compile_ok"] = False
    return panel


async def run_teach_pipeline(
    user_prompt: str,
    *,
    examples: Optional[list] = None,
    style_hint: Optional[str] = None,
    on_event: Optional[StreamEventCallback] = None,
    session_log: Optional[SessionLogger] = None,
) -> dict[str, Any]:
    state: dict[str, Any] = {
        "user_request": user_prompt,
        "workflow_step": "lesson_planner",
        "parse_warnings": [],
    }

    await _emit_step(on_event, "lesson_planner")
    plan_text = await stream_chat(
        system=LESSON_PLANNER_PROMPT,
        user=_build_user_message(user_prompt, style_hint=style_hint),
        phase="lesson_planner",
        on_event=on_event,
    )
    if session_log:
        session_log.log_raw_response("lesson_planner", plan_text)
    plan = extract_lesson_plan(plan_text)
    if plan:
        state["lesson_plan"] = plan
        if session_log:
            session_log.log_parsed("lesson_plan", plan)
        await _emit_partial(on_event, {"lesson_plan": plan})
    else:
        state["parse_warnings"].append("lesson_plan")
        if session_log:
            session_log.log_parse_warning("lesson_plan")
        logger.warning("Lesson plan JSON not extracted from K2 response")
    state["plan_response"] = plan_text
    state["workflow_step"] = "diagram_lesson"

    await _emit_step(on_event, "diagram_lesson")
    plan_json = json.dumps(plan or {"panel_outline": []}, indent=2)
    lesson_user = _build_user_message(
        user_prompt,
        examples=examples,
        style_hint=style_hint,
        extra=f"\n\nLesson plan to follow:\n{plan_json}",
    )
    lesson_text = await stream_chat(
        system=DIAGRAM_LESSON_PROMPT,
        user=lesson_user,
        phase="diagram_lesson",
        on_event=on_event,
    )
    if session_log:
        session_log.log_raw_response("diagram_lesson", lesson_text)
    lesson_raw = extract_diagram_lesson(lesson_text)
    if not lesson_raw:
        lesson_raw = build_diagram_lesson_fallback(lesson_text, plan)
        if lesson_raw:
            logger.info("Diagram lesson recovered from TikZ blocks + plan outline")
    panels = _normalize_panels(lesson_raw or {})
    if lesson_raw and panels:
        if session_log:
            session_log.log_parsed("diagram_lesson", lesson_raw)
        await _emit_partial(
            on_event,
            {"diagram_lesson": {"summary": lesson_raw.get("summary", ""), "panels": panels}},
        )
    elif not panels:
        state["parse_warnings"].append("diagram_lesson")
        if session_log:
            session_log.log_parse_warning("diagram_lesson")
        logger.warning(
            "Diagram lesson JSON not extracted from K2 response (len=%d, has_fence=%s, has_tikz=%s)",
            len(lesson_text),
            "```json" in lesson_text.lower(),
            bool(extract_tikz(lesson_text)),
        )
    state["diagram_lesson_raw"] = lesson_raw
    state["lesson_response"] = lesson_text
    state["workflow_step"] = "compile_panels"

    await _emit_step(on_event, "compile_panels")
    compiled_panels: list[dict[str, Any]] = []
    diagram_images: dict[str, str] = {}
    for panel in panels:
        compiled = await _compile_panel(
            panel,
            user_prompt=user_prompt,
            lesson_text=lesson_text,
            session_log=session_log,
            on_event=on_event,
        )
        compiled_panels.append(compiled)
        if compiled.get("image_url"):
            diagram_images[str(compiled["id"])] = compiled["image_url"]

    lesson_summary = (lesson_raw or {}).get("summary") or ""
    state["diagram_lesson"] = {"panels": compiled_panels, "summary": lesson_summary}
    state["diagram_images"] = diagram_images

    if compiled_panels:
        last_ok = next(
            (p for p in reversed(compiled_panels) if p.get("compile_ok")),
            compiled_panels[-1],
        )
        state["tikz_code"] = last_ok.get("tikz")
        if last_ok.get("image_url"):
            state["tikz_image"] = last_ok["image_url"]

    state["workflow_step"] = "math_explainer"
    await _emit_step(on_event, "math_explainer")
    context = json.dumps(
        {
            "lesson_plan": plan,
            "diagram_lesson": {
                "summary": lesson_summary,
                "panels": [
                    {
                        "id": p.get("id"),
                        "title": p.get("title"),
                        "caption": p.get("caption"),
                        "compile_ok": p.get("compile_ok"),
                    }
                    for p in compiled_panels
                ],
            },
        },
        indent=2,
        default=str,
    )[:12000]

    math_text = await stream_chat(
        system=MATH_EXPLAINER_PROMPT,
        user=_build_user_message(
            user_prompt,
            style_hint=style_hint,
            extra=f"\n\nTeaching context:\n{context}",
        ),
        phase="math_explainer",
        on_event=on_event,
    )
    if session_log:
        session_log.log_raw_response("math_explainer", math_text)
    math = extract_json_object(math_text, prefer_keys=("topic", "derivation_steps"))
    if math:
        state["math_explanation"] = math
        if session_log:
            session_log.log_parsed("math_explanation", math)
        await _emit_partial(on_event, {"math_explanation": math})
    else:
        state["parse_warnings"].append("math_explanation")
        if session_log:
            session_log.log_parse_warning("math_explanation")
        logger.warning(
            "Math explanation JSON not extracted from K2 response (len=%d, has_fence=%s). Tail: %s",
            len(math_text),
            "```json" in math_text.lower(),
            math_text[-2000:] if math_text else "",
        )
    state["math_response"] = math_text
    state["workflow_step"] = "complete"

    parse_ok = not state["parse_warnings"]
    state["final_response"] = build_safe_summary(
        lesson_summary=lesson_summary,
        plan=plan,
        parse_ok=parse_ok,
    )
    return state

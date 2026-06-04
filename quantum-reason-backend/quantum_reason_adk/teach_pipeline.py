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
    check_feynman_diagram_issues,
    extract_diagram_lesson,
    extract_json_object,
    extract_lesson_plan,
    extract_panel_tikz_from_lesson,
    extract_tikz,
    is_cot_leak,
    is_feynman_tikz,
    is_placeholder_tikz,
    is_valid_tikz,
    normalize_tikz_string,
    sanitize_annotation_latex,
)
from .shared_libraries.config import config
from .tools.latex_compiler import (
    extract_latex_log_errors,
    png_has_diagram_content,
    validate_tikz_compilation,
)

logger = logging.getLogger(__name__)

MAX_PNG_ASPECT_RATIO = 8.0
MIN_PNG_CONTENT_PX = 80
MIN_PNG_DIAGRAM_PX = 120

PARSE_FALLBACK_SUMMARY = (
    "Lesson outline could not be fully parsed; diagrams and math below may be incomplete."
)

CORRECTION_SUFFIX = (
    "\n\n**Operating Mode**: Mode 2: Code Correction. "
    "Fix the failed TikZ using the compilation log. "
    "Output MUST use ONLY \\feynmandiagram[horizontal=a to b] { ... } with leg syntax:\n"
    "  i1 [particle=\\(\\gamma\\)] -- [photon] v1,\n"
    "  v1 -- [fermion] o1 [particle=\\(e^-\\)],\n"
    "  v1 -- [fermion] o2 [particle=\\(e^+\\)]\n"
    "For Z/W bosons use -- [boson], not -- [photon]. "
    "Use vertex ids i1, v1, o1, o2 only (no underscores). "
    "Do NOT use \\vertex, \\node, or \\draw inside \\feynmandiagram. "
    "Output status report then ```tikz``` block only."
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
    history: Optional[list] = None,
    prior_tikz: Optional[str] = None,
) -> str:
    parts: list[str] = []
    if history:
        parts.append("Conversation history (most recent last):")
        for turn in history[-12:]:
            role = turn.get("role") if isinstance(turn, dict) else turn.role
            content = turn.get("content") if isinstance(turn, dict) else turn.content
            parts.append(f"{role}: {content}")
        parts.append("")
    if prior_tikz:
        parts.append("Previous TikZ diagram to refine:\n```tikz\n" + prior_tikz[:6000] + "\n```\n")
    parts.append(user_prompt)
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
                "annotation_latex": sanitize_annotation_latex(
                    raw.get("annotation_latex") or raw.get("annotationLatex") or []
                ),
                "linked_step_index": raw.get("linked_step_index")
                if raw.get("linked_step_index") is not None
                else raw.get("linkedStepIndex"),
            }
        )
    return normalized


def _png_aspect_ok(width: Optional[int], height: Optional[int]) -> bool:
    """Reject PNGs that look like an uncropped page (tiny diagram in huge canvas)."""
    if not width or not height or width <= 0 or height <= 0:
        return True
    short_side = min(width, height)
    long_side = max(width, height)
    ratio = long_side / short_side
    if long_side > 1200 and short_side < MIN_PNG_CONTENT_PX:
        return False
    if ratio > MAX_PNG_ASPECT_RATIO and short_side < 150:
        return False
    return True


def _png_content_ok(width: Optional[int], height: Optional[int]) -> bool:
    """Reject tiny PNGs that likely contain only a label, not a full diagram."""
    if not width or not height or width <= 0 or height <= 0:
        return True
    return max(width, height) >= MIN_PNG_DIAGRAM_PX


def _resolve_panel_tikz(panel: dict[str, Any], lesson_text: str) -> str:
    """Pick the best TikZ source for a panel (fenced blocks beat JSON placeholders)."""
    panel_id = str(panel.get("id") or "")
    code = normalize_tikz_string(str(panel.get("tikz") or ""))
    from_lesson = extract_panel_tikz_from_lesson(lesson_text, panel_id)
    if code and is_valid_tikz(code) and not is_placeholder_tikz(code):
        return code
    if from_lesson and is_valid_tikz(from_lesson):
        return from_lesson
    if lesson_text:
        fallback = extract_tikz(lesson_text)
        if fallback and is_valid_tikz(fallback):
            return normalize_tikz_string(fallback)
    return code


async def _compile_panel(
    panel: dict[str, Any],
    *,
    user_prompt: str,
    lesson_text: str = "",
    session_log: Optional[SessionLogger] = None,
    on_event: Optional[StreamEventCallback] = None,
) -> dict[str, Any]:
    """Compile panel TikZ; retry with K2 correction on failure."""
    code = _resolve_panel_tikz(panel, lesson_text)
    if not code or not is_valid_tikz(code):
        panel["compile_ok"] = False
        panel["compile_errors"] = ["No valid TikZ block found for this panel"]
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
        syntax_issues = check_feynman_diagram_issues(code)
        if syntax_issues:
            errors = syntax_issues
            last_log = "Static feynman syntax check failed (no pdflatex run)."
            ok = False
            png = None
        else:
            result = validate_tikz_compilation(code)
            png = result.get("png_base64")
            analysis = result.get("analysis") or {}
            errors = extract_latex_log_errors(result.get("log_content") or "")
            if not errors:
                errors = list(analysis.get("errors") or [])
            if result.get("error"):
                errors.append(str(result["error"]))
            last_log = (result.get("log_content") or "")[-4000:]

            log_text = result.get("log_content") or ""
            png_w = result.get("png_width")
            png_h = result.get("png_height")
            ok = bool(result.get("success")) and png and is_valid_tikz(code)
            if ok and not is_feynman_tikz(code):
                ok = False
                errors.append("Panel TikZ must use \\feynmandiagram, not manual draw-only tikzpicture")
            if ok and not _png_aspect_ok(png_w, png_h):
                ok = False
                errors.append(
                    f"Compiled PNG looks uncropped ({png_w}x{png_h}); diagram may be too small to read"
                )
            if ok and not _png_content_ok(png_w, png_h):
                ok = False
                errors.append(
                    f"Compiled diagram too small ({png_w}x{png_h}); layout likely failed"
                )
            if ok and not png_has_diagram_content(png):
                ok = False
                ink = result.get("png_ink_ratio")
                errors.append(
                    "Compiled PNG lacks visible diagram lines (layout/crop failure)"
                    + (f"; ink ratio {ink:.4f}" if isinstance(ink, (int, float)) else "")
                )
            if ok:
                panel["image_url"] = png
                panel["image_width"] = png_w
                panel["image_height"] = png_h
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
        if (
            fixed
            and is_feynman_tikz(fixed)
            and not is_cot_leak(fixed)
        ):
            code = normalize_tikz_string(fixed)
            panel["tikz"] = code

    panel["compile_ok"] = False
    return panel


async def run_teach_pipeline(
    user_prompt: str,
    *,
    examples: Optional[list] = None,
    style_hint: Optional[str] = None,
    history: Optional[list] = None,
    prior_tikz: Optional[str] = None,
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
        user=_build_user_message(
            user_prompt, style_hint=style_hint, history=history, prior_tikz=prior_tikz
        ),
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
        history=history,
        prior_tikz=prior_tikz,
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

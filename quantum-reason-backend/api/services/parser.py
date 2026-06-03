"""Parse workflow state into API response schemas."""

import json
import logging
from typing import Any, Optional

from quantum_reason_adk.response_extractors import (
    is_cot_leak,
    is_math_schema_echo,
    sanitize_reasoning_trace,
)
from quantum_reason_adk.schemas import (
    DerivationStep,
    DiagramLesson,
    DiagramPanel,
    FinalAnswer,
    LessonPlan,
    MathExplanation,
    normalize_math_domain,
    PanelOutline,
    PhysicsValidationReport,
    RuleValidationReport,
    TikzSnippet,
    ValidationReport,
)

logger = logging.getLogger(__name__)


def _as_dict(value: Any) -> Optional[dict]:
    if value is None:
        return None
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return {"raw": value}
    return None


def _parse_validation_report(raw: Any) -> Optional[ValidationReport]:
    data = _as_dict(raw)
    if not data:
        return None
    if "ok" in data:
        return ValidationReport(**data)
    return ValidationReport(
        ok=not bool(data.get("errors")),
        errors=data.get("errors") or [],
        warnings=data.get("warnings") or [],
        details=json.dumps(data, default=str)[:2000],
    )


def _parse_physics_report(raw: Any) -> Optional[PhysicsValidationReport]:
    data = _as_dict(raw)
    if not data:
        return None
    rules = []
    for item in data.get("validation_report") or []:
        if isinstance(item, dict):
            rules.append(RuleValidationReport(**item))
    return PhysicsValidationReport(
        user_process=data.get("user_process") or data.get("userProcess") or "",
        validation_report=rules,
        overall_conclusion=data.get("overall_conclusion")
        or data.get("overallConclusion")
        or "",
    )


def _parse_math_explanation(raw: Any) -> Optional[MathExplanation]:
    data = _as_dict(raw)
    if not data:
        return None
    if is_math_schema_echo(data):
        logger.warning(
            "Math explanation rejected: K2 echoed prompt schema (topic=%r)",
            data.get("topic"),
        )
        return None
    steps = []
    for item in data.get("derivation_steps") or data.get("derivationSteps") or []:
        if isinstance(item, dict):
            steps.append(DerivationStep(**item))
    if not steps:
        return None
    topic = data.get("topic") or ""
    if not topic or str(topic).strip().lower() == "physics explanation":
        if not steps:
            return None
    return MathExplanation(
        topic=str(topic).strip() or "Physics explanation",
        domain=normalize_math_domain(data.get("domain")),
        prerequisites=data.get("prerequisites") or [],
        key_equations=data.get("key_equations") or data.get("keyEquations") or [],
        derivation_steps=steps,
        physical_interpretation=data.get("physical_interpretation")
        or data.get("physicalInterpretation")
        or "",
        diagram_connection=data.get("diagram_connection") or data.get("diagramConnection"),
        reasoning_trace=sanitize_reasoning_trace(
            data.get("reasoning_trace") or data.get("reasoningTrace")
        ),
    )


def _sanitize_summary(
    summary: Any,
    *,
    diagram_lesson: Optional[DiagramLesson],
    lesson_plan: Optional[LessonPlan],
) -> Optional[str]:
    if summary is None:
        text = None
    else:
        text = str(summary).strip() or None
    if text and is_cot_leak(text):
        text = None
    if text:
        return text
    if diagram_lesson and diagram_lesson.summary:
        return diagram_lesson.summary
    if lesson_plan and lesson_plan.process_name:
        name = lesson_plan.process_name.strip()
        if lesson_plan.teaching_goals:
            return f"{name} — {lesson_plan.teaching_goals[0]}"
        return name
    return None


def _parse_lesson_plan(raw: Any) -> Optional[LessonPlan]:
    data = _as_dict(raw)
    if not data:
        return None
    outlines = []
    for item in data.get("panel_outline") or data.get("panelOutline") or []:
        if isinstance(item, dict):
            outlines.append(
                PanelOutline(
                    id=item.get("id") or "",
                    title=item.get("title") or "",
                    purpose=item.get("purpose") or "",
                )
            )
    return LessonPlan(
        process_name=data.get("process_name") or data.get("processName") or "",
        particles=data.get("particles") or [],
        teaching_goals=data.get("teaching_goals") or data.get("teachingGoals") or [],
        panel_outline=outlines,
    )


def _parse_diagram_lesson(raw: Any, images: dict) -> Optional[DiagramLesson]:
    data = _as_dict(raw)
    if not data:
        return None
    panels = []
    for item in data.get("panels") or []:
        if not isinstance(item, dict):
            continue
        pid = str(item.get("id") or "")
        image_url = item.get("image_url") or item.get("imageUrl") or images.get(pid)
        panels.append(
            DiagramPanel(
                id=pid,
                title=item.get("title") or "",
                caption=item.get("caption") or "",
                tikz=item.get("tikz") or "",
                annotation_latex=item.get("annotation_latex")
                or item.get("annotationLatex")
                or [],
                linked_step_index=item.get("linked_step_index")
                if item.get("linked_step_index") is not None
                else item.get("linkedStepIndex"),
                image_url=image_url,
                image_width=item.get("image_width") or item.get("imageWidth"),
                image_height=item.get("image_height") or item.get("imageHeight"),
                compile_ok=item.get("compile_ok") if "compile_ok" in item else item.get("compileOk"),
                compile_errors=item.get("compile_errors")
                or item.get("compileErrors")
                or [],
            )
        )
    return DiagramLesson(
        panels=panels,
        summary=data.get("summary") or "",
    )


def _extract_tikz(state: dict) -> Optional[TikzSnippet]:
    code = state.get("tikz_code") or state.get("tikzCode")
    if not code:
        final = state.get("final_response") or state.get("finalResponse") or ""
        if "\\feynmandiagram" in final or "\\begin{tikzpicture}" in final:
            code = final
    if not code:
        return None
    if isinstance(code, dict):
        return TikzSnippet(**code)
    return TikzSnippet(code=str(code).strip())


def state_to_final_answer(state: dict) -> FinalAnswer:
    compile_report = _parse_validation_report(
        state.get("tikz_validation_report") or state.get("tikzValidationReport")
    )
    physics_report = _parse_physics_report(
        state.get("physics_validation_report") or state.get("physicsValidationReport")
    )
    math_explanation = _parse_math_explanation(
        state.get("math_explanation") or state.get("mathExplanation")
    )
    tikz = _extract_tikz(state)
    diagram_lesson = _parse_diagram_lesson(
        state.get("diagram_lesson") or state.get("diagramLesson"),
        state.get("diagram_images") or state.get("diagramImages") or {},
    )
    lesson_plan = _parse_lesson_plan(state.get("lesson_plan") or state.get("lessonPlan"))

    summary = _sanitize_summary(
        state.get("final_response") or state.get("finalResponse"),
        diagram_lesson=diagram_lesson,
        lesson_plan=lesson_plan,
    )
    if summary and len(summary) > 500:
        summary = summary[:500].rstrip() + "…"

    if not compile_report and tikz:
        compile_report = ValidationReport(ok=True, warnings=[], errors=[])

    diagram_images = state.get("diagram_images") or state.get("diagramImages") or {}
    if not isinstance(diagram_images, dict):
        diagram_images = {}

    return FinalAnswer(
        tikz=tikz,
        physics_report=physics_report,
        compile_report=compile_report,
        math_explanation=math_explanation,
        summary=summary,
        parse_warnings=state.get("parse_warnings") or [],
        tikz_image=state.get("tikz_image") or state.get("tikzImage"),
        lesson_plan=lesson_plan,
        diagram_lesson=diagram_lesson,
        diagram_images=diagram_images,
        workflow_step=state.get("workflow_step") or state.get("workflowStep"),
        debug_session_id=state.get("debug_session_id") or state.get("debugSessionId"),
        quiz_questions=state.get("quiz_questions") or [],
        convention_warnings=state.get("convention_warnings") or [],
    )

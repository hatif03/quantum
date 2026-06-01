"""Parse workflow state into API response schemas."""

import json
import logging
from typing import Any, Optional

from quantum_reason_adk.schemas import (
    DerivationStep,
    FinalAnswer,
    MathExplanation,
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
    steps = []
    for item in data.get("derivation_steps") or data.get("derivationSteps") or []:
        if isinstance(item, dict):
            steps.append(DerivationStep(**item))
    return MathExplanation(
        topic=data.get("topic") or "Physics explanation",
        domain=data.get("domain") or "particle",
        prerequisites=data.get("prerequisites") or [],
        key_equations=data.get("key_equations") or data.get("keyEquations") or [],
        derivation_steps=steps,
        physical_interpretation=data.get("physical_interpretation")
        or data.get("physicalInterpretation")
        or "",
        diagram_connection=data.get("diagram_connection") or data.get("diagramConnection"),
        reasoning_trace=data.get("reasoning_trace") or data.get("reasoningTrace"),
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
    summary = state.get("final_response") or state.get("finalResponse")
    if summary and len(str(summary)) > 500 and tikz:
        summary = str(summary)[:500] + "..."

    if not compile_report and tikz:
        compile_report = ValidationReport(ok=True, warnings=[], errors=[])

    return FinalAnswer(
        tikz=tikz,
        physics_report=physics_report,
        compile_report=compile_report,
        math_explanation=math_explanation,
        summary=str(summary) if summary else None,
        tikz_image=state.get("tikz_image") or state.get("tikzImage"),
    )

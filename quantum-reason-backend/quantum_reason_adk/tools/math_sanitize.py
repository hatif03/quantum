"""Repair common K2 LaTeX mistakes in math explainer output."""

from __future__ import annotations

import re
from typing import Any

_UNBRACED_BAR = re.compile(r"\\bar\\([a-zA-Z]+)")
_CHAINED_SUBSCRIPT = re.compile(r"_\\([a-zA-Z]+)_\\([a-zA-Z]+)")
_SUBSCRIPT_SUPERSCRIPT = re.compile(r"_\{([^}]*)\^-\}")


def repair_latex_string(s: str) -> str:
    """Fix unbraced subscripts and \\bar commands before KaTeX rendering."""
    if not s or not isinstance(s, str):
        return s

    t = s
    t = _UNBRACED_BAR.sub(lambda m: f"\\bar{{\\{m.group(1)}}}", t)
    t = _CHAINED_SUBSCRIPT.sub(
        lambda m: f"_{{\\{m.group(1)}_\\{m.group(2)}}}", t
    )
    t = _SUBSCRIPT_SUPERSCRIPT.sub(r"_{\1^{-}}", t)
    return t


def _sanitize_string_list(items: Any) -> list[str]:
    if not isinstance(items, list):
        return []
    return [repair_latex_string(str(x)) for x in items if x is not None]


def sanitize_math_explanation(data: dict[str, Any]) -> dict[str, Any]:
    """Return a copy of math JSON with repaired LaTeX strings."""
    if not isinstance(data, dict):
        return data

    out = dict(data)
    if out.get("topic"):
        out["topic"] = repair_latex_string(str(out["topic"]))
    out["prerequisites"] = _sanitize_string_list(out.get("prerequisites"))
    out["key_equations"] = _sanitize_string_list(out.get("key_equations"))

    steps = out.get("derivation_steps") or out.get("derivationSteps") or []
    sanitized_steps: list[dict[str, Any]] = []
    for raw in steps:
        if not isinstance(raw, dict):
            continue
        step = dict(raw)
        step["latex"] = _sanitize_string_list(step.get("latex"))
        for key in ("prose", "intuition", "common_mistake", "commonMistake", "title"):
            if step.get(key):
                step[key] = repair_latex_string(str(step[key]))
        sanitized_steps.append(step)
    out["derivation_steps"] = sanitized_steps

    for key in ("physical_interpretation", "physicalInterpretation"):
        if out.get(key):
            out[key] = repair_latex_string(str(out[key]))
    for key in ("diagram_connection", "diagramConnection"):
        if out.get(key):
            out[key] = repair_latex_string(str(out[key]))
    if out.get("reasoning_trace") or out.get("reasoningTrace"):
        trace_key = "reasoning_trace" if out.get("reasoning_trace") else "reasoningTrace"
        out[trace_key] = repair_latex_string(str(out[trace_key]))

    return out

"""TikZ validation with heuristic pre-check and optional pdflatex compilation."""

import json

from ..schemas import ValidationReport
from .latex_compiler import validate_tikz_compilation


def _validate_tikz_syntax(tikz_code: str, packages: list) -> dict:
    result = {
        "syntax_valid": True,
        "structure_valid": True,
        "syntax_errors": [],
        "structure_issues": [],
        "warnings": [],
        "quality_score": 100,
    }

    if not (
        ("\\begin{tikzpicture}" in tikz_code and "\\end{tikzpicture}" in tikz_code)
        or "\\feynmandiagram" in tikz_code
    ):
        result["structure_issues"].append(
            "Missing tikzpicture environment or feynmandiagram command"
        )
        result["structure_valid"] = False

    feynman_patterns = ["\\feynmandiagram", "\\begin{feynman}", "\\vertex", "\\diagram"]
    if not any(pattern in tikz_code for pattern in feynman_patterns):
        result["warnings"].append("No TikZ-Feynman specific commands detected")

    brace_count = tikz_code.count("{") - tikz_code.count("}")
    if brace_count != 0:
        result["syntax_errors"].append(f"Mismatched braces: {abs(brace_count)} unmatched")
        result["syntax_valid"] = False

    bracket_count = tikz_code.count("[") - tikz_code.count("]")
    if bracket_count != 0:
        result["syntax_errors"].append(f"Mismatched brackets: {abs(bracket_count)} unmatched")
        result["syntax_valid"] = False

    error_penalty = len(result["syntax_errors"]) * 20
    structure_penalty = len(result["structure_issues"]) * 15
    warning_penalty = len(result["warnings"]) * 5
    result["quality_score"] = max(0, 100 - error_penalty - structure_penalty - warning_penalty)
    return result


def compile_tikz_tool(tikz_code: str, additional_packages: str = "") -> str:
    """Validate TikZ; return JSON ValidationReport string."""
    packages = []
    if additional_packages.strip():
        packages = [p.strip() for p in additional_packages.split(",") if p.strip()]

    heuristic = _validate_tikz_syntax(tikz_code, packages)
    errors = list(heuristic["syntax_errors"]) + list(heuristic["structure_issues"])
    warnings = list(heuristic["warnings"])

    compile_ok = False
    compile_details = None

    if heuristic["syntax_valid"] and heuristic["structure_valid"]:
        try:
            compile_result = validate_tikz_compilation(tikz_code, packages or None)
            compile_ok = bool(compile_result.get("success"))
            compile_details = compile_result.get("analysis") or compile_result.get("error")
            if not compile_ok:
                analysis = compile_result.get("analysis") or {}
                errors.extend(analysis.get("errors") or [])
                if compile_result.get("error"):
                    errors.append(str(compile_result["error"]))
                warnings.extend(analysis.get("warnings") or [])
        except Exception as exc:
            warnings.append(f"pdflatex unavailable: {exc}. Using heuristic validation only.")
            compile_ok = heuristic["quality_score"] >= 70
            compile_details = "Heuristic-only (LaTeX not installed)"
    else:
        compile_details = "Skipped pdflatex due to heuristic syntax failures"

    ok = compile_ok and not errors
    report = ValidationReport(
        ok=ok,
        errors=errors,
        warnings=warnings,
        details=json.dumps(
            {"heuristic_score": heuristic["quality_score"], "compile": compile_details},
            default=str,
        ),
    )
    return report.model_dump_json()

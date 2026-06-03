"""FastAPI routes for TikZ compilation."""

from fastapi import APIRouter, HTTPException

from quantum_reason_adk.schemas import CompileRequest, CompileResponse, ValidationReport
from quantum_reason_adk.tools.latex_compiler import validate_tikz_compilation

router = APIRouter()


def _compile_response_from_result(tikz: str, result: dict) -> CompileResponse:
    analysis = result.get("analysis") or {}
    errors = list(analysis.get("errors") or [])
    warnings = list(analysis.get("warnings") or [])
    if result.get("error"):
        errors.append(str(result["error"]))

    png = result.get("png_base64")
    ok = bool(result.get("success")) and not errors

    return CompileResponse(
        ok=ok,
        tikz_image=png if png else None,
        width=result.get("png_width"),
        height=result.get("png_height"),
        errors=errors,
        warnings=warnings,
        compile_report=ValidationReport(
            ok=ok,
            errors=errors,
            warnings=warnings,
            details=analysis.get("error_type"),
        ),
    )


@router.post("/compile", response_model=CompileResponse)
async def compile_tikz(req: CompileRequest):
    tikz = req.tikz.strip()
    if not tikz:
        raise HTTPException(status_code=400, detail="tikz code is required")

    try:
        result = validate_tikz_compilation(tikz)
        return _compile_response_from_result(tikz, result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

"""Workflow runner for Quantum Reason (OpenAI-compatible K2 client)."""

import json
import logging
import uuid
from typing import Optional

from quantum_reason_adk.pipelines import run_pipeline
from quantum_reason_adk.schemas import ValidationReport, WorkflowMode
from quantum_reason_adk.tools.latex_compiler import validate_tikz_compilation
from quantum_reason_adk.tools.kb.local import search_local_kb

from .parser import state_to_final_answer

logger = logging.getLogger(__name__)


class WorkflowRunner:
    async def run(
        self,
        user_prompt: str,
        mode: WorkflowMode = WorkflowMode.DIAGRAM,
        style_hint: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> tuple[str, dict]:
        session_id = session_id or str(uuid.uuid4())

        examples = None
        if mode in (WorkflowMode.DIAGRAM, WorkflowMode.BOTH):
            try:
                examples = search_local_kb(user_prompt, k=5)
            except Exception as exc:
                logger.warning("KB prefetch failed: %s", exc)
                examples = []

        state = await run_pipeline(
            mode,
            user_prompt,
            examples=examples,
            style_hint=style_hint,
        )

        code = state.get("tikz_code")
        if code and isinstance(code, str):
            try:
                compile_result = validate_tikz_compilation(code)
                png = compile_result.get("png_base64")
                if png:
                    state["tikz_image"] = png

                analysis = compile_result.get("analysis") or {}
                errors = list(analysis.get("errors") or [])
                warnings = list(analysis.get("warnings") or [])
                if compile_result.get("error"):
                    errors.append(str(compile_result["error"]))

                state["tikz_validation_report"] = ValidationReport(
                    ok=bool(compile_result.get("success")) and not errors,
                    errors=errors,
                    warnings=warnings,
                    details=json.dumps(
                        {"compile": analysis.get("error_type") or "pdflatex"},
                        default=str,
                    ),
                ).model_dump()
            except Exception as exc:
                logger.warning("TikZ compile check failed: %s", exc)

        return session_id, state_to_final_answer(state).model_dump()


workflow_runner = WorkflowRunner()

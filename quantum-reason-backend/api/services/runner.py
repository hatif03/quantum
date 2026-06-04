"""Workflow runner for Quantum Reason (OpenAI-compatible K2 client)."""

import asyncio
import json
import logging
import uuid
from collections.abc import AsyncIterator
from typing import Any, Optional

from quantum_reason_adk.agents.post_steps import apply_post_steps
from quantum_reason_adk.k2_client import StreamEventCallback
from quantum_reason_adk.logging.session_logger import SessionLogger
from quantum_reason_adk.pipelines import run_pipeline
from quantum_reason_adk.schemas import ValidationReport, WorkflowMode
from quantum_reason_adk.shared_libraries.config import config
from quantum_reason_adk.tools.latex_compiler import (
    png_has_diagram_content,
    validate_tikz_compilation,
)
from quantum_reason_adk.tools.kb.local import search_local_kb

from .parser import state_to_final_answer

logger = logging.getLogger(__name__)


class WorkflowRunner:
    async def _build_state(
        self,
        user_prompt: str,
        mode: WorkflowMode = WorkflowMode.DIAGRAM,
        style_hint: Optional[str] = None,
        history: Optional[list] = None,
        prior_tikz: Optional[str] = None,
        on_event: Optional[StreamEventCallback] = None,
        session_id: Optional[str] = None,
    ) -> dict[str, Any]:
        session_id = session_id or str(uuid.uuid4())
        examples = None
        if mode in (WorkflowMode.DIAGRAM, WorkflowMode.BOTH, WorkflowMode.TEACH):
            try:
                examples = search_local_kb(user_prompt, k=5)
            except Exception as exc:
                logger.warning("KB prefetch failed: %s", exc)
                examples = []

        session_log = SessionLogger(
            session_id,
            prompt=user_prompt,
            mode=str(mode.value if hasattr(mode, "value") else mode),
            model=config.models.k2_think_model,
        )
        state = await run_pipeline(
            mode,
            user_prompt,
            examples=examples,
            style_hint=style_hint,
            history=history,
            prior_tikz=prior_tikz,
            on_event=on_event,
            session_log=session_log,
        )
        state["debug_session_id"] = session_id
        session_log.finalize(state)
        apply_post_steps(state)

        code = state.get("tikz_code")
        if code and isinstance(code, str):
            try:
                compile_result = validate_tikz_compilation(code)
                png = compile_result.get("png_base64")
                analysis = compile_result.get("analysis") or {}
                errors = list(analysis.get("errors") or [])
                warnings = list(analysis.get("warnings") or [])
                if compile_result.get("error"):
                    errors.append(str(compile_result["error"]))

                compile_ok = bool(compile_result.get("success")) and bool(png)
                if compile_ok and not png_has_diagram_content(png):
                    compile_ok = False
                    ink = compile_result.get("png_ink_ratio")
                    errors.append(
                        "Compiled PNG lacks visible diagram lines (layout/crop failure)"
                        + (
                            f"; ink ratio {ink:.4f}"
                            if isinstance(ink, (int, float))
                            else ""
                        )
                    )
                if compile_ok and png:
                    state["tikz_image"] = png

                state["tikz_validation_report"] = ValidationReport(
                    ok=compile_ok and not errors,
                    errors=errors,
                    warnings=warnings,
                    details=json.dumps(
                        {
                            "compile": analysis.get("error_type") or "pdflatex",
                            "png_ink_ratio": compile_result.get("png_ink_ratio"),
                        },
                        default=str,
                    ),
                ).model_dump()
            except Exception as exc:
                logger.warning("TikZ compile check failed: %s", exc)

        return state

    async def run(
        self,
        user_prompt: str,
        mode: WorkflowMode = WorkflowMode.DIAGRAM,
        style_hint: Optional[str] = None,
        history: Optional[list] = None,
        prior_tikz: Optional[str] = None,
        session_id: Optional[str] = None,
        on_event: Optional[StreamEventCallback] = None,
    ) -> tuple[str, dict]:
        session_id = session_id or str(uuid.uuid4())
        state = await self._build_state(
            user_prompt,
            mode=mode,
            style_hint=style_hint,
            history=history,
            prior_tikz=prior_tikz,
            on_event=on_event,
            session_id=session_id,
        )
        answer = state_to_final_answer(state).model_dump()
        answer["debug_session_id"] = session_id
        return session_id, answer

    async def stream(
        self,
        user_prompt: str,
        mode: WorkflowMode = WorkflowMode.DIAGRAM,
        style_hint: Optional[str] = None,
        history: Optional[list] = None,
        prior_tikz: Optional[str] = None,
    ) -> AsyncIterator[str]:
        """Yield SSE lines: data: {json}\\n\\n"""
        queue: asyncio.Queue[Optional[dict[str, Any]]] = asyncio.Queue()

        async def on_event(payload: dict[str, Any]) -> None:
            await queue.put(payload)

        async def worker() -> None:
            try:
                _, result = await self.run(
                    user_prompt,
                    mode=mode,
                    style_hint=style_hint,
                    history=history,
                    prior_tikz=prior_tikz,
                    on_event=on_event,
                )
                await queue.put({"type": "done", "answer": result})
            except Exception as exc:
                logger.exception("Stream workflow failed")
                await queue.put({"type": "error", "message": str(exc)})
            finally:
                await queue.put(None)

        task = asyncio.create_task(worker())

        try:
            while True:
                item = await queue.get()
                if item is None:
                    break
                yield f"data: {json.dumps(item, default=str)}\n\n"
        finally:
            await task


workflow_runner = WorkflowRunner()

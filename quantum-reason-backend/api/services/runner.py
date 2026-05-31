"""Workflow runner for Quantum Reason (OpenAI-compatible K2 client)."""

import json
import logging
import uuid
from typing import Optional

from quantum_reason_adk.pipelines import run_pipeline
from quantum_reason_adk.schemas import WorkflowMode
from quantum_reason_adk.tools.tikz_validation import compile_tikz_tool
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
                report = json.loads(compile_tikz_tool(code))
                state["tikz_validation_report"] = report
            except Exception as exc:
                logger.warning("TikZ compile check failed: %s", exc)

        return session_id, state_to_final_answer(state).model_dump()


workflow_runner = WorkflowRunner()

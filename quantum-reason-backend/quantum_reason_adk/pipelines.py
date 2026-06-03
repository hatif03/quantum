"""Plain-Python workflow pipelines for Quantum Reason."""

import json
import logging
from typing import Any, Optional

from .k2_client import StreamEventCallback, stream_chat
from .response_extractors import extract_json_object, extract_tikz
from .logging.session_logger import SessionLogger
from .teach_pipeline import run_teach_pipeline
from .schemas import WorkflowMode
from .prompts.diagram_generator import PROMPT as DIAGRAM_PROMPT
from .prompts.math_explainer import PROMPT as MATH_EXPLAINER_PROMPT

logger = logging.getLogger(__name__)

DIAGRAM_SYSTEM_SUFFIX = (
    "\n\nYou may receive `examples` (KB snippets) in the user message. "
    "Generate compilable TikZ-Feynman code for the user request. "
    "Output a brief status report, then TikZ inside ```tikz fences."
)

BOTH_SYSTEM_SUFFIX = (
    "\n\nAlso explain the underlying physics briefly in valid JSON matching the math explainer schema. "
    "After the TikZ block, output the JSON object on its own."
)


def _build_user_message(
    user_prompt: str,
    *,
    examples: Optional[list] = None,
    style_hint: Optional[str] = None,
) -> str:
    parts = [user_prompt]
    if style_hint:
        parts.append(f"\nStyle hint: {style_hint}")
    if examples:
        parts.append("\n\nRelevant examples from knowledge base:\n")
        parts.append(json.dumps(examples, indent=2, default=str)[:8000])
    return "\n".join(parts)


async def run_diagram_pipeline(
    user_prompt: str,
    *,
    examples: Optional[list] = None,
    style_hint: Optional[str] = None,
    on_event: Optional[StreamEventCallback] = None,
) -> dict[str, Any]:
    system = DIAGRAM_PROMPT + DIAGRAM_SYSTEM_SUFFIX
    user = _build_user_message(user_prompt, examples=examples, style_hint=style_hint)
    text = await stream_chat(
        system=system, user=user, phase="diagram_generator", on_event=on_event
    )
    tikz = extract_tikz(text)
    state: dict[str, Any] = {"final_response": text, "user_request": user_prompt}
    if tikz:
        state["tikz_code"] = tikz
    return state


def _safe_explain_summary(math: Optional[dict[str, Any]]) -> str:
    """User-facing summary only — never raw K2 chain-of-thought."""
    if not math:
        return ""
    topic = str(math.get("topic") or "").strip()
    if topic:
        return topic
    return ""


async def run_explain_pipeline(
    user_prompt: str,
    *,
    on_event: Optional[StreamEventCallback] = None,
    session_log: Optional[SessionLogger] = None,
) -> dict[str, Any]:
    text = await stream_chat(
        system=MATH_EXPLAINER_PROMPT,
        user=user_prompt,
        phase="math_explainer",
        on_event=on_event,
    )
    if session_log:
        session_log.log_raw_response("math_explainer", text)
    math = extract_json_object(text)
    state: dict[str, Any] = {
        "user_request": user_prompt,
        "math_response": text,
        "parse_warnings": [],
    }
    if math:
        state["math_explanation"] = math
        if session_log:
            session_log.log_parsed("math_explanation", math)
        state["final_response"] = _safe_explain_summary(math)
    else:
        state["final_response"] = ""
        state["parse_warnings"].append("math_explanation")
        if session_log:
            session_log.log_parse_warning("math_explanation")
        logger.warning("Math explainer response did not contain parseable JSON")
    return state


async def run_both_pipeline(
    user_prompt: str,
    *,
    examples: Optional[list] = None,
    style_hint: Optional[str] = None,
) -> dict[str, Any]:
    system = DIAGRAM_PROMPT + DIAGRAM_SYSTEM_SUFFIX + BOTH_SYSTEM_SUFFIX
    user = _build_user_message(user_prompt, examples=examples, style_hint=style_hint)
    text = await stream_chat(system=system, user=user)
    tikz = extract_tikz(text)
    math = extract_json_object(text)
    state: dict[str, Any] = {"final_response": text, "user_request": user_prompt}
    if tikz:
        state["tikz_code"] = tikz
    if math:
        state["math_explanation"] = math
    return state


async def run_pipeline(
    mode: WorkflowMode,
    user_prompt: str,
    *,
    examples: Optional[list] = None,
    style_hint: Optional[str] = None,
    on_event: Optional[StreamEventCallback] = None,
    session_log: Optional[SessionLogger] = None,
) -> dict[str, Any]:
    if mode == WorkflowMode.EXPLAIN:
        return await run_explain_pipeline(
            user_prompt, on_event=on_event, session_log=session_log
        )
    if mode in (WorkflowMode.BOTH, WorkflowMode.TEACH):
        return await run_teach_pipeline(
            user_prompt,
            examples=examples,
            style_hint=style_hint,
            on_event=on_event,
            session_log=session_log,
        )
    return await run_diagram_pipeline(
        user_prompt,
        examples=examples,
        style_hint=style_hint,
        on_event=on_event,
    )

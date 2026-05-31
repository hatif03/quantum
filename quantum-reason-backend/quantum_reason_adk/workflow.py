"""ADK 2.x workflow orchestration for Quantum Reason."""

from google.adk.agents import LlmAgent

from .agent_factory import make_diagram_generator, make_math_explainer
from .sub_agents.diagram_generator_agent_prompt import PROMPT as DIAGRAM_GENERATOR_AGENT_PROMPT


def build_diagram_pipeline() -> LlmAgent:
    """Single-agent diagram path — K2 API requires streaming and rejects multi-turn tool payloads."""
    agent = make_diagram_generator()
    agent.instruction = (
        DIAGRAM_GENERATOR_AGENT_PROMPT
        + "\n\nSession state may include `examples` (KB snippets) and `user_request`. "
        "Generate compilable TikZ-Feynman code for the user request. "
        "Do not call transfer_to_agent or other tools."
    )
    return agent


def build_both_pipeline() -> LlmAgent:
    """Diagram + math in one agent call."""
    agent = make_diagram_generator()
    agent.instruction = (
        DIAGRAM_GENERATOR_AGENT_PROMPT
        + "\n\nAlso explain the underlying physics briefly. "
        "Use prefetched `examples` from session state if present. "
        "Do not call transfer_to_agent or other tools."
    )
    return agent


def build_explain_pipeline() -> LlmAgent:
    return make_math_explainer()


def get_workflow(mode: str = "diagram"):
    if mode == "explain":
        return build_explain_pipeline()
    if mode == "both":
        return build_both_pipeline()
    return build_diagram_pipeline()


quantum_reason_workflow = build_diagram_pipeline()
root_agent = quantum_reason_workflow

diagram_pipeline = quantum_reason_workflow
explain_pipeline = build_explain_pipeline()
both_pipeline = build_both_pipeline()

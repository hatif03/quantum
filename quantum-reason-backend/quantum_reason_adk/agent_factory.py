"""Factory functions for Quantum Reason sub-agents (one instance per pipeline)."""

from google.adk.agents import LlmAgent

from .models import (
    FEEDBACK_MODEL,
    GENERATOR_MODEL,
    KB_RETRIEVER_MODEL,
    MATH_EXPLAINER_MODEL,
    PHYSICS_VALIDATOR_MODEL,
    PLANNER_MODEL,
    TIKZ_VALIDATOR_MODEL,
)
from .sub_agents.diagram_generator_agent_prompt import PROMPT as DIAGRAM_GENERATOR_AGENT_PROMPT
from .sub_agents.feedback_agent_prompt import PROMPT as FEEDBACK_AGENT_PROMPT
from .sub_agents.kb_retriever_agent_prompt import PROMPT as KB_RETRIEVER_AGENT_PROMPT
from .sub_agents.math_explainer_agent_prompt import PROMPT as MATH_EXPLAINER_PROMPT
from .sub_agents.physics_validator_agent_prompt import PROMPT as PHYSICS_VALIDATOR_AGENT_PROMPT
from .sub_agents.planner_agent_prompt import PROMPT as PLANNER_AGENT_PROMPT
from .sub_agents.tikz_validator_agent_prompt import PROMPT as TIKZ_VALIDATOR_AGENT_PROMPT
from .sub_agents.tikz_validator_agent import tikz_after_callback


def make_process_planner() -> LlmAgent:
    return LlmAgent(
        model=PLANNER_MODEL,
        name="process_planner",
        description="Parses user prompt into an execution plan.",
        instruction=PLANNER_AGENT_PROMPT,
        output_key="plan",
        tools=[],
    )


def make_example_retriever() -> LlmAgent:
    return LlmAgent(
        model=KB_RETRIEVER_MODEL,
        name="example_retriever",
        description="Formats retrieved TikZ examples from session state.",
        instruction=KB_RETRIEVER_AGENT_PROMPT
        + "\n\nExamples are pre-loaded in session state under `examples`. Summarize the most relevant entries.",
        output_key="examples",
        tools=[],
        include_contents="none",
    )


def make_physics_validator() -> LlmAgent:
    return LlmAgent(
        model=PHYSICS_VALIDATOR_MODEL,
        name="physics_validator",
        description="Validates physics processes using rules and reasoning (no external tools).",
        instruction=PHYSICS_VALIDATOR_AGENT_PROMPT
        + "\n\nUse session state `plan`, `examples`, and the user request. Do not call external tools.",
        output_key="physics_validation_report",
        tools=[],
        include_contents="none",
    )


def make_diagram_generator() -> LlmAgent:
    return LlmAgent(
        model=GENERATOR_MODEL,
        name="diagram_generator",
        description="Generates TikZ Feynman diagrams.",
        instruction=DIAGRAM_GENERATOR_AGENT_PROMPT,
        output_key="tikz_code",
        tools=[],
    )


def make_tikz_validator() -> LlmAgent:
    return LlmAgent(
        model=TIKZ_VALIDATOR_MODEL,
        name="tikz_validator",
        description="Validates TikZ via heuristics and pdflatex.",
        instruction=TIKZ_VALIDATOR_AGENT_PROMPT,
        tools=[],
        output_key="tikz_validation_report",
        after_agent_callback=tikz_after_callback,
        include_contents="none",
    )


def make_math_explainer() -> LlmAgent:
    return LlmAgent(
        model=MATH_EXPLAINER_MODEL,
        name="math_explainer",
        description="Explains math behind quantum and particle physics.",
        instruction=MATH_EXPLAINER_PROMPT,
        output_key="math_explanation",
        tools=[],
    )


def make_response_synthesizer(suffix: str = "") -> LlmAgent:
    name = f"response_synthesizer{suffix}"
    return LlmAgent(
        model=FEEDBACK_MODEL,
        name=name,
        description="Synthesizes final user-facing response.",
        instruction=FEEDBACK_AGENT_PROMPT,
        output_key="final_response",
        tools=[],
        include_contents="none",
    )

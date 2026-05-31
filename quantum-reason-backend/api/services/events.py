"""Map ADK agent names to frontend workflow step IDs."""

AGENT_STEP_MAP = {
    "process_planner": "planner",
    "planner_agent": "planner",
    "example_retriever": "kb_retriever",
    "kb_retriever_agent": "kb_retriever",
    "physics_validator": "physics_validator",
    "physics_validator_agent": "physics_validator",
    "diagram_generator": "diagram_generator",
    "diagram_generator_agent": "diagram_generator",
    "generation_loop": "diagram_generator",
    "tikz_validator": "tikz_validator",
    "tikz_validator_agent": "tikz_validator",
    "math_explainer": "math_explainer",
    "response_synthesizer": "feedback",
    "response_synthesizer_diagram": "feedback",
    "response_synthesizer_explain": "feedback",
    "response_synthesizer_both": "feedback",
    "feedback_agent": "feedback",
    "diagram_pipeline": "planner",
    "explain_pipeline": "math_explainer",
    "both_pipeline": "planner",
}


def agent_to_step(author: str) -> str:
    return AGENT_STEP_MAP.get(author, author)

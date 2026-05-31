"""Model configurations for Quantum Reason agents."""

from .k2_models import get_k2_instruct_model, get_k2_think_model
from .shared_libraries.config import get_model_for_agent

# Reasoning agents — K2 Think v2
PLANNER_MODEL = get_model_for_agent("planner")
GENERATOR_MODEL = get_model_for_agent("generator")
PHYSICS_VALIDATOR_MODEL = get_model_for_agent("physics_validator")
MATH_EXPLAINER_MODEL = get_model_for_agent("math_explainer")

# Fast agents — K2 V2 Instruct
KB_RETRIEVER_MODEL = get_model_for_agent("kb_retriever")
TIKZ_VALIDATOR_MODEL = get_model_for_agent("tikz_validator")
FEEDBACK_MODEL = get_model_for_agent("feedback")

DEFAULT_MODEL = get_model_for_agent("default")

# Re-export for convenience
K2_THINK = get_k2_think_model
K2_INSTRUCT = get_k2_instruct_model

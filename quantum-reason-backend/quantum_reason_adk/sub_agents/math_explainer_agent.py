"""Math explainer agent for Quantum Reason."""

import json
import logging

from google.adk.agents import LlmAgent

from ..models import MATH_EXPLAINER_MODEL
from ..schemas import MathExplanation
from .math_explainer_agent_prompt import PROMPT as MATH_EXPLAINER_PROMPT

logger = logging.getLogger(__name__)


def parse_math_explanation(raw: str) -> dict:
    """Extract JSON object from model output."""
    text = raw.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        text = text[start : end + 1]
    return json.loads(text)


math_explainer = LlmAgent(
    model=MATH_EXPLAINER_MODEL,
    name="math_explainer",
    description="Explains crucial math behind quantum mechanics, QFT, and particle physics.",
    instruction=MATH_EXPLAINER_PROMPT,
    output_key="math_explanation",
)

MathExplainerAgent = math_explainer

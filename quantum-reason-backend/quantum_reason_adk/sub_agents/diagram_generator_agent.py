"""Diagram Generator Agent for Quantum Reason."""

from google.adk.agents import LlmAgent

from ..models import GENERATOR_MODEL
from .diagram_generator_agent_prompt import PROMPT as DIAGRAM_GENERATOR_AGENT_PROMPT

diagram_generator = LlmAgent(
    model=GENERATOR_MODEL,
    name="diagram_generator",
    description="Generates TikZ Feynman diagrams from natural language descriptions.",
    instruction=DIAGRAM_GENERATOR_AGENT_PROMPT,
    output_key="tikz_code",
)

DiagramGeneratorAgent = diagram_generator

# quantum_reason_adk/schemas.py
from enum import Enum
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator

_MATH_DOMAINS = frozenset({"qft", "qm", "stat_mech", "particle"})


def normalize_math_domain(value: object) -> str:
    """Coerce K2 output to a valid domain (handles schema echo like qft|qm|...)."""
    if value is None:
        return "particle"
    s = str(value).strip().lower()
    if s in _MATH_DOMAINS:
        return s
    if "|" in s:
        for part in s.split("|"):
            part = part.strip()
            if part in _MATH_DOMAINS:
                return part
    if "qft" in s:
        return "qft"
    if "stat_mech" in s:
        return "stat_mech"
    if s == "qm":
        return "qm"
    return "particle"


class Particle(BaseModel):
    name: str
    charge: float
    spin: float


class WorkflowMode(str, Enum):
    DIAGRAM = "diagram"
    EXPLAIN = "explain"
    BOTH = "both"
    TEACH = "teach"


class DiagramRequest(BaseModel):
    user_prompt: str
    style_hint: Optional[str] = None
    mode: WorkflowMode = WorkflowMode.DIAGRAM


class ExplainRequest(BaseModel):
    user_prompt: str
    context: Optional[str] = None


class PlanStep(str, Enum):
    RETRIEVE_EXAMPLES = "retrieve_examples"
    GENERATE_TIKZ = "generate_tikz"
    VALIDATE_TIKZ = "validate_tikz"
    VALIDATE_PHYSICS = "validate_physics"
    FEEDBACK = "feedback"
    EXPLAIN_MATH = "explain_math"


class Plan(BaseModel):
    steps: List[PlanStep] = Field(default_factory=list)
    original_prompt: str
    physics_process: Optional[str] = None
    particles_involved: List[str] = Field(default_factory=list)


class TikzSnippet(BaseModel):
    code: str
    description: Optional[str] = None


class ValidationReport(BaseModel):
    ok: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    details: Optional[str] = None


class RuleValidationReport(BaseModel):
    rule_number: int
    title: str
    validation_type: str = Field(description="Either 'text' or 'computational'.")
    passed: bool
    pass_fail_reason: str = Field(description="Explanation of why the rule passed or failed.")


class PhysicsValidationReport(BaseModel):
    user_process: str
    validation_report: List[RuleValidationReport]
    overall_conclusion: str


class PanelOutline(BaseModel):
    id: str
    title: str
    purpose: str = ""


class LessonPlan(BaseModel):
    process_name: str
    particles: List[str] = Field(default_factory=list)
    teaching_goals: List[str] = Field(default_factory=list)
    panel_outline: List[PanelOutline] = Field(default_factory=list)


class DiagramPanel(BaseModel):
    id: str
    title: str
    caption: str = ""
    tikz: str
    annotation_latex: List[str] = Field(default_factory=list)
    linked_step_index: Optional[int] = None
    image_url: Optional[str] = None
    image_width: Optional[int] = None
    image_height: Optional[int] = None
    compile_ok: Optional[bool] = None


class DiagramLesson(BaseModel):
    panels: List[DiagramPanel] = Field(default_factory=list)
    summary: str = ""


class DerivationStep(BaseModel):
    title: str
    latex: List[str] = Field(default_factory=list)
    prose: str
    panel_id: Optional[str] = None
    intuition: Optional[str] = None
    common_mistake: Optional[str] = None


class MathExplanation(BaseModel):
    topic: str
    domain: Literal["qft", "qm", "stat_mech", "particle"] = "particle"
    prerequisites: List[str] = Field(default_factory=list)
    key_equations: List[str] = Field(default_factory=list)
    derivation_steps: List[DerivationStep] = Field(default_factory=list)
    physical_interpretation: str = ""
    diagram_connection: Optional[str] = None
    reasoning_trace: Optional[str] = None

    @field_validator("domain", mode="before")
    @classmethod
    def _coerce_domain(cls, value: object) -> str:
        return normalize_math_domain(value)


class FinalAnswer(BaseModel):
    tikz: Optional[TikzSnippet] = None
    physics_report: Optional[PhysicsValidationReport] = None
    compile_report: Optional[ValidationReport] = None
    math_explanation: Optional[MathExplanation] = None
    summary: Optional[str] = None
    tikz_image: Optional[str] = None
    lesson_plan: Optional[LessonPlan] = None
    diagram_lesson: Optional[DiagramLesson] = None
    diagram_images: Dict[str, str] = Field(default_factory=dict)
    workflow_step: Optional[str] = None
    parse_warnings: List[str] = Field(default_factory=list)
    debug_session_id: Optional[str] = None


class ExplainResponse(BaseModel):
    math_explanation: MathExplanation
    summary: Optional[str] = None


class DiagramGenerationInput(BaseModel):
    user_prompt: str
    style_hint: Optional[str] = None
    examples: Optional[List[TikzSnippet]] = Field(default_factory=list)


class FeedbackAgentInput(BaseModel):
    generated_snippet: TikzSnippet
    physics_report: PhysicsValidationReport
    compile_report: ValidationReport


class WorkflowState(BaseModel):
    user_request: Optional[str] = None
    style_hint: Optional[str] = None
    mode: Optional[str] = None
    plan: Optional[Plan] = None
    examples: Optional[List[TikzSnippet]] = Field(default_factory=list)
    search_metadata: Optional[dict] = None
    tikz_code: Optional[str] = None
    generation_metadata: Optional[dict] = None
    tikz_validation_report: Optional[ValidationReport] = None
    physics_validation_report: Optional[PhysicsValidationReport] = None
    math_explanation: Optional[MathExplanation] = None
    final_response: Optional[str] = None
    workflow_step: Optional[str] = None
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class StateUpdate(BaseModel):
    agent_name: str
    output_key: str
    data: dict
    metadata: Optional[dict] = None

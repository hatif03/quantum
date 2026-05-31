/** Mirrors quantum_reason_adk/schemas.py for backend integration */

export type WorkflowMode = "diagram" | "explain" | "both";

export interface DiagramRequest {
  user_prompt: string;
  style_hint?: string | null;
  mode?: WorkflowMode;
}

export interface ExplainRequest {
  user_prompt: string;
  context?: string | null;
}

export type PlanStep =
  | "retrieve_examples"
  | "generate_tikz"
  | "validate_tikz"
  | "validate_physics"
  | "feedback"
  | "explain_math";

export interface Plan {
  steps: PlanStep[];
  original_prompt: string;
  physics_process?: string | null;
  particles_involved: string[];
}

export interface TikzSnippet {
  code: string;
  description?: string | null;
}

export interface ValidationReport {
  ok: boolean;
  errors: string[];
  warnings: string[];
  details?: string | null;
}

export interface RuleValidationReport {
  rule_number: number;
  title: string;
  validation_type: string;
  passed: boolean;
  pass_fail_reason: string;
}

export interface PhysicsValidationReport {
  user_process: string;
  validation_report: RuleValidationReport[];
  overall_conclusion: string;
}

export interface DerivationStep {
  title: string;
  latex: string[];
  prose: string;
}

export interface MathExplanation {
  topic: string;
  domain: "qft" | "qm" | "stat_mech" | "particle";
  prerequisites: string[];
  key_equations: string[];
  derivation_steps: DerivationStep[];
  physical_interpretation: string;
  diagram_connection?: string | null;
  reasoning_trace?: string | null;
}

export interface FinalAnswer {
  tikz?: TikzSnippet | null;
  physics_report?: PhysicsValidationReport | null;
  compile_report?: ValidationReport | null;
  math_explanation?: MathExplanation | null;
  summary?: string | null;
}

export interface ExplainResponse {
  math_explanation: MathExplanation;
  summary?: string | null;
}

export interface WorkflowState {
  user_request?: string | null;
  style_hint?: string | null;
  plan?: Plan | null;
  examples?: TikzSnippet[] | null;
  search_metadata?: Record<string, unknown> | null;
  tikz_code?: string | null;
  generation_metadata?: Record<string, unknown> | null;
  tikz_validation_report?: ValidationReport | null;
  physics_validation_report?: PhysicsValidationReport | null;
  math_explanation?: MathExplanation | null;
  final_response?: string | null;
  workflow_step?: string | null;
  errors: string[];
  warnings: string[];
}

export type WorkflowStepId =
  | "idle"
  | "planner"
  | "kb_retriever"
  | "physics_validator"
  | "diagram_generator"
  | "tikz_validator"
  | "math_explainer"
  | "feedback"
  | "complete"
  | "error";

export interface WorkflowEvent {
  step: string;
  author?: string;
  partial?: boolean;
  text?: string;
}

export interface ProcessExample {
  id: string;
  match: string[];
  title: string;
  short: string;
  confidence: string;
  particles: string[];
  diagramType: "annihilation" | "z_decay" | "compton" | "muon_decay";
  prompt: string;
  code: string;
}

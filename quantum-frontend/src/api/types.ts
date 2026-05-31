/** Types aligned with quantum_reason_adk/schemas.py */

export type WorkflowMode = "diagram" | "explain" | "both";

export interface DiagramRequest {
  user_prompt: string;
  style_hint?: string | null;
  mode?: WorkflowMode;
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

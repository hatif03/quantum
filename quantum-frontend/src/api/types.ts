/** Types aligned with quantum_reason_adk/schemas.py */

export type WorkflowMode = "diagram" | "explain" | "both" | "teach";

export interface DiagramRequest {
  user_prompt: string;
  style_hint?: string | null;
  mode?: WorkflowMode;
  history?: ChatTurn[];
  prior_tikz?: string | null;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface CompileRequest {
  tikz: string;
}

export interface CompileResponse {
  ok: boolean;
  tikz_image?: string | null;
  width?: number | null;
  height?: number | null;
  errors: string[];
  warnings: string[];
  compile_report?: ValidationReport | null;
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

export interface PanelOutline {
  id: string;
  title: string;
  purpose: string;
}

export interface LessonPlan {
  process_name: string;
  particles: string[];
  teaching_goals: string[];
  panel_outline: PanelOutline[];
}

export interface DiagramPanel {
  id: string;
  title: string;
  caption: string;
  tikz: string;
  annotation_latex: string[];
  linked_step_index?: number | null;
  image_url?: string | null;
  image_width?: number | null;
  image_height?: number | null;
  compile_ok?: boolean | null;
  compile_errors?: string[];
}

export interface DiagramLesson {
  panels: DiagramPanel[];
  summary: string;
}

export interface DerivationStep {
  title: string;
  latex: string[];
  prose: string;
  panel_id?: string | null;
  intuition?: string | null;
  common_mistake?: string | null;
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
  tikz_image?: string | null;
  lesson_plan?: LessonPlan | null;
  diagram_lesson?: DiagramLesson | null;
  diagram_images?: Record<string, string>;
  workflow_step?: string | null;
  parse_warnings?: string[];
  debug_session_id?: string | null;
  quiz_questions?: QuizQuestion[];
  convention_warnings?: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  answer: string;
}

export type WorkflowStepId =
  | "idle"
  | "lesson_planner"
  | "diagram_lesson"
  | "compile_panels"
  | "diagram_generator"
  | "math_explainer"
  | "complete"
  | "error";

export interface ProcessExample {
  id: string;
  match: string[];
  title: string;
  short: string;
  shortLatex: string;
  confidence: string;
  particles: string[];
  diagramType: "annihilation" | "z_decay" | "compton" | "muon_decay";
  prompt: string;
  code: string;
}

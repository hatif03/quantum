import type { WorkflowMode } from "../../api/types";

export function isTeachMode(mode: WorkflowMode): boolean {
  return mode === "both" || mode === "teach";
}

export const MODES: {
  id: WorkflowMode;
  label: string;
  hint: string;
}[] = [
  {
    id: "diagram",
    label: "Diagram",
    hint: "Draw the Feynman diagram and return TikZ code you can paste into a paper.",
  },
  {
    id: "explain",
    label: "Explain",
    hint: "Skip the sketch — get the physics math, key equations, and step-by-step reasoning.",
  },
  {
    id: "both",
    label: "Teach",
    hint: "Multi-panel diagrams with step-by-step math (sequential K2 pipeline, ~3–6 min).",
  },
];

export const STEP_LABELS: Record<string, string> = {
  lesson_planner: "Planning lesson…",
  diagram_lesson: "Building diagram panels…",
  compile_panels: "Compiling TikZ panels…",
  diagram_generator: "Generating TikZ…",
  math_explainer: "Explaining math…",
  complete: "Done",
};

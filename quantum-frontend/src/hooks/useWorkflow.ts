import { useCallback, useState } from "react";
import { generateDiagram } from "../api/client";
import { pickExample } from "../api/mock";
import type { FinalAnswer, WorkflowStepId } from "../api/types";

const STEP_MAP: Record<string, WorkflowStepId> = {
  planner: "planner",
  kb_retriever: "kb_retriever",
  physics_validator: "physics_validator",
  diagram_generator: "diagram_generator",
  tikz_validator: "tikz_validator",
  feedback: "feedback",
};

export function useWorkflow() {
  const [prompt, setPrompt] = useState(PROCESS_EXAMPLES_DEFAULT);
  const [activeStep, setActiveStep] = useState<WorkflowStepId>("idle");
  const [result, setResult] = useState<FinalAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const example = pickExample(prompt);

  const run = useCallback(async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    setActiveStep("planner");

    try {
      const answer = await generateDiagram(
        { user_prompt: prompt },
        (step) => {
          setActiveStep(STEP_MAP[step] ?? "planner");
        },
      );
      setResult(answer);
      setActiveStep("complete");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
      setActiveStep("error");
    } finally {
      setRunning(false);
    }
  }, [prompt]);

  return {
    prompt,
    setPrompt,
    example,
    activeStep,
    result,
    error,
    running,
    run,
  };
}

const PROCESS_EXAMPLES_DEFAULT =
  "Generate a Feynman diagram for electron-positron annihilation producing two photons";

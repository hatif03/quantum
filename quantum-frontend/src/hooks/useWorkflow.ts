import { useCallback, useState } from "react";
import {
  DiagramHttpError,
  DiagramNetworkError,
  generateDiagram,
} from "../api/client";
import { pickExample } from "../api/mock";
import type { FinalAnswer, WorkflowMode, WorkflowStepId } from "../api/types";

const STEP_MAP: Record<string, WorkflowStepId> = {
  planner: "planner",
  kb_retriever: "kb_retriever",
  physics_validator: "physics_validator",
  diagram_generator: "diagram_generator",
  tikz_validator: "tikz_validator",
  math_explainer: "math_explainer",
  feedback: "feedback",
};

export type WorkflowErrorKind = "network" | "http" | "unknown" | null;

export function useWorkflow() {
  const [prompt, setPrompt] = useState(PROCESS_EXAMPLES_DEFAULT);
  const [mode, setMode] = useState<WorkflowMode>("diagram");
  const [activeStep, setActiveStep] = useState<WorkflowStepId>("idle");
  const [result, setResult] = useState<FinalAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<WorkflowErrorKind>(null);
  const [offlineNotice, setOfflineNotice] = useState(false);
  const [running, setRunning] = useState(false);

  const example = pickExample(prompt);

  const runWithOptions = useCallback(
    async (forceMock = false) => {
      setRunning(true);
      setError(null);
      setErrorKind(null);
      setResult(null);
      if (!forceMock) {
        setOfflineNotice(false);
      }
      setActiveStep(mode === "explain" ? "math_explainer" : "planner");

      try {
        const answer = await generateDiagram(
          { user_prompt: prompt, mode },
          (step) => {
            setActiveStep(STEP_MAP[step] ?? "planner");
          },
          { forceMock },
        );
        setResult(answer);
        setActiveStep("complete");
        if (forceMock) {
          setOfflineNotice(true);
        }
      } catch (e) {
        if (e instanceof DiagramNetworkError) {
          setErrorKind("network");
          setError(e.message);
        } else if (e instanceof DiagramHttpError) {
          setErrorKind("http");
          setError(e.message);
        } else {
          setErrorKind("unknown");
          setError(e instanceof Error ? e.message : "Generation failed");
        }
        setActiveStep("error");
      } finally {
        setRunning(false);
      }
    },
    [prompt, mode],
  );

  const run = useCallback(() => runWithOptions(false), [runWithOptions]);

  const retryOffline = useCallback(() => runWithOptions(true), [runWithOptions]);

  return {
    prompt,
    setPrompt,
    mode,
    setMode,
    example,
    activeStep,
    result,
    error,
    errorKind,
    offlineNotice,
    running,
    run,
    retryOffline,
  };
}

const PROCESS_EXAMPLES_DEFAULT =
  "Generate a Feynman diagram for electron-positron annihilation producing two photons";

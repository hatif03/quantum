import { useEffect, useState } from "react";
import { pickExample } from "../../api/mock";
import { DiagramCanvas } from "../lab/DiagramCanvas";
import { ProcessInput } from "../lab/ProcessInput";
import { ResultPanel } from "../lab/ResultPanel";
import { WorkflowTimeline } from "../lab/WorkflowTimeline";
import { useWorkflow } from "../../hooks/useWorkflow";
import { JourneyChapter } from "./JourneyChapter";
import "./LabChapter.css";

export function LabChapter() {
  const {
    prompt,
    setPrompt,
    example,
    activeStep,
    result,
    error,
    running,
    run,
    agentSteps,
  } = useWorkflow();

  const [animating, setAnimating] = useState(false);
  const displayExample = result ? pickExample(prompt) : example;

  useEffect(() => {
    if (running) setAnimating(true);
    else if (activeStep === "complete") {
      const t = setTimeout(() => setAnimating(false), 1200);
      return () => clearTimeout(t);
    }
  }, [running, activeStep]);

  return (
    <JourneyChapter
      id="lab"
      eyebrow="Workbench"
      title="Draw your process"
      snap={false}
      className="journey-chapter--lab"
    >
      <p className="lab-chapter__lede">
        Describe a collision or decay in plain language. Six agents plan, validate
        physics, and return TikZ-Feynman code.
      </p>
      <div className="lab-chapter__grid">
        <ProcessInput
          value={prompt}
          onChange={setPrompt}
          onRun={run}
          running={running}
        />
        <DiagramCanvas
          example={displayExample}
          animating={animating || running}
        />
        <aside className="lab-chapter__aside">
          <WorkflowTimeline steps={agentSteps} activeStep={activeStep} />
          <ResultPanel result={result} error={error} />
        </aside>
      </div>
      <p className="lab-chapter__colophon">
        quantum — Feynman diagrams from plain language.
      </p>
    </JourneyChapter>
  );
}

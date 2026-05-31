import { lazy, Suspense, useEffect, useState } from "react";
import { pickExample } from "../api/mock";
import { DiagramCanvas } from "../components/lab/DiagramCanvas";
import { ProcessInput } from "../components/lab/ProcessInput";
import { ResultPanel } from "../components/lab/ResultPanel";
import { WorkflowTimeline } from "../components/lab/WorkflowTimeline";
import { useWorkflow } from "../hooks/useWorkflow";
import "./LabPage.css";

const ModelBackdrop = lazy(() =>
  import("../components/three/ModelBackdrop").then((m) => ({
    default: m.ModelBackdrop,
  })),
);

export function LabPage() {
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
  const displayExample = result
    ? pickExample(prompt)
    : example;

  useEffect(() => {
    if (running) {
      setAnimating(true);
    } else if (activeStep === "complete") {
      const t = setTimeout(() => setAnimating(false), 1200);
      return () => clearTimeout(t);
    }
  }, [running, activeStep]);

  return (
    <div className="page lab-page">
      <header className="lab-page__header">
        <p className="eyebrow">Interactive lab</p>
        <h1>Compose a process</h1>
        <p>Describe a collision or decay. Watch six agents plan, validate, and draw.</p>
      </header>

      <div className="lab-page__ambient">
        <Suspense fallback={null}>
          <ModelBackdrop model="fluid" className="lab-page__fluid" />
        </Suspense>
      </div>

      <div className="lab-page__grid">
        <ProcessInput
          value={prompt}
          onChange={setPrompt}
          onRun={run}
          running={running}
        />
        <DiagramCanvas example={displayExample} animating={animating || running} />
        <aside className="lab-page__aside">
          <WorkflowTimeline steps={agentSteps} activeStep={activeStep} />
          <ResultPanel result={result} error={error} />
        </aside>
      </div>
    </div>
  );
}

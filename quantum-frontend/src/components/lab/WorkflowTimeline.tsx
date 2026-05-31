import type { WorkflowStepId } from "../../api/types";
import "./WorkflowTimeline.css";

interface Step {
  id: WorkflowStepId;
  label: string;
}

interface WorkflowTimelineProps {
  steps: Step[];
  activeStep: WorkflowStepId;
}

const ORDER: WorkflowStepId[] = [
  "idle",
  "planner",
  "kb_retriever",
  "physics_validator",
  "diagram_generator",
  "tikz_validator",
  "feedback",
  "complete",
];

function stepIndex(id: WorkflowStepId): number {
  const i = ORDER.indexOf(id);
  return i < 0 ? 0 : i;
}

export function WorkflowTimeline({ steps, activeStep }: WorkflowTimelineProps) {
  const activeIdx = stepIndex(activeStep);

  return (
    <ol className="workflow-timeline panel" aria-label="Agent workflow progress">
      {steps.map((step, i) => {
        const idx = stepIndex(step.id);
        let status: "pending" | "active" | "done" | "error" = "pending";
        if (activeStep === "error") status = idx <= activeIdx ? "error" : "pending";
        else if (activeStep === "complete" || idx < activeIdx) status = "done";
        else if (idx === activeIdx && activeStep !== "idle") status = "active";

        return (
          <li
            key={step.id}
            className={`workflow-timeline__item workflow-timeline__item--${status}`}
          >
            <span className="workflow-timeline__index">{String(i + 1).padStart(2, "0")}</span>
            <span className="workflow-timeline__label">{step.label}</span>
            {status === "active" && (
              <span className="workflow-timeline__pulse" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

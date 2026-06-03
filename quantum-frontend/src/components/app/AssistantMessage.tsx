import { useState } from "react";
import { displaySummary, isMathSchemaEcho } from "../../api/cotLeak";
import { pickExample } from "../../api/mock";
import type { FinalAnswer, WorkflowMode } from "../../api/types";
import type { ChatMessage } from "../../types/chat";
import { renderMixedLatex } from "../sketch/MathBlock";
import { DiagramLessonView } from "../lab/DiagramLessonView";
import { ReasoningPanel } from "../lab/ReasoningPanel";
import { ThinkingTrace } from "../lab/ThinkingTrace";
import { TikzDiagram } from "../lab/TikzDiagram";
import { isTeachMode, STEP_LABELS } from "./chatConstants";
import { WorkflowErrorPanel } from "./WorkflowErrorPanel";
import "../lab/ChatWorkbench.css";

interface AssistantMessageProps {
  message: ChatMessage;
  userPrompt: string;
  running: boolean;
  onRetryOffline: () => void;
}

export function AssistantMessage({
  message,
  userPrompt,
  running,
  onRetryOffline,
}: AssistantMessageProps) {
  const [codeOpen, setCodeOpen] = useState(false);
  const [activePanelIndex, setActivePanelIndex] = useState(0);

  const workflowMode = message.mode ?? "diagram";
  const isStreaming =
    message.status === "pending" || message.status === "streaming";
  const isError = message.status === "error";
  const result = message.result;
  const displayExample = result ? pickExample(userPrompt) : pickExample(userPrompt);

  if (isError) {
    return (
      <WorkflowErrorPanel
        message={message.text}
        kind={message.errorKind ?? "unknown"}
        onRetryOffline={onRetryOffline}
        running={running}
      />
    );
  }

  return (
    <>
      {isStreaming && message.thinkingText && (
        <ThinkingTrace
          phase={message.thinkingPhase || message.activeStep || ""}
          text={message.thinkingText}
          running={isStreaming}
        />
      )}
      {isStreaming && (
        <>
          <p className="chat-workbench__status" aria-busy="true">
            Working…
          </p>
          {message.activeStep &&
            message.activeStep !== "idle" &&
            STEP_LABELS[message.activeStep] && (
              <p className="chat-workbench__step">
                {STEP_LABELS[message.activeStep]}
              </p>
            )}
        </>
      )}

      {isTeachMode(workflowMode) &&
        (result?.diagram_lesson?.panels?.length ? (
          <DiagramLessonView
            lesson={result.diagram_lesson}
            diagramImages={result.diagram_images}
            fallbackExample={displayExample}
            activeIndex={activePanelIndex}
            onActiveIndexChange={setActivePanelIndex}
          />
        ) : (
          <TikzDiagram
            example={displayExample}
            tikzImage={result?.tikz_image}
            animating={isStreaming}
          />
        ))}

      {workflowMode === "diagram" && (
        <TikzDiagram
          example={displayExample}
          tikzImage={result?.tikz_image}
          animating={isStreaming}
        />
      )}

      {result && (
        <AssistantResultBody
          result={result}
          mode={workflowMode}
          codeOpen={codeOpen}
          offlineNotice={message.offlineNotice ?? false}
          activePanelIndex={activePanelIndex}
          onToggleCode={() => setCodeOpen((o) => !o)}
        />
      )}
    </>
  );
}

function AssistantResultBody({
  result,
  mode,
  codeOpen,
  offlineNotice,
  activePanelIndex,
  onToggleCode,
}: {
  result: FinalAnswer;
  mode: WorkflowMode;
  codeOpen: boolean;
  offlineNotice: boolean;
  activePanelIndex: number;
  onToggleCode: () => void;
}) {
  const showMath = mode === "explain" || isTeachMode(mode);
  const activePanelId =
    result.diagram_lesson?.panels[activePanelIndex]?.id ?? null;
  const summaryText = displaySummary(result);
  const warnings = result.parse_warnings ?? [];
  const panelCount = result.diagram_lesson?.panels?.length ?? 0;
  const anyCompileOk =
    result.diagram_lesson?.panels?.some((p) => p.compile_ok) ?? false;
  const diagramWarning =
    isTeachMode(mode) &&
    (warnings.includes("diagram_lesson") ||
      (panelCount > 0 && !anyCompileOk));
  const mathIsPlaceholder =
    result.math_explanation != null && isMathSchemaEcho(result.math_explanation);
  const mathWarning =
    isTeachMode(mode) &&
    (warnings.includes("math_explanation") ||
      mathIsPlaceholder ||
      (!result.math_explanation && panelCount > 0 && !diagramWarning));
  const showMathPanel =
    showMath && result.math_explanation && !mathIsPlaceholder;
  const planWarning = isTeachMode(mode) && warnings.includes("lesson_plan");

  return (
    <div className="chat-workbench__result">
      {offlineNotice && (
        <p className="chat-workbench__offline-notice">
          Showing offline demo — start the backend for live K2 responses.
        </p>
      )}
      {diagramWarning && (
        <p className="chat-workbench__parse-warning" role="status">
          {panelCount === 0
            ? "Couldn't parse diagram lesson panels."
            : "Some diagram panels failed to compile."}
        </p>
      )}
      {mathWarning && !diagramWarning && (
        <p className="chat-workbench__parse-warning" role="status">
          {mathIsPlaceholder
            ? "Math explanation could not be parsed (template echoed). Rebuild the API image and try again, or check logs/sessions."
            : "Math explanation may be incomplete."}
        </p>
      )}
      {planWarning && panelCount >= 2 && !diagramWarning && (
        <p className="chat-workbench__parse-warning" role="status">
          Lesson plan outline was not fully parsed; panels may not match the plan.
        </p>
      )}
      {result.debug_session_id && (
        <p className="chat-workbench__debug-session" role="note">
          Debug session: <code>{result.debug_session_id}</code>
          {" — "}
          logs saved on server under{" "}
          <code>logs/sessions/{result.debug_session_id}</code>
        </p>
      )}
      {summaryText && (
        <p className="chat-workbench__summary">{renderMixedLatex(summaryText)}</p>
      )}

      {result.physics_report && (
        <p className="chat-workbench__meta">
          Physics: {result.physics_report.overall_conclusion}
          {result.compile_report && (
            <>
              {" · "}
              Compile: {result.compile_report.ok ? "OK" : "Failed"}
            </>
          )}
        </p>
      )}

      {showMathPanel && (
        <ReasoningPanel
          explanation={result.math_explanation!}
          activePanelId={activePanelId}
        />
      )}

      {result.tikz?.code && (mode === "diagram" || isTeachMode(mode)) && (
        <>
          <button
            type="button"
            className="chat-workbench__code-toggle"
            onClick={onToggleCode}
            aria-expanded={codeOpen}
          >
            {codeOpen ? "Hide TikZ" : "Show TikZ-Feynman code"}
          </button>
          {codeOpen && (
            <pre className="chat-workbench__code">
              <code>{result.tikz.code}</code>
            </pre>
          )}
        </>
      )}

      {!result.tikz_image &&
        !result.diagram_images &&
        result.tikz?.code &&
        mode === "diagram" && (
          <p className="chat-workbench__parse-warning" role="status">
            Diagram preview unavailable — TikZ source is saved. Re-run or copy the code below.
          </p>
        )}
    </div>
  );
}

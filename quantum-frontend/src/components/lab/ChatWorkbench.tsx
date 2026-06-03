import { useState } from "react";
import { displaySummary, isMathSchemaEcho } from "../../api/cotLeak";
import { pickExample, PROCESS_EXAMPLES } from "../../api/mock";
import { getApiBaseUrl } from "../../api/client";
import type { FinalAnswer, WorkflowMode } from "../../api/types";
import type { WorkflowErrorKind } from "../../hooks/useWorkflow";
import { useWorkflow } from "../../hooks/useWorkflow";
import { MathBlock, renderMixedLatex } from "../sketch/MathBlock";
import { DiagramLessonView } from "./DiagramLessonView";
import { ReasoningPanel } from "./ReasoningPanel";
import { ThinkingTrace } from "./ThinkingTrace";
import { TikzDiagram } from "./TikzDiagram";
import "./ChatWorkbench.css";

function isTeachMode(mode: WorkflowMode): boolean {
  return mode === "both" || mode === "teach";
}

const MODES: {
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

const STEP_LABELS: Record<string, string> = {
  lesson_planner: "Planning lesson…",
  diagram_lesson: "Building diagram panels…",
  compile_panels: "Compiling TikZ panels…",
  diagram_generator: "Generating TikZ…",
  math_explainer: "Explaining math…",
  complete: "Done",
};

export function ChatWorkbench() {
  const {
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
    thinkingText,
    thinkingPhase,
    run,
    retryOffline,
  } = useWorkflow();
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [codeOpen, setCodeOpen] = useState(false);
  const [activePanelIndex, setActivePanelIndex] = useState(0);

  const displayExample = result ? pickExample(prompt) : example;
  const hasThread = lastPrompt !== null;
  const activeMode = MODES.find((m) => m.id === mode)!;

  const handleSubmit = () => {
    const trimmed = prompt.trim();
    if (!trimmed || running) return;
    setLastPrompt(trimmed);
    setCodeOpen(false);
    setActivePanelIndex(0);
    void run();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="chat-workbench">
      <div className="chat-workbench__thread" role="log" aria-live="polite">
        {!hasThread && (
          <p className="chat-workbench__empty">
            Describe a particle process or ask for the math behind a quantum phenomenon.
          </p>
        )}

        {lastPrompt && (
          <div className="chat-workbench__message chat-workbench__message--user">
            <p>{lastPrompt}</p>
          </div>
        )}

        {hasThread && (
          <div className="chat-workbench__message chat-workbench__message--assistant">
            {error ? (
              <WorkflowError
                message={error}
                kind={errorKind}
                onRetryOffline={() => void retryOffline()}
                running={running}
              />
            ) : (
              <>
                {(running || thinkingText) && (
                  <ThinkingTrace
                    phase={thinkingPhase || activeStep}
                    text={thinkingText}
                    running={running}
                  />
                )}
                {running && (
                  <>
                    <p className="chat-workbench__status" aria-busy="true">
                      Working…
                    </p>
                    {activeStep !== "idle" && STEP_LABELS[activeStep] && (
                      <p className="chat-workbench__step">{STEP_LABELS[activeStep]}</p>
                    )}
                  </>
                )}
                {isTeachMode(mode) &&
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
                      animating={running}
                    />
                  ))}
                {mode === "diagram" && (
                  <TikzDiagram
                    example={displayExample}
                    tikzImage={result?.tikz_image}
                    animating={running}
                  />
                )}
                {result && (
                  <AssistantResult
                    result={result}
                    mode={mode}
                    codeOpen={codeOpen}
                    offlineNotice={offlineNotice}
                    activePanelIndex={activePanelIndex}
                    onToggleCode={() => setCodeOpen((o) => !o)}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="chat-workbench__composer">
        <div className="chat-workbench__composer-header">
          <span className="chat-workbench__composer-label">Describe a process</span>
          <span className="chat-workbench__composer-badge">Lab</span>
        </div>

        <fieldset className="chat-workbench__mode-fieldset">
          <legend className="chat-workbench__mode-legend">What do you want back?</legend>
          <div className="chat-workbench__mode" role="group" aria-label="Lab mode">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`chat-workbench__mode-btn${mode === m.id ? " chat-workbench__mode-btn--active" : ""}`}
                onClick={() => setMode(m.id)}
                disabled={running}
                aria-pressed={mode === m.id}
                title={m.hint}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="chat-workbench__mode-hint" id="mode-hint">
            {activeMode.hint}
          </p>
        </fieldset>

        <textarea
          id="process-prompt"
          className="chat-workbench__input"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. muon decay, Compton scattering, e⁺e⁻ → γγ…"
          aria-label="Process description"
          aria-describedby="mode-hint"
        />
        <div className="chat-workbench__actions">
          <div className="chat-workbench__chips" role="group" aria-label="Example processes">
            {PROCESS_EXAMPLES.map((ex) => (
              <button
                key={ex.id}
                type="button"
                className={`chat-workbench__chip${prompt === ex.prompt ? " chat-workbench__chip--active" : ""}`}
                onClick={() => setPrompt(ex.prompt)}
              >
                <MathBlock latex={ex.shortLatex} />
              </button>
            ))}
          </div>
          <div className="chat-workbench__send-row">
            <button
              type="button"
              className="btn btn--primary chat-workbench__send"
              onClick={handleSubmit}
              disabled={running || !prompt.trim()}
            >
              {running ? "…" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkflowError({
  message,
  kind,
  onRetryOffline,
  running,
}: {
  message: string;
  kind: WorkflowErrorKind;
  onRetryOffline: () => void;
  running: boolean;
}) {
  const apiBase = getApiBaseUrl();

  return (
    <div className="chat-workbench__error-panel" role="alert">
      <p className="chat-workbench__error-title">
        {kind === "network" ? "Backend unreachable" : "Request failed"}
      </p>
      <p className="chat-workbench__error">{message}</p>
      {kind === "network" && apiBase && (
        <p className="chat-workbench__error-hint">
          Start the API at <code>{apiBase}</code>, or try the offline demo below.
        </p>
      )}
      {(kind === "network" || kind === "http") && (
        <button
          type="button"
          className="btn chat-workbench__offline-btn"
          onClick={onRetryOffline}
          disabled={running}
        >
          {running ? "Loading…" : "Try offline demo"}
        </button>
      )}
    </div>
  );
}

function AssistantResult({
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
  const anyCompileOk = result.diagram_lesson?.panels?.some((p) => p.compile_ok) ?? false;
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
    </div>
  );
}

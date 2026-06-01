import { useState } from "react";
import { pickExample, PROCESS_EXAMPLES } from "../../api/mock";
import { getApiBaseUrl } from "../../api/client";
import type { FinalAnswer, WorkflowMode } from "../../api/types";
import type { WorkflowErrorKind } from "../../hooks/useWorkflow";
import { useWorkflow } from "../../hooks/useWorkflow";
import { MathBlock, renderMixedLatex } from "../sketch/MathBlock";
import { ReasoningPanel } from "./ReasoningPanel";
import { TikzDiagram } from "./TikzDiagram";
import "./ChatWorkbench.css";

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
    label: "Both",
    hint: "Full treatment: animated diagram plus mathematical explanation together.",
  },
];

const STEP_LABELS: Record<string, string> = {
  planner: "Planning…",
  kb_retriever: "Retrieving examples…",
  physics_validator: "Validating physics…",
  diagram_generator: "Generating TikZ…",
  tikz_validator: "Validating TikZ…",
  math_explainer: "Explaining math…",
  feedback: "Synthesizing response…",
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
    run,
    retryOffline,
  } = useWorkflow();
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [codeOpen, setCodeOpen] = useState(false);

  const displayExample = result ? pickExample(prompt) : example;
  const hasThread = lastPrompt !== null;
  const activeMode = MODES.find((m) => m.id === mode)!;

  const handleSubmit = () => {
    const trimmed = prompt.trim();
    if (!trimmed || running) return;
    setLastPrompt(trimmed);
    setCodeOpen(false);
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
                {(mode === "diagram" || mode === "both") && (
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
  onToggleCode,
}: {
  result: FinalAnswer;
  mode: WorkflowMode;
  codeOpen: boolean;
  offlineNotice: boolean;
  onToggleCode: () => void;
}) {
  const showMath = mode === "explain" || mode === "both";

  return (
    <div className="chat-workbench__result">
      {offlineNotice && (
        <p className="chat-workbench__offline-notice">
          Showing offline demo — start the backend for live K2 responses.
        </p>
      )}
      {result.summary && (
        <p className="chat-workbench__summary">{renderMixedLatex(result.summary)}</p>
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

      {showMath && result.math_explanation && (
        <ReasoningPanel explanation={result.math_explanation} />
      )}

      {result.tikz?.code && (mode === "diagram" || mode === "both") && (
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

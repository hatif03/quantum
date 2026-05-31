import { useState } from "react";
import { pickExample, PROCESS_EXAMPLES } from "../../api/mock";
import type { FinalAnswer } from "../../api/types";
import { useWorkflow } from "../../hooks/useWorkflow";
import { DiagramPreview } from "./DiagramPreview";
import "./ChatWorkbench.css";

export function ChatWorkbench() {
  const { prompt, setPrompt, example, result, error, running, run } = useWorkflow();
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [codeOpen, setCodeOpen] = useState(false);

  const displayExample = result ? pickExample(prompt) : example;
  const hasThread = lastPrompt !== null;

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
            Describe a particle process—e.g. electron-positron annihilation to two photons.
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
              <p className="chat-workbench__error" role="alert">
                {error}
              </p>
            ) : (
              <>
                {running && (
                  <p className="chat-workbench__status" aria-busy="true">
                    Generating…
                  </p>
                )}
                <DiagramPreview example={displayExample} animating={running} />
                {result && (
                  <AssistantResult
                    result={result}
                    codeOpen={codeOpen}
                    onToggleCode={() => setCodeOpen((o) => !o)}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="chat-workbench__composer">
        <textarea
          id="process-prompt"
          className="chat-workbench__input"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe a collision or decay…"
          aria-label="Process description"
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
                {ex.short}
              </button>
            ))}
          </div>
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
  );
}

function AssistantResult({
  result,
  codeOpen,
  onToggleCode,
}: {
  result: FinalAnswer;
  codeOpen: boolean;
  onToggleCode: () => void;
}) {
  return (
    <div className="chat-workbench__result">
      {result.summary && <p className="chat-workbench__summary">{result.summary}</p>}
      <p className="chat-workbench__meta">
        Physics: {result.physics_report.overall_conclusion}
        {" · "}
        Compile: {result.compile_report.ok ? "OK" : "Failed"}
      </p>
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
    </div>
  );
}

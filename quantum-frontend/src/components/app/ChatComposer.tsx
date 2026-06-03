import { forwardRef } from "react";
import type { WorkflowMode } from "../../api/types";
import { MODES } from "./chatConstants";
import "./ChatComposer.css";

interface ChatComposerProps {
  prompt: string;
  mode: WorkflowMode;
  running: boolean;
  onPromptChange: (value: string) => void;
  onModeChange: (mode: WorkflowMode) => void;
  onSubmit: () => void;
}

export const ChatComposer = forwardRef<HTMLTextAreaElement, ChatComposerProps>(
  function ChatComposer(
    { prompt, mode, running, onPromptChange, onModeChange, onSubmit },
    ref,
  ) {
    const activeMode = MODES.find((m) => m.id === mode)!;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSubmit();
      }
    };

    return (
      <div className="app-composer">
        <div className="app-composer__row">
          <div className="app-composer__modes" role="group" aria-label="Response mode">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`app-composer__mode${mode === m.id ? " app-composer__mode--active" : ""}`}
                onClick={() => onModeChange(m.id)}
                disabled={running}
                aria-pressed={mode === m.id}
                title={m.hint}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn--primary app-composer__send"
            onClick={onSubmit}
            disabled={running || !prompt.trim()}
            aria-label={running ? "Sending" : "Send message"}
          >
            {running ? "…" : "Send"}
          </button>
        </div>

        <textarea
          ref={ref}
          id="process-prompt"
          className="app-composer__input"
          rows={1}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe a process…"
          aria-label="Process description"
          aria-describedby="mode-hint"
        />
        <p id="mode-hint" className="sr-only">
          {activeMode.hint}
        </p>
      </div>
    );
  },
);

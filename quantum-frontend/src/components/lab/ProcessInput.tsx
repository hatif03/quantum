import { PROCESS_EXAMPLES } from "../../api/mock";
import "./ProcessInput.css";

interface ProcessInputProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  running: boolean;
}

export function ProcessInput({ value, onChange, onRun, running }: ProcessInputProps) {
  return (
    <div className="process-input panel">
      <label htmlFor="process-prompt" className="process-input__label">
        Particle process
      </label>
      <textarea
        id="process-prompt"
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe a collision or decay in plain language…"
      />
      <div className="process-input__chips" role="group" aria-label="Example processes">
        {PROCESS_EXAMPLES.map((ex) => (
          <button
            key={ex.id}
            type="button"
            className={`chip${value === ex.prompt ? " chip--active" : ""}`}
            onClick={() => onChange(ex.prompt)}
          >
            {ex.short}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn btn--primary process-input__run"
        onClick={onRun}
        disabled={running}
      >
        {running ? "Agents working…" : "Generate diagram"}
      </button>
    </div>
  );
}

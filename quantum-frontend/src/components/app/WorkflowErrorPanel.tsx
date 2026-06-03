import { getApiBaseUrl } from "../../api/client";
import type { WorkflowErrorKind } from "../../hooks/useWorkflow";
import "./WorkflowErrorPanel.css";

interface WorkflowErrorPanelProps {
  message: string;
  kind: WorkflowErrorKind;
  onRetryOffline: () => void;
  running: boolean;
}

export function WorkflowErrorPanel({
  message,
  kind,
  onRetryOffline,
  running,
}: WorkflowErrorPanelProps) {
  const apiBase = getApiBaseUrl();

  return (
    <div className="workflow-error" role="alert">
      <p className="workflow-error__title">
        {kind === "network" ? "Backend unreachable" : "Request failed"}
      </p>
      <p className="workflow-error__message">{message}</p>
      {kind === "network" && apiBase && (
        <p className="workflow-error__hint">
          Start the API at <code>{apiBase}</code>, or try the offline demo below.
        </p>
      )}
      {(kind === "network" || kind === "http") && (
        <button
          type="button"
          className="btn workflow-error__offline-btn"
          onClick={onRetryOffline}
          disabled={running}
        >
          {running ? "Loading…" : "Try offline demo"}
        </button>
      )}
    </div>
  );
}

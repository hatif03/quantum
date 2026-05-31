import type { FinalAnswer } from "../../api/types";
import "./ResultPanel.css";

interface ResultPanelProps {
  result: FinalAnswer | null;
  error: string | null;
}

export function ResultPanel({ result, error }: ResultPanelProps) {
  if (error) {
    return (
      <div className="result-panel panel result-panel--error" role="alert">
        <p className="result-panel__eyebrow">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="result-panel panel result-panel--empty">
        <p className="result-panel__eyebrow">Output</p>
        <p>Run the agents to receive TikZ-Feynman code and validation reports.</p>
      </div>
    );
  }

  return (
    <div className="result-panel panel">
      <p className="result-panel__eyebrow">Verified artifact</p>
      {result.summary && <p className="result-panel__summary">{result.summary}</p>}
      <p className="result-panel__status">
        Physics: {result.physics_report.overall_conclusion}
        <br />
        Compile: {result.compile_report.ok ? "OK" : "Failed"}
      </p>
      <pre className="result-panel__code" aria-label="Generated TikZ-Feynman code">
        <code>{result.tikz.code}</code>
      </pre>
    </div>
  );
}

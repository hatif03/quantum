import { useEffect, useRef } from "react";
import "./ThinkingTrace.css";

const PHASE_LABELS: Record<string, string> = {
  lesson_planner: "Planning lesson",
  diagram_lesson: "Building diagram panels",
  compile_panels: "Compiling TikZ",
  math_explainer: "Explaining math",
  diagram_generator: "Generating diagram",
  tikz_correction: "Fixing TikZ",
  default: "Thinking",
};

interface ThinkingTraceProps {
  phase: string;
  text: string;
  running: boolean;
  defaultOpen?: boolean;
}

export function ThinkingTrace({
  phase,
  text,
  running,
  defaultOpen,
}: ThinkingTraceProps) {
  const open = defaultOpen ?? running;
  const preRef = useRef<HTMLPreElement>(null);
  const label = PHASE_LABELS[phase] ?? PHASE_LABELS.default;

  useEffect(() => {
    const el = preRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [text]);

  if (!running && !text) {
    return null;
  }

  return (
    <details className="thinking-trace" open={open}>
      <summary className="thinking-trace__summary">
        K2 Think — {label}
        {running && <span className="thinking-trace__live">live</span>}
      </summary>
      <pre ref={preRef} className="thinking-trace__body">
        {text || (running ? "…" : "")}
      </pre>
    </details>
  );
}

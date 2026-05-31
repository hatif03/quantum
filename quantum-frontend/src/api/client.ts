import type {
  DiagramRequest,
  ExplainRequest,
  ExplainResponse,
  FinalAnswer,
  WorkflowEvent,
  WorkflowMode,
} from "./types";
import { mockGenerateDiagram } from "./mock";

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

export function hasBackend(): boolean {
  return API_BASE.length > 0;
}

const STEP_MAP: Record<string, string> = {
  planner: "planner",
  process_planner: "planner",
  kb_retriever: "kb_retriever",
  example_retriever: "kb_retriever",
  physics_validator: "physics_validator",
  diagram_generator: "diagram_generator",
  tikz_validator: "tikz_validator",
  math_explainer: "math_explainer",
  feedback: "feedback",
  response_synthesizer: "feedback",
};

export async function generateDiagram(
  req: DiagramRequest,
  onStep?: (step: string) => void,
  sessionId?: string,
): Promise<FinalAnswer> {
  if (!hasBackend()) {
    return mockGenerateDiagram(req, onStep);
  }

  if (sessionId) {
    const unsub = subscribeWorkflow(sessionId, (ev) => {
      const payload = ev as WorkflowEvent;
      if (payload.step) onStep?.(STEP_MAP[payload.step] ?? payload.step);
    });
    try {
      const res = await fetch(`${API_BASE}/api/diagram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(text || `Request failed (${res.status})`);
      }
      return res.json() as Promise<FinalAnswer>;
    } finally {
      unsub();
    }
  }

  const res = await fetch(`${API_BASE}/api/diagram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `Request failed (${res.status})`);
  }

  return res.json() as Promise<FinalAnswer>;
}

export async function explainPhysics(req: ExplainRequest): Promise<ExplainResponse> {
  if (!hasBackend()) {
    throw new Error("Explain mode requires VITE_API_BASE_URL");
  }

  const res = await fetch(`${API_BASE}/api/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `Request failed (${res.status})`);
  }

  return res.json() as Promise<ExplainResponse>;
}

export function subscribeWorkflow(
  sessionId: string,
  onEvent: (payload: WorkflowEvent) => void,
): () => void {
  if (!hasBackend()) return () => {};

  const source = new EventSource(
    `${API_BASE}/api/workflow/stream?session_id=${encodeURIComponent(sessionId)}`,
  );

  source.onmessage = (msg) => {
    try {
      onEvent(JSON.parse(msg.data) as WorkflowEvent);
    } catch {
      /* ignore malformed */
    }
  };

  return () => source.close();
}

export type { WorkflowMode };

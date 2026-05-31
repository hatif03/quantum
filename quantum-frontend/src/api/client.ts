import type { DiagramRequest, FinalAnswer } from "./types";
import { mockGenerateDiagram } from "./mock";

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

export function hasBackend(): boolean {
  return API_BASE.length > 0;
}

/**
 * Generate a diagram via backend or mock.
 * When VITE_API_BASE_URL is set, POST /api/diagram (future FastAPI/ADK wrapper).
 */
export async function generateDiagram(
  req: DiagramRequest,
  onStep?: (step: string) => void,
): Promise<FinalAnswer> {
  if (!hasBackend()) {
    return mockGenerateDiagram(req, onStep);
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

/** Stub for future streaming workflow updates (ADK session / SSE). */
export function subscribeWorkflow(
  _sessionId: string,
  _onEvent: (payload: unknown) => void,
): () => void {
  return () => {};
}

import type { DiagramRequest, FinalAnswer, WorkflowMode } from "./types";
import { mockGenerateDiagram } from "./mock";

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

function hasBackend(): boolean {
  return API_BASE.length > 0;
}

export async function generateDiagram(
  req: DiagramRequest,
  onStep?: (step: string) => void,
): Promise<FinalAnswer> {
  if (!hasBackend()) {
    return mockGenerateDiagram(req, onStep);
  }

  onStep?.(req.mode === "explain" ? "math_explainer" : "diagram_generator");

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

export type { WorkflowMode };

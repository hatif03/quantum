import type { DiagramRequest, FinalAnswer, WorkflowMode } from "./types";
import { mockGenerateDiagram } from "./mock";

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

export class DiagramNetworkError extends Error {
  readonly apiBase: string;

  constructor(message: string, apiBase: string) {
    super(message);
    this.name = "DiagramNetworkError";
    this.apiBase = apiBase;
  }
}

export class DiagramHttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "DiagramHttpError";
    this.status = status;
  }
}

function hasBackend(): boolean {
  return API_BASE.length > 0;
}

export function getApiBaseUrl(): string {
  return API_BASE;
}

export async function generateDiagramOffline(
  req: DiagramRequest,
  onStep?: (step: string) => void,
): Promise<FinalAnswer> {
  return mockGenerateDiagram(req, onStep);
}

export async function generateDiagram(
  req: DiagramRequest,
  onStep?: (step: string) => void,
  options?: { forceMock?: boolean },
): Promise<FinalAnswer> {
  if (!hasBackend() || options?.forceMock) {
    return mockGenerateDiagram(req, onStep);
  }

  onStep?.(req.mode === "explain" ? "math_explainer" : "diagram_generator");

  try {
    const res = await fetch(`${API_BASE}/api/diagram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new DiagramHttpError(
        text || `Request failed (${res.status})`,
        res.status,
      );
    }

    return res.json() as Promise<FinalAnswer>;
  } catch (e) {
    if (e instanceof DiagramHttpError) {
      throw e;
    }
    if (
      e instanceof TypeError ||
      (e instanceof Error &&
        (e.message.includes("Failed to fetch") || e.message.includes("NetworkError")))
    ) {
      throw new DiagramNetworkError(
        `Can't reach the physics backend at ${API_BASE}. Is it running? If uvicorn is up, your Vite port may not match CORS (e.g. 5174 vs 5173).`,
        API_BASE,
      );
    }
    throw e;
  }
}

export type { WorkflowMode };

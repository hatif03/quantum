import type { CompileRequest, CompileResponse, DiagramRequest, FinalAnswer, WorkflowMode } from "./types";
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

export type DiagramStreamHandlers = {
  onStep?: (step: string) => void;
  onThinking?: (phase: string, delta: string) => void;
};

function isNetworkFailure(e: unknown): boolean {
  return (
    e instanceof TypeError ||
    (e instanceof Error &&
      (e.message.includes("Failed to fetch") || e.message.includes("NetworkError")))
  );
}

async function parseSseStream(
  res: Response,
  handlers?: DiagramStreamHandlers,
): Promise<FinalAnswer> {
  if (!res.body) {
    throw new Error("Stream response has no body");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer: FinalAnswer | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      for (const line of part.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const payload = JSON.parse(line.slice(6)) as {
          type: string;
          step?: string;
          phase?: string;
          delta?: string;
          message?: string;
          answer?: FinalAnswer;
        };

        if (payload.type === "step" && payload.step) {
          handlers?.onStep?.(payload.step);
        }
        if (payload.type === "thinking" && payload.phase && payload.delta) {
          handlers?.onThinking?.(payload.phase, payload.delta);
        }
        if (payload.type === "done" && payload.answer) {
          answer = payload.answer;
        }
        if (payload.type === "error") {
          throw new DiagramHttpError(payload.message ?? "Stream failed", 500);
        }
      }
    }
  }

  if (!answer) {
    throw new Error("Stream ended without a final answer");
  }
  return answer;
}

export async function generateDiagramStream(
  req: DiagramRequest,
  handlers?: DiagramStreamHandlers,
): Promise<FinalAnswer> {
  try {
    const res = await fetch(`${API_BASE}/api/diagram/stream`, {
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

    return parseSseStream(res, handlers);
  } catch (e) {
    if (e instanceof DiagramHttpError) {
      throw e;
    }
    if (isNetworkFailure(e)) {
      throw new DiagramNetworkError(
        `Can't reach the physics backend at ${API_BASE}. Is it running? If uvicorn is up, your Vite port may not match CORS (e.g. 5174 vs 5173).`,
        API_BASE,
      );
    }
    throw e;
  }
}

export async function generateDiagram(
  req: DiagramRequest,
  onStep?: (step: string) => void,
  options?: { forceMock?: boolean; onThinking?: (phase: string, delta: string) => void },
): Promise<FinalAnswer> {
  if (!hasBackend() || options?.forceMock) {
    return mockGenerateDiagram(req, onStep);
  }

  const handlers: DiagramStreamHandlers = {
    onStep,
    onThinking: options?.onThinking,
  };

  return generateDiagramStream(req, handlers);
}

export async function compileTikz(tikz: string): Promise<CompileResponse> {
  if (!hasBackend()) {
    return {
      ok: false,
      errors: ["Backend not configured — set VITE_API_BASE_URL to compile TikZ."],
      warnings: [],
    };
  }

  const req: CompileRequest = { tikz };
  try {
    const res = await fetch(`${API_BASE}/api/compile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new DiagramHttpError(
        text || `Compile failed (${res.status})`,
        res.status,
      );
    }

    return (await res.json()) as CompileResponse;
  } catch (e) {
    if (e instanceof DiagramHttpError) {
      throw e;
    }
    if (isNetworkFailure(e)) {
      throw new DiagramNetworkError(
        `Can't reach the physics backend at ${API_BASE}.`,
        API_BASE,
      );
    }
    throw e;
  }
}

export type { WorkflowMode };

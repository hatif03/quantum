import type { FeynmanEdgeKind, FeynmanGraph } from "../types/graph";

const EDGE_KIND_MAP: Record<string, FeynmanEdgeKind> = {
  fermion: "fermion",
  "anti fermion": "fermion",
  photon: "photon",
  boson: "boson",
  scalar: "scalar",
};

/** Heuristic bootstrap from common TikZ-Feynman one-vertex topologies. */
export function tikzToGraph(tikz: string): FeynmanGraph | null {
  if (!tikz.includes("\\feynmandiagram")) {
    return null;
  }

  const legRe =
    /i(\d+)\s*\[particle=\\?\(([^)]+)\)\]\s*--\s*\[([^\]]+)\]\s*(\w+)/gi;
  const legs: { index: number; label: string; edgeKind: FeynmanEdgeKind; vertexId: string }[] =
    [];
  let match: RegExpExecArray | null;
  while ((match = legRe.exec(tikz)) !== null) {
    const edgeToken = match[3].trim().toLowerCase();
    legs.push({
      index: Number(match[1]),
      label: match[2].trim(),
      edgeKind: EDGE_KIND_MAP[edgeToken] ?? "fermion",
      vertexId: match[4],
    });
  }

  if (legs.length < 2) {
    return null;
  }

  const vertexId = legs[0].vertexId;
  const cx = 200;
  const cy = 120;
  const radius = 140;

  const nodes = [
    {
      id: vertexId,
      kind: "vertex" as const,
      label: "v",
      x: cx,
      y: cy,
    },
    ...legs.map((leg, i) => {
      const angle = Math.PI + (i / legs.length) * Math.PI;
      return {
        id: `e${leg.index}`,
        kind: "external" as const,
        label: leg.label,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius * 0.55,
      };
    }),
  ];

  const edges = legs.map((leg) => ({
    id: `l${leg.index}`,
    from: `e${leg.index}`,
    to: vertexId,
    kind: leg.edgeKind,
  }));

  return { nodes, edges };
}

export const GRAPH_BOOTSTRAP_KEY = "quantum:graph-bootstrap";

export function saveGraphBootstrap(graph: FeynmanGraph): void {
  sessionStorage.setItem(GRAPH_BOOTSTRAP_KEY, JSON.stringify(graph));
}

export function loadGraphBootstrap(): FeynmanGraph | null {
  try {
    const raw = sessionStorage.getItem(GRAPH_BOOTSTRAP_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(GRAPH_BOOTSTRAP_KEY);
    return JSON.parse(raw) as FeynmanGraph;
  } catch {
    return null;
  }
}

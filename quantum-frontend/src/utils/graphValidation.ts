import type { FeynmanGraph, FeynmanNode } from "../types/graph";

const CHARGE: Record<string, number> = {
  "e-": -1,
  "e+": 1,
  gamma: 0,
  mu: -1,
  nu: 0,
};

function nodeCharge(label: string): number {
  const key = label.toLowerCase().replace(/\s+/g, "");
  if (key.includes("e+") || key.includes("e^{+}")) return 1;
  if (key.includes("e-") || key.includes("e^{-}")) return -1;
  if (key.includes("gamma") || key === "γ") return 0;
  return CHARGE[key] ?? 0;
}

export function validateGraph(graph: FeynmanGraph): string[] {
  const errors: string[] = [];
  const vertices = graph.nodes.filter((n) => n.kind === "vertex");

  for (const v of vertices) {
    const connected = graph.edges.filter((e) => e.from === v.id || e.to === v.id);
    const externals = connected
      .map((e) => {
        const otherId = e.from === v.id ? e.to : e.from;
        return graph.nodes.find((n) => n.id === otherId);
      })
      .filter((n): n is FeynmanNode => n?.kind === "external");

    const chargeSum = externals.reduce((s, n) => s + nodeCharge(n.label), 0);
    if (chargeSum !== 0) {
      errors.push(`Vertex ${v.label || v.id}: charge not conserved (ΣQ = ${chargeSum}).`);
    }
  }

  if (graph.nodes.length < 2) {
    errors.push("Add at least one vertex and one external leg.");
  }

  return errors;
}

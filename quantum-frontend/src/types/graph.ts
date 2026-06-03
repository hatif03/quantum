export type FeynmanNodeKind = "vertex" | "external";

export type FeynmanEdgeKind = "fermion" | "photon" | "boson" | "scalar";

export interface FeynmanNode {
  id: string;
  kind: FeynmanNodeKind;
  label: string;
  x: number;
  y: number;
}

export interface FeynmanEdge {
  id: string;
  from: string;
  to: string;
  kind: FeynmanEdgeKind;
  arrow?: "in" | "out" | "none";
}

export interface FeynmanGraph {
  nodes: FeynmanNode[];
  edges: FeynmanEdge[];
}

import type { FeynmanGraph } from "../types/graph";

export function graphToTikz(graph: FeynmanGraph): string | null {
  const externals = graph.nodes.filter((n) => n.kind === "external");
  const vertices = graph.nodes.filter((n) => n.kind === "vertex");

  if (vertices.length !== 1 || externals.length < 2 || externals.length > 4) {
    return null;
  }

  const v = vertices[0].id;
  const legs = externals.map((ext, i) => {
    const edge = graph.edges.find(
      (e) =>
        (e.from === v && e.to === ext.id) || (e.to === v && e.from === ext.id),
    );
    const kind = edge?.kind ?? "fermion";
    const line =
      kind === "photon"
        ? "photon"
        : kind === "boson"
          ? "boson"
          : kind === "scalar"
            ? "scalar"
            : "fermion";
    const arrow =
      edge?.arrow === "out"
        ? "fermion"
        : edge?.arrow === "in"
          ? "anti fermion"
          : "fermion";
    const style = kind === "photon" || kind === "boson" ? `[${line}]` : `[${arrow}]`;
    return `  i${i + 1} [particle=\\(${ext.label}\\)] -- ${style} ${v}`;
  });

  return String.raw`\feynmandiagram [horizontal=a to b] {
  ${legs.join(",\n  ")},
};`;
}

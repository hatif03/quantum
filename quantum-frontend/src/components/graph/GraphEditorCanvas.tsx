import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { compileTikz } from "../../api/client";
import type { FeynmanEdgeKind, FeynmanGraph } from "../../types/graph";
import { validateGraph } from "../../utils/graphValidation";
import { graphToTikz } from "../../utils/graphToTikz";
import { tikzToGraph } from "../../utils/tikzToGraph";
import { ZoomableImage } from "../lab/ZoomableImage";
import { graphNodeTypes } from "./GraphNodes";
import "./GraphEditorCanvas.css";

const DEFAULT_NODES: Node[] = [
  {
    id: "v1",
    type: "vertex",
    position: { x: 200, y: 120 },
    data: { label: "v" },
  },
  {
    id: "e1",
    type: "external",
    position: { x: 40, y: 120 },
    data: { label: "e-" },
  },
  {
    id: "e2",
    type: "external",
    position: { x: 360, y: 80 },
    data: { label: "e+" },
  },
  {
    id: "e3",
    type: "external",
    position: { x: 360, y: 160 },
    data: { label: "γ" },
  },
];

const DEFAULT_EDGES: Edge[] = [
  { id: "l1", source: "e1", target: "v1", data: { kind: "fermion" } },
  { id: "l2", source: "v1", target: "e2", data: { kind: "fermion" } },
  { id: "l3", source: "v1", target: "e3", data: { kind: "photon" } },
];

function toGraph(nodes: Node[], edges: Edge[]): FeynmanGraph {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      kind: n.type === "vertex" ? "vertex" : "external",
      label: String(n.data.label ?? n.id),
      x: n.position.x,
      y: n.position.y,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      from: e.source,
      to: e.target,
      kind: (e.data?.kind as FeynmanEdgeKind) ?? "fermion",
    })),
  };
}

export function fromGraph(graph: FeynmanGraph): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: graph.nodes.map((n) => ({
      id: n.id,
      type: n.kind === "vertex" ? "vertex" : "external",
      position: { x: n.x, y: n.y },
      data: { label: n.label },
    })),
    edges: graph.edges.map((e) => ({
      id: e.id,
      source: e.from,
      target: e.to,
      data: { kind: e.kind },
    })),
  };
}

export interface GraphEditorApplyResult {
  tikz: string;
  tikz_image?: string | null;
}

interface GraphEditorCanvasProps {
  initialTikz?: string | null;
  initialGraph?: FeynmanGraph | null;
  onApply?: (result: GraphEditorApplyResult) => void;
  compact?: boolean;
}

export function GraphEditorCanvas({
  initialTikz,
  initialGraph,
  onApply,
  compact = false,
}: GraphEditorCanvasProps) {
  const seed = useMemo(() => {
    if (initialGraph && initialGraph.nodes.length >= 2) {
      return fromGraph(initialGraph);
    }
    if (initialTikz) {
      const parsed = tikzToGraph(initialTikz);
      if (parsed) return fromGraph(parsed);
    }
    return { nodes: DEFAULT_NODES, edges: DEFAULT_EDGES };
  }, [initialGraph, initialTikz]);

  const [nodes, setNodes, onNodesChange] = useNodesState(seed.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(seed.edges);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [tikz, setTikz] = useState<string | null>(null);
  const [png, setPng] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [compiling, setCompiling] = useState(false);

  const graph = useMemo(() => toGraph(nodes, edges), [nodes, edges]);
  const validation = useMemo(() => validateGraph(graph), [graph]);

  useEffect(() => {
    setNodes(seed.nodes);
    setEdges(seed.edges);
  }, [seed, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge({ ...connection, data: { kind: "fermion" } }, eds),
      ),
    [setEdges],
  );

  const addExternalLeg = () => {
    const vertex = nodes.find((n) => n.type === "vertex");
    if (!vertex) return;
    const id = `e${Date.now()}`;
    const angle = nodes.filter((n) => n.type === "external").length * 0.8;
    setNodes((ns) => [
      ...ns,
      {
        id,
        type: "external",
        position: {
          x: vertex.position.x + Math.cos(Math.PI + angle) * 140,
          y: vertex.position.y + Math.sin(Math.PI + angle) * 80,
        },
        data: { label: "?" },
      },
    ]);
    setEdges((es) => [
      ...es,
      { id: `l${id}`, source: id, target: vertex.id, data: { kind: "fermion" } },
    ]);
  };

  const addVertex = () => {
    if (nodes.some((n) => n.type === "vertex")) return;
    setNodes((ns) => [
      ...ns,
      {
        id: `v${Date.now()}`,
        type: "vertex",
        position: { x: 200, y: 120 },
        data: { label: "v" },
      },
    ]);
  };

  const deleteSelection = useCallback(() => {
    if (selectedEdge) {
      setEdges((es) => es.filter((e) => e.id !== selectedEdge));
      setSelectedEdge(null);
      return;
    }
    if (selectedNode) {
      setNodes((ns) => ns.filter((n) => n.id !== selectedNode));
      setEdges((es) =>
        es.filter((e) => e.source !== selectedNode && e.target !== selectedNode),
      );
      setSelectedNode(null);
    }
  }, [selectedEdge, selectedNode, setEdges, setNodes]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelection();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteSelection]);

  const setEdgeKind = (kind: FeynmanEdgeKind) => {
    if (!selectedEdge) return;
    setEdges((es) =>
      es.map((e) => (e.id === selectedEdge ? { ...e, data: { ...e.data, kind } } : e)),
    );
  };

  const exportTikz = async () => {
    setErrors(validation);
    const code = graphToTikz(graph);
    if (!code) {
      setErrors([
        ...validation,
        "Rule-based export supports one vertex with 2–4 external legs.",
      ]);
      return;
    }
    setTikz(code);
    setCompiling(true);
    try {
      const res = await compileTikz(code);
      if (res.tikz_image) setPng(res.tikz_image);
      if (!res.ok) setErrors([...validation, ...res.errors]);
      return { code, png: res.tikz_image ?? null, ok: res.ok };
    } finally {
      setCompiling(false);
    }
  };

  const handleApply = async () => {
    const code = graphToTikz(graph);
    if (!code) {
      setErrors([...validation, "Cannot export this topology yet."]);
      return;
    }
    setCompiling(true);
    try {
      const res = await compileTikz(code);
      if (res.ok) {
        onApply?.({ tikz: code, tikz_image: res.tikz_image ?? null });
      } else {
        setErrors([...validation, ...res.errors]);
      }
    } finally {
      setCompiling(false);
    }
  };

  const selectedEdgeKind =
    (edges.find((e) => e.id === selectedEdge)?.data?.kind as FeynmanEdgeKind) ??
    "fermion";

  return (
    <div className={`graph-canvas${compact ? " graph-canvas--compact" : ""}`}>
      <div className="graph-canvas__toolbar">
        <button type="button" className="btn btn--ghost" onClick={addExternalLeg}>
          + Leg
        </button>
        <button type="button" className="btn btn--ghost" onClick={addVertex}>
          + Vertex
        </button>
        <button type="button" className="btn btn--ghost" onClick={deleteSelection}>
          Delete
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void exportTikz()}
          disabled={compiling}
        >
          {compiling ? "Compiling…" : "Preview compile"}
        </button>
        {onApply && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void handleApply()}
            disabled={compiling}
          >
            Apply to message
          </button>
        )}
      </div>

      <div className="graph-canvas__main">
        <div className="graph-canvas__flow">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={graphNodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, n) => {
              setSelectedNode(n.id);
              setSelectedEdge(null);
            }}
            onEdgeClick={(_, e) => {
              setSelectedEdge(e.id);
              setSelectedNode(null);
            }}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        <aside className="graph-canvas__aside">
          {selectedEdge && (
            <div className="graph-canvas__inspector">
              <p className="graph-canvas__label">Edge type</p>
              {(["fermion", "photon", "boson", "scalar"] as FeynmanEdgeKind[]).map(
                (kind) => (
                  <button
                    key={kind}
                    type="button"
                    className={`btn btn--ghost${selectedEdgeKind === kind ? " graph-canvas__kind--active" : ""}`}
                    onClick={() => setEdgeKind(kind)}
                  >
                    {kind}
                  </button>
                ),
              )}
            </div>
          )}

          {(errors.length > 0 || validation.length > 0) && (
            <ul className="graph-canvas__errors">
              {[...new Set([...validation, ...errors])].map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}

          {tikz && (
            <pre className="graph-canvas__tikz">
              <code>{tikz}</code>
            </pre>
          )}
          {png && <ZoomableImage src={png} alt="Compiled graph diagram" />}
        </aside>
      </div>
    </div>
  );
}

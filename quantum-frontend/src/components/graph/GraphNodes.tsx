import type { NodeProps } from "@xyflow/react";
import "./GraphNodes.css";

export function VertexNode({ data }: NodeProps) {
  return (
    <div className="graph-node graph-node--vertex">
      <span>{String(data.label ?? "v")}</span>
    </div>
  );
}

export function ExternalNode({ data }: NodeProps) {
  return (
    <div className="graph-node graph-node--external">
      <span>{String(data.label ?? "?")}</span>
    </div>
  );
}

export const graphNodeTypes = {
  vertex: VertexNode,
  external: ExternalNode,
};

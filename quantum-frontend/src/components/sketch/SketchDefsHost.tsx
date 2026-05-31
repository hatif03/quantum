import { SketchDefs } from "./SketchDefs";

/** Mounts SVG filter defs once so HTML can reference url(#sketch-chalk) etc. */
export function SketchDefsHost() {
  return (
    <svg
      className="sketch-defs-host"
      width={0}
      height={0}
      aria-hidden="true"
      style={{ position: "absolute", overflow: "hidden" }}
    >
      <SketchDefs />
    </svg>
  );
}

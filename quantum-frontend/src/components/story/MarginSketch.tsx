import type { ReactNode } from "react";
import type { ChapterId } from "../../journey/chapters";
import { SketchDefs } from "../sketch/SketchDefs";
import { ScribblePath } from "../sketch/ScribblePath";
import "./MarginSketch.css";

export interface MarginSketchDef {
  id: string;
  side: "left" | "right";
  ariaLabel: string;
}

interface MarginSketchProps extends MarginSketchDef {}

function SketchPanel({ children }: { children: ReactNode }) {
  return (
    <svg className="margin-sketch__svg" viewBox="0 0 160 140" aria-hidden="true">
      <SketchDefs />
      <g filter="url(#sketch-pencil)">{children}</g>
    </svg>
  );
}

const SKETCHES: Record<string, () => ReactNode> = {
  "classroom-detector": () => (
    <SketchPanel>
      <ScribblePath d="M 24 100 L 136 100" strokeWidth={1.6} />
      <ScribblePath d="M 32 100 L 32 40 L 128 40 L 128 100" strokeWidth={1.4} fill="var(--sketch-wash)" />
      <ScribblePath d="M 40 88 L 120 88 M 40 72 L 120 72 M 40 56 L 120 56" strokeWidth={0.9} opacity={0.55} dashed />
      <text className="margin-sketch__label" x={48} y={32}>Si + ECAL</text>
    </SketchPanel>
  ),
  "classroom-trigger": () => (
    <SketchPanel>
      <ScribblePath d="M 80 24 L 48 60 L 80 96 L 112 60 Z" strokeWidth={1.4} fill="var(--sketch-wash)" />
      <ScribblePath d="M 80 96 L 80 118" strokeWidth={1.3} />
      <text className="margin-sketch__label" x={52} y={132}>TRIGGER</text>
    </SketchPanel>
  ),
  "collisions-beampipe": () => (
    <SketchPanel>
      <ScribblePath d="M 16 70 L 144 70" strokeWidth={2.2} />
      <ScribblePath d="M 70 70 L 90 48" strokeWidth={1.4} dashed />
      <ScribblePath d="M 70 70 L 90 92" strokeWidth={1.4} dashed />
      <text className="margin-sketch__label" x={36} y={118}>crossing</text>
    </SketchPanel>
  ),
  "collisions-spray": () => (
    <SketchPanel>
      <ScribblePath d="M 80 36 L 80 72" strokeWidth={1.5} />
      <ScribblePath d="M 80 72 L 40 108 M 80 72 L 120 108 M 80 72 L 80 112" strokeWidth={1.2} />
      <circle cx={80} cy={72} r={5} fill="var(--sketch-ink)" />
    </SketchPanel>
  ),
  "maps-parton-blob": () => (
    <SketchPanel>
      <ScribblePath d="M 40 88 Q 80 52 120 88 Q 80 124 40 88" strokeWidth={1.6} fill="var(--sketch-wash)" />
      <ScribblePath d="M 68 78 Q 80 68 92 78" strokeWidth={1.2} dashed />
      <text className="margin-sketch__label" x={58} y={108}>parton</text>
    </SketchPanel>
  ),
  "maps-tree-loop": () => (
    <SketchPanel>
      <ScribblePath d="M 24 88 L 80 52 L 136 88" strokeWidth={1.4} />
      <ScribblePath d="M 80 52 Q 108 72 80 108 Q 52 72 80 52" strokeWidth={1.2} dashed />
      <text className="margin-sketch__label" x={44} y={128}>tree / loop</text>
    </SketchPanel>
  ),
  "diagram-eegg": () => (
    <SketchPanel>
      <ScribblePath d="M 24 70 L 68 70" strokeWidth={1.4} dashed />
      <ScribblePath d="M 92 70 L 136 70" strokeWidth={1.4} dashed />
      <ScribblePath d="M 68 70 L 80 48 L 92 70" strokeWidth={1.3} dashed />
      <ScribblePath d="M 80 48 L 56 28 M 80 48 L 104 28" strokeWidth={1.2} />
      <text className="margin-sketch__label" x={40} y={108}>e+e- to gg</text>
    </SketchPanel>
  ),
  "diagram-photon": () => (
    <SketchPanel>
      <ScribblePath d="M 32 70 Q 48 50 64 70 Q 80 90 96 70 Q 112 50 128 70" strokeWidth={1.4} />
      <text className="margin-sketch__label" x={52} y={100}>gamma</text>
    </SketchPanel>
  ),
  "rules-vertex-q": () => (
    <SketchPanel>
      <circle cx={80} cy={72} r={6} fill="var(--sketch-ink)" />
      <ScribblePath d="M 32 72 L 74 72 M 86 72 L 128 72" strokeWidth={1.4} dashed />
      <ScribblePath d="M 80 66 L 80 36 M 80 78 L 80 108" strokeWidth={1.2} />
      <text className="margin-sketch__label" x={68} y={128}>Q</text>
    </SketchPanel>
  ),
  "rules-momentum": () => (
    <SketchPanel>
      <ScribblePath d="M 28 72 L 132 72" strokeWidth={1.8} />
      <ScribblePath d="M 28 72 L 18 62 M 132 72 L 142 62" strokeWidth={1.2} />
      <text className="margin-sketch__label" x={54} y={100}>Sum p = 0</text>
    </SketchPanel>
  ),
  "threshold-draw": () => (
    <SketchPanel>
      <ScribblePath d="M 36 108 L 124 108 L 124 40 L 36 40 Z" strokeWidth={1.4} fill="var(--sketch-wash)" />
      <ScribblePath d="M 52 88 L 88 56 L 108 76" strokeWidth={1.5} />
      <ScribblePath d="M 24 48 L 36 56" strokeWidth={1.2} />
    </SketchPanel>
  ),
  "threshold-lab": () => (
    <SketchPanel>
      <ScribblePath d="M 80 28 L 80 88 M 80 88 L 64 104 M 80 88 L 96 104" strokeWidth={2} />
      <text className="margin-sketch__label" x={48} y={124}>lab below</text>
    </SketchPanel>
  ),
};

export function MarginSketch({ id, side, ariaLabel }: MarginSketchProps) {
  const Sketch = SKETCHES[id];
  if (!Sketch) return null;

  return (
    <figure
      className={`margin-sketch margin-sketch--${side}`}
      aria-label={ariaLabel}
      role="img"
    >
      {Sketch()}
    </figure>
  );
}

export function marginSketchesForChapter(id: ChapterId): MarginSketchDef[] {
  return MARGIN_SKETCHES[id] ?? [];
}

export const MARGIN_SKETCHES: Partial<Record<ChapterId, MarginSketchDef[]>> = {
  classroom: [
    { id: "classroom-detector", side: "left", ariaLabel: "Detector cross-section with silicon and calorimeter layers" },
    { id: "classroom-trigger", side: "right", ariaLabel: "Trigger funnel selecting collision events" },
  ],
  collisions: [
    { id: "collisions-beampipe", side: "left", ariaLabel: "Beam pipes crossing at the interaction point" },
    { id: "collisions-spray", side: "right", ariaLabel: "Particle spray from the collision vertex" },
  ],
  maps: [
    { id: "maps-parton-blob", side: "left", ariaLabel: "Parton inside the proton" },
    { id: "maps-tree-loop", side: "right", ariaLabel: "Tree-level and loop Feynman topologies" },
  ],
  diagram: [
    { id: "diagram-eegg", side: "left", ariaLabel: "Mini Feynman diagram for electron-positron to photons" },
    { id: "diagram-photon", side: "right", ariaLabel: "Photon wavefront" },
  ],
  rules: [
    { id: "rules-vertex-q", side: "left", ariaLabel: "Vertex with electric charge labels" },
    { id: "rules-momentum", side: "right", ariaLabel: "Four-momentum conservation at a vertex" },
  ],
  threshold: [
    { id: "threshold-draw", side: "left", ariaLabel: "Blank diagram frame ready to be drawn" },
    { id: "threshold-lab", side: "right", ariaLabel: "Arrow pointing to the lab workbench below" },
  ],
};

import type { ReactNode } from "react";
import type { ChapterId } from "../../journey/chapters";
import { SketchDefs } from "../sketch/SketchDefs";
import { ScribblePath } from "../sketch/ScribblePath";
import "./MarginComic.css";

export interface MarginComicDef {
  id: string;
  side: "left" | "right";
  compact?: boolean;
  ariaLabel: string;
}

interface MarginComicProps extends MarginComicDef {}

function Bubble({ x, y, w, h, tailX, children }: {
  x: number; y: number; w: number; h: number; tailX: number; children: string;
}) {
  const path = `M ${x + 6} ${y} Q ${x} ${y} ${x} ${y + 6} L ${x} ${y + h - 6} Q ${x} ${y + h} ${x + 6} ${y + h} L ${x + w - 6} ${y + h} Q ${x + w} ${y + h} ${x + w} ${y + h - 6} L ${x + w} ${y + 6} Q ${x + w} ${y} ${x + w - 6} ${y} Z M ${tailX} ${y + h} L ${tailX - 5} ${y + h + 10} L ${tailX + 6} ${y + h}`;
  return (
    <>
      <ScribblePath d={path} strokeWidth={1.3} fill="var(--paper)" />
      <text className="margin-comic__bubble" x={x + 8} y={y + 16}>
        {children}
      </text>
    </>
  );
}

function RoundHead({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 1.1} fill="none" stroke="var(--sketch-ink)" strokeWidth={1.6} />
      <circle cx={cx - r * 0.35} cy={cy - r * 0.1} r={r * 0.22} fill="var(--sketch-ink)" />
      <circle cx={cx + r * 0.35} cy={cy - r * 0.1} r={r * 0.22} fill="var(--sketch-ink)" />
    </>
  );
}

function GlassesHead({ cx, cy, scale = 1 }: { cx: number; cy: number; scale?: number }) {
  const s = scale;
  return (
    <>
      <ScribblePath d={`M ${cx - 18 * s} ${cy - 6 * s} Q ${cx} ${cy - 18 * s} ${cx + 18 * s} ${cy - 6 * s}`} strokeWidth={1.4} />
      <circle cx={cx - 10 * s} cy={cy + 2 * s} r={8 * s} strokeWidth={1.2} fill="none" />
      <circle cx={cx + 10 * s} cy={cy + 2 * s} r={8 * s} strokeWidth={1.2} fill="none" />
      <ScribblePath d={`M ${cx - 18 * s} ${cy + 2 * s} L ${cx - 26 * s} ${cy + 5 * s}`} strokeWidth={1} />
      <ScribblePath d={`M ${cx + 18 * s} ${cy + 2 * s} L ${cx + 26 * s} ${cy + 5 * s}`} strokeWidth={1} />
    </>
  );
}

function ComicPanel({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  const viewBox = compact ? "0 0 150 130" : "0 0 150 160";
  return (
    <svg className="margin-comic__svg" viewBox={viewBox} aria-hidden="true">
      <SketchDefs />
      <g filter="url(#sketch-pencil)">{children}</g>
    </svg>
  );
}

const PANELS: Record<string, () => ReactNode> = {
  "classroom-photo": () => (
    <ComicPanel compact>
      <Bubble x={8} y={6} w={134} h={40} tailX={36}>IS THIS A PHOTO?</Bubble>
      <GlassesHead cx={75} cy={88} scale={0.9} />
      <ScribblePath d="M 60 104 Q 75 118 90 104" strokeWidth={1.2} />
    </ComicPanel>
  ),
  "classroom-map": () => (
    <ComicPanel compact>
      <GlassesHead cx={75} cy={52} scale={0.85} />
      <Bubble x={12} y={72} w={126} h={38} tailX={100}>IT&apos;S A MAP!</Bubble>
      <ScribblePath d="M 30 118 L 120 118 M 40 108 L 100 108" strokeWidth={1} opacity={0.5} dashed />
    </ComicPanel>
  ),
  "classroom-trigger": () => (
    <ComicPanel compact>
      <Bubble x={10} y={4} w={130} h={36} tailX={80}>TRIGGERED!</Bubble>
      <ScribblePath d="M 24 52 L 126 52 L 126 108 L 24 108 Z" strokeWidth={1.4} fill="var(--sketch-wash)" />
      <ScribblePath d="M 36 78 L 114 78 M 36 68 L 98 68" strokeWidth={1} opacity={0.55} dashed />
    </ComicPanel>
  ),
  "classroom-tracks": () => (
    <ComicPanel compact>
      <ScribblePath d="M 20 90 Q 50 60 80 90 Q 110 120 140 90" strokeWidth={1.4} />
      <ScribblePath d="M 30 100 Q 60 75 90 100" strokeWidth={1} opacity={0.6} dashed />
      <Bubble x={14} y={108} w={122} h={34} tailX={40}>RECONSTRUCTED</Bubble>
    </ComicPanel>
  ),
  "collisions-beams": () => (
    <ComicPanel compact>
      <ScribblePath d="M 8 70 L 68 70" strokeWidth={2} />
      <ScribblePath d="M 82 70 L 142 70" strokeWidth={2} />
      <RoundHead cx={28} cy={54} r={11} />
      <RoundHead cx={122} cy={54} r={11} />
      <Bubble x={36} y={88} w={78} h={32} tailX={75}>BEAM MEET!</Bubble>
    </ComicPanel>
  ),
  "collisions-rate": () => (
    <ComicPanel compact>
      <Bubble x={8} y={6} w={134} h={44} tailX={40}>BILLIONS / SEC</Bubble>
      <ScribblePath d="M 30 68 L 30 110 M 50 62 L 50 116 M 70 58 L 70 118" strokeWidth={1.2} opacity={0.65} />
      <text className="margin-comic__bubble" x={88} y={100}>×10⁹</text>
    </ComicPanel>
  ),
  "collisions-vertex": () => (
    <ComicPanel compact>
      <Bubble x={6} y={4} w={138} h={40} tailX={90}>WHERE&apos;S THE VERTEX?</Bubble>
      <ScribblePath d="M 75 58 L 58 88 L 92 88 Z" strokeWidth={1.2} fill="var(--sketch-wash)" />
      <ScribblePath d="M 75 88 L 40 118 M 75 88 L 110 118" strokeWidth={1.1} opacity={0.7} />
    </ComicPanel>
  ),
  "collisions-debris": () => (
    <ComicPanel compact>
      <ScribblePath d="M 75 50 L 75 90" strokeWidth={1.3} dashed />
      <ScribblePath d="M 75 90 L 35 120 M 75 90 L 115 120 M 75 90 L 75 125" strokeWidth={1.1} />
      <Bubble x={16} y={108} w={118} h={34} tailX={75}>MEASURE DEBRIS</Bubble>
    </ComicPanel>
  ),
  "maps-poster": () => (
    <ComicPanel compact>
      <GlassesHead cx={48} cy={72} scale={0.8} />
      <ScribblePath d="M 82 52 L 132 52 L 132 102 L 82 102 Z" strokeWidth={1.3} fill="var(--sketch-wash)" />
      <text className="margin-comic__bubble" x={92} y={82}>POSTER</text>
    </ComicPanel>
  ),
  "maps-notpic": () => (
    <ComicPanel compact>
      <Bubble x={6} y={8} w={138} h={40} tailX={40}>NOT A PICTURE!</Bubble>
      <ScribblePath d="M 30 68 L 120 68 L 100 110 L 50 110 Z" strokeWidth={1.3} fill="none" />
      <text className="margin-comic__bubble" x={62} y={98}>MAP</text>
    </ComicPanel>
  ),
  "maps-parton": () => (
    <ComicPanel compact>
      <Bubble x={12} y={4} w={126} h={36} tailX={75}>PARTON DISK</Bubble>
      <ScribblePath d="M 30 88 Q 75 68 120 88 Q 75 108 30 88" strokeWidth={1.5} fill="var(--sketch-wash)" />
    </ComicPanel>
  ),
  "maps-amplitude": () => (
    <ComicPanel compact>
      <ScribblePath d="M 24 70 L 60 50 L 96 70 L 60 90 Z" strokeWidth={1.3} />
      <ScribblePath d="M 60 50 L 60 30 M 96 70 L 118 58" strokeWidth={1} dashed />
      <Bubble x={10} y={100} w={130} h={34} tailX={90}>SUM PATHS</Bubble>
    </ComicPanel>
  ),
  "diagram-meet": () => (
    <ComicPanel compact>
      <Bubble x={10} y={4} w={130} h={36} tailX={65}>e+ MEETS e-</Bubble>
      <RoundHead cx={42} cy={78} r={10} />
      <RoundHead cx={108} cy={78} r={10} />
      <ScribblePath d="M 52 78 L 98 78" strokeWidth={1.6} dashed />
    </ComicPanel>
  ),
  "diagram-vertex": () => (
    <ComicPanel compact>
      <ScribblePath d="M 75 50 L 75 90" strokeWidth={1.4} dashed />
      <circle cx={75} cy={90} r={5} fill="var(--sketch-ink)" />
      <Bubble x={14} y={100} w={122} h={34} tailX={75}>ONE VERTEX</Bubble>
    </ComicPanel>
  ),
  "diagram-annihilate": () => (
    <ComicPanel compact>
      <Bubble x={8} y={6} w={134} h={40} tailX={75}>ANNIHILATE!</Bubble>
      <ScribblePath d="M 75 58 L 48 32 M 75 58 L 102 32" strokeWidth={1.4} />
      <text className="margin-comic__bubble" x={62} y={108}>γ γ</text>
    </ComicPanel>
  ),
  "diagram-helicity": () => (
    <ComicPanel compact>
      <ScribblePath d="M 30 70 L 120 70" strokeWidth={1.2} dashed />
      <ScribblePath d="M 30 90 L 120 90" strokeWidth={1.2} dashed />
      <Bubble x={12} y={104} w={126} h={34} tailX={60}>OPPOSITE HELICITY</Bubble>
    </ComicPanel>
  ),
  "rules-charge": () => (
    <ComicPanel compact>
      <Bubble x={10} y={4} w={130} h={36} tailX={55}>CHARGE OK?</Bubble>
      <GlassesHead cx={75} cy={72} scale={0.85} />
      <ScribblePath d="M 30 108 L 120 108 M 30 118 L 105 118" strokeWidth={1.1} />
    </ComicPanel>
  ),
  "rules-lepton": () => (
    <ComicPanel compact>
      <Bubble x={8} y={6} w={134} h={38} tailX={40}>LEPTON #?</Bubble>
      <ScribblePath d="M 40 62 L 40 100 M 75 58 L 75 104 M 110 62 L 110 100" strokeWidth={1.2} />
      <text className="margin-comic__bubble" x={52} y={118}>L_e conserved</text>
    </ComicPanel>
  ),
  "rules-momentum": () => (
    <ComicPanel compact>
      <ScribblePath d="M 20 78 L 130 78" strokeWidth={1.8} />
      <ScribblePath d="M 20 78 L 12 68 M 130 78 L 138 68" strokeWidth={1.2} />
      <Bubble x={14} y={92} w={122} h={36} tailX={75}>Σp = 0</Bubble>
    </ComicPanel>
  ),
  "rules-gauge": () => (
    <ComicPanel compact>
      <ScribblePath d="M 60 50 L 90 80 L 120 50 L 90 110 Z" strokeWidth={1.4} />
      <Bubble x={10} y={112} w={130} h={34} tailX={90}>GAUGE INV.</Bubble>
    </ComicPanel>
  ),
  "threshold-draw": () => (
    <ComicPanel compact>
      <Bubble x={8} y={4} w={134} h={36} tailX={60}>DRAW ONE!</Bubble>
      <GlassesHead cx={52} cy={62} scale={0.75} />
      <ScribblePath d="M 70 90 L 95 68 L 120 88 L 108 112" strokeWidth={1.5} />
    </ComicPanel>
  ),
  "threshold-name": () => (
    <ComicPanel compact>
      <Bubble x={10} y={8} w={130} h={44} tailX={40}>NAME A DECAY</Bubble>
      <ScribblePath d="M 30 72 L 120 72" strokeWidth={1.3} />
      <ScribblePath d="M 40 72 L 55 58 M 80 72 L 95 58" strokeWidth={1} dashed />
    </ComicPanel>
  ),
  "threshold-arrow": () => (
    <ComicPanel compact>
      <ScribblePath d="M 75 30 L 75 100 M 75 100 L 58 82 M 75 100 L 92 82" strokeWidth={2} />
      <Bubble x={14} y={104} w={122} h={34} tailX={75}>YOUR TURN ↓</Bubble>
    </ComicPanel>
  ),
  "threshold-tikz": () => (
    <ComicPanel compact>
      <Bubble x={8} y={4} w={134} h={40} tailX={90}>GET TIKZ CODE</Bubble>
      <ScribblePath d="M 24 58 L 126 58 L 126 108 L 24 108 Z" strokeWidth={1.2} fill="var(--sketch-wash)" />
      <text className="margin-comic__bubble" x={38} y={88}>feynman...</text>
    </ComicPanel>
  ),
};

export function MarginComic({ id, side, compact = true, ariaLabel }: MarginComicProps) {
  const Panel = PANELS[id];
  if (!Panel) return null;

  return (
    <figure
      className={`margin-comic margin-comic--${side}${compact ? " margin-comic--compact" : ""}`}
      aria-label={ariaLabel}
      role="img"
    >
      {Panel()}
    </figure>
  );
}

export function marginComicsForChapter(id: ChapterId): MarginComicDef[] {
  return MARGIN_COMICS[id] ?? [];
}

export const MARGIN_COMICS: Partial<Record<ChapterId, MarginComicDef[]>> = {
  classroom: [
    { id: "classroom-photo", side: "left", ariaLabel: "Student asks if the detector readout is a photograph" },
    { id: "classroom-map", side: "left", ariaLabel: "Reply: it is a map of what happened, not a photo" },
    { id: "classroom-trigger", side: "right", ariaLabel: "Detector panel fires a trigger on an event" },
    { id: "classroom-tracks", side: "right", ariaLabel: "Tracks are reconstructed from measurements" },
  ],
  collisions: [
    { id: "collisions-beams", side: "left", ariaLabel: "Two proton beams converge at the interaction point" },
    { id: "collisions-rate", side: "left", ariaLabel: "Billions of crossings per second, few useful events" },
    { id: "collisions-vertex", side: "right", ariaLabel: "Where is the collision vertex?" },
    { id: "collisions-debris", side: "right", ariaLabel: "Measure the debris to infer the vertex" },
  ],
  maps: [
    { id: "maps-poster", side: "left", ariaLabel: "A pretty poster is not the same as a Feynman map" },
    { id: "maps-notpic", side: "left", ariaLabel: "Diagrams are calculational maps, not pictures" },
    { id: "maps-parton", side: "right", ariaLabel: "Partons live inside the proton disk" },
    { id: "maps-amplitude", side: "right", ariaLabel: "Sum over paths to get the amplitude" },
  ],
  diagram: [
    { id: "diagram-meet", side: "left", ariaLabel: "Electron and positron meet at a vertex" },
    { id: "diagram-vertex", side: "left", ariaLabel: "A single QED vertex connects the pair" },
    { id: "diagram-annihilate", side: "right", ariaLabel: "They annihilate into two photons" },
    { id: "diagram-helicity", side: "right", ariaLabel: "Photons leave with opposite helicity" },
  ],
  rules: [
    { id: "rules-charge", side: "left", ariaLabel: "Check electric charge at every vertex" },
    { id: "rules-lepton", side: "left", ariaLabel: "Lepton number must match allowed couplings" },
    { id: "rules-momentum", side: "right", ariaLabel: "Four-momentum conserved at each vertex" },
    { id: "rules-gauge", side: "right", ariaLabel: "The amplitude must be gauge invariant" },
  ],
  threshold: [
    { id: "threshold-draw", side: "left", ariaLabel: "Time to draw your own process" },
    { id: "threshold-name", side: "left", ariaLabel: "Name a collision or decay in plain language" },
    { id: "threshold-arrow", side: "right", ariaLabel: "Open the quantum app to try a process" },
    { id: "threshold-tikz", side: "right", ariaLabel: "Receive TikZ-Feynman code for your paper" },
  ],
};

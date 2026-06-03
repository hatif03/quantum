import type { ChapterId } from "../../journey/chapters";
import { SketchDefs } from "../sketch/SketchDefs";
import { ScribblePath } from "../sketch/ScribblePath";
import "./StoryFigure.css";

interface StoryFigureProps {
  chapter: ChapterId;
}

export function StoryFigure({ chapter }: StoryFigureProps) {
  if (chapter === "diagram") return null;

  return (
    <figure className="story-figure" aria-hidden="true">
      <svg className="story-figure__svg" viewBox="0 0 360 220">
        <SketchDefs />
        <g filter="url(#sketch-pencil)">
          {chapter === "classroom" && <ClassroomFigure />}
          {chapter === "collisions" && <CollisionsFigure />}
          {chapter === "maps" && <MapsFigure />}
          {chapter === "rules" && <RulesFigure />}
          {chapter === "threshold" && <ThresholdFigure />}
        </g>
      </svg>
    </figure>
  );
}

function Caption({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text
      x={x}
      y={y}
      className="story-figure__caption"
      fontFamily="var(--font-scribble)"
      fontSize={14}
      fill="var(--sketch-ink)"
    >
      {children}
    </text>
  );
}

function ClassroomFigure() {
  const board =
    "M 48 32 Q 54 24 68 28 L 312 24 Q 324 30 320 44 L 316 168 Q 310 186 290 182 L 72 186 Q 54 190 50 172 L 48 32";
  return (
    <>
      <path d={board} fill="var(--sketch-wash)" stroke="none" opacity={0.4} />
      <ScribblePath d={board} stroke="var(--sketch-ink)" strokeWidth={2} />
      <ScribblePath d="M 72 68 Q 120 62 280 58" strokeWidth={1} opacity={0.5} />
      <ScribblePath d="M 68 98 Q 140 92 260 100" strokeWidth={1} opacity={0.45} dashed />
      <ScribblePath d="M 70 128 Q 180 122 250 130" strokeWidth={1} opacity={0.4} dashed />
      <Caption x={118} y={200}>detector event → map</Caption>
    </>
  );
}

function CollisionsFigure() {
  return (
    <>
      <ScribblePath d="M 24 110 L 140 110" strokeWidth={2.2} />
      <ScribblePath d="M 220 110 L 336 110" strokeWidth={2.2} />
      <ScribblePath d="M 140 110 L 168 88 L 196 110 L 168 132 Z" strokeWidth={1.8} fill="var(--sketch-wash)" />
      <ScribblePath d="M 168 88 L 168 52" strokeWidth={1.4} dashed />
      <ScribblePath d="M 168 132 L 168 168" strokeWidth={1.4} dashed />
      <ScribblePath d="M 196 110 L 248 72" strokeWidth={1.3} opacity={0.7} />
      <ScribblePath d="M 196 110 L 252 148" strokeWidth={1.3} opacity={0.7} />
      <ScribblePath d="M 120 110 L 96 82" strokeWidth={1.2} opacity={0.55} dashed />
      <ScribblePath d="M 120 110 L 92 142" strokeWidth={1.2} opacity={0.55} dashed />
      <Caption x={28} y={128}>beam</Caption>
      <Caption x={268} y={128}>beam</Caption>
      <Caption x={148} y={188}>vertex</Caption>
    </>
  );
}

function MapsFigure() {
  const disk = "M 90 130 Q 180 108 270 130 Q 180 152 90 130";
  return (
    <>
      <ScribblePath d={disk} strokeWidth={2} />
      <ScribblePath
        d="M 162 130 Q 180 122 198 130 Q 180 138 162 130"
        strokeWidth={1.6}
        fill="var(--sketch-wash)"
      />
      <ScribblePath d="M 180 108 L 178 48" strokeWidth={1.8} />
      <ScribblePath d="M 180 152 L 182 192" strokeWidth={1.8} />
      <ScribblePath d="M 162 48 Q 180 36 198 50" strokeWidth={1.4} />
      <ScribblePath d="M 160 192 Q 180 204 200 190" strokeWidth={1.4} />
      <Caption x={228} y={134}>parton x</Caption>
    </>
  );
}

function RulesFigure() {
  return (
    <>
      <ScribblePath d="M 128 72 L 232 76" strokeWidth={2.2} />
      <ScribblePath d="M 180 76 L 148 148" strokeWidth={1.6} />
      <ScribblePath d="M 180 76 L 212 148" strokeWidth={1.6} />
      <circle cx={180} cy={76} r={5} fill="var(--sketch-ink)" opacity={0.85} />
      <ScribblePath
        d="M 128 148 Q 148 154 168 148 Q 148 162 128 148"
        strokeWidth={1.1}
        opacity={0.55}
      />
      <ScribblePath
        d="M 192 148 Q 212 154 232 148 Q 212 162 192 148"
        strokeWidth={1.1}
        opacity={0.55}
      />
      <Caption x={52} y={88}>Q in</Caption>
      <Caption x={248} y={168}>Q out</Caption>
    </>
  );
}

function ThresholdFigure() {
  return (
    <>
      <ScribblePath d="M 48 160 Q 120 80 200 120 Q 280 60 312 100" strokeWidth={2} />
      <ScribblePath d="M 296 100 L 328 100 M 312 88 L 312 112" strokeWidth={1.6} />
      <Caption x={56} y={178}>your process</Caption>
    </>
  );
}

import type { ReactNode } from "react";
import { SketchDefs } from "./SketchDefs";
import { ScribblePath } from "./ScribblePath";
import "./SketchFrame.css";

interface SketchFrameProps {
  children: ReactNode;
  className?: string;
}

const FRAME_PATH =
  "M 14 18 Q 22 8 48 14 L 372 10 Q 395 16 398 38 L 402 168 Q 396 192 368 186 L 42 194 Q 18 198 10 172 L 8 42 Q 6 24 14 18";

const FRAME_PATH_2 =
  "M 12 22 L 46 16 L 378 12 L 394 36 L 388 176 L 364 190 L 38 188 L 14 168 L 16 48 Z";

export function SketchFrame({ children, className = "" }: SketchFrameProps) {
  return (
    <div className={`sketch-frame ${className}`.trim()}>
      <svg
        className="sketch-frame__border"
        viewBox="0 0 410 210"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <SketchDefs />
        <g filter="url(#sketch-pencil)">
          <ScribblePath
            d={FRAME_PATH}
            stroke="var(--sketch-blue)"
            strokeWidth={2.2}
            opacity={0.7}
          />
          <ScribblePath
            d={FRAME_PATH_2}
            stroke="var(--sketch-ink)"
            strokeWidth={0.9}
            opacity={0.25}
          />
        </g>
      </svg>
      <div className="sketch-frame__content">{children}</div>
    </div>
  );
}

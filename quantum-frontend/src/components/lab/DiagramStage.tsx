import type { ReactNode } from "react";
import "./DiagramStage.css";

interface DiagramStageProps {
  children: ReactNode;
  label?: string;
  aspectWidth?: number;
  aspectHeight?: number;
}

export function DiagramStage({
  children,
  label,
  aspectWidth,
  aspectHeight,
}: DiagramStageProps) {
  const style =
    aspectWidth && aspectHeight
      ? { aspectRatio: `${aspectWidth} / ${aspectHeight}` }
      : undefined;

  return (
    <div
      className="diagram-stage"
      role="img"
      aria-label={label}
      style={style}
    >
      <div className="diagram-stage__inner">{children}</div>
    </div>
  );
}

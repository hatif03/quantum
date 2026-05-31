import { toHandwritten } from "./handwrittenMath";
import "./EquationNote.css";

interface EquationNoteProps {
  latex: string;
  label?: string;
  position?: "left" | "right";
  faded?: boolean;
  ariaLabel?: string;
}

export function EquationNote({
  latex,
  label,
  position = "right",
  faded = false,
  ariaLabel,
}: EquationNoteProps) {
  const text = toHandwritten(latex);

  return (
    <aside
      className={`equation-note equation-note--${position}${faded ? " equation-note--faded" : ""}`}
      aria-label={ariaLabel ?? text}
    >
      {label && <span className="equation-note__label">{label}</span>}
      <span className="equation-note__scribble">{text}</span>
    </aside>
  );
}

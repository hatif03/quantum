import { MathBlock } from "./MathBlock";
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
  return (
    <aside
      className={`equation-note equation-note--margin equation-note--${position}${faded ? " equation-note--faded" : ""}`}
      aria-label={ariaLabel ?? latex}
    >
      {label && <span className="equation-note__label">{label}</span>}
      <span className="equation-note__scribble">
        <MathBlock latex={latex} />
      </span>
    </aside>
  );
}

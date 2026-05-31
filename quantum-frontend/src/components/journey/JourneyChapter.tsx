import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { ChapterId } from "../../journey/chapters";
import { marginNotesForChapter } from "../../journey/chapters";
import { EquationNote } from "../sketch/EquationNote";
import { SketchFrame } from "../sketch/SketchFrame";
import { ScrollHint } from "./ScrollHint";
import "./JourneyChapter.css";

interface JourneyChapterProps {
  id: ChapterId;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  isFirst?: boolean;
  showScrollHint?: boolean;
  snap?: boolean;
  className?: string;
  framed?: boolean;
  hasFigure?: boolean;
}

export function JourneyChapter({
  id,
  eyebrow,
  title,
  children,
  isFirst = false,
  showScrollHint = false,
  snap = true,
  className = "",
  framed = false,
  hasFigure = false,
}: JourneyChapterProps) {
  const TitleTag = isFirst ? "h1" : "h2";
  const marginNotes = marginNotesForChapter(id);

  const inner = (
    <>
      {eyebrow && <p className="journey-chapter__eyebrow">{eyebrow}</p>}
      <TitleTag id={`${id}-title`} className="journey-chapter__title">
        {title}
      </TitleTag>
      <div className="journey-chapter__body">{children}</div>
    </>
  );

  return (
    <section
      id={id}
      data-chapter={id}
      className={`journey-chapter${snap ? " journey-chapter--snap" : ""}${hasFigure ? " journey-chapter--with-figure" : ""} ${className}`.trim()}
      aria-labelledby={`${id}-title`}
    >
      {marginNotes.length > 0 && (
        <div className="journey-chapter__margin-notes" aria-hidden="true">
          {marginNotes.map((note, i) => (
            <EquationNote
              key={i}
              latex={note.latex}
              label={note.label}
              position={note.position}
              faded={note.faded}
            />
          ))}
        </div>
      )}

      <motion.div
        className="journey-chapter__wrap"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
      >
        {framed ? (
          <SketchFrame>
            <div className="journey-chapter__inner">{inner}</div>
          </SketchFrame>
        ) : (
          <div className="journey-chapter__inner">{inner}</div>
        )}
      </motion.div>
      {showScrollHint && <ScrollHint />}
    </section>
  );
}

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { ChapterId } from "../../journey/chapters";
import { marginNotesForChapter } from "../../journey/chapters";
import { marginComicsForChapter, MarginComic } from "../story/MarginComic";
import { marginSketchesForChapter, MarginSketch } from "../story/MarginSketch";
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

function GutterContent({ id, side }: { id: ChapterId; side: "left" | "right" }) {
  const comics = marginComicsForChapter(id).filter((c) => c.side === side);
  const sketches = marginSketchesForChapter(id).filter((s) => s.side === side);
  const notes = marginNotesForChapter(id).filter((n) => n.position === side);

  if (comics.length === 0 && sketches.length === 0 && notes.length === 0) {
    return null;
  }

  return (
    <>
      {comics.map((comic) => (
        <MarginComic key={comic.id} {...comic} />
      ))}
      {sketches.map((sketch) => (
        <MarginSketch key={sketch.id} {...sketch} />
      ))}
      {notes.map((note, i) => (
        <EquationNote
          key={i}
          latex={note.latex}
          label={note.label}
          position={note.position}
          faded={note.faded}
        />
      ))}
    </>
  );
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

  const inner = (
    <>
      {eyebrow && <p className="journey-chapter__eyebrow">{eyebrow}</p>}
      <TitleTag id={`${id}-title`} className="journey-chapter__title">
        {title}
      </TitleTag>
      <div className="journey-chapter__body">{children}</div>
    </>
  );

  const centerContent = framed ? (
    <SketchFrame>
      <div className="journey-chapter__inner">{inner}</div>
    </SketchFrame>
  ) : (
    <div className="journey-chapter__inner">{inner}</div>
  );

  return (
    <section
      id={id}
      data-chapter={id}
      className={`journey-chapter${snap ? " journey-chapter--snap" : ""}${hasFigure ? " journey-chapter--with-figure" : ""} ${className}`.trim()}
      aria-labelledby={`${id}-title`}
    >
      <div className="journey-chapter__grid">
        <aside className="journey-chapter__gutter journey-chapter__gutter--left" aria-hidden="true">
          <GutterContent id={id} side="left" />
        </aside>

        <motion.div
          className="journey-chapter__wrap"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        >
          {centerContent}
        </motion.div>

        <aside className="journey-chapter__gutter journey-chapter__gutter--right" aria-hidden="true">
          <GutterContent id={id} side="right" />
        </aside>
      </div>
      {showScrollHint && <ScrollHint />}
    </section>
  );
}

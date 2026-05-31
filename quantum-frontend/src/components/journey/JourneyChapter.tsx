import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { ChapterId } from "../../journey/chapters";
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
}: JourneyChapterProps) {
  const TitleTag = isFirst ? "h1" : "h2";

  return (
    <section
      id={id}
      data-chapter={id}
      className={`journey-chapter${snap ? " journey-chapter--snap" : ""} ${className}`.trim()}
      aria-labelledby={`${id}-title`}
    >
      <motion.div
        className="journey-chapter__inner"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
      >
        {eyebrow && <p className="journey-chapter__eyebrow">{eyebrow}</p>}
        <TitleTag id={`${id}-title`} className="journey-chapter__title">
          {title}
        </TitleTag>
        <div className="journey-chapter__body">{children}</div>
      </motion.div>
      {showScrollHint && <ScrollHint />}
    </section>
  );
}

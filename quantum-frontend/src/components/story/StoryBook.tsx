import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { FeynmanSketch } from "./FeynmanSketch";
import { ModelBackdrop } from "../three/ModelBackdrop";
import "./StoryBook.css";

const PAGES = [
  {
    id: "collisions",
    title: "Collisions in the dark",
    body: "Most particle events happen where we cannot point a camera. Nebulae and jets are clues—not photographs of a single collision.",
    model: "stellar-nursery" as const,
  },
  {
    id: "maps",
    title: "Maps, not pictures",
    body: "Physicists draw maps of what could happen. The drawing is a compact blueprint for calculation, not a literal snapshot.",
    model: "dg-tauri" as const,
  },
  {
    id: "diagram",
    title: "A Feynman diagram",
    body: "Lines trace particles. A junction marks an interaction. Watch two carriers meet—and two photons leave.",
    model: null,
    showSketch: true,
  },
  {
    id: "rules",
    title: "Rules on the page",
    body: "Charge must balance. Only allowed forces appear. The map encodes those rules so predictions stay honest.",
    model: null,
    showRules: true,
  },
  {
    id: "quantum",
    title: "Your words, a verified map",
    body: "Quantum reads plain language, checks physics, and returns TikZ-Feynman code you can drop into a paper.",
    model: "fluid" as const,
  },
];

export function StoryBook() {
  const [page, setPage] = useState(0);
  const reduced = useReducedMotion();
  const current = PAGES[page];
  const isLast = page === PAGES.length - 1;

  const next = useCallback(() => {
    setPage((p) => Math.min(PAGES.length - 1, p + 1));
  }, []);

  const prev = useCallback(() => {
    setPage((p) => Math.max(0, p - 1));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <div className="story-book" aria-label="Story book about Feynman diagrams">
      <div className="story-book__spread panel">
        {current.model && (
          <ModelBackdrop
            model={current.model}
            className="story-book__backdrop"
          />
        )}

        <AnimatePresence mode="wait">
          <motion.article
            key={current.id}
            className="story-book__page"
            initial={reduced ? false : { opacity: 0, rotateY: -8, x: 24 }}
            animate={{ opacity: 1, rotateY: 0, x: 0 }}
            exit={reduced ? undefined : { opacity: 0, rotateY: 8, x: -24 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            aria-live="polite"
          >
            <span className="story-book__folio">
              {String(page + 1).padStart(2, "0")} / {String(PAGES.length).padStart(2, "0")}
            </span>
            <h2>{current.title}</h2>
            <p>{current.body}</p>

            {current.showSketch && <FeynmanSketch animate={!reduced} showLabels />}

            {current.showRules && (
              <ul className="story-book__rules">
                <motion.li
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Charge conservation
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Allowed vertices &amp; propagators
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  Matches known interaction topology
                </motion.li>
              </ul>
            )}

            {isLast && (
              <div className="story-book__cta">
                <Link to="/lab" className="btn btn--primary">
                  Open the lab
                </Link>
              </div>
            )}
          </motion.article>
        </AnimatePresence>

        <div className="story-book__controls">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={prev}
            disabled={page === 0}
            aria-label="Previous page"
          >
            ← Prev
          </button>
          <div className="story-book__dots" role="tablist" aria-label="Story pages">
            {PAGES.map((p, i) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={i === page}
                aria-label={`Page ${i + 1}: ${p.title}`}
                className={`story-book__dot${i === page ? " story-book__dot--active" : ""}`}
                onClick={() => setPage(i)}
              />
            ))}
          </div>
          {!isLast ? (
            <button type="button" className="btn btn--primary" onClick={next} aria-label="Next page">
              Next →
            </button>
          ) : (
            <span className="story-book__end-note">End of story</span>
          )}
        </div>
      </div>
    </div>
  );
}

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { ChapterId } from "../../journey/chapters";
import { useActiveChapter } from "../../hooks/useActiveChapter";
import { PersistentStoryCanvas } from "../three/PersistentStoryCanvas";
import { ProgressRail } from "./ProgressRail";
import { StoryChapters } from "./StoryChapters";
import "./Journey.css";

const LabChapter = lazy(() =>
  import("./LabChapter").then((m) => ({ default: m.LabChapter })),
);

interface JourneyProps {
  initialChapter?: ChapterId;
}

export function Journey({ initialChapter }: JourneyProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeChapter = useActiveChapter(scrollRef);
  const reduced = useReducedMotion();
  const [labReady, setLabReady] = useState(false);

  const diagramInView = activeChapter === "diagram";

  useEffect(() => {
    const sentinel = document.getElementById("lab-sentinel");
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setLabReady(true);
      },
      { rootMargin: "240px 0px 240px 0px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (initialChapter === "lab" || window.location.hash === "#lab") {
      setLabReady(true);
      requestAnimationFrame(() => {
        document.getElementById("lab")?.scrollIntoView();
      });
    }
  }, [initialChapter]);

  const prefetchFluid =
    activeChapter === "rules" ||
    activeChapter === "threshold" ||
    activeChapter === "lab";

  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {activeChapter.replace(/-/g, " ")} section
      </div>

      <PersistentStoryCanvas
        activeChapter={activeChapter}
        prefetchFluid={prefetchFluid}
      />

      <ProgressRail activeChapter={activeChapter} />

      <div
        ref={scrollRef}
        className={`journey${reduced ? " journey--reduced" : ""}`}
      >
        <StoryChapters diagramInView={diagramInView} />

        <div id="lab-sentinel" className="journey__sentinel" aria-hidden="true" />

        {labReady ? (
          <Suspense
            fallback={
              <section className="journey__lab-loading panel">
                Loading workbench…
              </section>
            }
          >
            <LabChapter />
          </Suspense>
        ) : (
          <section
            id="lab"
            data-chapter="lab"
            className="journey-chapter journey-chapter--snap journey__lab-stub"
            aria-hidden="true"
          />
        )}
      </div>
    </>
  );
}

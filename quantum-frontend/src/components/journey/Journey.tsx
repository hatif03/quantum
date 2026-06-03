import { useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { useActiveChapter } from "../../hooks/useActiveChapter";
import { SketchDefsHost } from "../sketch/SketchDefsHost";
import { ProgressRail } from "./ProgressRail";
import { StoryChapters } from "./StoryChapters";
import "./Journey.css";

export function Journey() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeChapter = useActiveChapter(scrollRef);
  const reduced = useReducedMotion();

  const diagramInView = activeChapter === "diagram";

  return (
    <>
      <SketchDefsHost />

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {activeChapter.replace(/-/g, " ")} section
      </div>

      <ProgressRail activeChapter={activeChapter} />

      <div
        ref={scrollRef}
        className={`journey${reduced ? " journey--reduced" : ""}`}
      >
        <StoryChapters diagramInView={diagramInView} />
      </div>
    </>
  );
}

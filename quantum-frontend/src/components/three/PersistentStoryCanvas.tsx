import { lazy, Suspense, useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import {
  chapterModelForId,
  sceneOpacityForId,
  type ChapterId,
} from "../../journey/chapters";
import type { ModelId } from "./ModelBackdrop";
import "./PersistentStoryCanvas.css";

const Scene = lazy(() =>
  import("./PersistentScene").then((m) => ({ default: m.PersistentScene })),
);

interface PersistentStoryCanvasProps {
  activeChapter: ChapterId;
  prefetchFluid?: boolean;
}

function StaticBackdrop({ chapter }: { chapter: ChapterId }) {
  const model = chapterModelForId(chapter);
  const label =
    model === "stellar-nursery"
      ? "✦"
      : model === "dg-tauri"
        ? "★"
        : model === "fluid"
          ? "∿"
          : "";
  if (!label) return null;
  return (
    <div className="persistent-canvas__static" aria-hidden="true">
      <span>{label}</span>
    </div>
  );
}

export function PersistentStoryCanvas({
  activeChapter,
}: PersistentStoryCanvasProps) {
  const reduced = useReducedMotion();
  const activeModel = chapterModelForId(activeChapter);
  const targetOpacity = sceneOpacityForId(activeChapter);

  const preload = useMemo((): ModelId[] => {
    const ids: ModelId[] = ["stellar-nursery", "dg-tauri"];
    if (
      activeChapter === "rules" ||
      activeChapter === "threshold" ||
      activeChapter === "lab"
    ) {
      ids.push("fluid");
    }
    return ids;
  }, [activeChapter]);

  if (reduced) {
    return (
      <div className="persistent-canvas persistent-canvas--static">
        <StaticBackdrop chapter={activeChapter} />
      </div>
    );
  }

  return (
    <div className="persistent-canvas" aria-hidden="true">
      <Suspense fallback={<StaticBackdrop chapter={activeChapter} />}>
        <Scene
          activeModel={activeModel}
          targetOpacity={targetOpacity}
          preloadModels={preload}
        />
      </Suspense>
    </div>
  );
}

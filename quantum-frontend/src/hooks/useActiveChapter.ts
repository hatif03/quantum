import { useEffect, useState, type RefObject } from "react";
import type { ChapterId } from "../journey/chapters";

const DEFAULT_CHAPTER: ChapterId = "classroom";

export function useActiveChapter(containerRef: RefObject<HTMLElement | null>) {
  const [activeChapter, setActiveChapter] = useState<ChapterId>(DEFAULT_CHAPTER);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const sections = Array.from(
      root.querySelectorAll<HTMLElement>("[data-chapter]"),
    );

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          const id = visible[0].target.getAttribute("data-chapter") as ChapterId;
          if (id) setActiveChapter(id);
        }
      },
      {
        root: null,
        threshold: [0.35, 0.55, 0.75],
        rootMargin: "-12% 0px -12% 0px",
      },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [containerRef]);

  return activeChapter;
}

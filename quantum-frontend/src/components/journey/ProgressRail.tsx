import { CHAPTER_ORDER, type ChapterId } from "../../journey/chapters";
import "./ProgressRail.css";

interface ProgressRailProps {
  activeChapter: ChapterId;
}

export function ProgressRail({ activeChapter }: ProgressRailProps) {
  const activeIndex = CHAPTER_ORDER.indexOf(activeChapter);

  return (
    <div
      className="progress-rail"
      role="presentation"
      aria-hidden="true"
    >
      {CHAPTER_ORDER.map((id, i) => (
        <span
          key={id}
          className={`progress-rail__tick${
            i === activeIndex ? " progress-rail__tick--active" : ""
          }${i < activeIndex ? " progress-rail__tick--past" : ""}`}
        />
      ))}
    </div>
  );
}

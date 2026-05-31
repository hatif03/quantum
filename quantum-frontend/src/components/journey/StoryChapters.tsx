import { FeynmanSketch } from "../story/FeynmanSketch";
import { STORY_CHAPTERS } from "../../journey/chapters";
import { JourneyChapter } from "./JourneyChapter";

interface StoryChaptersProps {
  diagramInView: boolean;
}

export function StoryChapters({ diagramInView }: StoryChaptersProps) {
  return (
    <>
      {STORY_CHAPTERS.map((chapter, index) => {
        const body = Array.isArray(chapter.body) ? chapter.body : [chapter.body];
        const showHint = index < 5;

        return (
          <JourneyChapter
            key={chapter.id}
            id={chapter.id}
            eyebrow={chapter.eyebrow}
            title={chapter.title}
            isFirst={index === 0}
            showScrollHint={showHint && chapter.id !== "threshold"}
          >
            {body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
            {chapter.showSketch && (
              <FeynmanSketch animate={diagramInView} showLabels />
            )}
            {chapter.showRules && (
              <ul className="journey-chapter__rules">
                <li>Charge conservation</li>
                <li>Allowed vertices and propagators</li>
                <li>Matches known interaction topology</li>
              </ul>
            )}
            {chapter.showContinue && (
              <div className="journey-chapter__continue">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => {
                    document.getElementById("lab")?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                >
                  Continue to the workbench
                </button>
              </div>
            )}
          </JourneyChapter>
        );
      })}
    </>
  );
}

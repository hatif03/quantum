import { FeynmanSketch } from "../story/FeynmanSketch";
import { StoryFigure } from "../story/StoryFigure";
import { STORY_CHAPTERS } from "../../journey/chapters";
import { MathBlock } from "../sketch/MathBlock";
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
            showScrollHint={showHint}
            framed={false}
            hasFigure
          >
            {body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
            {chapter.inlineEquations && chapter.inlineEquations.length > 0 && (
              <ul className="journey-chapter__equations" aria-label="Key relations">
                {chapter.inlineEquations.map((eq) => (
                  <li key={eq}>
                    <MathBlock latex={eq} />
                  </li>
                ))}
              </ul>
            )}
            {chapter.id !== "diagram" && <StoryFigure chapter={chapter.id} />}
            {chapter.showSketch && (
              <FeynmanSketch animate={diagramInView} showLabels showTicks />
            )}
            {chapter.showRules && (
              <ul className="journey-chapter__rules">
                <li>Electric charge conserved at every vertex</li>
                <li>Lepton number matches the allowed couplings</li>
                <li>Four-momentum conserved for external legs</li>
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
                  Try it below
                </button>
              </div>
            )}
          </JourneyChapter>
        );
      })}
    </>
  );
}

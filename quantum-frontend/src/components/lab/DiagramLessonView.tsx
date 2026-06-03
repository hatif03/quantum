import { useState } from "react";
import type { DiagramLesson, ProcessExample } from "../../api/types";
import { MathBlock, normalizeLatexInput, renderMixedLatex } from "../sketch/MathBlock";
import { DiagramPreview } from "./DiagramPreview";
import { DiagramStage } from "./DiagramStage";
import "./DiagramLessonView.css";

interface DiagramLessonViewProps {
  lesson: DiagramLesson;
  diagramImages?: Record<string, string>;
  fallbackExample?: ProcessExample;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
}

export function DiagramLessonView({
  lesson,
  diagramImages = {},
  fallbackExample,
  activeIndex: controlledIndex,
  onActiveIndexChange,
}: DiagramLessonViewProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const activeIndex = controlledIndex ?? internalIndex;
  const setActiveIndex = (idx: number) => {
    onActiveIndexChange?.(idx);
    if (controlledIndex === undefined) {
      setInternalIndex(idx);
    }
  };

  const panels = lesson.panels;
  if (panels.length === 0) {
    return fallbackExample ? (
      <DiagramPreview example={fallbackExample} />
    ) : null;
  }

  const panel = panels[activeIndex] ?? panels[0];
  const imageUrl =
    panel.image_url ?? diagramImages[panel.id] ?? null;

  return (
    <div className="diagram-lesson">
      {lesson.summary && (
        <p className="diagram-lesson__summary">
          {renderMixedLatex(lesson.summary)}
        </p>
      )}

      <div
        className="diagram-lesson__tabs"
        role="tablist"
        aria-label="Diagram lesson steps"
      >
        {panels.map((p, idx) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={idx === activeIndex}
            className={`diagram-lesson__tab${idx === activeIndex ? " diagram-lesson__tab--active" : ""}`}
            onClick={() => setActiveIndex(idx)}
          >
            {p.title}
          </button>
        ))}
      </div>

      <div className="diagram-lesson__panel" role="tabpanel">
        <h4 className="diagram-lesson__title">{panel.title}</h4>
        {panel.caption && (
          <p className="diagram-lesson__caption">
            {renderMixedLatex(panel.caption)}
          </p>
        )}

        {imageUrl ? (
          <DiagramStage
            label={panel.title}
            aspectWidth={panel.image_width ?? undefined}
            aspectHeight={panel.image_height ?? undefined}
          >
            <img
              src={imageUrl}
              alt={panel.title}
              className="diagram-lesson__image"
            />
          </DiagramStage>
        ) : fallbackExample ? (
          <DiagramStage label={panel.title}>
            <DiagramPreview example={fallbackExample} embedded />
          </DiagramStage>
        ) : (
          <p className="diagram-lesson__compile-fail">
            Diagram image unavailable
            {panel.compile_ok === false ? " (compile failed)" : ""}
          </p>
        )}

        {panel.annotation_latex.length > 0 && (
          <ul className="diagram-lesson__annotations">
            {panel.annotation_latex.map((tex) => (
              <li key={tex}>
                <MathBlock latex={normalizeLatexInput(tex)} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="diagram-lesson__nav">
        <button
          type="button"
          className="btn"
          disabled={activeIndex <= 0}
          onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
        >
          Previous
        </button>
        <span className="diagram-lesson__counter">
          {activeIndex + 1} / {panels.length}
        </span>
        <button
          type="button"
          className="btn"
          disabled={activeIndex >= panels.length - 1}
          onClick={() =>
            setActiveIndex(Math.min(panels.length - 1, activeIndex + 1))
          }
        >
          Next
        </button>
      </div>
    </div>
  );
}

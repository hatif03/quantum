import { useState } from "react";
import type { DiagramLesson, DiagramPanel, ProcessExample } from "../../api/types";
import { compileTikz } from "../../api/client";
import { MathBlock, normalizeLatexInput, isRenderableAnnotationLatex, renderMixedLatex } from "../sketch/MathBlock";
import { DiagramImage } from "./DiagramImage";
import { DiagramPreview } from "./DiagramPreview";
import { DiagramStage } from "./DiagramStage";
import { DiagramEditActions } from "../app/DiagramEditActions";
import "./DiagramLessonView.css";

interface DiagramLessonViewProps {
  lesson: DiagramLesson;
  diagramImages?: Record<string, string>;
  fallbackExample?: ProcessExample;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  onPanelUpdate?: (panelId: string, patch: Partial<DiagramPanel>) => void;
  onEditCode?: (panelId: string, code: string) => void;
  onEditVisually?: (panelId: string, code: string) => void;
}

export function DiagramLessonView({
  lesson,
  diagramImages = {},
  fallbackExample,
  activeIndex: controlledIndex,
  onActiveIndexChange,
  onPanelUpdate,
  onEditCode,
  onEditVisually,
}: DiagramLessonViewProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [recompiling, setRecompiling] = useState(false);
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
  const imageUrl = panel.image_url ?? diagramImages[panel.id] ?? null;

  const handleRecompile = async () => {
    if (!panel.tikz || !onPanelUpdate) return;
    setRecompiling(true);
    try {
      const res = await compileTikz(panel.tikz);
      onPanelUpdate(panel.id, {
        image_url: res.tikz_image ?? panel.image_url,
        compile_ok: res.ok,
      });
    } finally {
      setRecompiling(false);
    }
  };

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
          <DiagramImage
            src={imageUrl}
            alt={panel.title}
            label={panel.title}
          />
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

        {panel.compile_ok === false && (panel.compile_errors?.length ?? 0) > 0 && (
          <ul className="diagram-lesson__compile-errors" role="alert">
            {panel.compile_errors!.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        )}

        <DiagramEditActions
          hasTikz={Boolean(panel.tikz)}
          onEditCode={
            panel.tikz && onEditCode
              ? () => onEditCode(panel.id, panel.tikz)
              : undefined
          }
          onEditVisually={
            panel.tikz && onEditVisually
              ? () => onEditVisually(panel.id, panel.tikz)
              : undefined
          }
          onRecompile={panel.tikz && onPanelUpdate ? () => void handleRecompile() : undefined}
          recompiling={recompiling}
        />

        {panel.annotation_latex.filter(isRenderableAnnotationLatex).length > 0 && (
          <ul className="diagram-lesson__annotations">
            {panel.annotation_latex.filter(isRenderableAnnotationLatex).map((tex) => (
              <li key={tex}>
                <MathBlock
                  latex={normalizeLatexInput(tex)}
                  displayMode={tex.length > 28 || tex.includes("\\gamma")}
                />
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

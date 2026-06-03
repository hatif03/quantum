import type { FinalAnswer } from "../../api/types";
import { exportLessonMarkdown } from "../../utils/exportLesson";
import "./ExportActions.css";

interface ExportActionsProps {
  result: FinalAnswer;
  onEditVisually?: () => void;
}

export function ExportActions({ result, onEditVisually }: ExportActionsProps) {
  const tikzCode = result.tikz?.code;
  const pngUrl = result.tikz_image;

  const copyTikz = async () => {
    if (!tikzCode) return;
    await navigator.clipboard.writeText(tikzCode);
  };

  const downloadPng = () => {
    if (!pngUrl) return;
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = "feynman-diagram.png";
    a.click();
  };

  const copySummary = async () => {
    if (!result.summary) return;
    await navigator.clipboard.writeText(result.summary);
  };

  const downloadLesson = () => {
    const md = exportLessonMarkdown(result);
    if (!md) return;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quantum-lesson.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="export-actions" role="group" aria-label="Export options">
      {tikzCode && (
        <button type="button" className="export-actions__btn btn btn--ghost" onClick={() => void copyTikz()}>
          Copy TikZ
        </button>
      )}
      {pngUrl && (
        <button type="button" className="export-actions__btn btn btn--ghost" onClick={downloadPng}>
          Download PNG
        </button>
      )}
      {result.summary && (
        <button type="button" className="export-actions__btn btn btn--ghost" onClick={() => void copySummary()}>
          Copy summary
        </button>
      )}
      {tikzCode && onEditVisually && (
        <button type="button" className="export-actions__btn btn btn--ghost" onClick={onEditVisually}>
          Edit visually
        </button>
      )}
      {result.diagram_lesson && (
        <button type="button" className="export-actions__btn btn btn--ghost" onClick={downloadLesson}>
          Export lesson
        </button>
      )}
    </div>
  );
}

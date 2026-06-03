import type { FinalAnswer } from "../../api/types";
import { TikzDiagram } from "../lab/TikzDiagram";
import { pickExample } from "../../api/mock";
import "./CompareView.css";

interface CompareViewProps {
  left: { label: string; prompt: string; result: FinalAnswer };
  right: { label: string; prompt: string; result: FinalAnswer };
  onClose: () => void;
}

export function CompareView({ left, right, onClose }: CompareViewProps) {
  return (
    <div className="compare-view">
      <div className="compare-view__header">
        <h2 className="compare-view__title">Compare diagrams</h2>
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="compare-view__grid">
        {[left, right].map((side) => (
          <div key={side.label} className="compare-view__pane">
            <h3>{side.label}</h3>
            <TikzDiagram
              example={pickExample(side.prompt)}
              tikzImage={side.result.tikz_image}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

import type { ProcessExample } from "../../api/types";
import { DiagramImage } from "./DiagramImage";
import { DiagramPreview } from "./DiagramPreview";
import { DiagramStage } from "./DiagramStage";
import "./TikzDiagram.css";

interface TikzDiagramProps {
  example: ProcessExample;
  tikzImage?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  animating?: boolean;
}

export function TikzDiagram({
  example,
  tikzImage,
  animating = false,
}: TikzDiagramProps) {
  if (tikzImage) {
    return (
      <div className="tikz-diagram">
        <DiagramImage
          src={tikzImage}
          alt={`Compiled Feynman diagram: ${example.title}`}
          label={`Feynman diagram: ${example.title}`}
          className="tikz-diagram__image-wrap"
        />
        <p className="tikz-diagram__caption">{example.short}</p>
      </div>
    );
  }

  return (
    <div className="tikz-diagram">
      <DiagramStage label={`Feynman diagram: ${example.title}`}>
        <DiagramPreview example={example} animating={animating} embedded />
      </DiagramStage>
    </div>
  );
}

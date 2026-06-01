import type { ProcessExample } from "../../api/types";
import { DiagramPreview } from "./DiagramPreview";
import "./TikzDiagram.css";

interface TikzDiagramProps {
  example: ProcessExample;
  tikzImage?: string | null;
  animating?: boolean;
}

export function TikzDiagram({ example, tikzImage, animating = false }: TikzDiagramProps) {
  if (tikzImage) {
    return (
      <div
        className="tikz-diagram"
        role="img"
        aria-label={`Feynman diagram: ${example.title}`}
      >
        <img
          src={tikzImage}
          alt={`Compiled Feynman diagram: ${example.title}`}
          className="tikz-diagram__image"
        />
        <p className="tikz-diagram__caption">{example.short}</p>
      </div>
    );
  }

  return <DiagramPreview example={example} animating={animating} />;
}

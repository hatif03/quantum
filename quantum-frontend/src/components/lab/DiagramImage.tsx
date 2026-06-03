import { useState } from "react";
import { EditorModal } from "../app/EditorModal";
import { ZoomableImage } from "./ZoomableImage";
import { DiagramStage } from "./DiagramStage";
import "./DiagramImage.css";

interface DiagramImageProps {
  src: string;
  alt: string;
  label?: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
  className?: string;
}

export function DiagramImage({
  src,
  alt,
  label,
  className = "",
}: DiagramImageProps) {
  const [fullViewOpen, setFullViewOpen] = useState(false);

  return (
    <>
      <DiagramStage label={label}>
        <div className={`diagram-image ${className}`.trim()}>
          <button
            type="button"
            className="diagram-image__full-view btn btn--ghost"
            onClick={() => setFullViewOpen(true)}
            aria-label={`Full view of ${alt}`}
          >
            Full view
          </button>
          <ZoomableImage
            src={src}
            alt={alt}
            className="diagram-image__img"
            interactive={false}
          />
        </div>
      </DiagramStage>

      <EditorModal
        open={fullViewOpen}
        title={alt}
        onClose={() => setFullViewOpen(false)}
        size="large"
      >
        <div className="diagram-image__modal-view">
          <ZoomableImage src={src} alt={alt} interactive />
        </div>
      </EditorModal>
    </>
  );
}

import { useCallback, useRef, useState } from "react";
import "./ZoomableImage.css";

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
  /** When false, render a static image with no zoom/pan controls. */
  interactive?: boolean;
}

export function ZoomableImage({
  src,
  alt,
  className = "",
  interactive = true,
}: ZoomableImageProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!interactive) return;
      e.preventDefault();
      setScale((s) => Math.min(3, Math.max(0.5, s - e.deltaY * 0.001)));
    },
    [interactive],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!interactive || !dragging.current) return;
    setOffset((o) => ({
      x: o.x + e.clientX - lastPos.current.x,
      y: o.y + e.clientY - lastPos.current.y,
    }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  const reset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  if (!interactive) {
    return (
      <div className="zoomable-image zoomable-image--static">
        <img
          src={src}
          alt={alt}
          className={`zoomable-image__img zoomable-image__img--static ${className}`.trim()}
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div className="zoomable-image">
      <div
        className="zoomable-image__viewport"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <img
          src={src}
          alt={alt}
          className={`zoomable-image__img ${className}`.trim()}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          }}
          draggable={false}
        />
      </div>
      <button type="button" className="zoomable-image__reset btn btn--ghost" onClick={reset}>
        Reset zoom
      </button>
    </div>
  );
}

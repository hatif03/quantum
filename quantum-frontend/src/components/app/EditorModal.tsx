import { useEffect, useId, useRef, type ReactNode } from "react";
import "./EditorModal.css";

interface EditorModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "default" | "large";
}

export function EditorModal({
  open,
  title,
  onClose,
  children,
  footer,
  size = "default",
}: EditorModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="editor-modal" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className={`editor-modal__dialog editor-modal__dialog--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="editor-modal__header">
          <h2 id={titleId} className="editor-modal__title">
            {title}
          </h2>
          <button
            type="button"
            className="editor-modal__close btn btn--ghost"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <div className="editor-modal__body">{children}</div>
        {footer && <footer className="editor-modal__footer">{footer}</footer>}
      </div>
    </div>
  );
}

import "./DiagramEditActions.css";

interface DiagramEditActionsProps {
  hasTikz: boolean;
  onEditCode?: () => void;
  onEditVisually?: () => void;
  onRecompile?: () => void;
  recompiling?: boolean;
}

export function DiagramEditActions({
  hasTikz,
  onEditCode,
  onEditVisually,
  onRecompile,
  recompiling = false,
}: DiagramEditActionsProps) {
  if (!hasTikz && !onRecompile) return null;

  return (
    <div className="diagram-edit-actions" role="group" aria-label="Diagram editing">
      {hasTikz && onEditCode && (
        <button type="button" className="diagram-edit-actions__btn btn btn--ghost" onClick={onEditCode}>
          Edit code
        </button>
      )}
      {hasTikz && onEditVisually && (
        <button
          type="button"
          className="diagram-edit-actions__btn btn btn--ghost"
          onClick={onEditVisually}
        >
          Edit visually
        </button>
      )}
      {onRecompile && (
        <button
          type="button"
          className="diagram-edit-actions__btn btn btn--ghost"
          onClick={onRecompile}
          disabled={recompiling}
        >
          {recompiling ? "Recompiling…" : "Recompile"}
        </button>
      )}
    </div>
  );
}

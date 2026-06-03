import "./RefinementActions.css";

interface RefinementActionsProps {
  onRefinement: (prompt: string) => void;
  compileFailed?: boolean;
  compileErrors?: string[];
}

export function RefinementActions({
  onRefinement,
  compileFailed,
  compileErrors,
}: RefinementActionsProps) {
  return (
    <div className="refinement-actions" role="group" aria-label="Refine response">
      {compileFailed && (
        <button
          type="button"
          className="refinement-actions__btn btn btn--ghost"
          onClick={() =>
            onRefinement(
              `Fix the TikZ compile errors and return corrected code: ${(compileErrors ?? []).join("; ")}`,
            )
          }
        >
          Fix compile
        </button>
      )}
      <button
        type="button"
        className="refinement-actions__btn btn btn--ghost"
        onClick={() => onRefinement("Simplify this diagram — fewer internal lines, same physics.")}
      >
        Simplify
      </button>
      <button
        type="button"
        className="refinement-actions__btn btn btn--ghost"
        onClick={() =>
          onRefinement("Add more detail — label propagators and show intermediate steps if needed.")
        }
      >
        Add detail
      </button>
    </div>
  );
}

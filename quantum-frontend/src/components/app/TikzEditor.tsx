import { useEffect, useState } from "react";
import { compileTikz } from "../../api/client";
import type { FinalAnswer } from "../../api/types";
import { ZoomableImage } from "../lab/ZoomableImage";
import "./TikzEditor.css";

export interface TikzEditorResult {
  code: string;
  tikz_image?: string | null;
  compile_report?: FinalAnswer["compile_report"];
}

interface TikzEditorProps {
  code: string;
  onSave: (code: string) => void;
  onRecompiled?: (result: TikzEditorResult) => void;
  compact?: boolean;
}

export function TikzEditor({
  code,
  onSave,
  onRecompiled,
  compact = false,
}: TikzEditorProps) {
  const [draft, setDraft] = useState(code);
  const [compiling, setCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    setDraft(code);
  }, [code]);

  const handleRecompile = async () => {
    setCompiling(true);
    setError(null);
    onSave(draft);
    try {
      const res = await compileTikz(draft);
      if (!res.ok) {
        setError(res.errors.join("; ") || "Compilation failed");
        setPreview(null);
        return;
      }
      setPreview(res.tikz_image ?? null);
      onRecompiled?.({
        code: draft,
        tikz_image: res.tikz_image ?? null,
        compile_report: res.compile_report ?? {
          ok: res.ok,
          errors: res.errors,
          warnings: res.warnings,
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Compile failed");
    } finally {
      setCompiling(false);
    }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(draft);
  };

  return (
    <div className={`tikz-editor${compact ? " tikz-editor--compact" : ""}`}>
      <div className="tikz-editor__layout">
        <textarea
          className="tikz-editor__area"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={compact ? 12 : 16}
          spellCheck={false}
          aria-label="TikZ-Feynman source"
        />
        {preview && (
          <div className="tikz-editor__preview">
            <ZoomableImage src={preview} alt="Compile preview" />
          </div>
        )}
      </div>
      <div className="tikz-editor__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void handleRecompile()}
          disabled={compiling || !draft.trim()}
        >
          {compiling ? "Compiling…" : "Recompile"}
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => void copyCode()}>
          Copy
        </button>
      </div>
      {error && (
        <p className="tikz-editor__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

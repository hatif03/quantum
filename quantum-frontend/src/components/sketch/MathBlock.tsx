import type { ReactNode } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import "./MathBlock.css";

/** QFT symbols K2 often emits; not in KaTeX by default. */
const KATEX_MACROS: Record<string, string> = {
  "\\slashed": "\\not{#1}",
};

const ANNOTATION_PLACEHOLDERS = new Set([
  "vertex_factor",
  "short title",
  "step name",
]);

/** Collapse JSON double-escapes: \\\\gamma -> \\gamma */
function collapseEscapedLatex(s: string): string {
  let t = s;
  while (/\\\\[a-zA-Z]/.test(t)) {
    t = t.replace(/\\\\([a-zA-Z])/g, "\\$1");
  }
  return t;
}

/** Strip $ / $$ / ${}$ wrappers so KaTeX receives bare LaTeX. */
export function normalizeLatexInput(s: string): string {
  let t = s.trim();
  if (!t) return "";

  t = collapseEscapedLatex(t);

  if (t.startsWith("${") && t.endsWith("}$")) {
    t = t.slice(2, -2).trim();
  }

  if (t.startsWith("$$") && t.endsWith("$$") && t.length > 4) {
    t = t.slice(2, -2).trim();
  } else if (t.startsWith("$") && t.endsWith("$") && t.length > 2) {
    t = t.slice(1, -1).trim();
  }

  while (/^\$+\s*/.test(t)) {
    t = t.replace(/^\$+\s*/, "");
  }
  while (/\s*\$+$/.test(t)) {
    t = t.replace(/\s*\$+$/, "");
  }

  return t.trim();
}

/** Skip schema placeholders and snake_case keys that are not LaTeX. */
export function isRenderableAnnotationLatex(raw: string): boolean {
  const t = normalizeLatexInput(raw);
  if (!t) return false;
  if (ANNOTATION_PLACEHOLDERS.has(t.toLowerCase())) return false;
  if (/^[a-z][a-z0-9_]*$/.test(t) && t.includes("_") && !t.includes("\\")) {
    return false;
  }
  return true;
}

export function renderLatex(latex: string, displayMode = false): string {
  const normalized = normalizeLatexInput(latex);
  if (!normalized) return "";
  try {
    return katex.renderToString(normalized, {
      throwOnError: false,
      displayMode,
      macros: KATEX_MACROS,
    });
  } catch {
    return normalized;
  }
}

interface MathBlockProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

export function MathBlock({ latex, displayMode = false, className = "" }: MathBlockProps) {
  const html = renderLatex(latex, displayMode);
  const modeClass = displayMode ? "math-block--display" : "math-block--inline";

  return (
    <span
      className={`math-block ${modeClass} ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** $...$, $$...$$, or \\(...\\) segments in prose. */
const LATEX_SEGMENT = /\$\$([^$]+)\$\$|\$([^$]+)\$|\\\(([^)]+)\\\)/g;

/** Render plain text with optional inline/display LaTeX segments. */
export function renderMixedLatex(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  LATEX_SEGMENT.lastIndex = 0;
  while ((match = LATEX_SEGMENT.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const isDisplay = match[1] !== undefined;
    const latex = match[1] ?? match[2] ?? match[3];
    parts.push(
      <MathBlock
        key={key++}
        latex={latex}
        displayMode={isDisplay}
      />,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

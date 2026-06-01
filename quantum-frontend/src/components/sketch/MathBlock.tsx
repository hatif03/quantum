import type { ReactNode } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import "./MathBlock.css";

export function renderLatex(latex: string, displayMode = false): string {
  try {
    return katex.renderToString(latex, { throwOnError: false, displayMode });
  } catch {
    return latex;
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

const LATEX_SEGMENT = /\$([^$]+)\$|\\\(([^)]+)\\\)/g;

/** Render plain text with optional $...$ or \\(...\\) LaTeX segments. */
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
    const latex = match[1] ?? match[2];
    parts.push(<MathBlock key={key++} latex={latex} displayMode={false} />);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

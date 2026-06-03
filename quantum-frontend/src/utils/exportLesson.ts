import type { FinalAnswer } from "../api/types";

export function exportLessonMarkdown(result: FinalAnswer): string | null {
  if (!result.diagram_lesson && !result.math_explanation) return null;

  const lines: string[] = [];
  const topic = result.math_explanation?.topic ?? result.diagram_lesson?.summary ?? "Lesson";

  lines.push(`# ${topic}`, "");

  if (result.summary) {
    lines.push(result.summary, "");
  }

  if (result.diagram_lesson?.panels?.length) {
    lines.push("## Diagram panels", "");
    for (const panel of result.diagram_lesson.panels) {
      lines.push(`### ${panel.title}`, "", panel.caption, "");
      if (panel.tikz) {
        lines.push("```tikz", panel.tikz, "```", "");
      }
    }
  }

  if (result.math_explanation?.derivation_steps?.length) {
    lines.push("## Derivation", "");
    for (const step of result.math_explanation.derivation_steps) {
      lines.push(`### ${step.title}`, "", step.prose, "");
      for (const eq of step.latex) {
        lines.push(`$$${eq}$$`, "");
      }
    }
  }

  if (result.tikz?.code) {
    lines.push("## TikZ source", "", "```tikz", result.tikz.code, "```");
  }

  return lines.join("\n");
}

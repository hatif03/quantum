import katex from "katex";
import type { MathExplanation } from "../../api/types";
import "katex/dist/katex.min.css";
import "./ReasoningPanel.css";

function renderLatex(latex: string): string {
  try {
    return katex.renderToString(latex, { throwOnError: false, displayMode: true });
  } catch {
    return latex;
  }
}

export function ReasoningPanel({ explanation }: { explanation: MathExplanation }) {
  return (
    <div className="reasoning-panel">
      <h3 className="reasoning-panel__title">{explanation.topic}</h3>
      <p className="reasoning-panel__domain">{explanation.domain.toUpperCase()}</p>

      {explanation.prerequisites.length > 0 && (
        <section className="reasoning-panel__section">
          <h4>Prerequisites</h4>
          <ul>
            {explanation.prerequisites.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
      )}

      {explanation.key_equations.length > 0 && (
        <section className="reasoning-panel__section">
          <h4>Key equations</h4>
          {explanation.key_equations.map((eq) => (
            <div
              key={eq}
              className="reasoning-panel__eq"
              dangerouslySetInnerHTML={{ __html: renderLatex(eq) }}
            />
          ))}
        </section>
      )}

      {explanation.derivation_steps.map((step) => (
        <details key={step.title} className="reasoning-panel__step" open>
          <summary>{step.title}</summary>
          <p>{step.prose}</p>
          {step.latex.map((eq) => (
            <div
              key={eq}
              className="reasoning-panel__eq"
              dangerouslySetInnerHTML={{ __html: renderLatex(eq) }}
            />
          ))}
        </details>
      ))}

      {explanation.physical_interpretation && (
        <section className="reasoning-panel__section">
          <h4>Physical interpretation</h4>
          <p>{explanation.physical_interpretation}</p>
        </section>
      )}

      {explanation.diagram_connection && (
        <section className="reasoning-panel__section">
          <h4>Diagram connection</h4>
          <p>{explanation.diagram_connection}</p>
        </section>
      )}

      {explanation.reasoning_trace && (
        <section className="reasoning-panel__trace">
          <h4>K2 Think reasoning</h4>
          <p>{explanation.reasoning_trace}</p>
        </section>
      )}
    </div>
  );
}

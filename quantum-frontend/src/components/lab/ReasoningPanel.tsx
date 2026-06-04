import { isReasoningTraceLeak } from "../../api/cotLeak";
import type { MathExplanation } from "../../api/types";
import { MathBlock, renderMixedLatex } from "../sketch/MathBlock";
import "./ReasoningPanel.css";

export function ReasoningPanel({
  explanation,
  activePanelId,
}: {
  explanation: MathExplanation;
  activePanelId?: string | null;
}) {
  return (
    <div className="reasoning-panel">
      <h3 className="reasoning-panel__title">{renderMixedLatex(explanation.topic)}</h3>
      <p className="reasoning-panel__domain">{explanation.domain.toUpperCase()}</p>

      {explanation.prerequisites.length > 0 && (
        <section className="reasoning-panel__section">
          <h4>Prerequisites</h4>
          <ul>
            {explanation.prerequisites.map((p) => (
              <li key={p}>{renderMixedLatex(p)}</li>
            ))}
          </ul>
        </section>
      )}

      {explanation.key_equations.length > 0 && (
        <section className="reasoning-panel__section">
          <h4>Key equations</h4>
          {explanation.key_equations.map((eq, idx) => (
            <div key={`${idx}-${eq.slice(0, 40)}`} className="reasoning-panel__eq">
              <MathBlock latex={eq} displayMode />
            </div>
          ))}
        </section>
      )}

      {explanation.derivation_steps.map((step) => {
        const linked =
          activePanelId &&
          step.panel_id &&
          step.panel_id === activePanelId;
        return (
          <details
            key={`${step.title}-${step.panel_id ?? ""}`}
            className={`reasoning-panel__step${linked ? " reasoning-panel__step--linked" : ""}`}
            open={linked || undefined}
          >
            <summary>{step.title}</summary>
            <p>{renderMixedLatex(step.prose)}</p>
            {step.intuition && (
              <p className="reasoning-panel__intuition">
                <strong>Why:</strong> {renderMixedLatex(step.intuition)}
              </p>
            )}
            {step.common_mistake && (
              <p className="reasoning-panel__mistake">
                <strong>Common mistake:</strong>{" "}
                {renderMixedLatex(step.common_mistake)}
              </p>
            )}
            {step.latex.map((eq, idx) => (
              <div key={`${idx}-${eq.slice(0, 40)}`} className="reasoning-panel__eq">
                <MathBlock latex={eq} displayMode={eq.length > 40} />
              </div>
            ))}
          </details>
        );
      })}

      {explanation.physical_interpretation && (
        <section className="reasoning-panel__section">
          <h4>Physical interpretation</h4>
          <p>{renderMixedLatex(explanation.physical_interpretation)}</p>
        </section>
      )}

      {explanation.diagram_connection && (
        <section className="reasoning-panel__section">
          <h4>Diagram connection</h4>
          <p>{renderMixedLatex(explanation.diagram_connection)}</p>
        </section>
      )}

      {explanation.reasoning_trace &&
        !isReasoningTraceLeak(explanation.reasoning_trace) && (
          <section className="reasoning-panel__trace">
            <h4>K2 Think reasoning</h4>
            <p>{renderMixedLatex(explanation.reasoning_trace)}</p>
          </section>
        )}
    </div>
  );
}

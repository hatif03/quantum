import type { PhysicsValidationReport } from "../../api/types";
import "./PhysicsValidationPanel.css";

interface PhysicsValidationPanelProps {
  report: PhysicsValidationReport;
}

export function PhysicsValidationPanel({ report }: PhysicsValidationPanelProps) {
  if (!report.validation_report?.length) return null;

  return (
    <div className="physics-panel">
      <p className="physics-panel__summary">{report.overall_conclusion}</p>
      <ul className="physics-panel__list">
        {report.validation_report.map((rule) => (
          <li
            key={rule.rule_number}
            className={`physics-panel__item${rule.passed ? " physics-panel__item--pass" : " physics-panel__item--fail"}`}
          >
            <span className="physics-panel__status" aria-hidden="true">
              {rule.passed ? "✓" : "✗"}
            </span>
            <div>
              <strong>{rule.title}</strong>
              <p>{rule.pass_fail_reason}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

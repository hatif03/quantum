import type { FinalAnswer } from "../../api/types";
import "./StudyPanels.css";

export function StudyPanels({ result }: { result: FinalAnswer }) {
  const warnings = result.convention_warnings ?? [];
  const quizzes = result.quiz_questions ?? [];

  if (warnings.length === 0 && quizzes.length === 0) return null;

  return (
    <div className="study-panels">
      {warnings.length > 0 && (
        <div className="study-panels__block">
          <h3 className="study-panels__title">Convention checks</h3>
          <ul>
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
      {quizzes.length > 0 && (
        <div className="study-panels__block">
          <h3 className="study-panels__title">Study questions</h3>
          <ul className="study-panels__quiz">
            {quizzes.map((q) => (
              <li key={q.id}>
                <details>
                  <summary>{q.question}</summary>
                  <p>{q.answer}</p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

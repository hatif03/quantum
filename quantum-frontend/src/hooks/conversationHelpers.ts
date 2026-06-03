import type { ChatTurn, DiagramRequest, FinalAnswer, WorkflowMode } from "../api/types";
import type { ChatMessage } from "../types/chat";

export function buildHistory(messages: ChatMessage[], maxTurns = 6): ChatTurn[] {
  const slice = messages.slice(-maxTurns * 2);
  return slice.map((m) => ({
    role: m.role,
    content:
      m.role === "user"
        ? m.text
        : m.result?.summary ?? m.text ?? "Assistant response",
  }));
}

export function findPriorTikz(messages: ChatMessage[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === "assistant" && m.result?.tikz?.code) {
      return m.result.tikz.code;
    }
  }
  return undefined;
}

export function buildDiagramRequest(
  messages: ChatMessage[],
  userPrompt: string,
  mode: WorkflowMode,
): DiagramRequest {
  const priorMessages = messages.filter((m) => m.status !== "pending");
  return {
    user_prompt: userPrompt,
    mode,
    history: buildHistory(priorMessages),
    prior_tikz: findPriorTikz(priorMessages),
  };
}

export function enrichAnswerExtras(result: FinalAnswer): FinalAnswer {
  const quiz_questions =
    result.math_explanation?.derivation_steps?.map((step, i) => ({
      id: `q${i + 1}`,
      question: `What is the key idea of "${step.title}"?`,
      answer: step.intuition ?? step.prose,
    })) ?? [];

  const convention_warnings: string[] = [];
  const code = result.tikz?.code ?? "";
  if (code && !code.includes("\\feynmandiagram")) {
    convention_warnings.push("TikZ block may be missing \\feynmandiagram wrapper.");
  }

  return {
    ...result,
    quiz_questions: result.quiz_questions ?? quiz_questions,
    convention_warnings: result.convention_warnings ?? convention_warnings,
  };
}

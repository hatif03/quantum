/** Detect K2 chain-of-thought or echoed prompt/schema in user-visible text. */
export function isCotLeak(text: string): boolean {
  if (!text || text.trim().length < 20) return false;
  const lower = text.toLowerCase();
  const markers = [
    "human-readable process name",
    "output only valid json",
    "matching this schema",
    "lesson planner for quantum reason",
    "we need to answer as the",
    "diagram lesson generator",
  ];
  const hits = markers.filter((m) => lower.includes(m)).length;
  if (hits >= 2) return true;
  if (hits >= 1 && (lower.includes("schema") || lower.includes("lesson planner"))) {
    return true;
  }
  return lower.startsWith("we need to answer") || lower.startsWith("let me ");
}

export function displaySummary(result: {
  summary?: string | null;
  diagram_lesson?: { summary?: string } | null;
  lesson_plan?: { process_name?: string; teaching_goals?: string[] } | null;
}): string | null {
  const lessonSummary = result.diagram_lesson?.summary?.trim();
  if (lessonSummary) return lessonSummary;

  const plan = result.lesson_plan;
  if (plan?.process_name?.trim()) {
    const name = plan.process_name.trim();
    const goal = plan.teaching_goals?.[0];
    return goal ? `${name} — ${goal}` : name;
  }

  const raw = result.summary?.trim();
  if (raw && !isCotLeak(raw)) return raw;
  return null;
}

/** K2 echoed the math explainer JSON template instead of real equations. */
export function isMathSchemaEcho(explanation: {
  topic?: string;
  prerequisites?: string[];
  key_equations?: string[];
  derivation_steps?: { title?: string; latex?: string[]; prose?: string }[];
}): boolean {
  const topic = (explanation.topic ?? "").trim().toLowerCase();
  if (topic === "short title" || topic === "topic") return true;

  const prereq = explanation.prerequisites ?? [];
  if (prereq.some((p) => p.toLowerCase().includes("concepts the reader should know"))) {
    return true;
  }

  const eqs = explanation.key_equations ?? [];
  if (
    eqs.some((e) => e.toLowerCase().includes("latex for central equations")) ||
    eqs.some((e) => ["eq1", "eq2"].includes(e.trim().toLowerCase()))
  ) {
    return true;
  }

  const steps = explanation.derivation_steps ?? [];
  if (steps.some((s) => (s.title ?? "").trim().toLowerCase() === "step name")) {
    return true;
  }
  if (steps.some((s) => (s.prose ?? "").trim().toLowerCase() === "accessible explanation")) {
    return true;
  }

  return false;
}

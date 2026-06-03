"""Lightweight post-processing agents (feature-flagged)."""

from __future__ import annotations

import os
from typing import Any

from quantum_reason_adk.schemas import DerivationStep, MathExplanation, QuizQuestion


def _enabled(name: str) -> bool:
    return os.getenv(name, "true").lower() in ("1", "true", "yes", "on")


def run_convention_checker(state: dict[str, Any]) -> list[str]:
    if not _enabled("ENABLE_CONVENTION_CHECKER"):
        return []

    warnings: list[str] = []
    code = state.get("tikz_code") or ""
    if isinstance(code, str) and code.strip():
        if "\\feynmandiagram" not in code:
            warnings.append("TikZ block may be missing \\feynmandiagram wrapper.")
        if "horizontal=" not in code and "vertical=" not in code:
            warnings.append("Consider adding horizontal= or vertical= layout hint.")
        if "\\begin{tikzpicture}" in code and "\\feynmandiagram" not in code:
            warnings.append("Raw tikzpicture detected; TikZ-Feynman macros are preferred.")

    diagram_lesson = state.get("diagram_lesson") or {}
    panels = diagram_lesson.get("panels") or []
    for panel in panels:
        tikz = (panel or {}).get("tikz") or ""
        if tikz and "\\feynmandiagram" not in tikz:
            title = (panel or {}).get("title") or panel.get("id") or "panel"
            warnings.append(f'Panel "{title}" may be missing \\feynmandiagram wrapper.')

    return warnings


def run_quiz_generator(state: dict[str, Any]) -> list[QuizQuestion]:
    if not _enabled("ENABLE_QUIZ_GENERATOR"):
        return []

    raw = state.get("math_explanation") or state.get("mathExplanation")
    if not raw:
        return []

    if isinstance(raw, MathExplanation):
        steps = raw.derivation_steps
    elif isinstance(raw, dict):
        steps = [
            DerivationStep(**s) if isinstance(s, dict) else s
            for s in raw.get("derivation_steps") or []
        ]
    else:
        return []

    questions: list[QuizQuestion] = []
    for i, step in enumerate(steps[:6]):
        if isinstance(step, dict):
            title = step.get("title") or f"Step {i + 1}"
            answer = step.get("intuition") or step.get("prose") or ""
        else:
            title = step.title or f"Step {i + 1}"
            answer = step.intuition or step.prose or ""
        if not answer.strip():
            continue
        questions.append(
            QuizQuestion(
                id=f"q{i + 1}",
                question=f'What is the key idea of "{title}"?',
                answer=answer.strip(),
            )
        )
    return questions


def apply_post_steps(state: dict[str, Any]) -> dict[str, Any]:
    """Mutate state with optional convention/quiz enrichments."""
    warnings = run_convention_checker(state)
    if warnings:
        state["convention_warnings"] = warnings

    quizzes = run_quiz_generator(state)
    if quizzes:
        state["quiz_questions"] = [q.model_dump() for q in quizzes]

    return state

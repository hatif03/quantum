"""Tests for math LaTeX sanitization (session ae924c61 cases)."""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from quantum_reason_adk.tools.math_sanitize import (  # noqa: E402
    repair_latex_string,
    sanitize_math_explanation,
)

SESSION_PATH = (
    ROOT
    / "logs"
    / "sessions"
    / "ae924c61-70b0-457e-9f58-c0e5c423b30d"
    / "parsed"
    / "math_explanation.json"
)


def test_chained_subscript_repair() -> None:
    raw = r"p_\mu = p_\nu_\mu + q"
    fixed = repair_latex_string(raw)
    assert fixed == r"p_\mu = p_{\nu_\mu} + q", fixed


def test_bar_nu_repair() -> None:
    raw = r"q = p_e + p_{\bar\nu_e}"
    fixed = repair_latex_string(raw)
    assert r"\bar{\nu}" in fixed, fixed
    assert r"\bar\nu" not in fixed, fixed


def test_subscript_superscript_repair() -> None:
    raw = r"\bar{u}_{e^-}"
    fixed = repair_latex_string(raw)
    assert "e^{-}" in fixed, fixed


def test_session_snapshot_sanitize() -> None:
    if not SESSION_PATH.exists():
        print("skip: session math_explanation.json not found")
        return

    data = json.loads(SESSION_PATH.read_text(encoding="utf-8"))
    out = sanitize_math_explanation(data)
    step1_latex = out["derivation_steps"][0]["latex"]
    assert r"p_{\nu_\mu}" in step1_latex[0], step1_latex[0]
    assert r"p_\nu_\mu" not in step1_latex[0], step1_latex[0]
    assert r"\bar{\nu}" in step1_latex[2], step1_latex[2]


def main() -> int:
    test_chained_subscript_repair()
    test_bar_nu_repair()
    test_subscript_superscript_repair()
    test_session_snapshot_sanitize()
    print("test_math_sanitize: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

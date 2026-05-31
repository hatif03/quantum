/** Map LaTeX-ish keys to pen-scribble display (Patrick Hand / Caveat) */
const HANDWRITTEN: Record<string, string> = {
  "E = mc^2": "E = mc²",
  "E = mc²": "E = mc²",
  "E^2 = p^2 c^2 + m^2 c^4": "E² = p²c² + m²c⁴",
  "\\sigma \\propto |\\mathcal{M}|^2": "σ ∝ |ℳ|²",
  "\\sum Q = 0": "Σ Q = 0",
  "\\sum L_e = 0": "Σ Lₑ = 0",
  "\\sum \\vec{p} = 0": "Σ p = 0",
  "p + p \\to X": "p + p → X",
  "\\sqrt{s}": "√s",
  "\\sqrt{s} \\approx 13.6\\,\\mathrm{TeV}": "√s ≈ 13.6 TeV",
  "e^+ e^- \\to \\gamma \\gamma": "e⁺ e⁻ → γ γ",
  "x \\in [0,1]": "x ∈ [0, 1]",
  "p_T^{jet}": "pₜʲᵉᵗ",
  "p_T^{jet} \\gg \\Lambda_{QCD}": "pₜʲᵉᵗ ≫ ΛQCD",
  "\\mathcal{M}": "ℳ",
  "\\psi": "ψ",
  "\\hbar": "ℏ",
  "\\alpha \\approx \\frac{1}{137}": "α ≈ 1/137",
  "?": "?",
  "core ?": "core?",
};

export function toHandwritten(latex: string): string {
  if (HANDWRITTEN[latex]) return HANDWRITTEN[latex];
  return latex
    .replace(/\\to/g, "→")
    .replace(/\\gamma/g, "γ")
    .replace(/\\sum/g, "Σ")
    .replace(/\\vec\{p\}/g, "p")
    .replace(/\\hbar/g, "ℏ")
    .replace(/\\psi/g, "ψ")
    .replace(/\\alpha/g, "α")
    .replace(/\^\+/g, "⁺")
    .replace(/\^-/g, "⁻")
    .replace(/\\frac\{1\}\{137\}/g, "1/137")
    .replace(/\\mathcal\{M\}/g, "ℳ")
    .replace(/\\mathrm\{TeV\}/g, "TeV")
    .replace(/\\gg/g, "≫")
    .replace(/\\in/g, "∈")
    .replace(/\\approx/g, "≈")
    .replace(/[{}\\]/g, "")
    .trim();
}

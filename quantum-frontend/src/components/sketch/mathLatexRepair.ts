/**
 * Repair common K2 LaTeX mistakes before KaTeX rendering.
 * Keep in sync with quantum_reason_adk/tools/math_sanitize.py.
 */

/** Fix unbraced \\bar on a single command: \\bar\\nu -> \\bar{\\nu} */
function repairUnbracedBar(s: string): string {
  return s.replace(/\\bar\\([a-zA-Z]+)/g, "\\bar{\\$1}");
}

/** Fix chained command subscripts: _\\nu_\\mu -> _{\\nu_\\mu} */
function repairChainedSubscripts(s: string): string {
  return s.replace(/_\\([a-zA-Z]+)_\\([a-zA-Z]+)/g, "_{\\$1_\\$2}");
}

/** Fix bare ^- inside braced subscripts: _{e^-} -> _{e^{-}} */
function repairSubscriptSuperscripts(s: string): string {
  return s.replace(/_\{([^}]*)\^-\}/g, "_{$1^{-}}");
}

export function repairLatexSyntax(s: string): string {
  if (!s) return "";
  let t = s;
  t = repairUnbracedBar(t);
  t = repairChainedSubscripts(t);
  t = repairSubscriptSuperscripts(t);
  return t;
}

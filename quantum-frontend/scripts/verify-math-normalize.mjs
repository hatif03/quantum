/**
 * Smoke-test normalizeLatexInput against session log samples.
 * Run: node scripts/verify-math-normalize.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import katex from "katex";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function normalizeLatexInput(s) {
  let t = s.trim();
  if (!t) return "";
  if (t.startsWith("${") && t.endsWith("}$")) t = t.slice(2, -2).trim();
  if (t.startsWith("$$") && t.endsWith("$$") && t.length > 4) t = t.slice(2, -2).trim();
  else if (t.startsWith("$") && t.endsWith("$") && t.length > 2) t = t.slice(1, -1).trim();
  while (/^\$+\s*/.test(t)) t = t.replace(/^\$+\s*/, "");
  while (/\s*\$+$/.test(t)) t = t.replace(/\s*\$+$/, "");
  return t.trim();
}

const logPath = path.resolve(
  __dirname,
  "../../quantum-reason-backend/logs/sessions/21cb429f-8e89-4a35-a83d-1a7e593045e3/parsed/math_explanation.json",
);

if (!fs.existsSync(logPath)) {
  console.log("Session log not found (skip):", logPath);
  process.exit(0);
}

const data = JSON.parse(fs.readFileSync(logPath, "utf8"));
const samples = [
  ...data.key_equations.slice(0, 3),
  data.derivation_steps[0]?.latex?.[0],
  "$ $ Vertex\\;rule\\;:\\;-i e \\gamma^{\\mu}$",
].filter(Boolean);

let failed = 0;
for (const raw of samples) {
  const norm = normalizeLatexInput(raw);
  const html = katex.renderToString(norm, {
    throwOnError: false,
    displayMode: true,
    macros: { "\\slashed": "\\not{#1}" },
  });
  const hasError = html.includes("katex-error");
  if (hasError || norm.startsWith("$")) {
    console.error("FAIL:", raw.slice(0, 60), "->", norm.slice(0, 60));
    failed++;
  } else {
    console.log("OK:", norm.slice(0, 50) + (norm.length > 50 ? "..." : ""));
  }
}

if (failed) process.exit(1);
console.log("verify-math-normalize: all samples OK");

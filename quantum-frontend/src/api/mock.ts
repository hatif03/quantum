import type { DiagramRequest, FinalAnswer, ProcessExample } from "./types";

export const PROCESS_EXAMPLES: ProcessExample[] = [
  {
    id: "annihilation",
    match: ["electron", "positron", "annihilation", "photon"],
    title: "Electron-positron annihilation",
    short: "e+ e- -> gamma gamma",
    confidence: "95% compile success pattern",
    particles: ["e-", "e+", "gamma", "gamma"],
    diagramType: "annihilation",
    prompt:
      "Generate a Feynman diagram for electron-positron annihilation producing two photons",
    code: String.raw`\feynmandiagram [horizontal=a to b] {
  i1 [particle=\(e^{-}\)] -- [fermion] a -- [fermion] i2 [particle=\(e^{+}\)],
  a -- [photon] b,
  b -- [photon] f1 [particle=\(\gamma\)],
  b -- [photon] f2 [particle=\(\gamma\)],
};`,
  },
  {
    id: "z_decay",
    match: ["z", "boson", "lepton", "pair"],
    title: "Z boson decay",
    short: "Z -> l+ l-",
    confidence: "PDG-backed validation path",
    particles: ["Z", "l-", "l+"],
    diagramType: "z_decay",
    prompt: "Draw a Z boson decay to lepton pair diagram",
    code: String.raw`\feynmandiagram [horizontal=z to v] {
  z [particle=\(Z^{0}\)] -- [boson] v,
  v -- [fermion] l1 [particle=\(\ell^{-}\)],
  v -- [anti fermion] l2 [particle=\(\ell^{+}\)],
};`,
  },
  {
    id: "compton",
    match: ["compton", "scattering"],
    title: "Compton scattering",
    short: "e- gamma -> e- gamma",
    confidence: "retrieves scattering examples",
    particles: ["e-", "gamma", "e-", "gamma"],
    diagramType: "compton",
    prompt: "Show Compton scattering process",
    code: String.raw`\feynmandiagram [horizontal=a to b] {
  i1 [particle=\(e^{-}\)] -- [fermion] a -- [fermion] b -- [fermion] f1 [particle=\(e^{-}\)],
  i2 [particle=\(\gamma\)] -- [photon] a,
  b -- [photon] f2 [particle=\(\gamma\)],
};`,
  },
  {
    id: "muon_decay",
    match: ["muon", "decay"],
    title: "Muon decay",
    short: "mu- -> e- nu_mu anti-nu_e",
    confidence: "weak-interaction topology",
    particles: ["mu-", "W-", "e-", "nu_mu", "anti-nu_e"],
    diagramType: "muon_decay",
    prompt: "muon decay diagram",
    code: String.raw`\feynmandiagram [horizontal=a to b] {
  mu [particle=\(\mu^{-}\)] -- [fermion] a -- [fermion] e [particle=\(e^{-}\)],
  a -- [boson, edge label=\(W^{-}\)] b,
  b -- [fermion] n1 [particle=\(\nu_{\mu}\)],
  b -- [anti fermion] n2 [particle=\(\bar{\nu}_{e}\)],
};`,
  },
];

export function pickExample(prompt: string): ProcessExample {
  const text = prompt.toLowerCase();
  return (
    PROCESS_EXAMPLES.find((ex) =>
      ex.match.some((term) => text.includes(term)),
    ) ?? PROCESS_EXAMPLES[0]
  );
}

const STEP_DELAY_MS = 520;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockGenerateDiagram(
  req: DiagramRequest,
  onStep?: (step: string) => void,
): Promise<FinalAnswer> {
  const example = pickExample(req.user_prompt);

  const steps = [
    "planner",
    "kb_retriever",
    "physics_validator",
    "diagram_generator",
    "tikz_validator",
    "feedback",
  ];

  for (const step of steps) {
    onStep?.(step);
    await delay(STEP_DELAY_MS);
  }

  return {
    tikz: {
      code: example.code,
      description: example.title,
    },
    physics_report: {
      user_process: example.short,
      validation_report: [
        {
          rule_number: 1,
          title: "Charge conservation",
          validation_type: "computational",
          passed: true,
          pass_fail_reason: "Net charge balances for the stated process.",
        },
        {
          rule_number: 2,
          title: "Allowed interaction",
          validation_type: "text",
          passed: true,
          pass_fail_reason: "Process matches known interaction patterns in the knowledge base.",
        },
      ],
      overall_conclusion: `Physics validation passed for ${example.title}.`,
    },
    compile_report: {
      ok: true,
      errors: [],
      warnings: [],
      details: "Mock compile: TikZ structure matches expected Feynman patterns.",
    },
    summary: `Generated a Feynman diagram for ${example.title}. The map shows which particles enter, interact, and exit—ready as TikZ-Feynman code for your paper.`,
  };
}

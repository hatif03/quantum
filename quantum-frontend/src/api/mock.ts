import type {
  DiagramLesson,
  DiagramRequest,
  FinalAnswer,
  ProcessExample,
} from "./types";

export const PROCESS_EXAMPLES: ProcessExample[] = [
  {
    id: "annihilation",
    match: ["electron", "positron", "annihilation", "photon"],
    title: "Electron-positron annihilation",
    short: "e+ e- -> gamma gamma",
    shortLatex: "e^+ e^- \\to \\gamma \\gamma",
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
    shortLatex: "Z \\to \\ell^+ \\ell^-",
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
    shortLatex: "e^- \\gamma \\to e^- \\gamma",
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
    shortLatex: "\\mu^- \\to e^- \\nu_\\mu \\bar{\\nu}_e",
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

  const isTeach = req.mode === "both" || req.mode === "teach";
  const teachSteps = [
    "lesson_planner",
    "diagram_lesson",
    "compile_panels",
    "math_explainer",
  ];
  const diagramSteps = ["diagram_generator"];

  const steps = isTeach
    ? teachSteps
    : req.mode === "explain"
      ? ["math_explainer"]
      : diagramSteps;

  for (const step of steps) {
    onStep?.(step);
    await delay(STEP_DELAY_MS);
  }

  const mathExplanation =
    req.mode === "explain" || isTeach
      ? mockMathExplanation(example, isTeach)
      : undefined;

  const diagramLesson = isTeach ? mockDiagramLesson(example) : undefined;

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
    summary: isTeach
      ? `Lesson for ${example.title}: follow the panels, then the derivation steps linked to each stage.`
      : `Generated a Feynman diagram for ${example.title}. The map shows which particles enter, interact, and exit—ready as TikZ-Feynman code for your paper.`,
    math_explanation: mathExplanation,
    diagram_lesson: diagramLesson,
    workflow_step: "complete",
  };
}

function mockDiagramLesson(example: ProcessExample): DiagramLesson {
  return {
    summary: `How ${example.title} works, from kinematics to the full Feynman diagram.`,
    panels: [
      {
        id: "panel_1",
        title: "Process overview",
        caption:
          "Identify incoming and outgoing particles and what is exchanged at the vertex.",
        tikz: example.code,
        annotation_latex: [example.shortLatex],
        linked_step_index: 0,
        compile_ok: false,
      },
      {
        id: "panel_2",
        title: "Full diagram",
        caption: "Tree-level Feynman diagram with standard tikz-feynman styling.",
        tikz: example.code,
        annotation_latex: ["\\sum Q = 0"],
        linked_step_index: 1,
        compile_ok: false,
      },
    ],
  };
}

function mockMathExplanation(example: ProcessExample, isTeach: boolean) {
  return {
    topic: example.title,
    domain: "particle" as const,
    prerequisites: ["Four-momentum conservation", "Feynman rules"],
    key_equations: [example.shortLatex, "\\sum Q = 0"],
    derivation_steps: [
      {
        title: "Process topology",
        latex: [example.shortLatex],
        prose: `The diagram encodes the allowed external legs and vertices for ${example.title.toLowerCase()}.`,
        panel_id: isTeach ? "panel_1" : undefined,
        intuition:
          "External legs are on-shell particles; internal lines are propagators mediating the interaction.",
      },
      {
        title: "Amplitude structure",
        latex: ["\\mathcal{M} \\propto g^2", example.shortLatex],
        prose: "Tree-level amplitudes follow from Feynman rules applied at each vertex.",
        panel_id: isTeach ? "panel_2" : undefined,
        intuition:
          "Each vertex contributes a coupling; momentum conservation at vertices fixes kinematics.",
        common_mistake: "Forgetting that photon lines use different Feynman rules than fermion lines.",
      },
    ],
    physical_interpretation:
      "Each line represents a propagating particle; vertices encode couplings constrained by symmetries.",
    diagram_connection: "Panel 1 sets up the process; panel 2 shows the full diagram used in the amplitude.",
    reasoning_trace:
      "Started from the user's process, matched KB topology, built a two-panel lesson, then derived the amplitude structure with explicit Feynman-rule intuition.",
  };
}

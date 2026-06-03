export type ChapterId =
  | "classroom"
  | "collisions"
  | "maps"
  | "diagram"
  | "rules"
  | "threshold";

export type SketchTheme = ChapterId;

export interface MarginNoteDef {
  latex: string;
  label?: string;
  position: "left" | "right";
  faded?: boolean;
}

export interface StoryChapterDef {
  id: ChapterId;
  sketch: SketchTheme;
  eyebrow?: string;
  title: string;
  body: string | string[];
  inlineEquations?: string[];
  marginNotes?: MarginNoteDef[];
  showSketch?: boolean;
  showRules?: boolean;
  showContinue?: boolean;
}

export const STORY_CHAPTERS: StoryChapterDef[] = [
  {
    id: "classroom",
    sketch: "classroom",
    eyebrow: "After the lecture",
    title: "What counts as an event",
    body: [
      "At the LHC, protons cross billions of times per second. A useful event is not a photograph—it is a reconstructed snapshot: tracks, energy deposits, and momenta that survived triggers and filters.",
      "The collision vertex never sat on the chalkboard. Physicists infer it from the debris, then draw a map of the process that could have produced what the detector saw.",
    ],
    inlineEquations: ["\\sigma \\propto |\\mathcal{M}|^2"],
    marginNotes: [
      { latex: "E^2 = p^2 c^2 + m^2 c^4", position: "left", label: "on-shell" },
      { latex: "\\sum Q = 0", position: "right" },
    ],
  },
  {
    id: "collisions",
    sketch: "collisions",
    eyebrow: "Beams",
    title: "Collisions in the dark",
    body: [
      "Two beam pipes carry protons at nearly the speed of light. Where they meet, partons can scatter or annihilate; the products spray into layers of silicon, gas, and calorimeters.",
      "A nebula on a poster is beautiful astrophysics—not a single pp interaction. Distant light is a clue; the event map is built from measured four-momenta.",
    ],
    inlineEquations: ["p + p \\to X", "\\sqrt{s} \\approx 13.6\\,\\mathrm{TeV}"],
    marginNotes: [
      { latex: "p + p \\to X", position: "right", label: "hard scatter" },
      { latex: "\\sqrt{s}", position: "left", faded: true },
    ],
  },
  {
    id: "maps",
    sketch: "maps",
    eyebrow: "Calculational graphs",
    title: "Maps, not pictures",
    body: [
      "A Feynman diagram is a recipe for an amplitude: which lines enter, which vertices fire, which propagators connect them. Time does not run left-to-right in the drawing—it is a bookkeeping graph.",
      "Jets and missing energy in data are shorthand for parton showers, hadronization, and invisible carriers. The sketch compresses that story into lines you can sum over in perturbation theory.",
    ],
    inlineEquations: ["x \\in [0,1]", "p_T^{jet} \\gg \\Lambda_{QCD}"],
    marginNotes: [
      { latex: "x \\in [0,1]", position: "left", label: "parton" },
      { latex: "p_T^{jet} \\gg \\Lambda", position: "right", faded: true },
    ],
  },
  {
    id: "diagram",
    sketch: "diagram",
    eyebrow: "On the page",
    title: "A Feynman diagram",
    body: [
      "Solid lines are fermions; wiggly lines are photons. At the central vertex, an electron and positron annihilate; two photons leave with opposite helicities in the simplest tree-level picture.",
      "Follow the arrows: charge flows in, photons carry the interaction, and the diagram tells you which Feynman rules to apply when you compute the rate.",
    ],
    inlineEquations: ["e^+ e^- \\to \\gamma \\gamma"],
    marginNotes: [
      {
        latex: "e^+ e^- \\to \\gamma \\gamma",
        position: "right",
        label: "QED tree",
      },
    ],
    showSketch: true,
  },
  {
    id: "rules",
    sketch: "rules",
    eyebrow: "Constraints",
    title: "Rules on the page",
    body: [
      "Every allowed diagram respects symmetries: electric charge, lepton number, and four-momentum at each vertex. If a line cannot couple at that vertex, it does not belong in the map.",
      "The amplitude must be gauge-invariant and match known low-energy limits. Those checks are what keep a scribble from becoming fiction.",
    ],
    inlineEquations: ["\\sum Q = 0", "\\sum L_e = 0"],
    marginNotes: [
      { latex: "\\sum Q = 0", position: "left" },
      { latex: "\\sum L_e = 0", position: "right" },
    ],
    showRules: true,
  },
  {
    id: "threshold",
    sketch: "threshold",
    eyebrow: "Your turn",
    title: "Draw one process",
    body: "Name a collision or decay in plain language. Open the app to sketch the diagram, explain the math, or get TikZ-Feynman code for your paper.",
    inlineEquations: ["\\mathcal{M}"],
    marginNotes: [{ latex: "\\mathcal{M}", position: "left", label: "amplitude" }],
    showContinue: true,
  },
];

export const CHAPTER_ORDER: ChapterId[] = STORY_CHAPTERS.map((c) => c.id);

export function marginNotesForChapter(id: ChapterId): MarginNoteDef[] {
  return STORY_CHAPTERS.find((c) => c.id === id)?.marginNotes ?? [];
}

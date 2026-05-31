import type { ModelId } from "../components/three/ModelBackdrop";

export type ChapterId =
  | "classroom"
  | "collisions"
  | "maps"
  | "diagram"
  | "rules"
  | "threshold"
  | "lab";

export interface StoryChapterDef {
  id: ChapterId;
  eyebrow?: string;
  title: string;
  body: string | string[];
  model: ModelId | null;
  /** 0–1 multiplier for 3D layer visibility */
  sceneOpacity: number;
  showSketch?: boolean;
  showRules?: boolean;
  showContinue?: boolean;
}

export const STORY_CHAPTERS: StoryChapterDef[] = [
  {
    id: "classroom",
    eyebrow: "After the lecture",
    title: "You step out of the hall",
    body: [
      "The chalkboard is still in your head: particles, forces, conservation laws.",
      "But the collision itself was never on the board—it is inferred. Physicists draw maps of events, not photographs.",
    ],
    model: null,
    sceneOpacity: 0,
  },
  {
    id: "collisions",
    eyebrow: "Out there",
    title: "Collisions in the dark",
    body: "Most particle events happen where we cannot point a camera. Nebulae and distant light are clues—not pictures of a single collision.",
    model: "stellar-nursery",
    sceneOpacity: 0.38,
  },
  {
    id: "maps",
    eyebrow: "Hidden structure",
    title: "Maps, not pictures",
    body: "Disks, jets, and hidden cores stand in for processes we model. The drawing is a compact blueprint for calculation, not a literal snapshot.",
    model: "dg-tauri",
    sceneOpacity: 0.36,
  },
  {
    id: "diagram",
    eyebrow: "On the page",
    title: "A Feynman diagram",
    body: "Lines trace particles. A junction marks an interaction. Watch two carriers meet—and two photons leave.",
    model: null,
    sceneOpacity: 0.06,
    showSketch: true,
  },
  {
    id: "rules",
    eyebrow: "Margin notes",
    title: "Rules on the page",
    body: "Charge must balance. Only allowed forces appear. The map encodes those rules so predictions stay honest.",
    model: null,
    sceneOpacity: 0,
    showRules: true,
  },
  {
    id: "threshold",
    eyebrow: "Threshold",
    title: "You have the premise",
    body: "Now sketch one process yourself. Quantum will read your words, check the physics, and return TikZ-Feynman code for your paper.",
    model: "fluid",
    sceneOpacity: 0.28,
    showContinue: true,
  },
];

export const CHAPTER_ORDER: ChapterId[] = [
  ...STORY_CHAPTERS.map((c) => c.id),
  "lab",
];

export function chapterModelForId(id: ChapterId): ModelId | null {
  if (id === "lab") return "fluid";
  return STORY_CHAPTERS.find((c) => c.id === id)?.model ?? null;
}

export function sceneOpacityForId(id: ChapterId): number {
  if (id === "lab") return 0.18;
  return STORY_CHAPTERS.find((c) => c.id === id)?.sceneOpacity ?? 0;
}

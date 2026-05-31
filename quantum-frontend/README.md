# quantum

Pen-and-paper frontend for the Particle Physics Agent. One scroll journey—from leaving the lecture hall to drawing Feynman diagrams in the workbench—with 3D atmosphere woven through the story ([Harmony](https://harmony.now/)-style flow).

## Quick start

```bash
cd quantum-frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Scroll to move through the narrative; the lab is the final chapter.

## Experience

| Entry | Behavior |
|-------|----------|
| `/` | Full immersive journey (masthead only—no nav links) |
| `/#lab` | Jump to the workbench chapter |
| `/lab` | Redirects to `/#lab` |
| `/story` | Redirects to `/` |

**Chapters (scroll):** classroom → collisions (nebula) → maps (protostar) → Feynman diagram → rules → threshold → **lab**

A fixed **persistent 3D canvas** crossfades models as you scroll. The lab bundle loads when you near the final section.

## 3D assets

Place GLB files in `public/models/`:

| File | Used in chapters |
|------|------------------|
| `fluid.glb` | threshold, lab |
| `stellar-nursery.glb` | collisions |
| `dg-tauri.glb` | maps |

## Backend integration

Types in `src/api/types.ts` mirror `feynmancraft_adk/schemas.py`.

| Variable | Behavior |
|----------|----------|
| *(unset)* | Mock six-agent pipeline in `src/api/mock.ts` |
| `VITE_API_BASE_URL` | POST `{base}/api/diagram` |

## Project layout

```
src/
  journey/      chapter definitions
  hooks/        useActiveChapter, useWorkflow
  components/
    journey/    Journey, JourneyChapter, LabChapter, ProgressRail
    story/      FeynmanSketch
    lab/        ProcessInput, DiagramCanvas, …
    three/      PersistentStoryCanvas, PersistentScene
    layout/     Masthead
  pages/        JourneyPage
```

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run preview` — preview production build

## Accessibility

- Native document scroll (keyboard, screen readers)
- `aria-live` announces active chapter
- `prefers-reduced-motion`: no scroll-snap, static 3D placeholders

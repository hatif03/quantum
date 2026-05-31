# quantum

Pen-and-paper frontend for **Quantum Reason** — a reasoning-first physics tutor (K2 Think + ADK 2.x). Scroll journey with Feynman diagrams, margin equations, and a lab workbench with Diagram / Explain / Both modes.

## Quick start

```bash
cd quantum-frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Scroll through the story; the lab is the final chapter.

## Experience

| Entry | Behavior |
|-------|----------|
| `/` | Full immersive journey (masthead only—no nav links) |
| `/#lab` | Jump to the workbench chapter |
| `/lab` | Redirects to `/#lab` |
| `/story` | Redirects to `/` |

**Chapters (scroll):** classroom → collisions → maps → Feynman diagram → rules → threshold → **lab**

Each story chapter includes subject-specific copy, inline handwritten equations, and a small SVG figure. The lab is a single-column chat UI: describe a process, see the diagram, expand TikZ output.

## Visual system

- Ruled paper background with red margin line
- `StoryFigure` — inline chapter diagrams in the content column
- `FeynmanSketch` — interactive QED diagram in the diagram chapter
- `EquationNote` — margin math in Patrick Hand (handwritten mapping)
- `ChatWorkbench` — minimal composer + message thread for the lab

No 3D/WebGL assets are required.

## Backend integration

Types in `src/api/types.ts` mirror `quantum_reason_adk/schemas.py`.

| Variable | Behavior |
|----------|----------|
| *(unset)* | Mock pipeline in `src/api/mock.ts` |
| `VITE_API_BASE_URL` | POST `{base}/api/diagram` |

## Project layout

```
src/
  journey/      chapter definitions + margin notes
  hooks/        useActiveChapter, useWorkflow
  components/
    sketch/     EquationNote, ScribblePath, SketchDefs
    journey/    Journey, JourneyChapter, LabChapter
    story/      FeynmanSketch, StoryFigure
    lab/          ChatWorkbench, DiagramPreview
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
- Decorative sketches are `aria-hidden`
- `prefers-reduced-motion`: no scroll-snap, static illustrations, no path animations

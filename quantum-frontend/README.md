# quantum

Minimal pen-and-paper frontend for the Particle Physics Agent. Turns plain-language physics requests into validated Feynman diagrams (TikZ-Feynman), with a story-driven intro and a lab wired for future backend integration.

## Quick start

```bash
cd quantum-frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Routes

| Path | Purpose |
|------|---------|
| `/` | Minimal home — brand, CTA to story and lab |
| `/story` | Five-page “book” explaining Feynman diagrams |
| `/lab` | Process input, diagram preview, agent timeline, TikZ output |

## 3D assets (Sketchfab)

Download **GLB** exports and place them in `public/models/`:

| File | Sketchfab | License |
|------|-----------|---------|
| `fluid.glb` | [physics/1 fluid](https://skfb.ly/6sZQP) | Lab ambient + story page 5 |
| `stellar-nursery.glb` | Stellar nursery (or free nebula substitute) | Story page 1 |
| `dg-tauri.glb` | Young accreting star (or free protostar substitute) | Story page 2 |

All three filenames match what the app loads. Models are preloaded and auto-centered on screen.

If a model is missing, the UI shows a paper-style placeholder (no broken layout).

## Backend integration

Types in `src/api/types.ts` mirror `feynmancraft_adk/schemas.py` (`DiagramRequest`, `WorkflowState`, `FinalAnswer`).

| Variable | Behavior |
|----------|----------|
| *(unset)* | Uses `src/api/mock.ts` — simulates the six-agent pipeline with example TikZ |
| `VITE_API_BASE_URL` | POST `{base}/api/diagram` with JSON body `{ user_prompt, style_hint? }` |

Example `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Future options (not implemented in the frontend):

- ADK dev UI / Cloud Run session API
- FastAPI wrapper around `root_agent` returning `FinalAnswer`
- SSE/WebSocket via `subscribeWorkflow()` stub in `src/api/client.ts`

## Project layout

```
src/
  api/          types, client, mock examples
  hooks/        useWorkflow state machine
  components/
    story/      StoryBook, FeynmanSketch
    lab/        ProcessInput, DiagramCanvas, WorkflowTimeline, ResultPanel
    three/      PaperScene, ModelBackdrop (React Three Fiber)
    layout/     Header, Footer
  pages/        Home, Story, Lab
```

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run preview` — preview production build

## Related repos

- **Agent backend:** `../Particle-Physics-Agent-main/` (not modified by this frontend)
- **Legacy mock UI:** `../feynmancraft-frontend/` (archived reference)

## Accessibility

- `prefers-reduced-motion`: disables 3D and softens book page transitions
- Story book: keyboard ←/→, `aria-live` on page changes
- Diagram SVGs include descriptive `aria-label`s

import { Suspense, lazy, useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import "./ModelBackdrop.css";

export type ModelId = "fluid" | "stellar-nursery" | "dg-tauri";

const PaperScene = lazy(() =>
  import("./PaperScene").then((m) => ({ default: m.PaperScene })),
);

const MODEL_PATHS: Record<ModelId, string> = {
  fluid: "/models/fluid.glb",
  "stellar-nursery": "/models/stellar-nursery.glb",
  "dg-tauri": "/models/dg-tauri.glb",
};

interface ModelBackdropProps {
  model: ModelId;
  className?: string;
}

function Placeholder({ model }: { model: ModelId }) {
  return (
    <div className="model-backdrop__placeholder" aria-hidden="true">
      <span className="model-backdrop__placeholder-label">
        {model === "stellar-nursery" ? "✦ nebula" : model === "fluid" ? "∿ field" : "★ star"}
      </span>
    </div>
  );
}

export function ModelBackdrop({ model, className = "" }: ModelBackdropProps) {
  const reduced = useReducedMotion();
  const path = useMemo(() => MODEL_PATHS[model], [model]);

  if (reduced) {
    return (
      <div className={`model-backdrop model-backdrop--static ${className}`}>
        <Placeholder model={model} />
      </div>
    );
  }

  return (
    <div className={`model-backdrop ${className}`}>
      <Suspense fallback={<Placeholder model={model} />}>
        <PaperScene
          modelPath={path}
          modelId={model}
          fallback={<Placeholder model={model} />}
        />
      </Suspense>
    </div>
  );
}

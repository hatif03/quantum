import { Component, type ReactNode, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Center, Float, useGLTF } from "@react-three/drei";
import type { ModelId } from "./ModelBackdrop";

interface PaperSceneProps {
  modelPath: string;
  modelId?: ModelId;
  fallback: ReactNode;
}

/** Tune framing per asset — large GLBs share one camera otherwise clip or vanish. */
const MODEL_SCALE: Record<ModelId, number> = {
  fluid: 0.45,
  "stellar-nursery": 0.85,
  "dg-tauri": 0.75,
};

function Model({ path, modelId }: { path: string; modelId?: ModelId }) {
  const { scene } = useGLTF(path);
  const scale = modelId ? MODEL_SCALE[modelId] : 0.8;

  const clone = useMemo(() => scene.clone(), [scene]);

  return (
    <Center>
      <Float speed={0.5} rotationIntensity={0.12} floatIntensity={0.2}>
        <primitive object={clone} scale={scale} />
      </Float>
    </Center>
  );
}

function SceneInner({ path, modelId }: { path: string; modelId?: ModelId }) {
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 6, 4]} intensity={0.55} />
      <directionalLight position={[-3, 2, -2]} intensity={0.25} />
      <Model path={path} modelId={modelId} />
    </>
  );
}

class SceneErrorBoundary extends Component<
  { children: ReactNode; onError: () => void; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export function PaperScene({ modelPath, modelId, fallback }: PaperSceneProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    let cancelled = false;

    fetch(modelPath, { method: "HEAD" })
      .then((res) => {
        if (!cancelled && !res.ok) setFailed(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [modelPath]);

  if (failed) {
    return <>{fallback}</>;
  }

  return (
    <Canvas
      dpr={[1, 1.25]}
      camera={{ position: [0, 0, 4.2], fov: 40 }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      style={{ background: "transparent" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
    >
      <SceneErrorBoundary onError={() => setFailed(true)} fallback={null}>
        <SceneInner path={modelPath} modelId={modelId} />
      </SceneErrorBoundary>
    </Canvas>
  );
}

useGLTF.preload("/models/fluid.glb");
useGLTF.preload("/models/stellar-nursery.glb");
useGLTF.preload("/models/dg-tauri.glb");

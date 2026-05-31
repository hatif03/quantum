import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Float, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { ModelId } from "./ModelBackdrop";

const MODEL_PATHS: Record<ModelId, string> = {
  fluid: "/models/fluid.glb",
  "stellar-nursery": "/models/stellar-nursery.glb",
  "dg-tauri": "/models/dg-tauri.glb",
};

const MODEL_SCALE: Record<ModelId, number> = {
  fluid: 0.45,
  "stellar-nursery": 0.85,
  "dg-tauri": 0.75,
};

const ALL_MODELS: ModelId[] = ["stellar-nursery", "dg-tauri", "fluid"];

function FadingModelLayer({
  modelId,
  path,
  target,
}: {
  modelId: ModelId;
  path: string;
  target: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const opacity = useRef(0);
  const { scene } = useGLTF(path);
  const clone = useMemo(() => scene.clone(), [scene]);

  useFrame((_, delta) => {
    opacity.current = THREE.MathUtils.lerp(opacity.current, target, delta * 3.5);
    const o = opacity.current;
    if (!groupRef.current) return;
    groupRef.current.visible = o > 0.02;
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mats = Array.isArray(child.material)
          ? child.material
          : [child.material];
        mats.forEach((mat) => {
          if (mat instanceof THREE.Material) {
            mat.transparent = true;
            mat.opacity = o;
            mat.depthWrite = o > 0.5;
          }
        });
      }
    });
  });

  return (
    <group ref={groupRef}>
      <Center>
        <Float speed={0.45} rotationIntensity={0.1} floatIntensity={0.18}>
          <primitive object={clone} scale={MODEL_SCALE[modelId]} />
        </Float>
      </Center>
    </group>
  );
}

function SceneContent({
  activeModel,
  targetOpacity,
}: {
  activeModel: ModelId | null;
  targetOpacity: number;
}) {
  const targets = useMemo(() => {
    const map: Record<ModelId, number> = {
      fluid: 0,
      "stellar-nursery": 0,
      "dg-tauri": 0,
    };
    if (activeModel) {
      map[activeModel] = targetOpacity;
    }
    return map;
  }, [activeModel, targetOpacity]);

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 6, 4]} intensity={0.55} />
      <directionalLight position={[-3, 2, -2]} intensity={0.22} />
      {ALL_MODELS.map((id) => (
        <FadingModelLayer
          key={id}
          modelId={id}
          path={MODEL_PATHS[id]}
          target={targets[id]}
        />
      ))}
    </>
  );
}

interface PersistentSceneProps {
  activeModel: ModelId | null;
  targetOpacity: number;
  preloadModels?: ModelId[];
}

useGLTF.preload(MODEL_PATHS["stellar-nursery"]);
useGLTF.preload(MODEL_PATHS["dg-tauri"]);
useGLTF.preload(MODEL_PATHS.fluid);

export function PersistentScene({
  activeModel,
  targetOpacity,
}: PersistentSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.25]}
      camera={{ position: [0, 0, 4.2], fov: 40 }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      style={{ background: "transparent" }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <SceneContent activeModel={activeModel} targetOpacity={targetOpacity} />
    </Canvas>
  );
}

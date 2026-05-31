import { motion } from "framer-motion";
import { SketchDefs } from "../sketch/SketchDefs";
import "./FeynmanSketch.css";

interface FeynmanSketchProps {
  animate?: boolean;
  showLabels?: boolean;
  compact?: boolean;
  showTicks?: boolean;
}

const PATHS = {
  fermionTop: "M 38 46 C 98 70 138 96 178 118",
  fermionBottom: "M 38 174 C 98 150 138 124 178 118",
  photonTop: "M 178 118 C 228 74 278 48 322 32",
  photonBottom: "M 178 118 C 226 156 276 180 322 194",
};

function WavyPhoton({ d, animate, delay }: { d: string; animate: boolean; delay: number }) {
  const wavy =
    "M 178 118 C 195 95 215 70 240 52 C 265 38 295 28 322 32";
  const path = d.includes("322 32") ? wavy : "M 178 118 C 200 140 240 168 280 186 C 305 192 322 194 322 194";

  if (!animate) {
    return <path className="feynman-sketch__line feynman-sketch__line--photon" d={path} />;
  }
  return (
    <motion.path
      className="feynman-sketch__line feynman-sketch__line--photon"
      d={path}
      initial={{ pathLength: 0, opacity: 0.35 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ delay, duration: 0.95, ease: "easeInOut" }}
    />
  );
}

export function FeynmanSketch({
  animate = true,
  showLabels = true,
  compact = false,
  showTicks = false,
}: FeynmanSketchProps) {
  return (
    <svg
      className={`feynman-sketch${compact ? " feynman-sketch--compact" : ""}`}
      viewBox="0 0 360 220"
      role="img"
      aria-label="Feynman diagram: electron and positron annihilate into two photons at a central vertex"
    >
      <SketchDefs />
      <g filter="url(#sketch-pencil)">
        {showTicks && (
          <>
            <path d="M 18 28 L 18 192" className="feynman-sketch__tick-line" />
            <path d="M 10 110 L 26 110" className="feynman-sketch__tick-line" />
            <path d="M 338 28 L 338 192" className="feynman-sketch__tick-line" />
          </>
        )}
        {animate ? (
          <>
            <motion.path
              className="feynman-sketch__line feynman-sketch__line--fermion"
              d={PATHS.fermionTop}
              initial={{ pathLength: 0, opacity: 0.35 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0, duration: 0.95, ease: "easeInOut" }}
            />
            <motion.path
              className="feynman-sketch__line feynman-sketch__line--fermion feynman-sketch__line--anti"
              d={PATHS.fermionBottom}
              initial={{ pathLength: 0, opacity: 0.35 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.95, ease: "easeInOut" }}
            />
            <WavyPhoton d={PATHS.photonTop} animate delay={0.3} />
            <WavyPhoton d={PATHS.photonBottom} animate delay={0.45} />
          </>
        ) : (
          <>
            <path className="feynman-sketch__line feynman-sketch__line--fermion" d={PATHS.fermionTop} />
            <path
              className="feynman-sketch__line feynman-sketch__line--fermion feynman-sketch__line--anti"
              d={PATHS.fermionBottom}
            />
            <WavyPhoton d={PATHS.photonTop} animate={false} delay={0} />
            <WavyPhoton d={PATHS.photonBottom} animate={false} delay={0} />
          </>
        )}
        {animate ? (
          <motion.circle
            className="feynman-sketch__vertex"
            cx={178}
            cy={118}
            r={8}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.75, type: "spring", stiffness: 260 }}
          />
        ) : (
          <circle className="feynman-sketch__vertex" cx={178} cy={118} r={8} />
        )}
        {showLabels && (
          <>
            <text className="feynman-sketch__label" x={24} y={38} filter="url(#sketch-chalk)">
              e⁻
            </text>
            <text className="feynman-sketch__label" x={24} y={196} filter="url(#sketch-chalk)">
              e⁺
            </text>
            <text className="feynman-sketch__label" x={306} y={26} filter="url(#sketch-chalk)">
              γ
            </text>
            <text className="feynman-sketch__label" x={306} y={208} filter="url(#sketch-chalk)">
              γ
            </text>
            {animate && (
              <motion.text
                className="feynman-sketch__note"
                x={188}
                y={198}
                filter="url(#sketch-chalk)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                vertex
              </motion.text>
            )}
          </>
        )}
      </g>
    </svg>
  );
}

import { motion } from "framer-motion";
import "./FeynmanSketch.css";

interface FeynmanSketchProps {
  animate?: boolean;
  showLabels?: boolean;
  compact?: boolean;
}

const PATHS = {
  fermionTop: "M 40 48 C 100 72 140 95 180 120",
  fermionBottom: "M 40 172 C 100 148 140 125 180 120",
  photonTop: "M 180 120 C 230 78 280 52 320 36",
  photonBottom: "M 180 120 C 228 158 278 182 320 196",
};

export function FeynmanSketch({
  animate = true,
  showLabels = true,
  compact = false,
}: FeynmanSketchProps) {
  return (
    <svg
      className={`feynman-sketch${compact ? " feynman-sketch--compact" : ""}`}
      viewBox="0 0 360 220"
      role="img"
      aria-label="Feynman diagram: electron and positron annihilate into two photons at a central vertex"
    >
      {animate ? (
        <>
          <motion.path
            className="feynman-sketch__line feynman-sketch__line--fermion"
            d={PATHS.fermionTop}
            initial={{ pathLength: 0, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0, duration: 0.9, ease: "easeInOut" }}
          />
          <motion.path
            className="feynman-sketch__line feynman-sketch__line--fermion feynman-sketch__line--anti"
            d={PATHS.fermionBottom}
            initial={{ pathLength: 0, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.9, ease: "easeInOut" }}
          />
          <motion.path
            className="feynman-sketch__line feynman-sketch__line--photon"
            d={PATHS.photonTop}
            initial={{ pathLength: 0, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.9, ease: "easeInOut" }}
          />
          <motion.path
            className="feynman-sketch__line feynman-sketch__line--photon"
            d={PATHS.photonBottom}
            initial={{ pathLength: 0, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.9, ease: "easeInOut" }}
          />
        </>
      ) : (
        <>
          <path className="feynman-sketch__line feynman-sketch__line--fermion" d={PATHS.fermionTop} />
          <path
            className="feynman-sketch__line feynman-sketch__line--fermion feynman-sketch__line--anti"
            d={PATHS.fermionBottom}
          />
          <path className="feynman-sketch__line feynman-sketch__line--photon" d={PATHS.photonTop} />
          <path className="feynman-sketch__line feynman-sketch__line--photon" d={PATHS.photonBottom} />
        </>
      )}
      {animate ? (
        <motion.circle
          className="feynman-sketch__vertex"
          cx={180}
          cy={120}
          r={7}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.75, type: "spring", stiffness: 280 }}
        />
      ) : (
        <circle className="feynman-sketch__vertex" cx={180} cy={120} r={7} />
      )}
      {showLabels && (
        <>
          <text className="feynman-sketch__label" x={28} y={40}>
            e⁻
          </text>
          <text className="feynman-sketch__label" x={28} y={198}>
            e⁺
          </text>
          <text className="feynman-sketch__label" x={308} y={28}>
            γ
          </text>
          <text className="feynman-sketch__label" x={308} y={210}>
            γ
          </text>
          {animate && (
            <motion.text
              className="feynman-sketch__note"
              x={200}
              y={200}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              interaction
            </motion.text>
          )}
        </>
      )}
    </svg>
  );
}

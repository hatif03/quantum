import { motion } from "framer-motion";
import type { ProcessExample } from "../../api/types";
import { MathBlock } from "../sketch/MathBlock";
import { FeynmanSketch } from "../story/FeynmanSketch";
import "./DiagramPreview.css";

interface DiagramPreviewProps {
  example: ProcessExample;
  animating?: boolean;
}

const PARTICLE_LATEX: Record<string, string> = {
  "e-": "e^-",
  "e+": "e^+",
  gamma: "\\gamma",
  Z: "Z",
  "l-": "\\ell^-",
  "l+": "\\ell^+",
  "mu-": "\\mu^-",
  "W-": "W^-",
  nu_mu: "\\nu_\\mu",
  anti_nu_e: "\\bar{\\nu}_e",
};

function particleLatex(label: string): string {
  return PARTICLE_LATEX[label] ?? label;
}

export function DiagramPreview({ example, animating = false }: DiagramPreviewProps) {
  return (
    <div
      className="diagram-preview"
      role="img"
      aria-label={`Feynman diagram: ${example.title}`}
    >
      {example.diagramType === "annihilation" ? (
        <FeynmanSketch animate={animating} showLabels compact />
      ) : (
        <DiagramTopology type={example.diagramType} labels={example.particles} animating={animating} />
      )}
      <p className="diagram-preview__caption">
        <MathBlock latex={example.shortLatex} />
      </p>
    </div>
  );
}

function DiagramTopology({
  type,
  labels,
  animating,
}: {
  type: ProcessExample["diagramType"];
  labels: string[];
  animating: boolean;
}) {
  if (type === "z_decay") {
    return (
      <svg viewBox="0 0 360 220" className="diagram-preview__svg">
        <InkLine d="M 50 110 L 180 110" delay={0} wavy animating={animating} />
        <InkLine d="M 180 110 L 300 50" delay={0.2} dashed animating={animating} />
        <InkLine d="M 180 110 L 300 170" delay={0.3} dashed animating={animating} />
        <Vertex cx={180} cy={110} delay={0.4} animating={animating} />
        <Label latex={particleLatex(labels[0])} x={30} y={88} />
        <Label latex={particleLatex(labels[1])} x={280} y={38} />
        <Label latex={particleLatex(labels[2])} x={280} y={178} />
      </svg>
    );
  }

  if (type === "compton") {
    return (
      <svg viewBox="0 0 360 220" className="diagram-preview__svg">
        <InkLine d="M 40 50 L 130 100" delay={0} dashed animating={animating} />
        <InkLine d="M 40 170 L 130 100" delay={0.1} wavy animating={animating} />
        <InkLine d="M 130 100 L 230 100" delay={0.2} dashed animating={animating} />
        <InkLine d="M 230 100 L 320 50" delay={0.3} dashed animating={animating} />
        <InkLine d="M 230 100 L 320 170" delay={0.35} wavy animating={animating} />
        <Vertex cx={130} cy={100} delay={0.25} animating={animating} />
        <Vertex cx={230} cy={100} delay={0.4} animating={animating} />
        <Label latex={particleLatex(labels[0])} x={18} y={48} />
        <Label latex={particleLatex(labels[1])} x={18} y={168} />
        <Label latex={particleLatex(labels[2])} x={300} y={48} />
        <Label latex={particleLatex(labels[3])} x={300} y={168} />
      </svg>
    );
  }

  if (type === "muon_decay") {
    return (
      <svg viewBox="0 0 360 220" className="diagram-preview__svg">
        <InkLine d="M 40 110 L 120 110" delay={0} dashed animating={animating} />
        <InkLine d="M 120 110 L 200 110" delay={0.15} wavy animating={animating} />
        <InkLine d="M 200 110 L 280 110" delay={0.25} dashed animating={animating} />
        <InkLine d="M 120 110 L 120 50" delay={0.3} dashed animating={animating} />
        <InkLine d="M 120 110 L 120 170" delay={0.35} dashed animating={animating} />
        <Vertex cx={120} cy={110} delay={0.2} animating={animating} />
        <Vertex cx={200} cy={110} delay={0.4} animating={animating} />
        <Label latex={particleLatex(labels[0])} x={18} y={100} />
        <Label latex={particleLatex(labels[1])} x={168} y={98} />
        <Label latex={particleLatex(labels[2])} x={268} y={100} />
        <Label latex={particleLatex(labels[3])} x={98} y={42} />
        <Label latex={particleLatex(labels[4])} x={98} y={182} />
      </svg>
    );
  }

  return null;
}

function InkLine({
  d,
  delay,
  dashed,
  wavy,
  animating,
}: {
  d: string;
  delay: number;
  dashed?: boolean;
  wavy?: boolean;
  animating: boolean;
}) {
  const className = `diagram-preview__line${dashed ? " diagram-preview__line--dashed" : ""}${wavy ? " diagram-preview__line--wavy" : ""}`;

  if (!animating) {
    return <path d={d} className={className} fill="none" />;
  }

  return (
    <motion.path
      d={d}
      className={className}
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ delay, duration: 0.7, ease: "easeInOut" }}
    />
  );
}

function Vertex({
  cx,
  cy,
  delay,
  animating,
}: {
  cx: number;
  cy: number;
  delay: number;
  animating: boolean;
}) {
  if (!animating) {
    return <circle cx={cx} cy={cy} r={6} className="diagram-preview__vertex" />;
  }

  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={6}
      className="diagram-preview__vertex"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay, type: "spring" }}
    />
  );
}

function Label({ latex, x, y }: { latex: string; x: number; y: number }) {
  return (
    <foreignObject x={x} y={y} width={80} height={36} className="diagram-preview__label-fo">
      <div className="diagram-preview__label">
        <MathBlock latex={latex} />
      </div>
    </foreignObject>
  );
}

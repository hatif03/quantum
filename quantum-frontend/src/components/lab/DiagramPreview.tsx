import { motion } from "framer-motion";
import type { ProcessExample } from "../../api/types";
import { FeynmanSketch } from "../story/FeynmanSketch";
import "./DiagramPreview.css";

interface DiagramPreviewProps {
  example: ProcessExample;
  animating?: boolean;
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
      <p className="diagram-preview__caption">{example.short}</p>
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
        <InkLine d="M 50 110 L 180 110" delay={0} animating={animating} />
        <InkLine d="M 180 110 L 300 50" delay={0.2} dashed animating={animating} />
        <InkLine d="M 180 110 L 300 170" delay={0.3} dashed animating={animating} />
        <Vertex cx={180} cy={110} delay={0.4} animating={animating} />
        <Label text={labels[0]} x={40} y={100} />
        <Label text={labels[1]} x={290} y={40} />
        <Label text={labels[2]} x={290} y={180} />
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
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 360 220" className="diagram-preview__svg">
      <InkLine d="M 40 110 L 140 90" delay={0} dashed animating={animating} />
      <InkLine d="M 140 90 L 300 40" delay={0.2} dashed animating={animating} />
      <InkLine d="M 140 90 L 200 130" delay={0.25} wavy animating={animating} />
      <InkLine d="M 200 130 L 280 100" delay={0.35} dashed animating={animating} />
      <InkLine d="M 200 130 L 290 180" delay={0.4} dashed animating={animating} />
      <Vertex cx={140} cy={90} delay={0.15} animating={animating} />
      <Vertex cx={200} cy={130} delay={0.3} animating={animating} />
    </svg>
  );
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

function Label({ text, x, y }: { text: string; x: number; y: number }) {
  return (
    <text className="diagram-preview__label" x={x} y={y}>
      {text}
    </text>
  );
}

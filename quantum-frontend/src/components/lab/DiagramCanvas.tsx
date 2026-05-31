import { motion } from "framer-motion";
import type { ProcessExample } from "../../api/types";
import { FeynmanSketch } from "../story/FeynmanSketch";
import "./DiagramCanvas.css";

interface DiagramCanvasProps {
  example: ProcessExample;
  animating?: boolean;
}

export function DiagramCanvas({ example, animating = false }: DiagramCanvasProps) {
  return (
    <div className="diagram-canvas panel" aria-label={`Diagram preview: ${example.title}`}>
      <div className="diagram-canvas__toolbar">
        <span className="diagram-canvas__title">{example.title}</span>
        <span className="diagram-canvas__meta">{example.confidence}</span>
      </div>
      <div className="diagram-canvas__stage">
        {example.diagramType === "annihilation" ? (
          <FeynmanSketch animate={animating} showLabels />
        ) : (
          <DiagramTopology type={example.diagramType} labels={example.particles} />
        )}
      </div>
      <p className="diagram-canvas__short">{example.short}</p>
    </div>
  );
}

function DiagramTopology({
  type,
  labels,
}: {
  type: ProcessExample["diagramType"];
  labels: string[];
}) {
  if (type === "z_decay") {
    return (
      <svg viewBox="0 0 360 220" className="diagram-topology" role="img" aria-label="Z boson decay diagram">
        <InkLine d="M 50 110 L 180 110" delay={0} />
        <InkLine d="M 180 110 L 300 50" delay={0.2} dashed />
        <InkLine d="M 180 110 L 300 170" delay={0.3} dashed />
        <Vertex cx={180} cy={110} delay={0.4} />
        <Label text={labels[0]} x={40} y={100} />
        <Label text={labels[1]} x={290} y={40} />
        <Label text={labels[2]} x={290} y={180} />
      </svg>
    );
  }

  if (type === "compton") {
    return (
      <svg viewBox="0 0 360 220" className="diagram-topology" role="img" aria-label="Compton scattering diagram">
        <InkLine d="M 40 50 L 130 100" delay={0} dashed />
        <InkLine d="M 40 170 L 130 100" delay={0.1} wavy />
        <InkLine d="M 130 100 L 230 100" delay={0.2} dashed />
        <InkLine d="M 230 100 L 320 50" delay={0.3} dashed />
        <InkLine d="M 230 100 L 320 170" delay={0.35} wavy />
        <Vertex cx={130} cy={100} delay={0.25} />
        <Vertex cx={230} cy={100} delay={0.4} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 360 220" className="diagram-topology" role="img" aria-label="Muon decay diagram">
      <InkLine d="M 40 110 L 140 90" delay={0} dashed />
      <InkLine d="M 140 90 L 300 40" delay={0.2} dashed />
      <InkLine d="M 140 90 L 200 130" delay={0.25} wavy />
      <InkLine d="M 200 130 L 280 100" delay={0.35} dashed />
      <InkLine d="M 200 130 L 290 180" delay={0.4} dashed />
      <Vertex cx={140} cy={90} delay={0.15} />
      <Vertex cx={200} cy={130} delay={0.3} />
    </svg>
  );
}

function InkLine({
  d,
  delay,
  dashed,
  wavy,
}: {
  d: string;
  delay: number;
  dashed?: boolean;
  wavy?: boolean;
}) {
  return (
    <motion.path
      d={d}
      className={`diagram-topology__line${dashed ? " diagram-topology__line--dashed" : ""}${wavy ? " diagram-topology__line--wavy" : ""}`}
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ delay, duration: 0.7, ease: "easeInOut" }}
    />
  );
}

function Vertex({ cx, cy, delay }: { cx: number; cy: number; delay: number }) {
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={6}
      className="diagram-topology__vertex"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay, type: "spring" }}
    />
  );
}

function Label({ text, x, y }: { text: string; x: number; y: number }) {
  return (
    <text className="diagram-topology__label" x={x} y={y}>
      {text}
    </text>
  );
}

interface ScribblePathProps {
  d: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  dashed?: boolean;
  fill?: string;
  className?: string;
}

/** Double-stroke path reads as pencil/pen on paper */
export function ScribblePath({
  d,
  stroke = "var(--sketch-ink)",
  strokeWidth = 2,
  opacity = 1,
  dashed,
  fill = "none",
  className = "",
}: ScribblePathProps) {
  const dash = dashed ? { strokeDasharray: "7 6" } : {};
  return (
    <g className={`scribble-path ${className}`.trim()} opacity={opacity}>
      <path
        d={d}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
        {...dash}
      />
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth * 0.45}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.35}
        transform="translate(0.8 0.5)"
        {...dash}
      />
    </g>
  );
}

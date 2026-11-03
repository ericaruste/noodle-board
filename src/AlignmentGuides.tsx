import { ViewportPortal, useStore } from "@xyflow/react";
import type { GuideLine, SpacingBracket } from "./alignSnap";

function screenPx(zoom: number, px: number) {
  return zoom > 0 ? px / zoom : px;
}

function BracketMark({
  bracket,
  stroke,
  halo,
  cap,
  scale,
}: {
  bracket: SpacingBracket;
  stroke: number;
  halo: number;
  cap: number;
  scale: number;
}) {
  const horizontal = bracket.orientation === "horizontal";
  const x1 = horizontal ? bracket.from : bracket.at;
  const y1 = horizontal ? bracket.at : bracket.from;
  const x2 = horizontal ? bracket.to : bracket.at;
  const y2 = horizontal ? bracket.at : bracket.to;
  const segments = horizontal
    ? [
        { x1, y1, x2, y2 },
        { x1, y1: y1 - cap, x2: x1, y2: y1 + cap },
        { x1: x2, y1: y2 - cap, x2, y2: y2 + cap },
      ]
    : [
        { x1, y1, x2, y2 },
        { x1: x1 - cap, y1, x2: x1 + cap, y2: y1 },
        { x1: x2 - cap, y1: y2, x2: x2 + cap, y2 },
      ];
  const label = String(Math.round(Math.abs(bracket.to - bracket.from)));
  const fontSize = 11;
  const height = 18;
  const width = Math.max(height, label.length * fontSize * 0.62 + 14);

  return (
    <g className="noodle-spacing-bracket">
      {segments.map((segment, index) => (
        <line key={`halo-${index}`} className="noodle-spacing-halo" {...segment} strokeWidth={halo} />
      ))}
      {segments.map((segment, index) => (
        <line key={`stroke-${index}`} {...segment} strokeWidth={stroke} />
      ))}
      <g
        className="noodle-spacing-label"
        transform={`translate(${(x1 + x2) / 2} ${(y1 + y2) / 2}) scale(${scale})`}
      >
        <rect x={-width / 2} y={-height / 2} width={width} height={height} rx={height / 2} />
        <text textAnchor="middle" dominantBaseline="central" fontSize={fontSize}>
          {label}
        </text>
      </g>
    </g>
  );
}

export default function AlignmentGuides({
  lines,
  brackets,
}: {
  lines: GuideLine[];
  brackets: SpacingBracket[];
}) {
  const zoom = useStore((state) => state.transform[2]);
  if (lines.length === 0 && brackets.length === 0) return null;
  const stroke = screenPx(zoom, 1);
  const bracketStroke = screenPx(zoom, 2);
  const halo = screenPx(zoom, 4);
  const cap = screenPx(zoom, 5);
  const scale = zoom > 0 ? 1 / zoom : 1;

  return (
    <ViewportPortal>
      <svg className="noodle-align-guides" aria-hidden>
        <g className="noodle-align-lines">
          {lines.map((line, index) => {
            const vertical = line.orientation === "vertical";
            return (
              <line
                key={`${line.orientation}-${index}`}
                x1={vertical ? line.at : line.from}
                y1={vertical ? line.from : line.at}
                x2={vertical ? line.at : line.to}
                y2={vertical ? line.to : line.at}
                strokeWidth={stroke}
              />
            );
          })}
        </g>
        <g className="noodle-spacing-layer">
          {brackets.map((bracket, index) => (
            <BracketMark
              key={`gap-${bracket.orientation}-${index}`}
              bracket={bracket}
              stroke={bracketStroke}
              halo={halo}
              cap={cap}
              scale={scale}
            />
          ))}
        </g>
      </svg>
    </ViewportPortal>
  );
}

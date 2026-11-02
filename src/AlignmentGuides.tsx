import { ViewportPortal, useStore } from "@xyflow/react";
import type { GuideLine, SpacingBracket } from "./alignSnap";

export default function AlignmentGuides({
  lines,
  brackets,
}: {
  lines: GuideLine[];
  brackets: SpacingBracket[];
}) {
  const zoom = useStore((state) => state.transform[2]);
  if (lines.length === 0 && brackets.length === 0) return null;
  const stroke = zoom > 0 ? 1 / zoom : 1;
  const cap = zoom > 0 ? 4 / zoom : 4;

  return (
    <ViewportPortal>
      <svg className="noodle-align-guides" aria-hidden>
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
        {brackets.map((bracket, index) => {
          const horizontal = bracket.orientation === "horizontal";
          const x1 = horizontal ? bracket.from : bracket.at;
          const y1 = horizontal ? bracket.at : bracket.from;
          const x2 = horizontal ? bracket.to : bracket.at;
          const y2 = horizontal ? bracket.at : bracket.to;
          return (
            <g key={`gap-${bracket.orientation}-${index}`} className="noodle-spacing-bracket">
              <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={stroke} />
              {horizontal ? (
                <>
                  <line x1={x1} y1={y1 - cap} x2={x1} y2={y1 + cap} strokeWidth={stroke} />
                  <line x1={x2} y1={y2 - cap} x2={x2} y2={y2 + cap} strokeWidth={stroke} />
                </>
              ) : (
                <>
                  <line x1={x1 - cap} y1={y1} x2={x1 + cap} y2={y1} strokeWidth={stroke} />
                  <line x1={x2 - cap} y1={y2} x2={x2 + cap} y2={y2} strokeWidth={stroke} />
                </>
              )}
            </g>
          );
        })}
      </svg>
    </ViewportPortal>
  );
}

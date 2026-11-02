import { ViewportPortal, useStore } from "@xyflow/react";
import type { GuideLine } from "./alignSnap";

export default function AlignmentGuides({ lines }: { lines: GuideLine[] }) {
  const zoom = useStore((state) => state.transform[2]);
  if (lines.length === 0) return null;
  const stroke = zoom > 0 ? 1 / zoom : 1;

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
      </svg>
    </ViewportPortal>
  );
}

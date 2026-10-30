import { type CSSProperties } from "react";
import { NodeResizer, useStore } from "@xyflow/react";

/** Screen-pixel targets. Multiplied by 1/zoom so they stay this size when zoomed out. */
const HIT_PX = 16;
const PORT_PX = 10;
const STROKE_PX = 2;
const GAP_PX = 4;

export function useNoodleResizeStyle(): CSSProperties {
  const zoom = useStore((state) => state.transform[2]);
  const compensate = Math.max(1 / zoom, 1);
  const thickness = HIT_PX * compensate;
  const port = PORT_PX * compensate;
  const gap = GAP_PX * compensate;
  return {
    "--noodle-resize-thickness": `${thickness}px`,
    "--noodle-resize-stroke": `${STROKE_PX * compensate}px`,
    "--noodle-port-size": `${port}px`,
    "--noodle-handle-outset": `${thickness / 2 + port / 2 + gap}px`,
    "--noodle-chrome-gap": `${8 * compensate}px`,
  } as CSSProperties;
}

type NoodleResizerProps = {
  selected?: boolean;
  minWidth: number;
  minHeight: number;
  keepAspectRatio?: boolean;
  onResizeStart?: () => void;
};

export function NoodleResizer({
  selected,
  minWidth,
  minHeight,
  keepAspectRatio,
  onResizeStart,
}: NoodleResizerProps) {
  return (
    <NodeResizer
      isVisible={selected}
      minWidth={minWidth}
      minHeight={minHeight}
      keepAspectRatio={keepAspectRatio}
      onResizeStart={onResizeStart}
      lineClassName="noodle-resize-line"
      handleClassName="noodle-resize-handle"
    />
  );
}

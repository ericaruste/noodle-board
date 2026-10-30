import { type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { NodeResizer, useNodeId, useStore } from "@xyflow/react";

/** Screen-pixel targets. Multiplied by 1/zoom so they stay this size when zoomed out. */
const HIT_PX = 16;
const PORT_PX = 10;
const STROKE_PX = 2;
const GAP_PX = 4;

/** Above elevated noodles. Selected nodes lift connected edges by 1000 (see
 *  elevateEdgesOnSelect), so 1002 still loses. The layer lives in the viewport,
 *  under the page toolbar. */
const RESIZE_LAYER_Z = 10000;

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

type Box = { x: number; y: number; width: number; height: number };

function readLength(value: unknown): number {
  if (typeof value === "number" && value > 0) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (parsed > 0) return parsed;
  }
  return 0;
}

function sameBox(a: Box | null, b: Box | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
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
  const resizeStyle = useNoodleResizeStyle();
  const nodeId = useNodeId();
  const box = useStore((state) => {
    const node = nodeId ? state.nodeLookup.get(nodeId) : undefined;
    if (!node) return null;
    const width = readLength(node.measured?.width) || readLength(node.width) || readLength(node.style?.width);
    const height = readLength(node.measured?.height) || readLength(node.height) || readLength(node.style?.height);
    if (!width || !height) return null;
    return {
      x: node.internals.positionAbsolute.x,
      y: node.internals.positionAbsolute.y,
      width,
      height,
    };
  }, sameBox);
  const flowRoot = useStore((state) => state.domNode);
  const viewport = flowRoot?.querySelector(".react-flow__viewport");

  if (!selected || !box || !viewport) return null;

  return createPortal(
    <div
      className="noodle-node noodle-resize-layer"
      style={{
        ...resizeStyle,
        transform: `translate(${box.x}px, ${box.y}px)`,
        width: box.width,
        height: box.height,
        zIndex: RESIZE_LAYER_Z,
      }}
    >
      <NodeResizer
        minWidth={minWidth}
        minHeight={minHeight}
        keepAspectRatio={keepAspectRatio}
        onResizeStart={onResizeStart}
        lineClassName="noodle-resize-line"
        handleClassName="noodle-resize-handle"
      />
    </div>,
    viewport,
  );
}

import { type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { NodeResizer, useNodeId, useStore } from "@xyflow/react";
import { layers } from "./layers";

/** Sizes at zoom 1. Zoom-out only partly cancels the viewport scale, so chrome
 *  shrinks a little instead of staying this large on screen. */
const HIT_PX = 16;
const PORT_PX = 8;
const HANDLE_PX = 12;
const STROKE_PX = 1;
const DASH_PX = 6;
const DASH_GAP_PX = 5;
export const GAP_PX = 2;

export function zoomCompensate(zoom: number) {
  const inverse = Math.max(1 / zoom, 1);
  return inverse ** 0.65;
}

/** Screen pixels from the node edge to selection chrome, clearing the ports. */
export function selectionClearance(zoom: number) {
  if (!(zoom > 0)) return 26;
  const compensate = zoomCompensate(zoom);
  const thickness = HIT_PX * compensate;
  const port = PORT_PX * compensate;
  const gap = GAP_PX * compensate;
  const outset = thickness / 2 + port / 2 + gap;
  return (outset + port / 2) * zoom + 8;
}

export function useNoodleResizeStyle(): CSSProperties {
  const zoom = useStore((state) => state.transform[2]);
  const compensate = zoomCompensate(zoom);
  const thickness = HIT_PX * compensate;
  const port = PORT_PX * compensate;
  const gap = GAP_PX * compensate;
  return {
    "--noodle-resize-thickness": `${thickness}px`,
    "--noodle-resize-stroke": `${STROKE_PX * compensate}px`,
    "--noodle-dash": `${DASH_PX * compensate}px`,
    "--noodle-dash-gap": `${DASH_GAP_PX * compensate}px`,
    "--noodle-handle-size": `${HANDLE_PX * compensate}px`,
    "--noodle-port-size": `${port}px`,
    "--noodle-handle-outset": `${thickness / 2 + port / 2 + gap}px`,
    "--noodle-chrome-gap": `${8 * compensate}px`,
  } as CSSProperties;
}

type Box = { x: number; y: number; width: number; height: number };

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
  onResizeEnd?: (event: unknown, params: { width: number; height: number }) => void;
};

export function NoodleResizer({
  selected,
  minWidth,
  minHeight,
  keepAspectRatio,
  onResizeStart,
  onResizeEnd,
}: NoodleResizerProps) {
  const resizeStyle = useNoodleResizeStyle();
  const nodeId = useNodeId();
  const box = useStore((state) => {
    const node = nodeId ? state.nodeLookup.get(nodeId) : undefined;
    const width = node?.measured.width;
    const height = node?.measured.height;
    if (!node || !width || !height) return null;
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
        zIndex: layers.selection,
      }}
    >
      <svg className="noodle-selection-stroke" width="100%" height="100%" aria-hidden>
        <rect width="100%" height="100%" />
      </svg>
      <NodeResizer
        minWidth={minWidth}
        minHeight={minHeight}
        keepAspectRatio={keepAspectRatio}
        onResizeStart={onResizeStart}
        onResizeEnd={onResizeEnd}
        autoScale={false}
        lineClassName="noodle-resize-line"
        handleClassName="noodle-resize-handle"
      />
    </div>,
    viewport,
  );
}

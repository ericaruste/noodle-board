import { useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { useNodeId, useReactFlow, useStore, useStoreApi } from "@xyflow/react";
import { layers } from "./layers";
import { RESIZE_HANDLES, resizeNodeBox, type ResizeHandle } from "./resizeMath";
import { setShiftAspect } from "./shiftAspect";

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

const CORNER_HANDLES = new Set<ResizeHandle>(["top-left", "top-right", "bottom-left", "bottom-right"]);

// The hug runs on the second pointerdown and moves the handle before mouseup.
// The browser then double-clicks whatever is underneath, which is the canvas.
let textFitZoomUntil = 0;

function armTextFitZoomBlock() {
  textFitZoomUntil = performance.now() + 700;
}

function swallowTextFitZoom(event: MouseEvent) {
  const armed = performance.now() < textFitZoomUntil;
  const onTextHandle =
    event.target instanceof Element &&
    Boolean(event.target.closest(".react-flow__resize-control")?.closest("[data-text-fit]"));
  const blockClick = event.type === "click" && armed;
  const blockDoubleClick = event.type === "dblclick" && (armed || onTextHandle);
  if (!blockClick && !blockDoubleClick) return;
  event.preventDefault();
  event.stopPropagation();
  if (event.type === "dblclick") textFitZoomUntil = 0;
}

export function ResizeHandles({
  onPointerDown,
}: {
  onPointerDown: (handle: ResizeHandle, event: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <>
      {RESIZE_HANDLES.map((handle) => {
        const corner = CORNER_HANDLES.has(handle);
        return (
          <div
            key={handle}
            role="slider"
            aria-label={`Resize ${handle}`}
            aria-orientation={handle === "left" || handle === "right" ? "horizontal" : handle === "top" || handle === "bottom" ? "vertical" : undefined}
            className={[
              "react-flow__resize-control",
              "nodrag",
              "nopan",
              corner ? "handle" : "line",
              ...handle.split("-"),
              corner ? "noodle-resize-handle" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ touchAction: "none" }}
            onPointerDown={(event) => onPointerDown(handle, event)}
          />
        );
      })}
    </>
  );
}

type NoodleResizerProps = {
  selected?: boolean;
  minWidth: number;
  minHeight: number;
  keepAspectRatio?: boolean;
  onResizeStart?: () => void;
  onResizeEnd?: (event: unknown, params: { width: number; height: number }) => void;
  onHandleDoubleClick?: () => void;
};

function useShiftResize(
  minWidth: number,
  minHeight: number,
  onResizeStart?: () => void,
  onResizeEnd?: (event: unknown, params: { width: number; height: number }) => void,
  lockAspect = false,
  onDoubleClick?: () => void,
) {
  const nodeId = useNodeId();
  const store = useStoreApi();
  const { screenToFlowPosition } = useReactFlow();
  const screenToFlowRef = useRef(screenToFlowPosition);
  const startRef = useRef(onResizeStart);
  const endRef = useRef(onResizeEnd);
  const doubleRef = useRef(onDoubleClick);
  const lastClick = useRef<{ handle: ResizeHandle; time: number } | null>(null);
  const stopDrag = useRef<(() => void) | null>(null);
  screenToFlowRef.current = screenToFlowPosition;
  startRef.current = onResizeStart;
  endRef.current = onResizeEnd;
  doubleRef.current = onDoubleClick;

  return (handle: ResizeHandle, event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !nodeId) return;
    event.preventDefault();
    event.stopPropagation();
    const now = performance.now();
    const last = lastClick.current;
    const repeated = Boolean(doubleRef.current) && last?.handle === handle && now - last.time < 500;
    lastClick.current = repeated ? null : { handle, time: now };
    if (repeated) {
      armTextFitZoomBlock();
      stopDrag.current?.();
      setShiftAspect(null);
      doubleRef.current?.();
      return;
    }
    const node = store.getState().nodeLookup.get(nodeId);
    const width = node?.measured.width;
    const height = node?.measured.height;
    if (!node || !width || !height) return;
    const pointer = screenToFlowRef.current({ x: event.clientX, y: event.clientY }, { snapToGrid: false });
    const origin = node.internals.positionAbsolute;
    const start = {
      x: node.position.x,
      y: node.position.y,
      absX: origin.x,
      absY: origin.y,
      width,
      height,
      pointer,
    };
    startRef.current?.();
    const drag: {
      pointerId: number;
      lastX: number;
      lastY: number;
      size: { x: number; y: number; width: number; height: number };
    } = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
      size: { x: start.x, y: start.y, width, height },
    };
    const apply = (clientX: number, clientY: number, shift: boolean) => {
      const aspectLock = lockAspect || shift;
      const point = screenToFlowRef.current({ x: clientX, y: clientY }, { snapToGrid: false });
      const next = resizeNodeBox(
        { x: start.absX, y: start.absY, width: start.width, height: start.height },
        start.pointer,
        handle,
        point,
        aspectLock,
        minWidth,
        minHeight,
      );
      const position = { x: start.x + (next.x - start.absX), y: start.y + (next.y - start.absY) };
      drag.size = { ...position, width: next.width, height: next.height };
      setShiftAspect(aspectLock ? nodeId : null, start.width / Math.max(start.height, 1));
      store.getState().triggerNodeChanges([
        { id: nodeId, type: "position", position },
        {
          id: nodeId,
          type: "dimensions",
          resizing: true,
          setAttributes: true,
          dimensions: { width: next.width, height: next.height },
        },
      ]);
    };
    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== drag.pointerId) return;
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      drag.lastX = moveEvent.clientX;
      drag.lastY = moveEvent.clientY;
      apply(moveEvent.clientX, moveEvent.clientY, moveEvent.shiftKey);
    };
    const onKey = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key !== "Shift") return;
      apply(drag.lastX, drag.lastY, keyEvent.type === "keydown");
    };
    const stop = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      if (stopDrag.current === stop) stopDrag.current = null;
    };
    const finish = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== drag.pointerId) return;
      stop();
      setShiftAspect(null);
      store.getState().triggerNodeChanges([
        { id: nodeId, type: "position", position: { x: drag.size.x, y: drag.size.y } },
        {
          id: nodeId,
          type: "dimensions",
          resizing: false,
          setAttributes: true,
          dimensions: { width: drag.size.width, height: drag.size.height },
        },
      ]);
      endRef.current?.(upEvent, { width: drag.size.width, height: drag.size.height });
    };
    stopDrag.current = stop;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
  };
}

export function NoodleResizer({
  selected,
  minWidth,
  minHeight,
  keepAspectRatio,
  onResizeStart,
  onResizeEnd,
  onHandleDoubleClick,
}: NoodleResizerProps) {
  const resizeStyle = useNoodleResizeStyle();
  const onHandleDown = useShiftResize(
    minWidth,
    minHeight,
    onResizeStart,
    onResizeEnd,
    keepAspectRatio,
    onHandleDoubleClick,
  );
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

  // d3 zoom hears dblclick on the renderer before React's handler on this layer.
  // The fit moves the handle before mouseup, so the click may land on the canvas.
  useEffect(() => {
    if (!onHandleDoubleClick) return;
    window.addEventListener("click", swallowTextFitZoom, true);
    window.addEventListener("dblclick", swallowTextFitZoom, true);
    return () => {
      window.removeEventListener("click", swallowTextFitZoom, true);
      window.removeEventListener("dblclick", swallowTextFitZoom, true);
    };
  }, [onHandleDoubleClick]);

  if (!selected || !box || !viewport) return null;

  return createPortal(
    <div
      className="noodle-node noodle-resize-layer"
      data-text-fit={onHandleDoubleClick ? "" : undefined}
      onDoubleClick={
        onHandleDoubleClick
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
            }
          : undefined
      }
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
      <ResizeHandles onPointerDown={onHandleDown} />
    </div>,
    viewport,
  );
}

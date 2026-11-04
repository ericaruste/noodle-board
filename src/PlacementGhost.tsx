import { useEffect, useMemo, useRef, useState } from "react";
import { ViewportPortal, useReactFlow, useStore } from "@xyflow/react";
import { layers } from "./layers";
import { isCanvasPlacementTarget, placementSize, snapFlowPoint, type Placement } from "./placement";
import { ShapePreview } from "./ShapeNode";
import { STICKY_COLORS } from "./StickyNode";

const PLACEHOLDER = "Double-click to write";

/**
 * Flow-sized preview under the cursor. It does not take hits, so the placement
 * click lands on the pane or the element underneath.
 */
export default function PlacementGhost({ placement }: { placement: Placement }) {
  const transform = useStore((state) => state.transform);
  const snapToGrid = useStore((state) => state.snapToGrid);
  const snapGrid = useStore((state) => state.snapGrid);
  const { screenToFlowPosition } = useReactFlow();
  const pointRef = useRef<{ x: number; y: number } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let frame = 0;
    let pending: { x: number; y: number } | null = null;
    const publish = (point: { x: number; y: number } | null) => {
      setCursor((prev) => {
        if (!point) return prev === null ? prev : null;
        if (prev && prev.x === point.x && prev.y === point.y) return prev;
        return point;
      });
    };
    const apply = () => {
      frame = 0;
      const point = pending;
      pending = null;
      if (!point) return;
      pointRef.current = point;
      const hit = document.elementFromPoint(point.x, point.y);
      publish(isCanvasPlacementTarget(hit) ? point : null);
    };
    const onMove = (event: PointerEvent) => {
      pending = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onOut = (event: PointerEvent) => {
      if (event.relatedTarget) return;
      pending = null;
      pointRef.current = null;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      publish(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerout", onOut);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onOut);
    };
  }, []);

  const size = placementSize(placement);
  const center = useMemo(() => {
    if (!cursor) return null;
    return snapFlowPoint(
      screenToFlowPosition({ x: cursor.x, y: cursor.y }, { snapToGrid: false }),
      snapToGrid,
      snapGrid,
    );
  }, [cursor, screenToFlowPosition, snapGrid, snapToGrid, transform]);

  if (!center) return null;

  return (
    <ViewportPortal>
      <div
        data-placement-ghost=""
        aria-hidden
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 opacity-60"
        style={{
          left: center.x,
          top: center.y,
          width: size.width,
          height: placement.kind === "text" ? undefined : size.height,
          zIndex: layers.selection,
        }}
      >
        {placement.kind === "sticky" ? (
          <div
            className="h-full w-full rounded-sm p-3 text-sm leading-5 text-slate-400 shadow-[2px_4px_12px_rgba(15,23,42,0.18)]"
            style={{ background: STICKY_COLORS[placement.color] }}
          >
            {PLACEHOLDER}
          </div>
        ) : null}
        {placement.kind === "text" ? (
          <div className="min-h-[1.5rem] overflow-auto px-1 py-0.5 text-sm leading-5 text-slate-400">
            {PLACEHOLDER}
          </div>
        ) : null}
        {placement.kind === "shape" ? (
          <ShapePreview kind={placement.shape} width={size.width} height={size.height} />
        ) : null}
        {placement.kind === "image" ? (
          <img
            src={placement.src}
            alt=""
            draggable={false}
            className="block h-full w-full object-contain"
            style={{ filter: "drop-shadow(2px 4px 12px rgba(15, 23, 42, 0.18))" }}
          />
        ) : null}
      </div>
    </ViewportPortal>
  );
}

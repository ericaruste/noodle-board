import type { ReactFlowState, Viewport } from "@xyflow/react";

/**
 * Same wheel scale React Flow uses for a pinch or Ctrl/Cmd+wheel.
 * A Mac pinch reports a much smaller delta, so the library multiplies it by 10.
 */
export function pinchZoomDelta(event: Pick<WheelEvent, "ctrlKey" | "deltaY" | "deltaMode">) {
  const mac = typeof navigator !== "undefined" && navigator.userAgent.indexOf("Mac") >= 0;
  const factor = event.ctrlKey && mac ? 10 : 1;
  const mode = event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002;
  return -event.deltaY * mode * factor;
}

/** Next viewport for a zoom gesture, clamped, with the pointer held on the same board point. */
export function viewportZoomedAtPointer(
  viewport: Viewport,
  pointer: { x: number; y: number },
  delta: number,
  minZoom: number,
  maxZoom: number,
): Viewport {
  const zoom = viewport.zoom > 0 ? viewport.zoom : 1;
  const nextZoom = Math.min(maxZoom, Math.max(minZoom, zoom * 2 ** delta));
  const scale = nextZoom / zoom;
  return {
    x: pointer.x - (pointer.x - viewport.x) * scale,
    y: pointer.y - (pointer.y - viewport.y) * scale,
    zoom: nextZoom,
  };
}

export function zoomBoardFromWheel(
  state: Pick<ReactFlowState, "panZoom" | "minZoom" | "maxZoom">,
  event: WheelEvent,
) {
  const panZoom = state.panZoom;
  const from = event.target instanceof Element ? event.target : null;
  const renderer = from?.closest(".react-flow__renderer");
  if (!panZoom || !(renderer instanceof HTMLElement)) return;
  const rect = renderer.getBoundingClientRect();
  const next = viewportZoomedAtPointer(
    panZoom.getViewport(),
    {
      x: event.clientX - rect.left - renderer.clientLeft,
      y: event.clientY - rect.top - renderer.clientTop,
    },
    pinchZoomDelta(event),
    state.minZoom,
    state.maxZoom,
  );
  const current = panZoom.getViewport();
  if (Math.abs(next.zoom - current.zoom) < 1e-6 && next.x === current.x && next.y === current.y) return;
  void panZoom.setViewport(next);
}

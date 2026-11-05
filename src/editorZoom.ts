import type { ReactFlowState, Viewport } from "@xyflow/react";

function isMacOs() {
  return typeof navigator !== "undefined" && navigator.userAgent.indexOf("Mac") >= 0;
}

export type WheelSample = {
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  deltaX: number;
  deltaY: number;
  deltaMode: number;
};

export type PinchWatch = { until: number };

/**
 * Chromium turns a trackpad pinch into a wheel whose deltaY is `100 * ln(scale)`,
 * so the pinch scale is `exp(-deltaY / 100)`. In the `2 ** delta` zoom that is
 * about `0.0144` per pixel. The library uses `0.002`, and `0.02` only on a Mac,
 * so a Windows pinch is several times too small. `0.026` sits a little above the
 * Mac library scale: a modest pinch is a clear step, and it still cannot cross
 * 0.15–3 in one gesture.
 */
const PINCH_PIXEL = 0.026;
const PINCH_EVENT_CAP = 0.62;
const NOTCH_EXPONENT = 0.38;
const PINCH_HOLD_MS = 90;

/** A pinch sets ctrlKey. Cmd+wheel on a Mac sets metaKey, and Chromium often sets ctrlKey too. */
export function isMarkedZoomGesture(event: Pick<WheelEvent, "ctrlKey" | "metaKey">, mac = isMacOs()) {
  return event.ctrlKey || (mac && event.metaKey);
}

export function isEditorZoomGesture(event: WheelSample, mac = isMacOs()) {
  return isMarkedZoomGesture(event, mac) || isUnmarkedPinch(event);
}

/**
 * A swipe along one axis. Drift on the quiet axis still counts as that swipe,
 * so a two-finger scroll is not treated as a pinch.
 */
export function isOneAxisSwipe(event: Pick<WheelSample, "deltaX" | "deltaY">) {
  const absX = Math.abs(event.deltaX);
  const absY = Math.abs(event.deltaY);
  const major = Math.max(absX, absY);
  const minor = Math.min(absX, absY);
  if (major < 0.5) return false;
  return minor <= Math.max(1, major * 0.45);
}

/**
 * A pinch some trackpads deliver as a wheel without ctrlKey. It moves both
 * axes together. A one-axis swipe, a mouse notch, and a normal diagonal scroll
 * stay pans.
 */
export function isUnmarkedPinch(event: WheelSample) {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return false;
  if (event.deltaMode !== 0) return false;
  if (isOneAxisSwipe(event)) return false;
  const absX = Math.abs(event.deltaX);
  const absY = Math.abs(event.deltaY);
  if (absX < 0.75 || absY < 0.75 || absX > 24 || absY > 24) return false;
  return Math.min(absX, absY) / Math.max(absX, absY) >= 0.85;
}

function isDiscreteModifierWheel(event: WheelSample) {
  if (event.deltaMode === 2) return true;
  if (event.deltaMode === 1) return Number.isInteger(event.deltaY) && Math.abs(event.deltaY) >= 1;
  if (Math.abs(event.deltaX) > 1.5) return false;
  if (Math.abs(event.deltaY) < 40) return false;
  return Math.abs(event.deltaY - Math.round(event.deltaY)) < 0.01;
}

/** Zoom exponent for a pinch or Ctrl/Cmd+wheel. Positive zooms in. */
export function pinchZoomDelta(event: WheelSample) {
  if (isDiscreteModifierWheel(event)) {
    if (event.deltaY === 0) return 0;
    return -Math.sign(event.deltaY) * NOTCH_EXPONENT;
  }
  const coefficient = event.deltaMode === 1 ? 0.35 : event.deltaMode ? 1 : PINCH_PIXEL;
  const delta = -event.deltaY * coefficient;
  if (delta > PINCH_EVENT_CAP) return PINCH_EVENT_CAP;
  if (delta < -PINCH_EVENT_CAP) return -PINCH_EVENT_CAP;
  return delta;
}

/**
 * `zoom` applies the gesture. `drop` is scroll noise inside a pinch, so the
 * pinch does not pan. `pass` lets a two-finger scroll pan.
 */
export function classifyBoardWheel(
  event: WheelSample,
  watch: PinchWatch,
  now: number,
  mac = isMacOs(),
): "zoom" | "drop" | "pass" {
  if (isMarkedZoomGesture(event, mac) || isUnmarkedPinch(event)) {
    watch.until = now + PINCH_HOLD_MS;
    return "zoom";
  }
  if (now < watch.until) return "drop";
  return "pass";
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

export function boardWheelSkipsCanvas(event: Pick<WheelEvent, "target">) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return true;
  if (target.closest(".react-flow__minimap")) return true;
  if (target.closest(".noodle-text-editor")) return false;
  return Boolean(target.closest(".nowheel"));
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

export function bindBoardZoom(
  root: HTMLElement,
  getState: () => Pick<ReactFlowState, "panZoom" | "minZoom" | "maxZoom">,
) {
  const watch: PinchWatch = { until: 0 };
  const onWheel = (event: WheelEvent) => {
    if (boardWheelSkipsCanvas(event)) return;
    const action = classifyBoardWheel(event, watch, performance.now());
    if (action === "pass") return;
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    if (action === "zoom") zoomBoardFromWheel(getState(), event);
  };
  root.addEventListener("wheel", onWheel, { capture: true, passive: false });
  return () => root.removeEventListener("wheel", onWheel, { capture: true });
}

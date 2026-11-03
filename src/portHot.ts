import { useEffect, useState } from "react";
import type { SideId } from "./attachment";
import type { HotPort } from "./noodleEnds";

/** One landing while a noodle end is dragged. Port fill, outline, marker, preview, and drop all read it. */
export type HoverTarget = {
  elementId: string;
  mode: "port" | "edge";
  side: SideId;
  fraction: number;
};

export type ConnectionOrigin = { nodeId: string; handleId: string; fraction: number };

export type HandlePlacement = { fraction: number; hot: boolean };

let current: HotPort | null = null;
let hover: HoverTarget | null = null;
let origin: ConnectionOrigin | null = null;
let swallowUntil = 0;
let portGesture = false;
let portGestureTimer = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function sameHot(a: HotPort | null, b: HotPort | null) {
  return a?.nodeId === b?.nodeId && (a?.handleId ?? null) === (b?.handleId ?? null) && a?.fraction === b?.fraction;
}

function sameHover(a: HoverTarget | null, b: HoverTarget | null) {
  return a?.elementId === b?.elementId && a?.mode === b?.mode && a?.side === b?.side && a?.fraction === b?.fraction;
}

function sameOrigin(a: ConnectionOrigin | null, b: ConnectionOrigin | null) {
  return a?.nodeId === b?.nodeId && a?.handleId === b?.handleId && a?.fraction === b?.fraction;
}

export function getHotPort() {
  return current;
}

export function getConnectionOrigin() {
  return origin;
}

export function getHoverTarget() {
  return hover;
}

export function setHotPort(next: HotPort | null) {
  const clearHover = next == null && hover != null;
  if (!clearHover && sameHot(current, next)) return;
  current = next;
  if (next == null) hover = null;
  emit();
}

/** Sets the landing and the port the drop will use, in one update. */
export function setDragFeedback(nextHover: HoverTarget | null, nextHot: HotPort | null) {
  if (sameHover(hover, nextHover) && sameHot(current, nextHot)) return;
  hover = nextHover;
  current = nextHot;
  emit();
}

/** The click and double-click that finish a drag should not select or edit. */
export function armClickSwallow() {
  swallowUntil = performance.now() + 400;
}

export function swallowsClick() {
  return performance.now() <= swallowUntil;
}

/**
 * A port press starts a connect. The click that follows pointerup lands on the
 * noodle, because the noodle is painted above the port. That click stays part
 * of the gesture until it arrives, so it cannot select the noodle.
 */
export function beginPortGesture() {
  portGesture = true;
  window.clearTimeout(portGestureTimer);
}

export function notePortRelease() {
  window.clearTimeout(portGestureTimer);
  // The click is dispatched in this same turn, before the timer.
  portGestureTimer = window.setTimeout(() => {
    portGesture = false;
  }, 50);
}

export function portGestureOwnsClick() {
  return portGesture;
}

export function consumePortGesture() {
  portGesture = false;
  window.clearTimeout(portGestureTimer);
}

export function setConnectionOrigin(next: ConnectionOrigin | null) {
  if (sameOrigin(origin, next)) return;
  origin = next;
  emit();
}

export function clearConnectionOrigin() {
  setConnectionOrigin(null);
}

function placementFor(nodeId: string, handleId: string): HandlePlacement | null {
  // While this element is the landing zone, its four ports stay on the midpoints.
  if (hover?.elementId === nodeId) return null;
  const hotHere =
    current?.nodeId === nodeId && (current.handleId ?? null) === handleId && current.fraction != null;
  const originHere = origin?.nodeId === nodeId && origin.handleId === handleId;
  // The landing marker follows `current`. The origin handle itself stays on its port.
  if (hotHere && originHere && origin) return { fraction: origin.fraction, hot: true };
  if (hotHere && current?.fraction != null) return { fraction: current.fraction, hot: true };
  if (originHere && origin) return { fraction: origin.fraction, hot: false };
  return null;
}

function samePlacement(a: HandlePlacement | null, b: HandlePlacement | null) {
  return a?.hot === b?.hot && a?.fraction === b?.fraction;
}

export function useHoverTarget() {
  const [value, setValue] = useState<HoverTarget | null>(() => hover);

  useEffect(() => {
    const sync = () => setValue((prev) => (sameHover(prev, hover) ? prev : hover));
    listeners.add(sync);
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);

  return value;
}

export function useHotPort() {
  const [port, setPort] = useState<HotPort | null>(() => current);

  useEffect(() => {
    const sync = () => setPort((prev) => (sameHot(prev, current) ? prev : current));
    listeners.add(sync);
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);

  return port;
}

/** Fraction to draw this side's handle at, when the pointer or an in-progress drag pins it. */
export function useHandlePlacement(nodeId: string, handleId: string) {
  const [placement, setPlacement] = useState<HandlePlacement | null>(() => placementFor(nodeId, handleId));

  useEffect(() => {
    const sync = () => {
      const next = placementFor(nodeId, handleId);
      setPlacement((prev) => (samePlacement(prev, next) ? prev : next));
    };
    listeners.add(sync);
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, [nodeId, handleId]);

  return placement;
}

import { useEffect, useState } from "react";
import type { HotPort } from "./noodleEnds";

export type ConnectionOrigin = { nodeId: string; handleId: string; fraction: number };

export type HandlePlacement = { fraction: number; hot: boolean };

let current: HotPort | null = null;
let origin: ConnectionOrigin | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function sameHot(a: HotPort | null, b: HotPort | null) {
  return a?.nodeId === b?.nodeId && (a?.handleId ?? null) === (b?.handleId ?? null) && a?.fraction === b?.fraction;
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

export function setHotPort(next: HotPort | null) {
  if (sameHot(current, next)) return;
  current = next;
  emit();
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
  if (current?.nodeId === nodeId && (current.handleId ?? null) === handleId && current.fraction != null) {
    return { fraction: current.fraction, hot: true };
  }
  if (origin?.nodeId === nodeId && origin.handleId === handleId) {
    return { fraction: origin.fraction, hot: false };
  }
  return null;
}

function samePlacement(a: HandlePlacement | null, b: HandlePlacement | null) {
  return a?.hot === b?.hot && a?.fraction === b?.fraction;
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

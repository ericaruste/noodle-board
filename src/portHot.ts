import { useEffect, useState } from "react";
import type { HotPort } from "./noodleEnds";

let current: HotPort | null = null;
const listeners = new Set<() => void>();

function same(a: HotPort | null, b: HotPort | null) {
  return a?.nodeId === b?.nodeId && (a?.handleId ?? null) === (b?.handleId ?? null);
}

export function setHotPort(next: HotPort | null) {
  if (same(current, next)) return;
  current = next;
  listeners.forEach((listener) => listener());
}

export function usePortHot(nodeId: string, handleId: string) {
  const [hot, setHot] = useState(
    () => current?.nodeId === nodeId && (current.handleId ?? null) === handleId,
  );

  useEffect(() => {
    const sync = () => {
      const next = current?.nodeId === nodeId && (current.handleId ?? null) === handleId;
      setHot((prev) => (prev === next ? prev : next));
    };
    listeners.add(sync);
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, [nodeId, handleId]);

  return hot;
}

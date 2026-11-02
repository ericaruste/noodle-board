import { useNodeId, useStore } from "@xyflow/react";
import { useLayoutEffect, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent, type ReactNode, type WheelEvent } from "react";
import { createPortal } from "react-dom";
import { selectionClearance } from "./NoodleResizer";
import {
  placeSelectionChrome,
  type ChromeRect,
  type ChromeSide,
  type ChromeSlot,
  type ChromeViewport,
} from "./selectionChromeLayout";

type SlotRecord = {
  nodeId: string;
  side: ChromeSide;
  order: number;
  width: number;
  height: number;
};

type SafeArea = ChromeViewport & { obstacles: ChromeRect[] };

const slots = new Map<string, SlotRecord>();
const listeners = new Set<() => void>();
let tick = 0;

function emit() {
  tick += 1;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getTick() {
  return tick;
}

function setSlot(id: string, next: SlotRecord) {
  const prev = slots.get(id);
  if (
    prev &&
    prev.nodeId === next.nodeId &&
    prev.side === next.side &&
    prev.order === next.order &&
    Math.abs(prev.width - next.width) < 0.5 &&
    Math.abs(prev.height - next.height) < 0.5
  ) {
    return;
  }
  slots.set(id, next);
  emit();
}

function clearSlot(id: string) {
  if (!slots.delete(id)) return;
  emit();
}

function slotsFor(nodeId: string): ChromeSlot[] {
  const list: ChromeSlot[] = [];
  for (const [id, slot] of slots) {
    if (slot.nodeId !== nodeId) continue;
    list.push({ id, side: slot.side, order: slot.order, width: slot.width, height: slot.height });
  }
  return list;
}

type Anchor = {
  left: number;
  top: number;
  width: number;
  height: number;
  zoom: number;
};

function sameAnchor(a: Anchor | null, b: Anchor | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5 &&
    Math.abs(a.zoom - b.zoom) < 0.001
  );
}

function sameSafe(a: SafeArea | null, b: SafeArea | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  if (
    Math.abs(a.top - b.top) > 0.5 ||
    Math.abs(a.left - b.left) > 0.5 ||
    Math.abs(a.right - b.right) > 0.5 ||
    Math.abs(a.bottom - b.bottom) > 0.5 ||
    a.obstacles.length !== b.obstacles.length
  ) {
    return false;
  }
  return a.obstacles.every(
    (item, index) =>
      Math.abs(item.left - b.obstacles[index].left) < 0.5 &&
      Math.abs(item.top - b.obstacles[index].top) < 0.5 &&
      Math.abs(item.width - b.obstacles[index].width) < 0.5 &&
      Math.abs(item.height - b.obstacles[index].height) < 0.5,
  );
}

function readSafeArea(renderer: HTMLElement): SafeArea {
  const width = renderer.clientWidth;
  const height = renderer.clientHeight;
  const flowRect = renderer.getBoundingClientRect();
  let top = 8;
  let left = 8;
  let right = Math.max(8, width - 8);
  let bottom = Math.max(8, height - 8);
  const obstacles: ChromeRect[] = [];

  const pushOverlay = (rect: DOMRect) => {
    const local = {
      left: rect.left - flowRect.left,
      top: rect.top - flowRect.top,
      width: rect.width,
      height: rect.height,
    };
    const wide = rect.width > width * 0.6;
    if (wide && local.top <= 32 && local.top + local.height < height * 0.5) {
      top = Math.max(top, local.top + local.height + 8);
      return;
    }
    if (wide && local.top + local.height >= height - 32 && local.top > height * 0.5) {
      bottom = Math.min(bottom, local.top - 8);
      return;
    }
    obstacles.push(local);
  };

  const flow = renderer.closest(".react-flow");
  const board = flow?.parentElement;
  if (board && flow) {
    for (const child of board.children) {
      if (!(child instanceof HTMLElement) || child === flow) continue;
      const rect = child.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) continue;
      const overlaps =
        rect.bottom > flowRect.top &&
        rect.top < flowRect.bottom &&
        rect.right > flowRect.left &&
        rect.left < flowRect.right;
      if (overlaps) pushOverlay(rect);
    }
  }

  const minimap = flow?.querySelector(".react-flow__minimap");
  if (minimap instanceof HTMLElement) {
    const rect = minimap.getBoundingClientRect();
    if (rect.width > 8 && rect.height > 8) {
      obstacles.push({
        left: rect.left - flowRect.left,
        top: rect.top - flowRect.top,
        width: rect.width,
        height: rect.height,
      });
    }
  }

  return {
    top,
    left,
    right: Math.max(left, right),
    bottom: Math.max(top, bottom),
    obstacles,
  };
}

function rendererOf(state: { domNode: HTMLElement | null }) {
  const node = state.domNode?.querySelector(".react-flow__renderer");
  return node instanceof HTMLElement ? node : null;
}

type SelectionChromeProps = {
  side: ChromeSide;
  /** Lower numbers sit closer to the object on the preferred side. */
  order?: number;
  children: ReactNode;
};

export default function SelectionChrome({ side, order = 0, children }: SelectionChromeProps) {
  const nodeId = useNodeId();
  const slotId = `${nodeId ?? "node"}:${side}:${order}`;
  const host = useStore(rendererOf);
  const anchor = useStore((state): Anchor | null => {
    if (!nodeId) return null;
    const node = state.nodeLookup.get(nodeId);
    const width = node?.measured.width;
    const height = node?.measured.height;
    const zoom = state.transform[2];
    if (!node || !width || !height || !(zoom > 0)) return null;
    const [panX, panY] = state.transform;
    return {
      left: node.internals.positionAbsolute.x * zoom + panX,
      top: node.internals.positionAbsolute.y * zoom + panY,
      width: width * zoom,
      height: height * zoom,
      zoom,
    };
  }, sameAnchor);
  const layoutTick = useSyncExternalStore(subscribe, getTick, getTick);
  const rootRef = useRef<HTMLDivElement>(null);
  const [safe, setSafe] = useState<SafeArea | null>(null);

  useLayoutEffect(() => {
    return () => clearSlot(slotId);
  }, [slotId]);

  useLayoutEffect(() => {
    if (!host) return;
    const update = () => {
      const next = readSafeArea(host);
      setSafe((prev) => (sameSafe(prev, next) ? prev : next));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    const flow = host.closest(".react-flow");
    const board = flow?.parentElement;
    if (board && flow) {
      for (const child of board.children) {
        if (child instanceof HTMLElement && child !== flow) observer.observe(child);
      }
    }
    const minimap = flow?.querySelector(".react-flow__minimap");
    if (minimap instanceof HTMLElement) observer.observe(minimap);
    return () => observer.disconnect();
  }, [host]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !nodeId) return;
    const rect = root.getBoundingClientRect();
    setSlot(slotId, { nodeId, side, order, width: rect.width, height: rect.height });
  });

  const placed =
    anchor && safe
      ? placeSelectionChrome(
          { left: anchor.left, top: anchor.top, width: anchor.width, height: anchor.height },
          safe,
          slotsFor(nodeId ?? ""),
          selectionClearance(anchor.zoom),
          safe.obstacles,
        ).get(slotId)
      : undefined;
  void layoutTick;

  if (!host || !nodeId) return null;

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    const target = event.target;
    if (target instanceof Element && target.closest("input, textarea")) return;
    event.preventDefault();
  };

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return createPortal(
    <div
      ref={rootRef}
      data-selection-chrome={side}
      className="nodrag nopan nowheel"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "max-content",
        zIndex: 10,
        pointerEvents: "auto",
        visibility: placed ? "visible" : "hidden",
        transform: placed ? `translate(${placed.left}px, ${placed.top}px)` : "translate(-9999px, -9999px)",
      }}
      onPointerDown={onPointerDown}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onWheel={onWheel}
    >
      {children}
    </div>,
    host,
  );
}

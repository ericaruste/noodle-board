import { Position, type Edge } from "@xyflow/react";
import { applyNoodleData, readNoodle } from "./noodleData";

export const SIDES = ["top", "right", "bottom", "left"] as const;
export type SideId = (typeof SIDES)[number];

/** Fractions closer than this are the same point on a side. */
export const SAME_FRACTION = 0.012;

export type NodeBox = { x: number; y: number; width: number; height: number };

export type PerimeterHit = {
  side: SideId;
  fraction: number;
  x: number;
  y: number;
  distance: number;
};

type BoxNode = {
  measured?: { width?: number | null; height?: number | null };
  width?: number | null;
  height?: number | null;
  internals?: { positionAbsolute?: { x: number; y: number } };
  position?: { x: number; y: number };
};

export function isSide(id: string | null | undefined): id is SideId {
  return id === "top" || id === "right" || id === "bottom" || id === "left";
}

export function clampFraction(value: number) {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}

export function quantizeFraction(value: number) {
  return Math.round(clampFraction(value) * 1000) / 1000;
}

export function sameFraction(a: number | undefined, b: number | undefined) {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.abs(a - b) < SAME_FRACTION;
}

export function sidePosition(side: SideId): Position {
  if (side === "top") return Position.Top;
  if (side === "right") return Position.Right;
  if (side === "bottom") return Position.Bottom;
  return Position.Left;
}

export function nodeBox(node: BoxNode | null | undefined): NodeBox | null {
  if (!node) return null;
  const width = node.measured?.width ?? node.width;
  const height = node.measured?.height ?? node.height;
  if (!width || !height) return null;
  const origin = node.internals?.positionAbsolute ?? node.position;
  if (!origin) return null;
  return { x: origin.x, y: origin.y, width, height };
}

export function containsPoint(box: NodeBox, point: { x: number; y: number }) {
  return point.x >= box.x && point.y >= box.y && point.x <= box.x + box.width && point.y <= box.y + box.height;
}

/** Closest point on the rectangle border, and where it sits along that side. */
export function projectOntoBox(box: NodeBox, point: { x: number; y: number }): PerimeterHit {
  const right = box.x + box.width;
  const bottom = box.y + box.height;
  const clampX = Math.min(right, Math.max(box.x, point.x));
  const clampY = Math.min(bottom, Math.max(box.y, point.y));
  const width = box.width || 1;
  const height = box.height || 1;
  const candidates: PerimeterHit[] = [
    {
      side: "top",
      fraction: (clampX - box.x) / width,
      x: clampX,
      y: box.y,
      distance: Math.hypot(clampX - point.x, box.y - point.y),
    },
    {
      side: "bottom",
      fraction: (clampX - box.x) / width,
      x: clampX,
      y: bottom,
      distance: Math.hypot(clampX - point.x, bottom - point.y),
    },
    {
      side: "left",
      fraction: (clampY - box.y) / height,
      x: box.x,
      y: clampY,
      distance: Math.hypot(box.x - point.x, clampY - point.y),
    },
    {
      side: "right",
      fraction: (clampY - box.y) / height,
      x: right,
      y: clampY,
      distance: Math.hypot(right - point.x, clampY - point.y),
    },
  ];
  let best = candidates[0];
  for (const candidate of candidates) {
    if (candidate.distance < best.distance) best = candidate;
  }
  return { ...best, fraction: quantizeFraction(best.fraction) };
}

export function pointOnSide(box: NodeBox, side: SideId, fraction: number) {
  const t = clampFraction(fraction);
  if (side === "top") return { x: box.x + box.width * t, y: box.y };
  if (side === "bottom") return { x: box.x + box.width * t, y: box.y + box.height };
  if (side === "left") return { x: box.x, y: box.y + box.height * t };
  return { x: box.x + box.width, y: box.y + box.height * t };
}

export function sameAttachmentPoint(
  source: string | null | undefined,
  sourceHandle: string | null | undefined,
  sourceFraction: number | undefined,
  target: string | null | undefined,
  targetHandle: string | null | undefined,
  targetFraction: number | undefined,
) {
  if (!source || source !== target) return false;
  if (!isSide(sourceHandle) || sourceHandle !== targetHandle) return false;
  return sameFraction(sourceFraction ?? 0.5, targetFraction ?? 0.5);
}

type Slot = {
  edgeId: string;
  end: "source" | "target";
  fraction: number | undefined;
};

function slotFraction(data: unknown, end: "source" | "target") {
  const noodle = readNoodle(data);
  return end === "source" ? noodle.sourceFraction : noodle.targetFraction;
}

/**
 * Where each end sits. One edge on a side keeps its fraction (midpoint when
 * none was stored). Two or more edges share the side evenly, inset from the corners.
 */
export function resolveAttachments(edges: readonly Edge[]) {
  const groups = new Map<string, Slot[]>();
  for (const edge of edges) {
    if (isSide(edge.sourceHandle)) {
      const key = `${edge.source}:${edge.sourceHandle}`;
      const slots = groups.get(key) ?? [];
      slots.push({ edgeId: edge.id, end: "source", fraction: slotFraction(edge.data, "source") });
      groups.set(key, slots);
    }
    if (isSide(edge.targetHandle)) {
      const key = `${edge.target}:${edge.targetHandle}`;
      const slots = groups.get(key) ?? [];
      slots.push({ edgeId: edge.id, end: "target", fraction: slotFraction(edge.data, "target") });
      groups.set(key, slots);
    }
  }

  const resolved = new Map<string, { source?: number; target?: number }>();
  for (const slots of groups.values()) {
    const edgeCount = new Set(slots.map((slot) => slot.edgeId)).size;
    const ranked = [...slots].sort((a, b) => {
      const delta = (a.fraction ?? 0.5) - (b.fraction ?? 0.5);
      if (Math.abs(delta) > 0.0001) return delta;
      if (a.edgeId !== b.edgeId) return a.edgeId < b.edgeId ? -1 : 1;
      return a.end < b.end ? -1 : 1;
    });
    ranked.forEach((slot, index) => {
      const fraction =
        edgeCount < 2 ? quantizeFraction(slot.fraction ?? 0.5) : quantizeFraction((index + 1) / (ranked.length + 1));
      const entry = resolved.get(slot.edgeId) ?? {};
      entry[slot.end] = fraction;
      resolved.set(slot.edgeId, entry);
    });
  }
  return resolved;
}

/** Write resolved fractions onto `edge.data`. Returns the same array when nothing changed. */
export function reflowAttachments(edges: Edge[]): Edge[] {
  const resolved = resolveAttachments(edges);
  let changed = false;
  const next = edges.map((edge) => {
    const found = resolved.get(edge.id);
    const data = readNoodle(edge.data);
    const sourceFraction = isSide(edge.sourceHandle) ? found?.source : undefined;
    const targetFraction = isSide(edge.targetHandle) ? found?.target : undefined;
    if (data.sourceFraction === sourceFraction && data.targetFraction === targetFraction) return edge;
    changed = true;
    const noodle = { ...data };
    if (sourceFraction === undefined) delete noodle.sourceFraction;
    else noodle.sourceFraction = sourceFraction;
    if (targetFraction === undefined) delete noodle.targetFraction;
    else noodle.targetFraction = targetFraction;
    return applyNoodleData(edge, noodle);
  });
  return changed ? next : edges;
}

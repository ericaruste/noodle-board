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

/**
 * The side under the pointer, with the port fixed at that side's midpoint.
 * `distance` is the distance to the side, so a grab along the side still lands on the midpoint.
 */
export function projectOntoSideMidpoint(box: NodeBox, point: { x: number; y: number }): PerimeterHit {
  const edge = projectOntoBox(box, point);
  const at = pointOnSide(box, edge.side, 0.5);
  return { side: edge.side, fraction: 0.5, x: at.x, y: at.y, distance: edge.distance };
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

/**
 * Where each end sits. The origin (source) is the midpoint of its side.
 * The target keeps the fraction it was dropped at. Nothing is spread along a side.
 */
export function resolveAttachments(edges: readonly Edge[]) {
  const resolved = new Map<string, { source?: number; target?: number }>();
  for (const edge of edges) {
    const entry: { source?: number; target?: number } = {};
    if (isSide(edge.sourceHandle)) entry.source = 0.5;
    if (isSide(edge.targetHandle)) {
      const stored = readNoodle(edge.data).targetFraction;
      entry.target = stored == null ? 0.5 : clampFraction(stored);
    }
    if (entry.source !== undefined || entry.target !== undefined) resolved.set(edge.id, entry);
  }
  return resolved;
}

/**
 * Snap a free origin back to the side midpoint and drop fractions that no longer
 * sit on a side. Target fractions are left where they were dropped.
 * Returns the same array when nothing changed.
 */
export function reflowAttachments(edges: Edge[]): Edge[] {
  let changed = false;
  const next = edges.map((edge) => {
    const data = readNoodle(edge.data);
    const noodle = { ...data };
    let touched = false;
    if (isSide(edge.sourceHandle)) {
      if (noodle.sourceFraction != null && !sameFraction(noodle.sourceFraction, 0.5)) {
        noodle.sourceFraction = 0.5;
        touched = true;
      }
    } else if (noodle.sourceFraction != null) {
      delete noodle.sourceFraction;
      touched = true;
    }
    if (!isSide(edge.targetHandle) && noodle.targetFraction != null) {
      delete noodle.targetFraction;
      touched = true;
    }
    if (!touched) return edge;
    changed = true;
    return applyNoodleData(edge, noodle);
  });
  return changed ? next : edges;
}

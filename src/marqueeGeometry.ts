import { ENDPOINT_TYPE } from "./noodleEnds";

export type FlowRect = { x: number; y: number; width: number; height: number };

type Point = { x: number; y: number };

type NodeBox = {
  id: string;
  type?: string | null;
  hidden?: boolean;
  width?: number | null;
  height?: number | null;
  measured?: { width?: number | null; height?: number | null };
  internals?: { positionAbsolute?: { x: number; y: number } };
};

export function normalizeRect(x: number, y: number, width: number, height: number): FlowRect {
  return {
    x: width < 0 ? x + width : x,
    y: height < 0 ? y + height : y,
    width: Math.abs(width),
    height: Math.abs(height),
  };
}

/** Partial overlap, including a shared edge. */
export function rectsTouch(a: FlowRect, b: FlowRect) {
  return a.x <= b.x + b.width && a.x + a.width >= b.x && a.y <= b.y + b.height && a.y + a.height >= b.y;
}

function bounds(rect: FlowRect, pad: number) {
  return {
    minX: rect.x - pad,
    minY: rect.y - pad,
    maxX: rect.x + rect.width + pad,
    maxY: rect.y + rect.height + pad,
  };
}

function pointIn(point: Point, box: { minX: number; minY: number; maxX: number; maxY: number }) {
  return point.x >= box.minX && point.x <= box.maxX && point.y >= box.minY && point.y <= box.maxY;
}

function cross(ax: number, ay: number, bx: number, by: number) {
  return ax * by - ay * bx;
}

function onSegment(a: Point, b: Point, point: Point) {
  return (
    point.x >= Math.min(a.x, b.x) - 1e-6 &&
    point.x <= Math.max(a.x, b.x) + 1e-6 &&
    point.y >= Math.min(a.y, b.y) - 1e-6 &&
    point.y <= Math.max(a.y, b.y) + 1e-6
  );
}

function segmentsHit(a: Point, b: Point, c: Point, d: Point) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const cdx = d.x - c.x;
  const cdy = d.y - c.y;
  const d1 = cross(abx, aby, c.x - a.x, c.y - a.y);
  const d2 = cross(abx, aby, d.x - a.x, d.y - a.y);
  const d3 = cross(cdx, cdy, a.x - c.x, a.y - c.y);
  const d4 = cross(cdx, cdy, b.x - c.x, b.y - c.y);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  if (d1 === 0 && onSegment(a, b, c)) return true;
  if (d2 === 0 && onSegment(a, b, d)) return true;
  if (d3 === 0 && onSegment(c, d, a)) return true;
  if (d4 === 0 && onSegment(c, d, b)) return true;
  return false;
}

export function segmentHitsRect(a: Point, b: Point, rect: FlowRect, pad: number) {
  const box = bounds(rect, pad);
  if (pointIn(a, box) || pointIn(b, box)) return true;
  const corners: Point[] = [
    { x: box.minX, y: box.minY },
    { x: box.maxX, y: box.minY },
    { x: box.maxX, y: box.maxY },
    { x: box.minX, y: box.maxY },
  ];
  for (let i = 0; i < 4; i += 1) {
    if (segmentsHit(a, b, corners[i], corners[(i + 1) % 4])) return true;
  }
  return false;
}

/** True when the drawn stroke, not the node boxes at its ends, meets the rectangle. */
export function pathHitsRect(path: SVGGeometryElement, rect: FlowRect, pad: number) {
  let length = 0;
  try {
    length = path.getTotalLength();
  } catch {
    return false;
  }
  if (!Number.isFinite(length) || length <= 0) return false;
  const steps = Math.max(1, Math.ceil(length / 4));
  let prev: Point;
  try {
    prev = path.getPointAtLength(0);
  } catch {
    return false;
  }
  for (let i = 1; i <= steps; i += 1) {
    let next: Point;
    try {
      next = path.getPointAtLength(Math.min(length, (length * i) / steps));
    } catch {
      return false;
    }
    if (segmentHitsRect(prev, next, rect, pad)) return true;
    prev = next;
  }
  return false;
}

export function nodesTouchingRect(nodes: Iterable<NodeBox>, rect: FlowRect) {
  const ids = new Set<string>();
  for (const node of nodes) {
    if (node.hidden || node.type === ENDPOINT_TYPE) continue;
    const width = node.measured?.width ?? node.width ?? 0;
    const height = node.measured?.height ?? node.height ?? 0;
    if (!width || !height) continue;
    const origin = node.internals?.positionAbsolute;
    if (!origin) continue;
    if (rectsTouch(rect, { x: origin.x, y: origin.y, width, height })) ids.add(node.id);
  }
  return ids;
}

export function selectionIds(
  pickedNodes: ReadonlySet<string>,
  pickedEdges: ReadonlySet<string>,
  baseNodes: ReadonlySet<string>,
  baseEdges: ReadonlySet<string>,
  additive: boolean,
) {
  if (!additive) return { nodes: pickedNodes, edges: pickedEdges };
  const nodes = new Set(baseNodes);
  const edges = new Set(baseEdges);
  for (const id of pickedNodes) nodes.add(id);
  for (const id of pickedEdges) edges.add(id);
  return { nodes, edges };
}

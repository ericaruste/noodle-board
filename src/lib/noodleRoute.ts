import { Position } from "@xyflow/react";
import type { NoodlePoint, NoodleShape } from "./noodleData";

export type NoodleAnchor = {
  kind: "segment" | "curve";
  /** Segment index in the laid-out point list. Unused for a curve. */
  index: number;
  x: number;
  y: number;
  /** Unit perpendicular. Dragging positive moves the segment along this. */
  nx: number;
  ny: number;
};

export type NoodleLayout = {
  path: string;
  labelX: number;
  labelY: number;
  points: NoodlePoint[];
  anchors: NoodleAnchor[];
};

const ELBOW_OFFSET = 24;
const ELBOW_RADIUS = 10;
const STUB = 28;

/** Gap between a node edge and the drawn noodle end. */
export const ROUTE_GAP = 8;

export type FlowRect = { minX: number; minY: number; maxX: number; maxY: number };

export type RouteFrame = { view: FlowRect; obstacles: FlowRect[] };

const handleDirections = {
  [Position.Left]: { x: -1, y: 0 },
  [Position.Right]: { x: 1, y: 0 },
  [Position.Top]: { x: 0, y: -1 },
  [Position.Bottom]: { x: 0, y: 1 },
};

function roundPoint(point: NoodlePoint): NoodlePoint {
  return { x: Math.round(point.x * 100) / 100, y: Math.round(point.y * 100) / 100 };
}

function near(a: number, b: number) {
  return Math.abs(a - b) < 0.51;
}

function dedupe(points: NoodlePoint[]): NoodlePoint[] {
  const out: NoodlePoint[] = [];
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    const prev = out[out.length - 1];
    if (prev && near(prev.x, point.x) && near(prev.y, point.y)) {
      if (i === points.length - 1) out[out.length - 1] = { ...point };
      continue;
    }
    out.push({ ...point });
  }
  return out;
}

function mergeCollinear(points: NoodlePoint[]): NoodlePoint[] {
  if (points.length < 3) return points.map((point) => ({ ...point }));
  const out: NoodlePoint[] = [points[0]];
  for (let i = 1; i < points.length - 1; i += 1) {
    const a = out[out.length - 1];
    const b = points[i];
    const c = points[i + 1];
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const bcx = c.x - b.x;
    const bcy = c.y - b.y;
    const ab = Math.hypot(abx, aby) || 1;
    const bc = Math.hypot(bcx, bcy) || 1;
    const sin = Math.abs(abx * bcy - aby * bcx) / (ab * bc);
    if (sin < 0.02) continue;
    out.push({ ...b });
  }
  out.push({ ...points[points.length - 1] });
  return dedupe(out);
}

/** Orthogonal polyline. The first and last points stay put. */
function orthogonalize(points: NoodlePoint[]): NoodlePoint[] {
  if (points.length < 2) return points.map((point) => ({ ...point }));
  const out: NoodlePoint[] = [{ ...points[0] }];
  for (let i = 1; i < points.length; i += 1) {
    const prev = out[out.length - 1];
    const cur = points[i];
    const last = i === points.length - 1;
    if (near(prev.x, cur.x) || near(prev.y, cur.y)) {
      if (last) out.push({ ...cur });
      else {
        out.push({
          x: near(prev.x, cur.x) ? prev.x : cur.x,
          y: near(prev.y, cur.y) ? prev.y : cur.y,
        });
      }
      continue;
    }
    const before = out.length >= 2 ? out[out.length - 2] : null;
    const horizontal = before
      ? Math.abs(before.y - prev.y) <= Math.abs(before.x - prev.x)
      : Math.abs(cur.x - prev.x) >= Math.abs(cur.y - prev.y);
    out.push(horizontal ? { x: cur.x, y: prev.y } : { x: prev.x, y: cur.y });
    out.push({ ...cur });
  }
  return dedupe(out);
}

function pinEnds(points: NoodlePoint[], source: NoodlePoint, target: NoodlePoint) {
  if (points.length < 2) return [{ ...source }, { ...target }];
  const next = points.map((point) => ({ ...point }));
  next[0] = { ...source };
  next[next.length - 1] = { ...target };
  return next;
}

/**
 * React Flow's smoothstep point list, so an untouched elbow matches the
 * connector people already draw by dragging a port.
 */
function elbowPoints(
  source: NoodlePoint,
  sourcePosition: Position,
  target: NoodlePoint,
  targetPosition: Position,
): NoodlePoint[] {
  const sourceDir = handleDirections[sourcePosition];
  const targetDir = handleDirections[targetPosition];
  const sourceGapped = { x: source.x + sourceDir.x * ELBOW_OFFSET, y: source.y + sourceDir.y * ELBOW_OFFSET };
  const targetGapped = { x: target.x + targetDir.x * ELBOW_OFFSET, y: target.y + targetDir.y * ELBOW_OFFSET };
  const dir =
    sourcePosition === Position.Left || sourcePosition === Position.Right
      ? sourceGapped.x < targetGapped.x
        ? { x: 1, y: 0 }
        : { x: -1, y: 0 }
      : sourceGapped.y < targetGapped.y
        ? { x: 0, y: 1 }
        : { x: 0, y: -1 };
  const dirAccessor = dir.x !== 0 ? "x" : "y";
  const currDir = dir[dirAccessor];
  let mids: NoodlePoint[] = [];
  const sourceGapOffset = { x: 0, y: 0 };
  const targetGapOffset = { x: 0, y: 0 };

  if (sourceDir[dirAccessor] * targetDir[dirAccessor] === -1) {
    const centerX = dirAccessor === "x" ? (sourceGapped.x + targetGapped.x) / 2 : (sourceGapped.x + targetGapped.x) / 2;
    const centerY = dirAccessor === "x" ? (sourceGapped.y + targetGapped.y) / 2 : (sourceGapped.y + targetGapped.y) / 2;
    const verticalSplit = [
      { x: centerX, y: sourceGapped.y },
      { x: centerX, y: targetGapped.y },
    ];
    const horizontalSplit = [
      { x: sourceGapped.x, y: centerY },
      { x: targetGapped.x, y: centerY },
    ];
    if (sourceDir[dirAccessor] === currDir) mids = dirAccessor === "x" ? verticalSplit : horizontalSplit;
    else mids = dirAccessor === "x" ? horizontalSplit : verticalSplit;
  } else {
    const sourceTarget = [{ x: sourceGapped.x, y: targetGapped.y }];
    const targetSource = [{ x: targetGapped.x, y: sourceGapped.y }];
    if (dirAccessor === "x") mids = sourceDir.x === currDir ? targetSource : sourceTarget;
    else mids = sourceDir.y === currDir ? sourceTarget : targetSource;

    if (sourcePosition === targetPosition) {
      const diff = Math.abs(source[dirAccessor] - target[dirAccessor]);
      if (diff <= ELBOW_OFFSET) {
        const gapOffset = Math.min(ELBOW_OFFSET - 1, ELBOW_OFFSET - diff);
        if (sourceDir[dirAccessor] === currDir) {
          sourceGapOffset[dirAccessor] = (sourceGapped[dirAccessor] > source[dirAccessor] ? -1 : 1) * gapOffset;
        } else {
          targetGapOffset[dirAccessor] = (targetGapped[dirAccessor] > target[dirAccessor] ? -1 : 1) * gapOffset;
        }
      }
    }

    if (sourcePosition !== targetPosition) {
      const opposite = dirAccessor === "x" ? "y" : "x";
      const sameDir = sourceDir[dirAccessor] === targetDir[opposite];
      const sourceGt = sourceGapped[opposite] > targetGapped[opposite];
      const sourceLt = sourceGapped[opposite] < targetGapped[opposite];
      const flip =
        (sourceDir[dirAccessor] === 1 && ((!sameDir && sourceGt) || (sameDir && sourceLt))) ||
        (sourceDir[dirAccessor] !== 1 && ((!sameDir && sourceLt) || (sameDir && sourceGt)));
      if (flip) mids = dirAccessor === "x" ? sourceTarget : targetSource;
    }
  }

  const gappedSource = { x: sourceGapped.x + sourceGapOffset.x, y: sourceGapped.y + sourceGapOffset.y };
  const gappedTarget = { x: targetGapped.x + targetGapOffset.x, y: targetGapped.y + targetGapOffset.y };
  const first = mids[0];
  const last = mids[mids.length - 1];
  return [
    source,
    ...(first && (gappedSource.x !== first.x || gappedSource.y !== first.y) ? [gappedSource] : []),
    ...mids,
    ...(last && (gappedTarget.x !== last.x || gappedTarget.y !== last.y) ? [gappedTarget] : []),
    target,
  ];
}

function bend(a: NoodlePoint, b: NoodlePoint, c: NoodlePoint, size: number) {
  const radius = Math.min(Math.hypot(b.x - a.x, b.y - a.y) / 2, Math.hypot(c.x - b.x, c.y - b.y) / 2, size);
  if ((near(a.x, b.x) && near(b.x, c.x)) || (near(a.y, b.y) && near(b.y, c.y)) || radius < 0.5) {
    return `L${b.x} ${b.y}`;
  }
  if (near(a.y, b.y)) {
    const xDir = a.x < c.x ? -1 : 1;
    const yDir = a.y < c.y ? 1 : -1;
    return `L ${b.x + radius * xDir},${b.y}Q ${b.x},${b.y} ${b.x},${b.y + radius * yDir}`;
  }
  const xDir = a.x < c.x ? 1 : -1;
  const yDir = a.y < c.y ? -1 : 1;
  return `L ${b.x},${b.y + radius * yDir}Q ${b.x},${b.y} ${b.x + radius * xDir},${b.y}`;
}

function polylinePath(points: NoodlePoint[], radius: number) {
  if (points.length < 2) return "";
  if (points.length === 2 || radius <= 0) {
    return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join("");
  }
  let path = `M${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    path += bend(points[i - 1], points[i], points[i + 1], radius);
  }
  const last = points[points.length - 1];
  path += `L${last.x} ${last.y}`;
  return path;
}

function labelOn(points: NoodlePoint[]) {
  let bestLength = -1;
  let midX = points[0]?.x ?? 0;
  let midY = points[0]?.y ?? 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length > bestLength) {
      bestLength = length;
      midX = (a.x + b.x) / 2;
      midY = (a.y + b.y) / 2;
    }
  }
  return { x: midX, y: midY };
}

function bodyAnchors(points: NoodlePoint[]): NoodleAnchor[] {
  if (points.length < 2) return [];
  const source = points[0];
  const target = points[points.length - 1];
  const anchors: NoodleAnchor[] = [];
  let count = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    if (Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y) >= 1) count += 1;
  }
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    if (length < 16) continue;
    const touchesSource = Math.hypot(a.x - source.x, a.y - source.y) < 0.6;
    const touchesTarget = Math.hypot(b.x - target.x, b.y - target.y) < 0.6;
    if ((touchesSource || touchesTarget) && length < 40 && count > 1) continue;
    anchors.push({
      kind: "segment",
      index: i,
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      nx: -dy / length,
      ny: dx / length,
    });
  }
  return anchors;
}

function travel(point: NoodlePoint, position: Position, distance: number): NoodlePoint {
  if (position === Position.Left) return { x: point.x - distance, y: point.y };
  if (position === Position.Right) return { x: point.x + distance, y: point.y };
  if (position === Position.Top) return { x: point.x, y: point.y - distance };
  return { x: point.x, y: point.y + distance };
}

function cubicAt(p0: NoodlePoint, c1: NoodlePoint, c2: NoodlePoint, p3: NoodlePoint, t: number) {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p3.y,
  };
}

function curveStub(from: NoodlePoint, position: Position, to: NoodlePoint, len: number) {
  const toward =
    position === Position.Left
      ? from.x - to.x
      : position === Position.Right
        ? to.x - from.x
        : position === Position.Top
          ? from.y - to.y
          : to.y - from.y;
  const cap = Math.min(80, Math.max(28, len * 0.25));
  if (toward > 0) return Math.min(cap, Math.max(28, toward * 0.45));
  return Math.min(40, cap);
}

function curveLayout(
  source: NoodlePoint,
  sourcePosition: Position,
  target: NoodlePoint,
  targetPosition: Position,
  curveOffset: number,
): NoodleLayout {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const shift = curveOffset / 0.75;
  const c1 = travel(source, sourcePosition, curveStub(source, sourcePosition, target, len));
  const c2 = travel(target, targetPosition, curveStub(target, targetPosition, source, len));
  const control1 = { x: c1.x + nx * shift, y: c1.y + ny * shift };
  const control2 = { x: c2.x + nx * shift, y: c2.y + ny * shift };
  const mid = cubicAt(source, control1, control2, target, 0.5);
  return {
    path: `M${source.x} ${source.y} C${control1.x} ${control1.y} ${control2.x} ${control2.y} ${target.x} ${target.y}`,
    labelX: mid.x,
    labelY: mid.y,
    points: [source, target],
    anchors: [{ kind: "curve", index: 0, x: mid.x, y: mid.y, nx, ny }],
  };
}

function clampPoint(point: NoodlePoint, view: FlowRect): NoodlePoint {
  return {
    x: Math.min(view.maxX, Math.max(view.minX, point.x)),
    y: Math.min(view.maxY, Math.max(view.minY, point.y)),
  };
}

function segmentHits(a: NoodlePoint, b: NoodlePoint, rect: FlowRect) {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  return maxX > rect.minX + 0.5 && minX < rect.maxX - 0.5 && maxY > rect.minY + 0.5 && minY < rect.maxY - 0.5;
}

function detourAround(a: NoodlePoint, b: NoodlePoint, rect: FlowRect, view: FlowRect): NoodlePoint[] {
  const horizontal = Math.abs(a.y - b.y) <= Math.abs(a.x - b.x);
  if (horizontal) {
    const y = Math.abs(a.y - rect.minY) <= Math.abs(a.y - rect.maxY) ? rect.minY : rect.maxY;
    const clamped = Math.min(view.maxY, Math.max(view.minY, y));
    return [
      { x: a.x, y: clamped },
      { x: b.x, y: clamped },
    ];
  }
  const x = Math.abs(a.x - rect.minX) <= Math.abs(a.x - rect.maxX) ? rect.minX : rect.maxX;
  const clamped = Math.min(view.maxX, Math.max(view.minX, x));
  return [
    { x: clamped, y: a.y },
    { x: clamped, y: b.y },
  ];
}

function avoidObstacles(points: NoodlePoint[], frame: RouteFrame): NoodlePoint[] {
  let current = points;
  for (const rect of frame.obstacles) {
    const next: NoodlePoint[] = [];
    for (let i = 0; i < current.length; i += 1) {
      const point = current[i];
      if (i > 0 && segmentHits(current[i - 1], point, rect)) {
        next.push(...detourAround(current[i - 1], point, rect, frame.view));
      }
      next.push(point);
    }
    current = next;
  }
  return current;
}

/**
 * Draw-only. Elbow waypoints that would leave the visible canvas, or run under
 * the toolbars, bend back inside. Stored bends are not changed.
 */
export function fitElbowToView(points: NoodlePoint[], frame: RouteFrame | null): NoodlePoint[] {
  if (!frame || points.length < 3) return points;
  const { view } = frame;
  if (!(view.maxX > view.minX) || !(view.maxY > view.minY)) return points;
  const source = points[0];
  const target = points[points.length - 1];
  const clamped = points.map((point, index) =>
    index === 0 || index === points.length - 1 ? { ...point } : clampPoint(point, view),
  );
  const around = avoidObstacles(pinEnds(orthogonalize(clamped), source, target), frame);
  const again = around.map((point, index) =>
    index === 0 || index === around.length - 1 ? { ...point } : clampPoint(point, view),
  );
  return pinEnds(mergeCollinear(orthogonalize(again)), source, target);
}

export function layoutNoodle(input: {
  shape: NoodleShape;
  source: NoodlePoint;
  target: NoodlePoint;
  sourcePosition: Position;
  targetPosition: Position;
  bends: NoodlePoint[];
  curveOffset: number;
  /** Visible canvas, in flow units. Elbows bend back inside it. */
  frame?: RouteFrame | null;
}): NoodleLayout {
  const source = roundPoint(input.source);
  const target = roundPoint(input.target);
  if (input.shape === "curve") {
    return curveLayout(source, input.sourcePosition, target, input.targetPosition, input.curveOffset);
  }
  const bends = input.bends.map(roundPoint);
  let points =
    input.shape === "elbow"
      ? bends.length
        ? orthogonalize([source, ...bends, target])
        : mergeCollinear(elbowPoints(source, input.sourcePosition, target, input.targetPosition))
      : mergeCollinear([source, ...bends, target]);
  if (input.shape === "elbow") points = fitElbowToView(points, input.frame ?? null);
  points = pinEnds(points.map(roundPoint), source, target);
  const label = labelOn(points);
  return {
    path: polylinePath(points, input.shape === "elbow" ? ELBOW_RADIUS : 0),
    labelX: label.x,
    labelY: label.y,
    points,
    anchors: bodyAnchors(points),
  };
}

function stubOf(length: number) {
  return Math.min(STUB, Math.max(8, length * 0.3));
}

function translateSegment(points: NoodlePoint[], index: number, ox: number, oy: number): NoodlePoint[] {
  const pts = points.map((point) => ({ ...point }));
  const a = pts[index];
  const b = pts[index + 1];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const shift = (point: NoodlePoint): NoodlePoint => ({ x: point.x + ox, y: point.y + oy });
  const atStart = index === 0;
  const atEnd = index === pts.length - 2;

  if (atStart && atEnd) {
    const stub = stubOf(len);
    return [
      pts[0],
      shift({ x: a.x + ux * stub, y: a.y + uy * stub }),
      shift({ x: b.x - ux * stub, y: b.y - uy * stub }),
      pts[pts.length - 1],
    ];
  }
  if (atStart) {
    const stub = stubOf(len);
    const pinned = { x: a.x + ux * stub, y: a.y + uy * stub };
    const next = pts.slice();
    next[index + 1] = shift(b);
    next.splice(index + 1, 0, pinned, shift(pinned));
    return next;
  }
  if (atEnd) {
    const stub = stubOf(len);
    const pinned = { x: b.x - ux * stub, y: b.y - uy * stub };
    const next = pts.slice();
    next[index] = shift(a);
    next.splice(index + 1, 0, shift(pinned), pinned);
    return next;
  }
  const next = pts.slice();
  next[index] = shift(a);
  next[index + 1] = shift(b);
  return next;
}

/** Move one body segment perpendicular to itself. Both path ends stay put. */
export function moveSegment(points: NoodlePoint[], index: number, ox: number, oy: number, shape: NoodleShape): NoodlePoint[] {
  if (points.length < 2 || index < 0 || index >= points.length - 1) return points;
  const source = points[0];
  const target = points[points.length - 1];
  let mx = ox;
  let my = oy;
  if (shape === "elbow") {
    const a = points[index];
    const b = points[index + 1];
    if (Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)) mx = 0;
    else my = 0;
  }
  const moved = translateSegment(points, index, mx, my);
  const pinned = pinEnds(moved, source, target);
  const cleaned = shape === "elbow" ? mergeCollinear(orthogonalize(pinned)) : mergeCollinear(pinned);
  return pinEnds(cleaned, source, target).map(roundPoint);
}

export function bendsFromPoints(points: NoodlePoint[]): NoodlePoint[] {
  if (points.length <= 2) return [];
  return points.slice(1, -1).map(roundPoint);
}

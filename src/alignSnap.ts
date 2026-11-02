import type { Node, NodeChange } from "@xyflow/react";

/**
 * Custom alignment and equal-spacing snap. The xyflow helper-lines example is
 * Pro-licensed; this is a small local overlay and does not copy that source.
 */

/** Flow-coordinate distance. Kept in flow space so zooming out does not widen the grab. */
export const ALIGN_SNAP = 5;

const GUIDE_PAD = 4;
const SKIP_TYPES = new Set(["endpoint"]);

export type GuideLine = {
  orientation: "vertical" | "horizontal";
  /** Flow x for a vertical line, flow y for a horizontal line. */
  at: number;
  from: number;
  to: number;
};

/** A measurement mark in a gap: a segment between facing edges, plus end caps drawn by the overlay. */
export type SpacingBracket = {
  /** "horizontal" runs left-to-right. "vertical" runs top-to-bottom. */
  orientation: "horizontal" | "vertical";
  from: number;
  to: number;
  /** Cross-axis center of the gap. */
  at: number;
};

export type GuideOverlay = {
  lines: GuideLine[];
  brackets: SpacingBracket[];
};

export type FlowBox = { x: number; y: number; w: number; h: number };

type Axis = "x" | "y";
type Anchor = 0 | 0.5 | 1;

const ANCHORS: Anchor[] = [0, 0.5, 1];

type Sides = { left: boolean; right: boolean; top: boolean; bottom: boolean };

type SnapHit = {
  delta: number;
  anchor: Anchor;
  matches: { at: number; other: FlowBox }[];
};

export type AlignResult = {
  changes: NodeChange[];
  /** null leaves the current guides alone. An empty list clears them. */
  guides: GuideLine[] | null;
  /** null leaves spacing brackets alone. An empty list clears them. */
  brackets: SpacingBracket[] | null;
};

function styleSize(value: unknown): number | null {
  if (typeof value === "number" && value > 0) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (parsed > 0) return parsed;
  }
  return null;
}

export function nodeBox(node: Node): FlowBox | null {
  if (node.hidden || (node.type && SKIP_TYPES.has(node.type))) return null;
  const w = node.measured?.width ?? node.width ?? styleSize(node.style?.width);
  const h = node.measured?.height ?? node.height ?? styleSize(node.style?.height);
  if (w == null || h == null || !(w > 0) || !(h > 0)) return null;
  return { x: node.position.x, y: node.position.y, w, h };
}

function proposedBox(node: Node, changes: NodeChange[]): FlowBox | null {
  const base = nodeBox(node);
  if (!base) return null;
  let { x, y, w, h } = base;
  for (const change of changes) {
    if (change.type === "add" || change.id !== node.id) continue;
    if (change.type === "position" && change.position) {
      x = change.position.x;
      y = change.position.y;
    }
    if (change.type === "dimensions" && change.dimensions) {
      if (change.dimensions.width > 0) w = change.dimensions.width;
      if (change.dimensions.height > 0) h = change.dimensions.height;
    }
  }
  return { x, y, w, h };
}

function anchorAt(box: FlowBox, axis: Axis, anchor: Anchor) {
  return axis === "x" ? box.x + anchor * box.w : box.y + anchor * box.h;
}

function bestSnap(moving: FlowBox, others: FlowBox[], axis: Axis, anchors: Anchor[], shareDelta: boolean): SnapHit | null {
  let bestAbs = Number.POSITIVE_INFINITY;
  let bestDelta = 0;
  let bestAnchor: Anchor = anchors[0] ?? 0;
  const found: { delta: number; anchor: Anchor; at: number; other: FlowBox }[] = [];

  for (const anchor of anchors) {
    const pos = anchorAt(moving, axis, anchor);
    for (const other of others) {
      for (const otherAnchor of ANCHORS) {
        const at = anchorAt(other, axis, otherAnchor);
        const delta = at - pos;
        const abs = Math.abs(delta);
        if (abs > ALIGN_SNAP) continue;
        found.push({ delta, anchor, at, other });
        if (abs < bestAbs - 1e-6) {
          bestAbs = abs;
          bestDelta = delta;
          bestAnchor = anchor;
        }
      }
    }
  }

  if (!Number.isFinite(bestAbs)) return null;
  const matches = found.filter((hit) =>
    shareDelta
      ? Math.abs(hit.delta - bestDelta) < 0.01
      : hit.anchor === bestAnchor && Math.abs(hit.delta - bestDelta) < 0.01,
  );
  return { delta: bestDelta, anchor: bestAnchor, matches };
}

function guidesFor(axis: Axis, snapped: FlowBox, matches: { at: number; other: FlowBox }[]): GuideLine[] {
  const grouped = new Map<number, { from: number; to: number }>();
  for (const match of matches) {
    const from =
      axis === "x"
        ? Math.min(snapped.y, match.other.y) - GUIDE_PAD
        : Math.min(snapped.x, match.other.x) - GUIDE_PAD;
    const to =
      axis === "x"
        ? Math.max(snapped.y + snapped.h, match.other.y + match.other.h) + GUIDE_PAD
        : Math.max(snapped.x + snapped.w, match.other.x + match.other.w) + GUIDE_PAD;
    const key = Math.round(match.at * 100) / 100;
    const existing = grouped.get(key);
    if (!existing) grouped.set(key, { from, to });
    else {
      existing.from = Math.min(existing.from, from);
      existing.to = Math.max(existing.to, to);
    }
  }
  const orientation = axis === "x" ? "vertical" : "horizontal";
  return [...grouped.entries()].map(([at, span]) => ({
    orientation,
    at,
    from: span.from,
    to: span.to,
  }));
}

function otherBoxes(nodes: Node[], skip: Set<string>) {
  const boxes: FlowBox[] = [];
  for (const node of nodes) {
    if (skip.has(node.id)) continue;
    const box = nodeBox(node);
    if (box) boxes.push(box);
  }
  return boxes;
}

function shiftDrag(changes: NodeChange[], active: Set<string>, dx: number, dy: number): NodeChange[] {
  if (dx === 0 && dy === 0) return changes;
  return changes.map((change) => {
    if (change.type !== "position" || !change.position || !active.has(change.id)) return change;
    return {
      ...change,
      position: { x: change.position.x + dx, y: change.position.y + dy },
    };
  });
}

/** "horizontal" keeps the drag on a line of constant y. "vertical" keeps constant x. */
export type AxisLock = "horizontal" | "vertical";

/** Drag-start position used to lock an Alt-drag while Shift is held. */
export type DragAxisLock = {
  origin: { x: number; y: number };
  primaryId: string;
};

/**
 * Keep a drag on the axis the pointer has moved further along.
 * The other axis is left free so alignment can still snap it.
 */
function constrainDragChanges(
  changes: NodeChange[],
  active: Set<string>,
  primaryId: string,
  origin: { x: number; y: number },
): { changes: NodeChange[]; lock: AxisLock } | null {
  const primary = changes.find(
    (change) => change.type === "position" && change.id === primaryId && change.position,
  );
  if (!primary || primary.type !== "position" || !primary.position) return null;
  const dx = primary.position.x - origin.x;
  const dy = primary.position.y - origin.y;
  const lock: AxisLock = Math.abs(dx) >= Math.abs(dy) ? "horizontal" : "vertical";
  const shifted =
    lock === "horizontal"
      ? shiftDrag(changes, active, 0, origin.y - primary.position.y)
      : shiftDrag(changes, active, origin.x - primary.position.x, 0);
  return { changes: shifted, lock };
}

function withAxisLock(
  changes: NodeChange[],
  active: Set<string>,
  primaryId: string,
  constraint: DragAxisLock | null,
): { changes: NodeChange[]; lock: AxisLock | null; primaryId: string } {
  if (!constraint || !active.has(constraint.primaryId)) {
    return { changes, lock: null, primaryId };
  }
  const locked = constrainDragChanges(changes, active, constraint.primaryId, constraint.origin);
  if (!locked) return { changes, lock: null, primaryId };
  return { changes: locked.changes, lock: locked.lock, primaryId: constraint.primaryId };
}

function axisStart(box: FlowBox, axis: Axis) {
  return axis === "x" ? box.x : box.y;
}

function axisEnd(box: FlowBox, axis: Axis) {
  return axis === "x" ? box.x + box.w : box.y + box.h;
}

function axisSize(box: FlowBox, axis: Axis) {
  return axis === "x" ? box.w : box.h;
}

/** Row-mates overlap vertically. Column-mates overlap horizontally. */
function overlapsCross(a: FlowBox, b: FlowBox, axis: Axis) {
  if (axis === "x") return Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0;
  return Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 0;
}

function crossAt(a: FlowBox, b: FlowBox, axis: Axis) {
  if (axis === "x") {
    const start = Math.max(a.y, b.y);
    const end = Math.min(a.y + a.h, b.y + b.h);
    if (end > start) return (start + end) / 2;
    return (a.y + a.h / 2 + b.y + b.h / 2) / 2;
  }
  const start = Math.max(a.x, b.x);
  const end = Math.min(a.x + a.w, b.x + b.w);
  if (end > start) return (start + end) / 2;
  return (a.x + a.w / 2 + b.x + b.w / 2) / 2;
}

type GapPair = { gap: number; a: FlowBox; b: FlowBox };

type SpacingContext = {
  existing: GapPair[];
  before: GapPair | null;
  after: GapPair | null;
};

function gapPair(a: FlowBox, b: FlowBox, axis: Axis): GapPair | null {
  const gap = axisStart(b, axis) - axisEnd(a, axis);
  if (!(gap >= 0)) return null;
  return { gap, a, b };
}

function spacingContext(moving: FlowBox, others: FlowBox[], axis: Axis): SpacingContext | null {
  const sorted = others
    .filter((other) => overlapsCross(moving, other, axis))
    .sort((a, b) => axisStart(a, axis) - axisStart(b, axis) || axisEnd(a, axis) - axisEnd(b, axis));
  if (sorted.length === 0) return null;

  const center = (axisStart(moving, axis) + axisEnd(moving, axis)) / 2;
  const existing: GapPair[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const pair = gapPair(a, b, axis);
    if (!pair) continue;
    // The span the dragged node sits in is not an existing gap.
    if (center > axisEnd(a, axis) && center < axisStart(b, axis)) continue;
    existing.push(pair);
  }

  let before: FlowBox | null = null;
  let beforeEnd = Number.NEGATIVE_INFINITY;
  let after: FlowBox | null = null;
  let afterStart = Number.POSITIVE_INFINITY;
  const start = axisStart(moving, axis);
  const end = axisEnd(moving, axis);
  for (const other of sorted) {
    const otherEnd = axisEnd(other, axis);
    if (otherEnd <= start + 0.01 && otherEnd >= beforeEnd) {
      before = other;
      beforeEnd = otherEnd;
    }
    const otherStart = axisStart(other, axis);
    if (otherStart >= end - 0.01 && otherStart <= afterStart) {
      after = other;
      afterStart = otherStart;
    }
  }

  return {
    existing,
    before: before ? gapPair(before, moving, axis) : null,
    after: after ? gapPair(moving, after, axis) : null,
  };
}

type SpacingSnap = { delta: number; targets: number[]; tolerance: number };

const NO_SPACING: SpacingSnap = { delta: 0, targets: [], tolerance: ALIGN_SNAP };

function uniqueGaps(values: number[]) {
  const out: number[] = [];
  for (const value of values) {
    if (out.some((item) => Math.abs(item - value) <= 0.05)) continue;
    out.push(value);
  }
  return out;
}

function equalSpan(context: SpacingContext, moving: FlowBox, axis: Axis) {
  if (!context.before || !context.after) return null;
  const left = context.before.a;
  const right = context.after.b;
  const space = axisStart(right, axis) - axisEnd(left, axis);
  const gap = (space - axisSize(moving, axis)) / 2;
  if (!(gap >= 0)) return null;
  return { delta: axisEnd(left, axis) + gap - axisStart(moving, axis), gap };
}

/**
 * Snap so the gap to a neighbour matches an existing gap on that row or column.
 * A node sitting between two neighbours prefers the centre of that span.
 * Alignment already owns an axis when `allowSnap` is false: report matching gaps, but do not move.
 */
function spacingSnap(moving: FlowBox, others: FlowBox[], axis: Axis, allowSnap: boolean): SpacingSnap {
  const context = spacingContext(moving, others, axis);
  if (!context) return NO_SPACING;

  const centered = equalSpan(context, moving, axis);
  if (centered && Math.abs(centered.delta) <= ALIGN_SNAP) {
    if (!allowSnap) return { delta: 0, targets: [centered.gap], tolerance: ALIGN_SNAP };
    return { delta: centered.delta, targets: [centered.gap], tolerance: 0.05 };
  }

  const sideTargets = (limit: number) => {
    const targets: number[] = [];
    for (const item of context.existing) {
      if (context.before && Math.abs(context.before.gap - item.gap) <= limit) targets.push(item.gap);
      if (context.after && Math.abs(context.after.gap - item.gap) <= limit) targets.push(item.gap);
    }
    return uniqueGaps(targets);
  };

  if (!allowSnap) return { delta: 0, targets: sideTargets(ALIGN_SNAP), tolerance: ALIGN_SNAP };

  const candidates: { delta: number; target: number; dist: number }[] = [];
  const consider = (pair: GapPair | null, side: "before" | "after") => {
    if (!pair) return;
    for (const item of context.existing) {
      const dist = Math.abs(pair.gap - item.gap);
      if (dist > ALIGN_SNAP) continue;
      const delta = side === "before" ? item.gap - pair.gap : pair.gap - item.gap;
      candidates.push({ delta, target: item.gap, dist });
    }
  };
  consider(context.before, "before");
  consider(context.after, "after");
  if (candidates.length === 0) return NO_SPACING;

  let bestDist = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) bestDist = Math.min(bestDist, candidate.dist);
  const closest = candidates.filter((candidate) => candidate.dist <= bestDist + 1e-6);

  let chosen: { delta: number; targets: number[] } | null = null;
  const seen = new Set<string>();
  for (const candidate of closest) {
    const key = candidate.delta.toFixed(4);
    if (seen.has(key)) continue;
    seen.add(key);
    const targets = uniqueGaps(
      closest.filter((item) => item.delta.toFixed(4) === key).map((item) => item.target),
    );
    if (!chosen || targets.length > chosen.targets.length) chosen = { delta: candidate.delta, targets };
  }
  if (!chosen) return NO_SPACING;
  return { delta: chosen.delta, targets: chosen.targets, tolerance: 0.05 };
}

function bracketBetween(pair: GapPair, axis: Axis): SpacingBracket | null {
  if (!(pair.gap > 0)) return null;
  return {
    orientation: axis === "x" ? "horizontal" : "vertical",
    from: axisEnd(pair.a, axis),
    to: axisStart(pair.b, axis),
    at: crossAt(pair.a, pair.b, axis),
  };
}

function spacingBrackets(
  moving: FlowBox,
  others: FlowBox[],
  axis: Axis,
  targets: number[],
  tolerance: number,
): SpacingBracket[] {
  if (targets.length === 0) return [];
  const context = spacingContext(moving, others, axis);
  if (!context) return [];
  const near = (gap: number, limit: number) => targets.some((target) => Math.abs(gap - target) <= limit);
  const brackets: SpacingBracket[] = [];
  for (const pair of context.existing) {
    if (!near(pair.gap, 0.05)) continue;
    const bracket = bracketBetween(pair, axis);
    if (bracket) brackets.push(bracket);
  }
  for (const pair of [context.before, context.after]) {
    if (!pair || !near(pair.gap, tolerance)) continue;
    const bracket = bracketBetween(pair, axis);
    if (bracket) brackets.push(bracket);
  }
  return brackets;
}

function sortBrackets(brackets: SpacingBracket[]) {
  return [...brackets].sort((a, b) => {
    if (a.orientation !== b.orientation) return a.orientation < b.orientation ? -1 : 1;
    return a.at - b.at || a.from - b.from || a.to - b.to;
  });
}

function snapDrag(
  nodes: Node[],
  changes: NodeChange[],
  active: Set<string>,
  primaryId: string,
  lock: AxisLock | null,
): AlignResult {
  const primary = nodes.find((node) => node.id === primaryId);
  const moving = primary ? proposedBox(primary, changes) : null;
  if (!primary || !moving) return { changes, guides: [], brackets: [] };

  const others = otherBoxes(nodes, active);
  // A locked axis stays on the start line. Guides still snap the free axis.
  const xSnap = lock === "vertical" ? null : bestSnap(moving, others, "x", ANCHORS, true);
  const ySnap = lock === "horizontal" ? null : bestSnap(moving, others, "y", ANCHORS, true);
  const alignDx = xSnap?.delta ?? 0;
  const alignDy = ySnap?.delta ?? 0;
  const aligned = { ...moving, x: moving.x + alignDx, y: moving.y + alignDy };
  // Alignment owns an axis it already rewrote. Spacing can still mark gaps that match.
  const xSpace = spacingSnap(aligned, others, "x", xSnap == null && lock !== "vertical");
  const ySpace = spacingSnap(
    { ...aligned, x: aligned.x + xSpace.delta },
    others,
    "y",
    ySnap == null && lock !== "horizontal",
  );
  const dx = alignDx + xSpace.delta;
  const dy = alignDy + ySpace.delta;
  const placed = { ...moving, x: moving.x + dx, y: moving.y + dy };
  const guides = [
    ...(xSnap ? guidesFor("x", placed, xSnap.matches) : []),
    ...(ySnap ? guidesFor("y", placed, ySnap.matches) : []),
  ];
  const brackets = sortBrackets([
    ...spacingBrackets(placed, others, "x", xSpace.targets, xSpace.tolerance),
    ...spacingBrackets(placed, others, "y", ySpace.targets, ySpace.tolerance),
  ]);
  return { changes: shiftDrag(changes, active, dx, dy), guides, brackets };
}

function movedSides(origin: FlowBox, next: FlowBox): Sides {
  return {
    left: Math.abs(next.x - origin.x) > 0.01,
    right: Math.abs(next.x + next.w - (origin.x + origin.w)) > 0.01,
    top: Math.abs(next.y - origin.y) > 0.01,
    bottom: Math.abs(next.y + next.h - (origin.y + origin.h)) > 0.01,
  };
}

function anchorsFor(startMoved: boolean, endMoved: boolean): Anchor[] {
  if (startMoved && endMoved) return ANCHORS;
  if (endMoved) return [1, 0.5];
  if (startMoved) return [0, 0.5];
  return [];
}

function applyResizeSnap(box: FlowBox, axis: Axis, anchor: Anchor, delta: number, sides: Sides): FlowBox | null {
  const next = { ...box };
  if (axis === "x") {
    const leftFixed = !sides.left;
    const rightFixed = !sides.right;
    if (leftFixed && !rightFixed) {
      next.w += anchor === 0.5 ? delta * 2 : delta;
    } else if (rightFixed && !leftFixed) {
      const shift = anchor === 0.5 ? delta * 2 : delta;
      next.x += shift;
      next.w -= shift;
    } else {
      next.x += delta;
    }
  } else {
    const topFixed = !sides.top;
    const bottomFixed = !sides.bottom;
    if (topFixed && !bottomFixed) {
      next.h += anchor === 0.5 ? delta * 2 : delta;
    } else if (bottomFixed && !topFixed) {
      const shift = anchor === 0.5 ? delta * 2 : delta;
      next.y += shift;
      next.h -= shift;
    } else {
      next.y += delta;
    }
  }
  if (!(next.w > 1) || !(next.h > 1)) return null;
  return next;
}

function lockAspect(box: FlowBox, origin: FlowBox, driven: Axis, aspect: number, sides: Sides): FlowBox | null {
  if (!(aspect > 0)) return box;
  if (driven === "x") {
    const h = box.w / aspect;
    let y = origin.y;
    if (sides.top && !sides.bottom) y = origin.y + origin.h - h;
    else if (sides.top && sides.bottom) y = origin.y + (origin.h - h) / 2;
    if (!(h > 1)) return null;
    return { ...box, y, h };
  }
  const w = box.h * aspect;
  let x = origin.x;
  if (sides.left && !sides.right) x = origin.x + origin.w - w;
  else if (sides.left && sides.right) x = origin.x + (origin.w - w) / 2;
  if (!(w > 1)) return null;
  return { ...box, x, w };
}

function writeBox(changes: NodeChange[], id: string, box: FlowBox, prev: FlowBox): NodeChange[] {
  let sawPosition = false;
  const next = changes.map((change) => {
    if (change.type === "add" || change.id !== id) return change;
    if (change.type === "position") {
      sawPosition = true;
      return { ...change, position: { x: box.x, y: box.y } };
    }
    if (change.type === "dimensions" && change.dimensions) {
      return {
        ...change,
        dimensions: { width: box.w, height: box.h },
      };
    }
    return change;
  });
  if (!sawPosition && (Math.abs(box.x - prev.x) > 0.01 || Math.abs(box.y - prev.y) > 0.01)) {
    next.push({ id, type: "position", position: { x: box.x, y: box.y } });
  }
  return next;
}

function resizingNode(node: Node | undefined) {
  return Boolean(node && (node as Node & { resizing?: boolean }).resizing);
}

function snapResize(
  nodes: Node[],
  changes: NodeChange[],
  id: string,
  resizeOrigins: Map<string, FlowBox>,
  snappedSizes: Map<string, { width: number; height: number }>,
): AlignResult {
  const node = nodes.find((item) => item.id === id);
  const prev = node ? nodeBox(node) : null;
  const next = node && prev ? proposedBox(node, changes) : null;
  if (!node || !prev || !next) return { changes, guides: [], brackets: [] };

  if (!resizingNode(node) || !resizeOrigins.has(id)) resizeOrigins.set(id, prev);
  const origin = resizeOrigins.get(id) ?? prev;
  const sides = movedSides(origin, next);
  const xAnchors = anchorsFor(sides.left, sides.right);
  const yAnchors = anchorsFor(sides.top, sides.bottom);
  const others = otherBoxes(nodes, new Set([id]));
  const aspect = node.type === "image" && origin.h > 0 ? origin.w / origin.h : null;

  let box = next;
  const guides: GuideLine[] = [];

  if (aspect) {
    const xSnap = xAnchors.length ? bestSnap(next, others, "x", xAnchors, false) : null;
    const ySnap = yAnchors.length ? bestSnap(next, others, "y", yAnchors, false) : null;
    const xAbs = xSnap ? Math.abs(xSnap.delta) : Number.POSITIVE_INFINITY;
    const yAbs = ySnap ? Math.abs(ySnap.delta) : Number.POSITIVE_INFINITY;
    if (xSnap && xAbs <= yAbs) {
      const snapped = applyResizeSnap(next, "x", xSnap.anchor, xSnap.delta, sides);
      const locked = snapped ? lockAspect(snapped, origin, "x", aspect, sides) : null;
      if (locked) {
        box = locked;
        guides.push(...guidesFor("x", box, xSnap.matches));
      }
    } else if (ySnap) {
      const snapped = applyResizeSnap(next, "y", ySnap.anchor, ySnap.delta, sides);
      const locked = snapped ? lockAspect(snapped, origin, "y", aspect, sides) : null;
      if (locked) {
        box = locked;
        guides.push(...guidesFor("y", box, ySnap.matches));
      }
    }
  } else {
    const xSnap = xAnchors.length ? bestSnap(next, others, "x", xAnchors, false) : null;
    if (xSnap) {
      const snapped = applyResizeSnap(box, "x", xSnap.anchor, xSnap.delta, sides);
      if (snapped) {
        box = snapped;
        guides.push(...guidesFor("x", box, xSnap.matches));
      }
    }
    const ySnap = yAnchors.length ? bestSnap(box, others, "y", yAnchors, false) : null;
    if (ySnap) {
      const snapped = applyResizeSnap(box, "y", ySnap.anchor, ySnap.delta, sides);
      if (snapped) {
        box = snapped;
        guides.push(...guidesFor("y", box, ySnap.matches));
      }
    }
  }

  snappedSizes.set(id, { width: box.w, height: box.h });
  const wrote = box === next ? changes : writeBox(changes, id, box, prev);
  return { changes: wrote, guides, brackets: [] };
}

function finishResize(
  changes: NodeChange[],
  resizeOrigins: Map<string, FlowBox>,
  snappedSizes: Map<string, { width: number; height: number }>,
): NodeChange[] {
  return changes.map((change) => {
    if (change.type !== "dimensions" || change.resizing !== false) return change;
    resizeOrigins.delete(change.id);
    const snapped = snappedSizes.get(change.id);
    // Keep the snapped size for this id. A second pass of this update still needs it,
    // and the next resize of the node overwrites the entry.
    if (!snapped) return change;
    // The resizer's pointer size is unsnapped. Keep the size already on screen.
    return {
      ...change,
      setAttributes: true,
      dimensions: { width: snapped.width, height: snapped.height },
    };
  });
}

export function sameGuides(a: GuideLine[], b: GuideLine[]) {
  if (a.length !== b.length) return false;
  return a.every((line, index) => {
    const other = b[index];
    return (
      line.orientation === other.orientation &&
      line.at === other.at &&
      line.from === other.from &&
      line.to === other.to
    );
  });
}

export function sameBrackets(a: SpacingBracket[], b: SpacingBracket[]) {
  if (a.length !== b.length) return false;
  return a.every((bracket, index) => {
    const other = b[index];
    return (
      bracket.orientation === other.orientation &&
      bracket.from === other.from &&
      bracket.to === other.to &&
      bracket.at === other.at
    );
  });
}

export function sameOverlay(a: GuideOverlay, b: GuideOverlay) {
  return sameGuides(a.lines, b.lines) && sameBrackets(a.brackets, b.brackets);
}

/**
 * Rewrites drag and resize changes so a moving node snaps to other nodes'
 * left/center/right and top/middle/bottom, and while dragging also to an equal
 * gap on its row or column. Guides and brackets are for an overlay; nothing
 * is added to the graph. Spacing is not applied while resizing.
 */
export function alignNodeChanges(
  nodes: Node[],
  changes: NodeChange[],
  dragNodeId: string | null,
  resizeOrigins: Map<string, FlowBox>,
  snappedSizes: Map<string, { width: number; height: number }>,
  constraint: DragAxisLock | null = null,
): AlignResult {
  const resizeChange = changes.find((change) => change.type === "dimensions" && change.resizing === true);
  if (resizeChange?.type === "dimensions") {
    return snapResize(nodes, changes, resizeChange.id, resizeOrigins, snappedSizes);
  }

  if (changes.some((change) => change.type === "dimensions" && change.resizing === false)) {
    return {
      changes: finishResize(changes, resizeOrigins, snappedSizes),
      guides: [],
      brackets: [],
    };
  }

  const draggingIds = changes.flatMap((change) =>
    change.type === "position" && change.dragging === true && change.position ? [change.id] : [],
  );
  if (draggingIds.length > 0) {
    const active = new Set(draggingIds);
    const primaryId = dragNodeId && active.has(dragNodeId) ? dragNodeId : draggingIds[0];
    const locked = withAxisLock(changes, active, primaryId, constraint);
    return snapDrag(nodes, locked.changes, active, locked.primaryId, locked.lock);
  }

  if (
    dragNodeId &&
    changes.some((change) => change.type === "position" && change.dragging === false && change.position)
  ) {
    const active = new Set(
      changes.flatMap((change) =>
        change.type === "position" && change.dragging === false && change.position ? [change.id] : [],
      ),
    );
    const primaryId = active.has(dragNodeId) ? dragNodeId : [...active][0];
    const locked = withAxisLock(changes, active, primaryId, constraint);
    const snapped = snapDrag(nodes, locked.changes, active, locked.primaryId, locked.lock);
    return { changes: snapped.changes, guides: [], brackets: [] };
  }

  return { changes, guides: null, brackets: null };
}

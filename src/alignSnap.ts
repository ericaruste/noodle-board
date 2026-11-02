import type { Node, NodeChange } from "@xyflow/react";

/**
 * Custom alignment snap. The xyflow helper-lines example is Pro-licensed;
 * this is a small local overlay and does not copy that source.
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

function snapDrag(nodes: Node[], changes: NodeChange[], active: Set<string>, primaryId: string): AlignResult {
  const primary = nodes.find((node) => node.id === primaryId);
  const moving = primary ? proposedBox(primary, changes) : null;
  if (!primary || !moving) return { changes, guides: [] };

  const others = otherBoxes(nodes, active);
  const xSnap = bestSnap(moving, others, "x", ANCHORS, true);
  const ySnap = bestSnap(moving, others, "y", ANCHORS, true);
  const dx = xSnap?.delta ?? 0;
  const dy = ySnap?.delta ?? 0;
  const snapped = { ...moving, x: moving.x + dx, y: moving.y + dy };
  const guides = [
    ...(xSnap ? guidesFor("x", snapped, xSnap.matches) : []),
    ...(ySnap ? guidesFor("y", snapped, ySnap.matches) : []),
  ];
  return { changes: shiftDrag(changes, active, dx, dy), guides };
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
  if (!node || !prev || !next) return { changes, guides: [] };

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
    const ySnap = yAnchors.length ? bestSnap(next, others, "y", yAnchors, false) : null;
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
  return { changes: wrote, guides };
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

/**
 * Rewrites drag and resize changes so a moving node snaps to other nodes'
 * left/center/right and top/middle/bottom. Guide lines are for an overlay;
 * nothing is added to the graph.
 */
export function alignNodeChanges(
  nodes: Node[],
  changes: NodeChange[],
  dragNodeId: string | null,
  resizeOrigins: Map<string, FlowBox>,
  snappedSizes: Map<string, { width: number; height: number }>,
): AlignResult {
  const resizeChange = changes.find((change) => change.type === "dimensions" && change.resizing === true);
  if (resizeChange?.type === "dimensions") {
    return snapResize(nodes, changes, resizeChange.id, resizeOrigins, snappedSizes);
  }

  if (changes.some((change) => change.type === "dimensions" && change.resizing === false)) {
    return {
      changes: finishResize(changes, resizeOrigins, snappedSizes),
      guides: [],
    };
  }

  const draggingIds = changes.flatMap((change) =>
    change.type === "position" && change.dragging === true && change.position ? [change.id] : [],
  );
  if (draggingIds.length > 0) {
    const active = new Set(draggingIds);
    const primaryId = dragNodeId && active.has(dragNodeId) ? dragNodeId : draggingIds[0];
    return snapDrag(nodes, changes, active, primaryId);
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
    const snapped = snapDrag(nodes, changes, active, primaryId);
    return { changes: snapped.changes, guides: [] };
  }

  return { changes, guides: null };
}

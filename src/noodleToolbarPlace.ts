/**
 * Screen-pixel placement for the noodle toolbar.
 * The gap is the empty space between the pill and the stroke, segment anchors, and end knobs.
 */

export const NOODLE_TOOLBAR_GAP = 16;

const STEP = 4;
/** How far a side may slide past the first touch before the path is treated as occupying that side. */
const EXTRA = 96;

export type ScreenPoint = { x: number; y: number };

export type ScreenRect = { left: number; top: number; right: number; bottom: number };

export type ToolbarObstacles = {
  segments: { a: ScreenPoint; b: ScreenPoint; radius: number }[];
  circles: { c: ScreenPoint; radius: number }[];
};

export type PlaceInput = {
  width: number;
  height: number;
  /** Point on the stroke the toolbar prefers to sit beside. */
  mid: ScreenPoint;
  obstacles: ToolbarObstacles;
  pane: ScreenRect;
  /** Regions the pill must stay outside, already padded by the caller. */
  blocked: ScreenRect[];
  /** Regions that reject a side when the pill would cover them. The gap is not measured to these. */
  avoid: ScreenRect[];
  gap: number;
  pad: number;
};

type Vec = { x: number; y: number };

const ABOVE: Vec = { x: 0, y: -1 };
const SIDES: Vec[] = [ABOVE, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];

function crossAxis(side: Vec): Vec {
  return { x: -side.y, y: side.x };
}

function boxAt(origin: ScreenPoint, side: Vec, t: number, width: number, height: number): ScreenRect {
  const cx = origin.x + side.x * t;
  const cy = origin.y + side.y * t;
  return {
    left: cx - width / 2,
    top: cy - height / 2,
    right: cx + width / 2,
    bottom: cy + height / 2,
  };
}

function halfExtent(side: Vec, width: number, height: number) {
  return Math.abs(side.x) * (width / 2) + Math.abs(side.y) * (height / 2);
}

function pointInRect(x: number, y: number, rect: ScreenRect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function cross(ax: number, ay: number, bx: number, by: number) {
  return ax * by - ay * bx;
}

function segmentsCross(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number) {
  const d1 = cross(bx - ax, by - ay, cx - ax, cy - ay);
  const d2 = cross(bx - ax, by - ay, dx - ax, dy - ay);
  const d3 = cross(dx - cx, dy - cy, ax - cx, ay - cy);
  const d4 = cross(dx - cx, dy - cy, bx - cx, by - cy);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function segmentHitsRect(ax: number, ay: number, bx: number, by: number, rect: ScreenRect) {
  if (pointInRect(ax, ay, rect) || pointInRect(bx, by, rect)) return true;
  const edges: [number, number, number, number][] = [
    [rect.left, rect.top, rect.right, rect.top],
    [rect.right, rect.top, rect.right, rect.bottom],
    [rect.right, rect.bottom, rect.left, rect.bottom],
    [rect.left, rect.bottom, rect.left, rect.top],
  ];
  return edges.some(([x1, y1, x2, y2]) => segmentsCross(ax, ay, bx, by, x1, y1, x2, y2));
}

function distPointToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 < 1e-6 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

function distPointToRect(px: number, py: number, rect: ScreenRect) {
  const dx = px < rect.left ? rect.left - px : px > rect.right ? px - rect.right : 0;
  const dy = py < rect.top ? rect.top - py : py > rect.bottom ? py - rect.bottom : 0;
  return Math.hypot(dx, dy);
}

function distSegToRect(a: ScreenPoint, b: ScreenPoint, rect: ScreenRect) {
  if (segmentHitsRect(a.x, a.y, b.x, b.y, rect)) return 0;
  let min = Math.min(distPointToRect(a.x, a.y, rect), distPointToRect(b.x, b.y, rect));
  const corners = [
    [rect.left, rect.top],
    [rect.right, rect.top],
    [rect.right, rect.bottom],
    [rect.left, rect.bottom],
  ];
  for (const [x, y] of corners) min = Math.min(min, distPointToSeg(x, y, a.x, a.y, b.x, b.y));
  return min;
}

function clearance(rect: ScreenRect, input: PlaceInput) {
  let min = Infinity;
  for (const seg of input.obstacles.segments) {
    min = Math.min(min, distSegToRect(seg.a, seg.b, rect) - seg.radius);
  }
  for (const circle of input.obstacles.circles) {
    min = Math.min(min, distPointToRect(circle.c.x, circle.c.y, rect) - circle.radius);
  }
  return min;
}

function rectsOverlap(a: ScreenRect, b: ScreenRect) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function expand(rect: ScreenRect, pad: number): ScreenRect {
  return { left: rect.left - pad, top: rect.top - pad, right: rect.right + pad, bottom: rect.bottom + pad };
}

function paneCorrection(rect: ScreenRect, pane: ScreenRect, pad: number) {
  let x = 0;
  let y = 0;
  if (rect.left < pane.left + pad) x = pane.left + pad - rect.left;
  else if (rect.right > pane.right - pad) x = pane.right - pad - rect.right;
  if (rect.top < pane.top + pad) y = pane.top + pad - rect.top;
  else if (rect.bottom > pane.bottom - pad) y = pane.bottom - pad - rect.bottom;
  return { x, y };
}

function fits(rect: ScreenRect, input: PlaceInput) {
  const correction = paneCorrection(rect, input.pane, input.pad);
  if (Math.abs(correction.x) > 0.5 || Math.abs(correction.y) > 0.5) return false;
  if (input.blocked.some((block) => rectsOverlap(rect, expand(block, input.pad)))) return false;
  if (input.avoid.some((keep) => rectsOverlap(rect, keep))) return false;
  return clearance(rect, input) >= input.gap - 0.5;
}

function tightBox(input: PlaceInput, side: Vec, crossShift: number, extra: number): ScreenRect | null {
  const touch = halfExtent(side, input.width, input.height);
  const cap = touch + extra;
  const axis = crossAxis(side);
  const origin = {
    x: input.mid.x + axis.x * crossShift,
    y: input.mid.y + axis.y * crossShift,
  };
  let prev = touch;
  for (let t = touch; t <= cap + 0.01; t += STEP) {
    const rect = boxAt(origin, side, t, input.width, input.height);
    if (clearance(rect, input) < input.gap) {
      prev = t;
      continue;
    }
    let lo = prev;
    let hi = t;
    for (let i = 0; i < 10; i += 1) {
      const midT = (lo + hi) / 2;
      if (clearance(boxAt(origin, side, midT, input.width, input.height), input) >= input.gap) hi = midT;
      else lo = midT;
    }
    return boxAt(origin, side, hi, input.width, input.height);
  }
  return null;
}

function crossExtentFits(rect: ScreenRect, input: PlaceInput, side: Vec) {
  if (Math.abs(side.y) === 1) {
    return rect.right - rect.left <= input.pane.right - input.pane.left - input.pad * 2 + 1;
  }
  return rect.bottom - rect.top <= input.pane.bottom - input.pane.top - input.pad * 2 + 1;
}

function crossPositions(input: PlaceInput, side: Vec) {
  const horizontal = Math.abs(side.y) === 1;
  const extent = horizontal ? input.width : input.height;
  const origin = horizontal ? input.mid.x : input.mid.y;
  const paneStart = (horizontal ? input.pane.left : input.pane.top) + input.pad;
  const paneEnd = (horizontal ? input.pane.right : input.pane.bottom) - input.pad;
  const shifts = [0, paneStart + extent / 2 - origin, paneEnd - extent / 2 - origin];
  for (const block of input.blocked) {
    const expanded = expand(block, input.pad);
    const blockStart = horizontal ? expanded.left : expanded.top;
    const blockEnd = horizontal ? expanded.right : expanded.bottom;
    shifts.push(blockStart - extent / 2 - origin, blockEnd + extent / 2 - origin);
  }
  return shifts;
}

function placeOnSide(input: PlaceInput, side: Vec, extra = EXTRA): ScreenRect | null {
  let best: ScreenRect | null = null;
  let bestDist = Infinity;
  for (const shift of crossPositions(input, side)) {
    const rect = tightBox(input, side, shift, extra);
    if (!rect || !crossExtentFits(rect, input, side) || !fits(rect, input)) continue;
    const correction = paneCorrection(rect, input.pane, input.pad);
    const along = correction.x * side.x + correction.y * side.y;
    // Sliding back along this side would lay the pill on the arrow.
    if (along < -0.5) continue;
    if (Math.abs(shift) < bestDist) {
      best = rect;
      bestDist = Math.abs(shift);
    }
  }
  return best;
}

function insidePane(rect: ScreenRect, input: PlaceInput) {
  const correction = paneCorrection(rect, input.pane, input.pad);
  return Math.abs(correction.x) <= 0.5 && Math.abs(correction.y) <= 0.5;
}

function missesChrome(rect: ScreenRect, input: PlaceInput) {
  if (input.blocked.some((block) => rectsOverlap(rect, expand(block, input.pad)))) return false;
  if (input.avoid.some((keep) => rectsOverlap(rect, keep))) return false;
  return true;
}

function fallback(input: PlaceInput): ScreenRect {
  for (const extra of [480, 2400]) {
    for (const side of SIDES) {
      const placed = placeOnSide(input, side, extra);
      if (placed) return placed;
    }
  }
  for (const side of SIDES) {
    const placed = placeOnSide({ ...input, gap: 0 }, side, 2400);
    if (placed) return placed;
  }
  let best: ScreenRect | null = null;
  let bestClear = -Infinity;
  for (const side of SIDES) {
    for (const shift of crossPositions(input, side)) {
      const rect = tightBox(input, side, shift, 2400);
      if (!rect || !insidePane(rect, input) || !missesChrome(rect, input)) continue;
      const score = clearance(rect, input);
      if (score > bestClear) {
        best = rect;
        bestClear = score;
      }
    }
  }
  if (best) return best;
  const below = { x: 0, y: 1 };
  const parked = tightBox({ ...input, gap: 0 }, below, 0, 2400);
  if (parked && missesChrome(parked, input)) return parked;
  return boxAt(input.mid, below, halfExtent(below, input.width, input.height) + input.gap, input.width, input.height);
}

/** Top-left of the toolbar box, in the same screen space as `mid` and `pane`. */
export function placeNoodleToolbar(input: PlaceInput): ScreenRect {
  for (const side of SIDES) {
    const placed = placeOnSide(input, side);
    if (placed) return placed;
  }
  return fallback(input);
}

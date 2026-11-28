export type FlowBox = { x: number; y: number; width: number; height: number };

export type Point = { x: number; y: number };

export const RESIZE_HANDLES = [
  "top-left",
  "top",
  "top-right",
  "right",
  "bottom-right",
  "bottom",
  "bottom-left",
  "left",
] as const;

export type ResizeHandle = (typeof RESIZE_HANDLES)[number];

type Dir = {
  affectsX: boolean;
  affectsY: boolean;
  horizontal: boolean;
  vertical: boolean;
};

const DIRS: Record<ResizeHandle, Dir> = {
  "top-left": { affectsX: true, affectsY: true, horizontal: true, vertical: true },
  top: { affectsX: false, affectsY: true, horizontal: false, vertical: true },
  "top-right": { affectsX: false, affectsY: true, horizontal: true, vertical: true },
  right: { affectsX: false, affectsY: false, horizontal: true, vertical: false },
  "bottom-right": { affectsX: false, affectsY: false, horizontal: true, vertical: true },
  bottom: { affectsX: false, affectsY: false, horizontal: false, vertical: true },
  "bottom-left": { affectsX: true, affectsY: false, horizontal: true, vertical: true },
  left: { affectsX: true, affectsY: false, horizontal: true, vertical: false },
};

export function resizeHandleDir(handle: ResizeHandle) {
  return DIRS[handle];
}

function clampDist(dist: number, next: number, min: number) {
  if (next >= min) return dist;
  const clamp = min - next;
  return dist + (dist < 0 ? clamp : -clamp);
}

/** One element's box after a handle drag. Shift keeps the ratio from `start`. */
export function resizeNodeBox(
  start: FlowBox,
  startPointer: Point,
  handle: ResizeHandle,
  pointer: Point,
  shift: boolean,
  minWidth: number,
  minHeight: number,
): FlowBox {
  const dir = DIRS[handle];
  const aspect = start.height > 0 ? start.width / start.height : 1;
  let distX = dir.horizontal ? pointer.x - startPointer.x : 0;
  let distY = dir.vertical ? pointer.y - startPointer.y : 0;
  let affectsX = dir.affectsX;
  let affectsY = dir.affectsY;

  if (dir.horizontal) {
    const width = start.width + (affectsX ? -distX : distX);
    distX = clampDist(distX, width, minWidth);
  }
  if (dir.vertical) {
    const height = start.height + (affectsY ? -distY : distY);
    distY = clampDist(distY, height, minHeight);
  }

  if (shift && aspect > 0) {
    if (dir.horizontal && dir.vertical) {
      const width = start.width + (affectsX ? -distX : distX);
      const height = start.height + (affectsY ? -distY : distY);
      if (width >= height * aspect) distY = (affectsX !== affectsY ? -distX : distX) / aspect;
      else distX = (affectsX !== affectsY ? -distY : distY) * aspect;
    } else if (dir.horizontal) {
      distY = distX / aspect;
      affectsY = affectsX;
    } else {
      distX = distY * aspect;
      affectsX = affectsY;
    }
  }

  let width = start.width + (affectsX ? -distX : distX);
  let height = start.height + (affectsY ? -distY : distY);
  const minScale = Math.max(
    start.width > 0 ? minWidth / start.width : 1,
    start.height > 0 ? minHeight / start.height : 1,
    0.02,
  );
  if (shift && start.width > 0 && width / start.width < minScale) {
    return aspectBox(start, dir, minScale);
  }
  if (!shift) {
    if (width < minWidth) {
      distX = affectsX ? start.width - minWidth : minWidth - start.width;
      width = minWidth;
    }
    if (height < minHeight) {
      distY = affectsY ? start.height - minHeight : minHeight - start.height;
      height = minHeight;
    }
  }
  return {
    x: affectsX ? start.x + distX : start.x,
    y: affectsY ? start.y + distY : start.y,
    width,
    height,
  };
}

function aspectBox(start: FlowBox, dir: Dir, scale: number): FlowBox {
  const width = start.width * scale;
  const height = start.height * scale;
  let lockLeft = !dir.affectsX;
  let lockTop = !dir.affectsY;
  if (dir.horizontal && !dir.vertical) {
    lockLeft = !dir.affectsX;
    lockTop = !dir.affectsX;
  } else if (dir.vertical && !dir.horizontal) {
    lockLeft = !dir.affectsY;
    lockTop = !dir.affectsY;
  }
  return {
    x: lockLeft ? start.x : start.x + start.width - width,
    y: lockTop ? start.y : start.y + start.height - height,
    width,
    height,
  };
}

export function scalePoint(point: Point, anchor: Point, sx: number, sy: number): Point {
  return {
    x: anchor.x + (point.x - anchor.x) * sx,
    y: anchor.y + (point.y - anchor.y) * sy,
  };
}

export function scaleBox(box: FlowBox, anchor: Point, sx: number, sy: number): FlowBox {
  const x1 = anchor.x + (box.x - anchor.x) * sx;
  const y1 = anchor.y + (box.y - anchor.y) * sy;
  const x2 = anchor.x + (box.x + box.width - anchor.x) * sx;
  const y2 = anchor.y + (box.y + box.height - anchor.y) * sy;
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}

/**
 * Group-box scale about the opposite corner, or about the midpoint of the
 * opposite edge when Shift locks the box ratio from an edge handle.
 */
export function groupScale(
  start: FlowBox,
  handle: ResizeHandle,
  pointer: Point,
  shift: boolean,
  floorX: number,
  floorY: number,
): { anchor: Point; sx: number; sy: number; box: FlowBox } {
  const dir = DIRS[handle];
  const right = start.x + start.width;
  const bottom = start.y + start.height;
  const width = Math.max(start.width, 1);
  const height = Math.max(start.height, 1);
  let sx = 1;
  let sy = 1;
  if (dir.horizontal) sx = dir.affectsX ? (right - pointer.x) / width : (pointer.x - start.x) / width;
  if (dir.vertical) sy = dir.affectsY ? (bottom - pointer.y) / height : (pointer.y - start.y) / height;

  const corner = dir.horizontal && dir.vertical;
  let anchor: Point;
  if (shift && !corner && dir.horizontal) {
    anchor = { x: dir.affectsX ? right : start.x, y: start.y + start.height / 2 };
  } else if (shift && !corner && dir.vertical) {
    anchor = { x: start.x + start.width / 2, y: dir.affectsY ? bottom : start.y };
  } else {
    anchor = { x: dir.affectsX ? right : start.x, y: dir.affectsY ? bottom : start.y };
  }

  if (shift) {
    const raw = corner ? Math.max(sx, sy) : dir.horizontal ? sx : sy;
    const scale = Math.max(raw, floorX, floorY, 0.02);
    sx = scale;
    sy = scale;
  } else {
    if (dir.horizontal) sx = Math.max(sx, floorX, 0.02);
    else sx = 1;
    if (dir.vertical) sy = Math.max(sy, floorY, 0.02);
    else sy = 1;
  }

  return { anchor, sx, sy, box: scaleBox(start, anchor, sx, sy) };
}

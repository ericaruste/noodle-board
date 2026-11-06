export type ChromeSide = "above" | "below";

export type ChromeSlot = {
  id: string;
  side: ChromeSide;
  order: number;
  width: number;
  height: number;
};

export type ChromeRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ChromeViewport = {
  top: number;
  left: number;
  right: number;
  bottom: number;
};

const STACK_GAP = 6;

function byOrder(a: ChromeSlot, b: ChromeSlot) {
  return a.order - b.order || a.id.localeCompare(b.id);
}

function stackHeight(items: ChromeSlot[]) {
  return items.reduce((sum, item, index) => sum + item.height + (index > 0 ? STACK_GAP : 0), 0);
}

/** Intersection of the element and the safe area. Null when the element misses that area. */
function onScreenSpan(node: ChromeRect, viewport: ChromeViewport): ChromeRect | null {
  const left = Math.max(node.left, viewport.left);
  const right = Math.min(node.left + node.width, viewport.right);
  const top = Math.max(node.top, viewport.top);
  const bottom = Math.min(node.top + node.height, viewport.bottom);
  if (right - left <= 0.5 || bottom - top <= 0.5) return null;
  return { left, top, width: right - left, height: bottom - top };
}

function edgeInside(edge: number, viewport: ChromeViewport) {
  return edge >= viewport.top - 0.5 && edge <= viewport.bottom + 0.5;
}

function leftFor(center: number, width: number, viewport: ChromeViewport) {
  const room = viewport.right - viewport.left;
  if (!(room > 0) || width >= room) return viewport.left;
  return Math.min(Math.max(center - width / 2, viewport.left), viewport.right - width);
}

/** `closestAtBottom` puts order 0 at the bottom of the stack, nearer the object. */
function placeStack(
  placed: Map<string, { left: number; top: number }>,
  items: ChromeSlot[],
  top: number,
  center: number,
  viewport: ChromeViewport,
  closestAtBottom: boolean,
) {
  if (items.length === 0) return;
  if (closestAtBottom) {
    let cursor = top + stackHeight(items);
    for (const slot of items) {
      cursor -= slot.height;
      placed.set(slot.id, { left: leftFor(center, slot.width, viewport), top: cursor });
      cursor -= STACK_GAP;
    }
    return;
  }
  let cursor = top;
  for (const slot of items) {
    placed.set(slot.id, { left: leftFor(center, slot.width, viewport), top: cursor });
    cursor += slot.height + STACK_GAP;
  }
}

/**
 * Screen-space stacks for a selected element.
 * The text stack stays above and the color stack stays below.
 * A visible edge keeps that bar outside the element, clear of the ports.
 * An edge past the safe area pins the bar on the on-screen part of the element.
 * Each bar centers on that span. Overlap with the main toolbar is handled by the
 * safe area, not by sliding the bar to the side of the pill or the minimap.
 */
export function placeSelectionChrome(
  node: ChromeRect,
  viewport: ChromeViewport,
  slots: ChromeSlot[],
  clearance: number,
): Map<string, { left: number; top: number }> {
  const above = slots.filter((slot) => slot.side === "above" && slot.height > 0).sort(byOrder);
  const below = slots.filter((slot) => slot.side === "below" && slot.height > 0).sort(byOrder);
  const span = onScreenSpan(node, viewport);
  const center = span ? span.left + span.width / 2 : node.left + node.width / 2;
  const nodeBottom = node.top + node.height;
  const topVisible = span != null && edgeInside(node.top, viewport);
  const bottomVisible = span != null && edgeInside(nodeBottom, viewport);
  const aboveH = stackHeight(above);
  const belowH = stackHeight(below);

  let aboveTop = topVisible ? node.top - clearance - aboveH : (span?.top ?? node.top - clearance - aboveH);
  let belowTop = bottomVisible ? nodeBottom + clearance : span ? span.top + span.height - belowH : nodeBottom + clearance;

  const room = viewport.bottom - viewport.top;
  if (above.length > 0) {
    if (aboveH <= room) aboveTop = Math.min(Math.max(aboveTop, viewport.top), viewport.bottom - aboveH);
    else if (aboveTop < viewport.top) aboveTop = viewport.top;
  }
  if (below.length > 0) {
    if (belowH <= room) belowTop = Math.min(Math.max(belowTop, viewport.top), viewport.bottom - belowH);
    else if (belowTop < viewport.top) belowTop = viewport.top;
  }

  if (above.length > 0 && below.length > 0 && belowTop < aboveTop + aboveH) {
    const bothPinned = !topVisible && !bottomVisible && span != null;
    if (bothPinned) {
      // The pins would overlap. Text keeps the top. Color sits beneath it, even when
      // the pair is taller than the safe area and the color bar meets the main toolbar.
      const gap = Math.max(0, Math.min(STACK_GAP, room - aboveH - belowH));
      aboveTop = viewport.top;
      belowTop = aboveTop + aboveH + gap;
    } else if (aboveTop + aboveH + STACK_GAP + belowH <= viewport.bottom && aboveTop >= viewport.top) {
      belowTop = aboveTop + aboveH + STACK_GAP;
    } else if (belowH <= room) {
      belowTop = viewport.bottom - belowH;
      aboveTop = Math.max(viewport.top, Math.min(aboveTop, belowTop - aboveH));
    }
  }

  const placed = new Map<string, { left: number; top: number }>();
  placeStack(placed, above, aboveTop, center, viewport, true);
  placeStack(placed, below, belowTop, center, viewport, false);
  return placed;
}

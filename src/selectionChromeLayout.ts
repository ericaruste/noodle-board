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

function overflow(height: number, space: number) {
  return Math.max(0, height - space - 0.5);
}

function intersects(a: ChromeRect, b: ChromeRect) {
  return a.left < b.left + b.width && a.left + a.width > b.left && a.top < b.top + b.height && a.top + a.height > b.top;
}

function placeLeft(node: ChromeRect, viewport: ChromeViewport, width: number) {
  const room = viewport.right - viewport.left;
  if (width >= room) return viewport.left;
  const centered = node.left + node.width / 2 - width / 2;
  return Math.min(Math.max(centered, viewport.left), viewport.right - width);
}

function shiftIntoView(
  placed: Map<string, { left: number; top: number }>,
  ids: string[],
  slots: ChromeSlot[],
  viewport: ChromeViewport,
) {
  if (ids.length === 0) return;
  let minTop = Infinity;
  let maxBottom = -Infinity;
  for (const id of ids) {
    const pos = placed.get(id);
    const slot = slots.find((item) => item.id === id);
    if (!pos || !slot) continue;
    minTop = Math.min(minTop, pos.top);
    maxBottom = Math.max(maxBottom, pos.top + slot.height);
  }
  if (!Number.isFinite(minTop)) return;
  let shift = 0;
  if (minTop < viewport.top) shift = viewport.top - minTop;
  if (maxBottom + shift > viewport.bottom) shift -= maxBottom + shift - viewport.bottom;
  if (minTop + shift < viewport.top) shift = viewport.top - minTop;
  if (shift === 0) return;
  for (const id of ids) {
    const pos = placed.get(id);
    if (!pos) continue;
    placed.set(id, { left: pos.left, top: pos.top + shift });
  }
}

function avoidObstacles(
  placed: Map<string, { left: number; top: number }>,
  slots: ChromeSlot[],
  viewport: ChromeViewport,
  obstacles: ChromeRect[],
) {
  for (const slot of slots) {
    const pos = placed.get(slot.id);
    if (!pos) continue;
    let left = pos.left;
    let top = pos.top;
    for (const obstacle of obstacles) {
      const current = { left, top, width: slot.width, height: slot.height };
      if (!intersects(current, obstacle)) continue;
      const candidates = [
        { left: obstacle.left - slot.width - STACK_GAP, top },
        { left: obstacle.left + obstacle.width + STACK_GAP, top },
        { left, top: obstacle.top - slot.height - STACK_GAP },
        { left, top: obstacle.top + obstacle.height + STACK_GAP },
      ];
      const fits = (candidate: { left: number; top: number }) => {
        const box = { ...candidate, width: slot.width, height: slot.height };
        if (box.left < viewport.left - 0.5 || box.top < viewport.top - 0.5) return false;
        if (box.left + box.width > viewport.right + 0.5 || box.top + box.height > viewport.bottom + 0.5) return false;
        if (obstacles.some((item) => intersects(box, item))) return false;
        for (const [id, other] of placed) {
          if (id === slot.id) continue;
          const sibling = slots.find((item) => item.id === id);
          if (!sibling) continue;
          if (intersects(box, { left: other.left, top: other.top, width: sibling.width, height: sibling.height })) {
            return false;
          }
        }
        return true;
      };
      const next = candidates.find(fits);
      if (!next) continue;
      left = next.left;
      top = next.top;
      placed.set(slot.id, { left, top });
    }
    placed.set(slot.id, clampIntoView({ left, top }, slot, viewport));
  }
}

function clampIntoView(
  pos: { left: number; top: number },
  slot: ChromeSlot,
  viewport: ChromeViewport,
) {
  const roomW = viewport.right - viewport.left;
  const roomH = viewport.bottom - viewport.top;
  const left = slot.width >= roomW ? viewport.left : Math.min(Math.max(pos.left, viewport.left), viewport.right - slot.width);
  const top = slot.height >= roomH ? viewport.top : Math.min(Math.max(pos.top, viewport.top), viewport.bottom - slot.height);
  return { left, top };
}

/** Screen-space stack above or below a node. Preferred sides win when they fit. */
export function placeSelectionChrome(
  node: ChromeRect,
  viewport: ChromeViewport,
  slots: ChromeSlot[],
  clearance: number,
  obstacles: ChromeRect[] = [],
): Map<string, { left: number; top: number }> {
  const above = slots.filter((slot) => slot.side === "above" && slot.height > 0).sort(byOrder);
  const below = slots.filter((slot) => slot.side === "below" && slot.height > 0).sort(byOrder);
  const spaceAbove = node.top - clearance - viewport.top;
  const spaceBelow = viewport.bottom - (node.top + node.height + clearance);

  const candidates = [
    { top: above, bottom: below },
    { top: [] as ChromeSlot[], bottom: [...below, ...above] },
    { top: [...above, ...below], bottom: [] as ChromeSlot[] },
  ];

  const score = (top: ChromeSlot[], bottom: ChromeSlot[]) => {
    const misplaced = top.filter((slot) => slot.side === "below").length + bottom.filter((slot) => slot.side === "above").length;
    return overflow(stackHeight(top), spaceAbove) + overflow(stackHeight(bottom), spaceBelow) + misplaced * 0.01;
  };

  let best = candidates[0];
  let bestScore = score(best.top, best.bottom);
  for (const candidate of candidates.slice(1)) {
    const next = score(candidate.top, candidate.bottom);
    if (next < bestScore) {
      best = candidate;
      bestScore = next;
    }
  }

  const placed = new Map<string, { left: number; top: number }>();
  let cursor = node.top - clearance;
  for (const slot of best.top) {
    cursor -= slot.height;
    placed.set(slot.id, { left: placeLeft(node, viewport, slot.width), top: cursor });
    cursor -= STACK_GAP;
  }

  cursor = node.top + node.height + clearance;
  for (const slot of best.bottom) {
    placed.set(slot.id, { left: placeLeft(node, viewport, slot.width), top: cursor });
    cursor += slot.height + STACK_GAP;
  }

  shiftIntoView(
    placed,
    best.top.map((slot) => slot.id),
    slots,
    viewport,
  );
  shiftIntoView(
    placed,
    best.bottom.map((slot) => slot.id),
    slots,
    viewport,
  );
  avoidObstacles(placed, [...best.top, ...best.bottom], viewport, obstacles);
  return placed;
}

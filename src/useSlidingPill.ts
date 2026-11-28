import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

export type SlidingPillBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SlidingPill = {
  box: SlidingPillBox | null;
  /** The control under the pointer or focus. Null hides the pill. */
  active: HTMLElement | null;
};

/** A control the pill should cover. `skip` hides the pill, the same as a disabled button. */
export const PILL_TARGET_ATTR = "data-pill-target";
const PILL_TARGET = `[${PILL_TARGET_ATTR}]`;
const PILL_TARGET_SKIP = "skip";

function boxFor(row: HTMLElement, target: HTMLElement): SlidingPillBox {
  const rowBox = row.getBoundingClientRect();
  const targetBox = target.getBoundingClientRect();
  // The floating layer is not scaled. A scaled ancestor would make viewport pixels
  // disagree with the row's local box, so only then convert.
  const scaleX = row.offsetWidth > 0 ? rowBox.width / row.offsetWidth : 1;
  const scaleY = row.offsetHeight > 0 ? rowBox.height / row.offsetHeight : 1;
  const scaled = Math.abs(scaleX - 1) > 0.01 || Math.abs(scaleY - 1) > 0.01;
  const sx = scaled ? scaleX : 1;
  const sy = scaled ? scaleY : 1;
  return {
    x: (targetBox.left - rowBox.left) / sx,
    y: (targetBox.top - rowBox.top) / sy,
    width: targetBox.width / sx,
    height: targetBox.height / sy,
  };
}

function skipsPill(node: HTMLElement): boolean {
  if (node.getAttribute(PILL_TARGET_ATTR) === PILL_TARGET_SKIP) return true;
  return node instanceof HTMLButtonElement && node.disabled;
}

function containsPoint(node: HTMLElement, x: number, y: number): boolean {
  const box = node.getBoundingClientRect();
  return x >= box.left && x < box.right && y >= box.top && y < box.bottom;
}

/** A marked group wins over the chevron inside it. Hit-testing uses viewport boxes. offsetLeft is wrong inside a relative tip. */
function targetUnder(row: HTMLElement, x: number, y: number): HTMLElement | null {
  for (const node of row.querySelectorAll(PILL_TARGET)) {
    if (node instanceof HTMLElement && containsPoint(node, x, y)) return node;
  }
  for (const node of row.querySelectorAll("button")) {
    if (!(node instanceof HTMLButtonElement)) continue;
    if (node.closest(PILL_TARGET)) continue;
    if (containsPoint(node, x, y)) return node;
  }
  return null;
}

export function useSlidingPill(rowRef: RefObject<HTMLElement | null>): SlidingPill {
  const [pill, setPill] = useState<SlidingPill>({ box: null, active: null });
  const [row, setRow] = useState<HTMLElement | null>(null);
  const visibleRef = useRef(false);
  const activeRef = useRef<HTMLElement | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);

  // The toolbar row is portaled, so the ref is empty on the first effect.
  useLayoutEffect(() => {
    const node = rowRef.current;
    setRow((current) => (current === node ? current : node));
  });

  useEffect(() => {
    if (!row) return;

    const show = (target: HTMLElement) => {
      if (visibleRef.current && activeRef.current === target) return;
      activeRef.current = target;
      visibleRef.current = true;
      setPill({ box: boxFor(row, target), active: target });
    };

    const hide = () => {
      if (!visibleRef.current) return;
      visibleRef.current = false;
      activeRef.current = null;
      setPill((current) => ({ box: current.box, active: null }));
    };

    const placeFromPoint = (x: number, y: number) => {
      pointerRef.current = { x, y };
      const target = targetUnder(row, x, y);
      // A gap between tools keeps the current pill. Leaving the row is what fades it.
      if (!target) return;
      if (skipsPill(target)) {
        hide();
        return;
      }
      show(target);
    };

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const marked = target.closest(PILL_TARGET);
      const control =
        marked instanceof HTMLElement && row.contains(marked)
          ? marked
          : target.closest("button");
      if (!(control instanceof HTMLElement) || !row.contains(control)) return;
      if (skipsPill(control)) {
        hide();
        return;
      }
      show(control);
    };

    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (next instanceof Node && row.contains(next)) return;
      const point = pointerRef.current;
      if (row.matches(":hover") && point) {
        const target = targetUnder(row, point.x, point.y);
        if (target && !skipsPill(target)) {
          show(target);
          return;
        }
      }
      hide();
    };

    const remeasure = () => {
      const point = pointerRef.current;
      if (row.matches(":hover") && point) {
        const under = targetUnder(row, point.x, point.y);
        if (!under || skipsPill(under)) {
          if (visibleRef.current) hide();
          return;
        }
        if (!visibleRef.current || activeRef.current !== under) {
          show(under);
          return;
        }
      }
      const target = activeRef.current;
      if (!target || !visibleRef.current || !row.contains(target) || skipsPill(target)) {
        if (target && skipsPill(target) && visibleRef.current) hide();
        return;
      }
      const box = boxFor(row, target);
      setPill((current) => {
        if (
          current.box &&
          current.box.x === box.x &&
          current.box.y === box.y &&
          current.box.width === box.width &&
          current.box.height === box.height &&
          current.active === target
        ) {
          return current;
        }
        return { box, active: target };
      });
    };

    const observer = new ResizeObserver(remeasure);
    observer.observe(row);
    const disabled = new MutationObserver(remeasure);
    disabled.observe(row, {
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled", PILL_TARGET_ATTR],
    });
    window.addEventListener("resize", remeasure);
    const onPointer = (event: PointerEvent) => placeFromPoint(event.clientX, event.clientY);
    row.addEventListener("pointermove", onPointer);
    row.addEventListener("pointerenter", onPointer);
    // The reference clears the pill on mouseleave, including while a button stays focused.
    row.addEventListener("pointerleave", hide);
    row.addEventListener("focusin", onFocusIn);
    row.addEventListener("focusout", onFocusOut);
    return () => {
      visibleRef.current = false;
      activeRef.current = null;
      observer.disconnect();
      disabled.disconnect();
      window.removeEventListener("resize", remeasure);
      row.removeEventListener("pointermove", onPointer);
      row.removeEventListener("pointerenter", onPointer);
      row.removeEventListener("pointerleave", hide);
      row.removeEventListener("focusin", onFocusIn);
      row.removeEventListener("focusout", onFocusOut);
    };
  }, [row]);

  return pill;
}

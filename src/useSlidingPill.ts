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

function boxFor(row: HTMLElement, button: HTMLElement): SlidingPillBox {
  const rowBox = row.getBoundingClientRect();
  const buttonBox = button.getBoundingClientRect();
  return {
    x: buttonBox.left - rowBox.left,
    y: buttonBox.top - rowBox.top,
    width: buttonBox.width,
    height: buttonBox.height,
  };
}

/** Hit-test the row. A disabled button is not a target, and offsetLeft is wrong inside a relative tip. */
function buttonUnder(row: HTMLElement, x: number, y: number): HTMLButtonElement | null {
  for (const node of row.querySelectorAll("button")) {
    if (!(node instanceof HTMLButtonElement)) continue;
    const box = node.getBoundingClientRect();
    if (x >= box.left && x < box.right && y >= box.top && y < box.bottom) return node;
  }
  return null;
}

export function useSlidingPill(rowRef: RefObject<HTMLElement | null>): SlidingPill {
  const [pill, setPill] = useState<SlidingPill>({ box: null, active: null });
  const [row, setRow] = useState<HTMLElement | null>(null);
  const visibleRef = useRef(false);
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);

  // The toolbar row is portaled, so the ref is empty on the first effect.
  useLayoutEffect(() => {
    const node = rowRef.current;
    setRow((current) => (current === node ? current : node));
  });

  useEffect(() => {
    if (!row) return;

    const show = (button: HTMLButtonElement) => {
      if (visibleRef.current && activeRef.current === button) return;
      activeRef.current = button;
      visibleRef.current = true;
      setPill({ box: boxFor(row, button), active: button });
    };

    const hide = () => {
      if (!visibleRef.current) return;
      visibleRef.current = false;
      activeRef.current = null;
      setPill((current) => ({ box: current.box, active: null }));
    };

    const placeFromPoint = (x: number, y: number) => {
      pointerRef.current = { x, y };
      const button = buttonUnder(row, x, y);
      // A gap between tools keeps the current pill. Leaving the row is what fades it.
      if (!button) return;
      if (button.disabled) {
        hide();
        return;
      }
      show(button);
    };

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest("button");
      if (!(button instanceof HTMLButtonElement) || !row.contains(button)) return;
      if (button.disabled) {
        hide();
        return;
      }
      show(button);
    };

    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (next instanceof Node && row.contains(next)) return;
      const point = pointerRef.current;
      if (row.matches(":hover") && point) {
        const button = buttonUnder(row, point.x, point.y);
        if (button && !button.disabled) {
          show(button);
          return;
        }
      }
      hide();
    };

    const remeasure = () => {
      const button = activeRef.current;
      if (!button || !visibleRef.current || !row.contains(button)) return;
      const box = boxFor(row, button);
      setPill((current) => {
        if (
          current.box &&
          current.box.x === box.x &&
          current.box.y === box.y &&
          current.box.width === box.width &&
          current.box.height === box.height &&
          current.active === button
        ) {
          return current;
        }
        return { box, active: button };
      });
    };

    const observer = new ResizeObserver(remeasure);
    observer.observe(row);
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

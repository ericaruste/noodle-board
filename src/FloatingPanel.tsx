import {
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type AriaRole,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
  type WheelEvent,
} from "react";
import { createPortal } from "react-dom";
import { layers } from "./layers";

export type FloatingLayerName = "toolbar" | "dropdown";

type SlotName = FloatingLayerName | "modal";

const slots = new Map<SlotName, HTMLElement>();
const listeners = new Set<() => void>();
let slotVersion = 0;

function emitSlots() {
  slotVersion += 1;
  for (const listener of listeners) listener();
}

function subscribeSlots(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function slotVersionNow() {
  return slotVersion;
}

export function floatingSlot(name: SlotName) {
  return slots.get(name) ?? null;
}

function registerSlot(name: SlotName, node: HTMLElement | null) {
  if (node) slots.set(name, node);
  else slots.delete(name);
  emitSlots();
}

const slotClass = "pointer-events-none absolute inset-0";

/**
 * One full-board layer. The root uses the toolbar token so every panel paints
 * above the selection chrome. The dropdown and modal slots stack above that.
 */
export function FloatingLayer() {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    registerSlot("toolbar", toolbarRef.current);
    registerSlot("dropdown", dropdownRef.current);
    registerSlot("modal", modalRef.current);
    return () => {
      registerSlot("toolbar", null);
      registerSlot("dropdown", null);
      registerSlot("modal", null);
    };
  }, []);

  return (
    <div
      data-floating-layer=""
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: layers.toolbar }}
    >
      <div ref={toolbarRef} data-floating-slot="toolbar" className={slotClass} style={{ zIndex: layers.toolbar }} />
      <div ref={dropdownRef} data-floating-slot="dropdown" className={slotClass} style={{ zIndex: layers.dropdown }} />
      <div ref={modalRef} data-floating-slot="modal" className={slotClass} style={{ zIndex: layers.modal }} />
    </div>
  );
}

type Blockable = {
  stopPropagation: () => void;
  preventDefault: () => void;
  target: EventTarget | null;
};

function blockPanelEvent(event: Blockable) {
  event.stopPropagation();
  const target = event.target;
  // Canceling pointerdown suppresses the mouse moves react-colorful uses to drag.
  if (target instanceof Element && target.closest(".react-colorful, input, textarea, select")) return;
  event.preventDefault();
}

type FloatingPanelProps = {
  layer: FloatingLayerName;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  panelRef?: Ref<HTMLDivElement>;
  role?: AriaRole;
  ariaLabel?: string;
  "data-selection-chrome"?: string;
  "data-noodle-toolbar"?: string;
  "data-text-toolbar"?: string;
  "data-shapes-menu"?: string;
  "data-recent-menu"?: string;
  "data-group-toolbar"?: string;
};

function setRef(ref: Ref<HTMLDivElement> | undefined, node: HTMLDivElement | null) {
  if (!ref) return;
  if (typeof ref === "function") ref(node);
  else (ref as { current: HTMLDivElement | null }).current = node;
}

/**
 * The only wrapper for a toolbar, dropdown, or popover. It portals into the
 * shared layer and does not accept a z-index from the caller.
 */
export function FloatingPanel({
  layer,
  children,
  className,
  style,
  panelRef,
  role,
  ariaLabel,
  ...marks
}: FloatingPanelProps) {
  useSyncExternalStore(subscribeSlots, slotVersionNow, () => 0);
  const host = floatingSlot(layer);
  if (!host) return null;

  return createPortal(
    <div
      ref={(node) => setRef(panelRef, node)}
      role={role}
      aria-label={ariaLabel}
      data-floating-panel={layer}
      className={["nodrag nopan nowheel", className].filter(Boolean).join(" ")}
      style={{ pointerEvents: "auto", ...style }}
      onPointerDown={(event: ReactPointerEvent<HTMLDivElement>) => blockPanelEvent(event)}
      onMouseDown={(event) => blockPanelEvent(event)}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onWheel={(event: WheelEvent<HTMLDivElement>) => event.stopPropagation()}
      {...marks}
    >
      {children}
    </div>,
    host,
  );
}

export type AnchorAlign = "start" | "center";

export type AnchorBox = {
  top: number;
  left: number;
  minWidth: number;
};

/** `brand.scale.100`. The space between a floating toolbar and the menu that opens from it. */
function toolbarMenuGap(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--brand-scale-100");
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : 4;
}

/** The toolbar the control sits in. The menu clears that box, not the button inside it. */
function toolbarRect(anchor: HTMLElement): DOMRect {
  const panel = anchor.closest("[data-floating-panel='toolbar']");
  if (panel instanceof HTMLElement) return paintedBox(panel);
  let node: HTMLElement | null = anchor;
  while (node) {
    if (node.parentElement?.hasAttribute("data-canvas-chrome")) return node.getBoundingClientRect();
    node = node.parentElement;
  }
  return anchor.getBoundingClientRect();
}

/**
 * The noodle bar is placed inside a zero-size portal host at the top of the
 * layer. A menu has to clear the painted pill, or the 4px gap lands on the screen edge.
 */
function paintedBox(panel: HTMLElement): DOMRect {
  const box = panel.getBoundingClientRect();
  if (box.width >= 1 && box.height >= 1) return box;
  for (const node of panel.querySelectorAll("*")) {
    if (!(node instanceof HTMLElement)) continue;
    const child = node.getBoundingClientRect();
    if (child.width >= 1 && child.height >= 1) return child;
  }
  return box;
}

/** Screen position for a menu under a button, clamped to the floating layer. */
export function useAnchoredBox(
  open: boolean,
  anchorRef: { readonly current: HTMLElement | null },
  align: AnchorAlign = "start",
) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<AnchorBox | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setBox(null);
      return;
    }
    let frame = 0;
    const place = () => {
      const anchor = anchorRef.current;
      const menu = menuRef.current;
      const layer = floatingSlot("dropdown");
      if (anchor && menu && layer) {
        const rect = anchor.getBoundingClientRect();
        const host = toolbarRect(anchor);
        const layerRect = layer.getBoundingClientRect();
        const width = menu.offsetWidth;
        const height = menu.getBoundingClientRect().height;
        const pad = 8;
        const gap = toolbarMenuGap();
        let top = host.bottom + gap - layerRect.top;
        if (height > 0 && host.bottom + gap + height > layerRect.bottom - pad) {
          const above = host.top - gap - height - layerRect.top;
          if (above >= pad) top = above;
        }
        let left = (align === "center" ? rect.left + rect.width / 2 - width / 2 : rect.left) - layerRect.left;
        if (width > 0) {
          const maxLeft = layerRect.width - pad - width;
          if (left > maxLeft) left = Math.max(pad, maxLeft);
        }
        if (left < pad) left = pad;
        const next = { top, left, minWidth: rect.width };
        setBox((prev) =>
          prev &&
          Math.abs(prev.top - next.top) < 0.5 &&
          Math.abs(prev.left - next.left) < 0.5 &&
          Math.abs(prev.minWidth - next.minWidth) < 0.5
            ? prev
            : next,
        );
      }
      frame = requestAnimationFrame(place);
    };
    place();
    return () => cancelAnimationFrame(frame);
  }, [open, anchorRef, align]);

  return { menuRef, box };
}

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useReactFlow, useStore, useStoreApi, type Edge, type Node } from "@xyflow/react";
import { drawnNoodle } from "./drawnNoodle";
import { layers } from "./layers";
import { nodesTouchingRect, normalizeRect, pathHitsRect, selectionIds, type FlowRect } from "./marqueeGeometry";
import { ENDPOINT_TYPE } from "./noodleEnds";

const DRAG_PX = 8;

const BLOCKS_MARQUEE =
  ".react-flow__node, .react-flow__edge, .react-flow__handle, .react-flow__resize-control, .react-flow__nodesselection, .react-flow__minimap, .react-flow__controls, .react-flow__panel, .noodle-anchor, .noodle-end, .noodle-edge-label, [data-noodle-label], [data-marquee-hit], [data-floating-panel], [data-canvas-chrome], [data-shapes-menu], .board-toolbar, [role='alert']";

const CHROME = "[data-floating-panel], [data-canvas-chrome], .board-toolbar, [data-shapes-menu], button, a, input, textarea, select";

type Phase = "idle" | "drawing" | "committed";

type Visual = { rect: FlowRect; hit: boolean };

function isEmptyCanvas(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  if (target.closest(BLOCKS_MARQUEE)) return false;
  return Boolean(target.closest(".react-flow__pane"));
}

function selectionKey(nodes: Node[], edges: Edge[]) {
  const nodeIds: string[] = [];
  for (const node of nodes) {
    if (node.selected && node.type !== ENDPOINT_TYPE) nodeIds.push(node.id);
  }
  nodeIds.sort();
  const edgeIds: string[] = [];
  for (const edge of edges) {
    if (edge.selected) edgeIds.push(edge.id);
  }
  edgeIds.sort();
  return `${nodeIds.join("\n")}|${edgeIds.join("\n")}`;
}

function keyOf(nodes: ReadonlySet<string>, edges: ReadonlySet<string>) {
  return `${[...nodes].sort().join("\n")}|${[...edges].sort().join("\n")}`;
}

function strokePad(path: SVGGeometryElement) {
  const styled = Number.parseFloat(path.style.strokeWidth || "");
  if (Number.isFinite(styled) && styled > 0) return styled / 2;
  const attr = Number.parseFloat(path.getAttribute("stroke-width") || "");
  if (Number.isFinite(attr) && attr > 0) return attr / 2;
  return 1;
}

function edgePath(id: string) {
  const edge = document.querySelector(`.react-flow__edge[data-id="${CSS.escape(id)}"]`);
  const path = edge?.querySelector(".react-flow__edge-path");
  return path instanceof SVGGeometryElement ? path : null;
}

function hitsDrawnPath(d: string, rect: FlowRect, pad: number) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  svg.appendChild(path);
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  svg.style.left = "-9999px";
  document.body.appendChild(svg);
  try {
    return pathHitsRect(path, rect, pad);
  } finally {
    svg.remove();
  }
}

function edgesTouchingRect(edges: readonly Edge[], rect: FlowRect) {
  const ids = new Set<string>();
  for (const edge of edges) {
    if (edge.hidden) continue;
    const path = edgePath(edge.id);
    if (path) {
      if (pathHitsRect(path, rect, strokePad(path))) ids.add(edge.id);
      continue;
    }
    const drawn = drawnNoodle(edge.id);
    if (!drawn) continue;
    if (hitsDrawnPath(drawn.d, rect, drawn.width / 2)) ids.add(edge.id);
  }
  return ids;
}

/**
 * Select-tool marquee. The rectangle is drag feedback on the selection layer.
 * Pointer-up commits. The click that pointer-up fires is swallowed. A later
 * click on the rectangle border restores the selection from when the drag
 * started. The interior stays open: a click on an element selects that
 * element, and a click on empty canvas still clears. Escape aborts before
 * that commit.
 */
export default function Marquee({
  active,
  onSelect,
}: {
  active: boolean;
  onSelect: (nodes: ReadonlySet<string>, edges: ReadonlySet<string>) => void;
}) {
  const store = useStoreApi();
  const { screenToFlowPosition } = useReactFlow();
  const zoom = useStore((state) => state.transform[2] || 1);
  const root = useStore((state) => state.domNode);
  const liveKey = useStore((state) => selectionKey(state.nodes, state.edges));
  const [visual, setVisual] = useState<Visual | null>(null);
  const activeRef = useRef(active);
  const onSelectRef = useRef(onSelect);
  const screenToFlowRef = useRef(screenToFlowPosition);
  const phaseRef = useRef<Phase>("idle");
  const abortedRef = useRef(false);
  const swallowClickRef = useRef(false);
  const swallowFrameRef = useRef(0);
  const baseRef = useRef<{ nodes: Set<string>; edges: Set<string> } | null>(null);
  const committedKeyRef = useRef("");
  const matchedRef = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startFlowX: number;
    startFlowY: number;
    moved: boolean;
    move: (event: PointerEvent) => void;
    up: (event: PointerEvent) => void;
  } | null>(null);

  activeRef.current = active;
  onSelectRef.current = onSelect;
  screenToFlowRef.current = screenToFlowPosition;

  const detachDrag = () => {
    const drag = dragRef.current;
    if (!drag) return;
    window.removeEventListener("pointermove", drag.move);
    window.removeEventListener("pointerup", drag.up);
    window.removeEventListener("pointercancel", drag.up);
    dragRef.current = null;
  };

  useEffect(() => {
    if (phaseRef.current !== "committed") return;
    if (liveKey === committedKeyRef.current) {
      matchedRef.current = true;
      return;
    }
    if (!matchedRef.current) return;
    phaseRef.current = "idle";
    matchedRef.current = false;
    setVisual(null);
  }, [liveKey]);

  useEffect(() => {
    if (active) return;
    if (phaseRef.current === "drawing") {
      abortedRef.current = true;
      phaseRef.current = "idle";
      setVisual(null);
      return;
    }
    if (phaseRef.current === "committed") {
      phaseRef.current = "idle";
      matchedRef.current = false;
      setVisual(null);
    }
  }, [active]);

  useEffect(() => {
    const armSwallow = () => {
      swallowClickRef.current = true;
      cancelAnimationFrame(swallowFrameRef.current);
      // The click from this pointer-up is dispatched in this turn. A pointerdown
      // must not retire the swallow before that click. The next frame does, so a
      // click that never arrives cannot swallow a later one.
      swallowFrameRef.current = requestAnimationFrame(() => {
        swallowClickRef.current = false;
      });
    };
    const onClick = (event: MouseEvent) => {
      if (!swallowClickRef.current) return;
      swallowClickRef.current = false;
      cancelAnimationFrame(swallowFrameRef.current);
      if (event.target instanceof Element && event.target.closest(CHROME)) return;
      event.preventDefault();
      event.stopPropagation();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || phaseRef.current !== "drawing") return;
      event.preventDefault();
      event.stopPropagation();
      abortedRef.current = true;
      phaseRef.current = "idle";
      setVisual(null);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary) return;
      const target = event.target;
      if (target instanceof Element && target.closest("[data-marquee-hit]")) return;
      if (phaseRef.current === "committed") {
        phaseRef.current = "idle";
        matchedRef.current = false;
        setVisual(null);
      }
      if (!activeRef.current || abortedRef.current || dragRef.current) return;
      if (!isEmptyCanvas(target)) return;
      const flow = screenToFlowRef.current({ x: event.clientX, y: event.clientY });
      const state = store.getState();
      const baseNodes = new Set<string>();
      const baseEdges = new Set<string>();
      for (const node of state.nodes) {
        if (node.selected && node.type !== ENDPOINT_TYPE) baseNodes.add(node.id);
      }
      for (const edge of state.edges) {
        if (edge.selected) baseEdges.add(edge.id);
      }
      baseRef.current = { nodes: baseNodes, edges: baseEdges };
      phaseRef.current = "drawing";
      abortedRef.current = false;
      const move = (moveEvent: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag || moveEvent.pointerId !== drag.pointerId) return;
        if (abortedRef.current || phaseRef.current !== "drawing") return;
        const distance = Math.hypot(moveEvent.clientX - drag.startClientX, moveEvent.clientY - drag.startClientY);
        if (!drag.moved) {
          if (distance <= DRAG_PX) return;
          drag.moved = true;
        }
        moveEvent.stopPropagation();
        moveEvent.preventDefault();
        const point = screenToFlowRef.current({ x: moveEvent.clientX, y: moveEvent.clientY });
        setVisual({
          rect: normalizeRect(drag.startFlowX, drag.startFlowY, point.x - drag.startFlowX, point.y - drag.startFlowY),
          hit: false,
        });
      };
      const up = (upEvent: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag || upEvent.pointerId !== drag.pointerId) return;
        detachDrag();
        if (abortedRef.current || phaseRef.current !== "drawing") {
          abortedRef.current = false;
          phaseRef.current = "idle";
          armSwallow();
          setVisual(null);
          return;
        }
        if (!drag.moved) {
          phaseRef.current = "idle";
          setVisual(null);
          return;
        }
        const point = screenToFlowRef.current({ x: upEvent.clientX, y: upEvent.clientY });
        const rect = normalizeRect(drag.startFlowX, drag.startFlowY, point.x - drag.startFlowX, point.y - drag.startFlowY);
        const latest = store.getState();
        const pickedNodes = nodesTouchingRect(latest.nodeLookup.values(), rect, (id) => {
          const el = document.querySelector(`.react-flow__node[data-id="${CSS.escape(id)}"]`);
          if (!(el instanceof HTMLElement)) return null;
          const bounds = el.getBoundingClientRect();
          if (bounds.width < 1 || bounds.height < 1) return null;
          const topLeft = screenToFlowRef.current({ x: bounds.left, y: bounds.top });
          const bottomRight = screenToFlowRef.current({ x: bounds.right, y: bounds.bottom });
          return {
            x: Math.min(topLeft.x, bottomRight.x),
            y: Math.min(topLeft.y, bottomRight.y),
            width: Math.abs(bottomRight.x - topLeft.x),
            height: Math.abs(bottomRight.y - topLeft.y),
          };
        });
        const pickedEdges = edgesTouchingRect(latest.edges, rect);
        const additive = upEvent.shiftKey;
        if (additive && pickedNodes.size === 0 && pickedEdges.size === 0) {
          phaseRef.current = "committed";
          committedKeyRef.current = keyOf(baseNodes, baseEdges);
          matchedRef.current = false;
          setVisual({ rect, hit: true });
          armSwallow();
          return;
        }
        const next = selectionIds(pickedNodes, pickedEdges, baseNodes, baseEdges, additive);
        phaseRef.current = "committed";
        committedKeyRef.current = keyOf(next.nodes, next.edges);
        matchedRef.current = false;
        setVisual({ rect, hit: true });
        onSelectRef.current(next.nodes, next.edges);
        armSwallow();
      };
      dragRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startFlowX: flow.x,
        startFlowY: flow.y,
        moved: false,
        move,
        up,
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    };
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("pointerdown", onPointerDown, true);
      cancelAnimationFrame(swallowFrameRef.current);
      detachDrag();
    };
  }, [store]);

  const cancelHit = (event: { preventDefault: () => void; stopPropagation: () => void }) => {
    event.preventDefault();
    event.stopPropagation();
    const base = baseRef.current;
    phaseRef.current = "idle";
    matchedRef.current = false;
    setVisual(null);
    if (!base) return;
    onSelectRef.current(base.nodes, base.edges);
  };

  const viewport = root?.querySelector(".react-flow__viewport");
  if (!visual || !(viewport instanceof HTMLElement)) return null;
  const { rect } = visual;
  const stroke = 1.5 / zoom;
  return createPortal(
    <div
      data-marquee=""
      className="noodle-marquee"
      style={{
        transform: `translate(${rect.x}px, ${rect.y}px)`,
        width: Math.max(rect.width, 1),
        height: Math.max(rect.height, 1),
        zIndex: layers.selection,
      }}
    >
      <svg width="100%" height="100%" aria-hidden>
        <rect
          width="100%"
          height="100%"
          fill={visual.hit ? "none" : "rgba(100, 116, 139, 0.14)"}
          stroke="#64748b"
          strokeWidth={stroke}
          strokeDasharray={`${6 / zoom} ${5 / zoom}`}
          style={{ pointerEvents: "none" }}
        />
        {visual.hit ? (
          <rect
            data-marquee-hit=""
            width="100%"
            height="100%"
            fill="none"
            stroke="transparent"
            strokeWidth={16 / zoom}
            style={{ pointerEvents: "stroke" }}
            onPointerDown={cancelHit}
            onClick={cancelHit}
          />
        ) : null}
      </svg>
    </div>,
    viewport,
  );
}

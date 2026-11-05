import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { BaseEdge, EdgeLabelRenderer, Position, useReactFlow, useStore, useStoreApi, type EdgeProps } from "@xyflow/react";
import { FloatingPanel, floatingSlot } from "./FloatingPanel";
import { layers } from "./layers";
import { ENDPOINT_TYPE, edgeAnchor, forwardEndDrag, knobOnRim, outward } from "./noodleEnds";
import { isSide, nodeBox, outlineRadius, resolveAttachments, routeEnd, sidePosition, type SideId } from "./attachment";
import { placeHandle, syncPlacedHandles } from "./PortMagnet";
import { setConnectionOrigin, setHotPort } from "./portHot";
import {
  publishNoodle,
  readNoodle,
  sameNoodle,
  snapshotBoard,
  thicknessPx,
  type NoodleArrow,
  type NoodleData,
} from "./noodleData";
import { closeNoodleLabel, useNoodleLabelEditing } from "./noodleLabel";
import { bendsFromPoints, layoutNoodle, moveSegment, ROUTE_GAP, type FlowRect, type NoodleAnchor, type RouteFrame } from "./noodleRoute";
import NoodleToolbar from "./NoodleToolbar";
import { dropDrawnNoodle, publishDrawnNoodle } from "./drawnNoodle";
import { NOODLE_TOOLBAR_GAP, placeNoodleToolbar, type ScreenRect } from "./noodleToolbarPlace";
import { useSelectedObjectCount } from "./selectionScope";

type FlowNode = {
  type?: string;
  data?: unknown;
  measured?: { width?: number | null; height?: number | null };
  internals?: { positionAbsolute: { x: number; y: number } };
};

function sidePoint(
  node: FlowNode | undefined,
  side: SideId | null,
  fraction: number | undefined,
  fallbackX: number,
  fallbackY: number,
) {
  if (!node || !side) return { x: fallbackX, y: fallbackY };
  const box = nodeBox(node);
  if (!box) return { x: fallbackX, y: fallbackY };
  return routeEnd(box, side, fraction ?? 0.5, outlineRadius(node.type, node.data, box), ROUTE_GAP);
}

const VIEW_MARGIN = 16;

function screenToFlow(pane: DOMRect, tx: number, ty: number, zoom: number, x: number, y: number) {
  return { x: (x - pane.left - tx) / zoom, y: (y - pane.top - ty) / zoom };
}

function flowRect(pane: DOMRect, tx: number, ty: number, zoom: number, rect: DOMRect, pad: number): FlowRect {
  const min = screenToFlow(pane, tx, ty, zoom, rect.left - pad, rect.top - pad);
  const max = screenToFlow(pane, tx, ty, zoom, rect.right + pad, rect.bottom + pad);
  return { minX: min.x, minY: min.y, maxX: max.x, maxY: max.y };
}

let frameCacheKey = "";
let frameCache: RouteFrame | null = null;
let chromeVersion = 0;
const chromeListeners = new Set<() => void>();
let chromeWatch: ResizeObserver | null = null;
const chromeWatched = new Set<Element>();

function attachChromeWatch(observer: ResizeObserver) {
  let attached = false;
  for (const selector of ["[data-canvas-chrome]", ".board-toolbar", ".react-flow__minimap", ".react-flow"]) {
    const element = document.querySelector(selector);
    if (!element || chromeWatched.has(element)) continue;
    chromeWatched.add(element);
    observer.observe(element);
    attached = true;
  }
  return attached;
}

function noteChromeAttached() {
  frameCacheKey = "";
  chromeVersion += 1;
  chromeListeners.forEach((listener) => listener());
}

function ensureChromeWatch() {
  if (chromeWatch || typeof ResizeObserver === "undefined") return;
  chromeWatch = new ResizeObserver(() => {
    frameCacheKey = "";
    chromeVersion += 1;
    attachChromeWatch(chromeWatch!);
    chromeListeners.forEach((listener) => listener());
  });
  attachChromeWatch(chromeWatch);
  // The tool pill portals after the first layout, so watch again on the next frame.
  requestAnimationFrame(() => {
    if (chromeWatch && attachChromeWatch(chromeWatch)) noteChromeAttached();
  });
}

/** Re-render when the toolbar or minimap changes size without a pan or zoom. */
export function useChromeLayout() {
  return useSyncExternalStore(
    (listener) => {
      ensureChromeWatch();
      chromeListeners.add(listener);
      return () => chromeListeners.delete(listener);
    },
    () => chromeVersion,
    () => 0,
  );
}

function chromeKey() {
  const box = (selector: string) => {
    const rect = document.querySelector(selector)?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return "0";
    return `${rect.left.toFixed(0)},${rect.top.toFixed(0)},${rect.width.toFixed(0)},${rect.height.toFixed(0)}`;
  };
  return `${box("[data-canvas-chrome]")}|${box(".board-toolbar")}|${box(".react-flow__minimap")}`;
}

export function routeFrame(transform: [number, number, number], width: number, height: number) {
  const key = `${width}x${height}:${transform[0].toFixed(1)}:${transform[1].toFixed(1)}:${transform[2].toFixed(3)}:${chromeKey()}`;
  if (key === frameCacheKey) return frameCache;
  frameCacheKey = key;
  frameCache = measureFrame(transform);
  return frameCache;
}

/** Visible canvas minus the top bar. The minimap and the bottom tool pill are obstacles. */
function measureFrame(transform: [number, number, number]): RouteFrame | null {
  const pane = document.querySelector(".react-flow")?.getBoundingClientRect();
  const zoom = transform[2];
  if (!pane || !zoom) return null;
  const [tx, ty] = transform;
  let top = pane.top + VIEW_MARGIN;
  let bottom = pane.bottom - VIEW_MARGIN;
  let left = pane.left + VIEW_MARGIN;
  let right = pane.right - VIEW_MARGIN;
  const chrome = document.querySelector("[data-canvas-chrome]")?.getBoundingClientRect();
  if (chrome && chrome.width > 0 && chrome.bottom > pane.top && chrome.top < pane.bottom) {
    top = Math.max(top, chrome.bottom + VIEW_MARGIN);
  }
  const viewMin = screenToFlow(pane, tx, ty, zoom, left, top);
  const viewMax = screenToFlow(pane, tx, ty, zoom, right, bottom);
  const obstacles: FlowRect[] = [];
  for (const selector of [".react-flow__minimap", ".board-toolbar"]) {
    const rect = document.querySelector(selector)?.getBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0) obstacles.push(flowRect(pane, tx, ty, zoom, rect, VIEW_MARGIN));
  }
  return {
    view: { minX: viewMin.x, minY: viewMin.y, maxX: viewMax.x, maxY: viewMax.y },
    obstacles,
  };
}

function EndKnob({
  edgeId,
  x,
  y,
  position,
  end,
  nodeId,
  side,
  fraction,
}: {
  edgeId: string;
  x: number;
  y: number;
  position: Position;
  end: "source" | "target";
  nodeId?: string;
  side?: SideId | null;
  fraction?: number;
}) {
  const store = useStoreApi();
  const size = 14;
  const { cx, cy } = knobOnRim(x, y, position, size / 2);
  return (
    <foreignObject x={cx - size / 2} y={cy - size / 2} width={size} height={size} className="noodle-end">
      <div
        role="button"
        aria-label={`Drag ${end} end`}
        className="noodle-end-dot nodrag nopan"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          const anchor = edgeAnchor(edgeId, end);
          if (!(anchor instanceof Element)) return;
          if (nodeId && side) {
            const state = store.getState();
            if (end === "source") {
              const pin = { nodeId, handleId: side, fraction: 0.5 };
              setConnectionOrigin(pin);
              setHotPort(pin);
              syncPlacedHandles(state);
              placeHandle(state, nodeId, side, 0.5);
            } else if (fraction != null) {
              setHotPort({ nodeId, handleId: side, fraction });
              syncPlacedHandles(state);
              placeHandle(state, nodeId, side, fraction);
            }
          }
          event.preventDefault();
          event.stopPropagation();
          forwardEndDrag(anchor, event);
        }}
      />
    </foreignObject>
  );
}

type FlowCircle = { x: number; y: number; radius: number };

function sampleFlowPath(d: string, fallback: { x: number; y: number }[], zoom: number) {
  if (!d || typeof document === "undefined") return fallback;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  svg.appendChild(path);
  const length = path.getTotalLength();
  if (!(length > 0)) return fallback;
  // Two screen pixels per sample, so a tight curve cannot bulge through the gap.
  const count = Math.max(16, Math.min(720, Math.ceil((length * (zoom || 1)) / 2)));
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= count; i += 1) {
    const point = path.getPointAtLength((length * i) / count);
    points.push({ x: point.x, y: point.y });
  }
  return points;
}

function clientRect(rect: DOMRect): ScreenRect {
  return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
}

function measureHandleCircles() {
  const circles: { c: { x: number; y: number }; radius: number }[] = [];
  for (const node of document.querySelectorAll("[data-noodle-anchor], .noodle-end-dot")) {
    if (!(node instanceof Element)) continue;
    const box = node.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) continue;
    circles.push({
      c: { x: box.left + box.width / 2, y: box.top + box.height / 2 },
      radius: Math.max(box.width, box.height) / 2,
    });
  }
  return circles;
}

function measureAvoidRects() {
  const rects: ScreenRect[] = [];
  for (const node of document.querySelectorAll("[data-noodle-rest], [data-noodle-label]")) {
    if (!(node instanceof Element)) continue;
    const box = node.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) continue;
    rects.push(clientRect(box));
  }
  return rects;
}

function PlacedNoodleToolbar({
  path,
  points,
  midX,
  midY,
  strokeWidth,
  handles,
  zoom,
  flowToScreenPosition,
  children,
}: {
  path: string;
  points: { x: number; y: number }[];
  midX: number;
  midY: number;
  strokeWidth: number;
  handles: FlowCircle[];
  zoom: number;
  flowToScreenPosition: (point: { x: number; y: number }) => { x: number; y: number };
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const pane = document.querySelector(".react-flow");
    const layer = floatingSlot("toolbar");
    if (!el || !(pane instanceof Element) || !layer) return;
    const width = el.offsetWidth;
    const height = el.offsetHeight;
    if (width < 1 || height < 1) return;
    const safeZoom = zoom || 1;
    const samples = sampleFlowPath(path, points, safeZoom);
    const screen = samples.map((point) => flowToScreenPosition(point));
    const paintRadius = ((strokeWidth + 6) / 2) * safeZoom;
    const segments: { a: { x: number; y: number }; b: { x: number; y: number }; radius: number }[] = [];
    for (let i = 0; i < screen.length - 1; i += 1) {
      segments.push({ a: screen[i], b: screen[i + 1], radius: paintRadius });
    }
    const measured = measureHandleCircles();
    const circles =
      measured.length > 0
        ? measured
        : handles.map((handle) => ({
            c: flowToScreenPosition(handle),
            radius: handle.radius * safeZoom,
          }));
    if (measured.length === 0 && screen.length > 0) {
      for (const end of [screen[0], screen[screen.length - 1]]) {
        circles.push({ c: end, radius: 8 * safeZoom });
      }
    }
    const tools = document.querySelector(".board-toolbar")?.getBoundingClientRect();
    if (!tools || tools.width < 1 || tools.height < 1) {
      setPos(null);
      return;
    }
    const placed = placeNoodleToolbar({
      width,
      height,
      mid: flowToScreenPosition({ x: midX, y: midY }),
      obstacles: { segments, circles },
      pane: clientRect(pane.getBoundingClientRect()),
      blocked: [clientRect(tools)],
      avoid: measureAvoidRects(),
      gap: NOODLE_TOOLBAR_GAP,
      pad: 8,
    });
    if (!placed) {
      setPos(null);
      return;
    }
    const layerBox = layer.getBoundingClientRect();
    const next = { left: placed.left - layerBox.left, top: placed.top - layerBox.top };
    setPos((prev) =>
      prev && Math.abs(prev.left - next.left) < 0.5 && Math.abs(prev.top - next.top) < 0.5 ? prev : next,
    );
  });
  return (
    <div
      ref={ref}
      className="w-max rounded-xl border border-white/50 bg-white/40 shadow-lg backdrop-blur-xl"
      style={{
        position: "absolute",
        left: pos?.left ?? 0,
        top: pos?.top ?? 0,
        visibility: pos ? "visible" : "hidden",
        pointerEvents: "auto",
      }}
    >
      {children}
    </div>
  );
}

function ScreenEdgeToolbar({
  path,
  points,
  midX,
  midY,
  strokeWidth,
  handles,
  children,
}: {
  path: string;
  points: { x: number; y: number }[];
  midX: number;
  midY: number;
  strokeWidth: number;
  handles: FlowCircle[];
  children: ReactNode;
}) {
  useChromeLayout();
  const { flowToScreenPosition } = useReactFlow();
  const [, , zoom] = useStore(
    (state) => state.transform,
    (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2],
  );
  return (
    <FloatingPanel
      layer="toolbar"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      <PlacedNoodleToolbar
        path={path}
        points={points}
        midX={midX}
        midY={midY}
        strokeWidth={strokeWidth}
        handles={handles}
        zoom={zoom}
        flowToScreenPosition={flowToScreenPosition}
      >
        {children}
      </PlacedNoodleToolbar>
    </FloatingPanel>
  );
}

function labelStyle(x: number, y: number) {
  return {
    position: "absolute" as const,
    zIndex: layers.selection,
    transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
  };
}

function NoodleLabelEditor({
  edgeId,
  data,
  x,
  y,
}: {
  edgeId: string;
  data: NoodleData;
  x: number;
  y: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  const historyRef = useRef(false);
  const zoom = useStore((state) => state.transform[2]);
  const [lift, setLift] = useState(0);

  useLayoutEffect(() => {
    const input = inputRef.current;
    const tools = document.querySelector(".board-toolbar")?.getBoundingClientRect();
    const z = zoom || 1;
    if (!input || !tools || tools.width <= 0) {
      if (lift !== 0) setLift(0);
      return;
    }
    const box = input.getBoundingClientRect();
    const baseBottom = box.bottom - lift * z;
    const baseTop = box.top - lift * z;
    const hits =
      box.right > tools.left &&
      box.left < tools.right &&
      baseBottom > tools.top &&
      baseTop < tools.bottom;
    const next = hits ? (tools.top - 8 - baseBottom) / z : 0;
    if (Math.abs(next - lift) > 0.5) setLift(next);
  });

  const write = (label: string, history: boolean) => {
    const next = { ...dataRef.current, label };
    if (sameNoodle(dataRef.current, next)) return;
    dataRef.current = next;
    if (history) snapshotBoard();
    publishNoodle(edgeId, next);
  };

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus({ preventScroll: true });
    const end = input.value.length;
    input.setSelectionRange(end, end);
  }, []);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const stop = (event: Event) => {
      event.stopPropagation();
    };
    const stopWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };
    input.addEventListener("pointerdown", stop);
    input.addEventListener("mousedown", stop);
    input.addEventListener("click", stop);
    input.addEventListener("dblclick", stop);
    input.addEventListener("wheel", stopWheel, { passive: false });
    return () => {
      input.removeEventListener("pointerdown", stop);
      input.removeEventListener("mousedown", stop);
      input.removeEventListener("click", stop);
      input.removeEventListener("dblclick", stop);
      input.removeEventListener("wheel", stopWheel);
    };
  }, []);

  const shown = data.label.length > 0 ? data.label : "Label";
  const place = labelStyle(x, y);
  return (
    <EdgeLabelRenderer>
      <input
        ref={inputRef}
        data-noodle-label=""
        aria-label="Label"
        value={data.label}
        placeholder="Label"
        maxLength={160}
        onFocus={() => {
          historyRef.current = false;
        }}
        onChange={(event) => {
          const history = !historyRef.current;
          historyRef.current = true;
          write(event.target.value, history);
        }}
        onBlur={() => {
          const current = dataRef.current;
          if (current.label && !current.label.trim()) publishNoodle(edgeId, { ...current, label: "" });
          closeNoodleLabel(edgeId);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== "Escape") return;
          event.preventDefault();
          event.stopPropagation();
          if (event.key === "Enter") {
            const current = dataRef.current;
            if (current.label && !current.label.trim()) publishNoodle(edgeId, { ...current, label: "" });
          }
          closeNoodleLabel(edgeId);
        }}
        className="noodle-edge-label noodle-edge-label-input nodrag nopan nowheel"
        style={{
          ...place,
          transform: `${place.transform} translateY(${lift}px)`,
          color: data.color,
          width: `${Math.min(Math.max(shown.length, 1), 32) + 1}ch`,
        }}
      />
    </EdgeLabelRenderer>
  );
}

function markerId(edgeId: string, end: "start" | "end") {
  return `noodle-${end}-${edgeId.replace(/[^A-Za-z0-9_-]/g, "")}`;
}

function MarkerDef({ id, kind, color }: { id: string; kind: NoodleArrow; color: string }) {
  if (kind === "none") return null;
  const stroke = kind === "open" ? color : "none";
  const fill = kind === "open" ? "none" : color;
  return (
    <marker
      id={id}
      viewBox="0 0 16 16"
      markerWidth="14"
      markerHeight="14"
      refX="14"
      refY="8"
      orient="auto-start-reverse"
      markerUnits="userSpaceOnUse"
    >
      {kind === "arrow" ? <path d="M2 2.5 14 8 2 13.5 5.2 8Z" fill={color} /> : null}
      {kind === "open" ? (
        <path d="M2 2.5 14 8 2 13.5" fill="none" stroke={stroke} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
      ) : null}
      {kind === "triangle" ? <path d="M2 2 14 8 2 14Z" fill={fill} /> : null}
      {kind === "circle" ? <circle cx="8" cy="8" r="5" fill={fill} /> : null}
      {kind === "diamond" ? <path d="M2 8 8 2.5 14 8 8 13.5Z" fill={fill} /> : null}
    </marker>
  );
}

function SegmentAnchor({
  edgeId,
  anchor,
  points,
  data,
}: {
  edgeId: string;
  anchor: NoodleAnchor;
  points: { x: number; y: number }[];
  data: NoodleData;
}) {
  const { screenToFlowPosition } = useReactFlow();
  const dataRef = useRef(data);
  dataRef.current = data;
  const size = 12;
  const cursor = Math.abs(anchor.nx) > Math.abs(anchor.ny) ? "ew-resize" : "ns-resize";

  return (
    <foreignObject
      x={anchor.x - size / 2}
      y={anchor.y - size / 2}
      width={size}
      height={size}
      className="noodle-anchor"
    >
      <div
        role="button"
        aria-label="Drag segment"
        data-noodle-anchor
        className="noodle-anchor-dot nodrag nopan"
        style={{ cursor, borderColor: data.color }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.stopPropagation();
          const origin = screenToFlowPosition({ x: event.clientX, y: event.clientY });
          const startPoints = points.map((point) => ({ ...point }));
          const startOffset = dataRef.current.curveOffset;
          let took = false;
          const onMove = (move: PointerEvent) => {
            const flow = screenToFlowPosition({ x: move.clientX, y: move.clientY });
            const delta = (flow.x - origin.x) * anchor.nx + (flow.y - origin.y) * anchor.ny;
            if (Math.abs(delta) < 0.5) return;
            if (!took) {
              took = true;
              snapshotBoard();
            }
            const current = dataRef.current;
            if (anchor.kind === "curve") {
              publishNoodle(edgeId, { ...current, curveOffset: Math.round((startOffset + delta) * 100) / 100 });
              return;
            }
            const nextPoints = moveSegment(startPoints, anchor.index, anchor.nx * delta, anchor.ny * delta, current.shape);
            publishNoodle(edgeId, { ...current, bends: bendsFromPoints(nextPoints) });
          };
          const onUp = () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
          };
          window.addEventListener("pointermove", onMove);
          window.addEventListener("pointerup", onUp);
        }}
      />
    </foreignObject>
  );
}

export default function NoodleEdge(props: EdgeProps) {
  const sourceNode = useStore((state) => state.nodeLookup.get(props.source));
  const targetNode = useStore((state) => state.nodeLookup.get(props.target));
  const attachment = useStore((state) => {
    const found = resolveAttachments(state.edges).get(props.id);
    return `${found?.source ?? ""}|${found?.target ?? ""}`;
  });
  const [sourceKey, targetKey] = attachment.split("|");
  const sourceFraction = sourceKey === "" ? undefined : Number(sourceKey);
  const targetFraction = targetKey === "" ? undefined : Number(targetKey);
  const data = readNoodle(props.data);
  const soloSelection = useSelectedObjectCount() === 1;
  const showChrome = props.selected && soloSelection;
  const sourceType = sourceNode?.type;
  const targetType = targetNode?.type;
  const sourceSide = sourceType !== ENDPOINT_TYPE && isSide(props.sourceHandleId) ? props.sourceHandleId : null;
  const targetSide = targetType !== ENDPOINT_TYPE && isSide(props.targetHandleId) ? props.targetHandleId : null;
  const sourceOnSide = sidePoint(sourceNode, sourceSide, sourceFraction, props.sourceX, props.sourceY);
  const targetOnSide = sidePoint(targetNode, targetSide, targetFraction, props.targetX, props.targetY);
  const sourcePosition = sourceType === ENDPOINT_TYPE ? outward(props.sourceX, props.sourceY, props.targetX, props.targetY) : sourceSide ? sidePosition(sourceSide) : props.sourcePosition;
  const targetPosition = targetType === ENDPOINT_TYPE ? outward(props.targetX, props.targetY, props.sourceX, props.sourceY) : targetSide ? sidePosition(targetSide) : props.targetPosition;
  const source = sourceType === ENDPOINT_TYPE ? { x: props.sourceX, y: props.sourceY } : sourceOnSide;
  const target = targetType === ENDPOINT_TYPE ? { x: props.targetX, y: props.targetY } : targetOnSide;
  const route = layoutNoodle({
    shape: data.shape,
    source,
    target,
    sourcePosition,
    targetPosition,
    bends: data.bends,
    curveOffset: data.curveOffset,
  });
  const startId = markerId(props.id, "start");
  const endId = markerId(props.id, "end");
  const width = thicknessPx(data.thickness);
  publishDrawnNoodle(props.id, route.path, width);
  useEffect(() => () => dropDrawnNoodle(props.id), [props.id]);
  const label = data.label.trim();
  const editing = useNoodleLabelEditing(props.id);
  const store = useStoreApi();
  const wasSelected = useRef(props.selected);
  useEffect(() => {
    const was = wasSelected.current;
    wasSelected.current = Boolean(props.selected);
    if (editing && was && !props.selected) closeNoodleLabel(props.id);
  }, [editing, props.selected]);
  const connecting = useStore((state) => state.connection.inProgress || state.connectionClickStartHandle != null);
  // Board units. Dividing by zoom holds a screen gap, so zooming out lifts the text off the stroke.
  const lift = 18;
  const guide = route.anchors[0];
  const labelShift = !guide
    ? { x: 0, y: -lift }
    : Math.abs(guide.ny) < 0.2
      ? { x: 0, y: -lift }
      : {
          x: guide.nx * (guide.ny > 0 ? -lift : lift),
          y: guide.ny * (guide.ny > 0 ? -lift : lift),
        };
  const labelX = route.labelX + labelShift.x;
  const labelY = route.labelY + labelShift.y;
  const toolbarHandles: FlowCircle[] = route.anchors.map((anchor) => ({ x: anchor.x, y: anchor.y, radius: 6 }));
  if (sourceType !== ENDPOINT_TYPE) {
    const knob = knobOnRim(source.x, source.y, sourcePosition, 7);
    toolbarHandles.push({ x: knob.cx, y: knob.cy, radius: 7 });
  }
  if (targetType !== ENDPOINT_TYPE) {
    const knob = knobOnRim(target.x, target.y, targetPosition, 7);
    toolbarHandles.push({ x: knob.cx, y: knob.cy, radius: 7 });
  }

  return (
    <>
      <defs>
        <MarkerDef id={startId} kind={data.markerStart} color={data.color} />
        <MarkerDef id={endId} kind={data.markerEnd} color={data.color} />
      </defs>
      {props.selected ? (
        <path d={route.path} fill="none" stroke={data.color} strokeWidth={width + 6} strokeOpacity={0.18} strokeLinecap="round" />
      ) : null}
      <BaseEdge
        id={props.id}
        path={route.path}
        style={{
          stroke: data.color,
          strokeWidth: width,
          strokeDasharray: data.lineStyle === "dashed" ? "8 6" : undefined,
        }}
        markerStart={data.markerStart === "none" ? undefined : `url('#${startId}')`}
        markerEnd={data.markerEnd === "none" ? undefined : `url('#${endId}')`}
        interactionWidth={24}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showChrome
        ? route.anchors.map((anchor) => (
            <SegmentAnchor
              key={`${anchor.kind}-${anchor.index}`}
              edgeId={props.id}
              anchor={anchor}
              points={route.points}
              data={data}
            />
          ))
        : null}
      {showChrome && sourceType !== ENDPOINT_TYPE ? (
        <EndKnob
          edgeId={props.id}
          x={source.x}
          y={source.y}
          position={sourcePosition}
          end="source"
          nodeId={props.source}
          side={sourceSide}
          fraction={sourceFraction}
        />
      ) : null}
      {showChrome && targetType !== ENDPOINT_TYPE ? (
        <EndKnob
          edgeId={props.id}
          x={target.x}
          y={target.y}
          position={targetPosition}
          end="target"
          nodeId={props.target}
          side={targetSide}
          fraction={targetFraction}
        />
      ) : null}
      {editing ? (
        <NoodleLabelEditor edgeId={props.id} data={data} x={labelX} y={labelY} />
      ) : label ? (
        <EdgeLabelRenderer>
          <div
            data-noodle-rest={props.id}
            className="noodle-edge-label nodrag nopan nowheel"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              if (document.querySelector(".noodle-hand")) return;
              store.getState().addSelectedEdges([props.id]);
            }}
            onDoubleClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onWheel={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            style={{
              ...labelStyle(labelX, labelY),
              color: data.color,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
      {showChrome && !connecting ? (
        <ScreenEdgeToolbar
          path={route.path}
          points={route.points}
          midX={route.labelX}
          midY={route.labelY}
          strokeWidth={width}
          handles={toolbarHandles}
        >
          <NoodleToolbar edgeId={props.id} data={data} />
        </ScreenEdgeToolbar>
      ) : null}
    </>
  );
}

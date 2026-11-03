import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { BaseEdge, EdgeLabelRenderer, Position, useReactFlow, useStore, useStoreApi, type EdgeProps } from "@xyflow/react";
import { FloatingPanel } from "./FloatingPanel";
import { ENDPOINT_TYPE, edgeAnchor, forwardEndDrag, knobOnRim, outward } from "./noodleEnds";
import { isSide, nodeBox, outlineRadius, resolveAttachments, routeEnd, sidePosition, type SideId } from "./attachment";
import { placeHandle, syncPlacedHandles } from "./PortMagnet";
import { setConnectionOrigin, setHotPort } from "./portHot";
import {
  publishNoodle,
  readNoodle,
  snapshotBoard,
  thicknessPx,
  type NoodleArrow,
  type NoodleData,
} from "./noodleData";
import { bendsFromPoints, layoutNoodle, moveSegment, ROUTE_GAP, type FlowRect, type NoodleAnchor, type RouteFrame } from "./noodleRoute";
import NoodleToolbar from "./NoodleToolbar";

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

function chromeKey() {
  const box = (selector: string) => {
    const rect = document.querySelector(selector)?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return "0";
    return `${rect.left.toFixed(0)},${rect.top.toFixed(0)},${rect.width.toFixed(0)},${rect.height.toFixed(0)}`;
  };
  return `${box("[data-canvas-chrome]")}|${box(".react-flow__minimap")}`;
}

export function routeFrame(transform: [number, number, number], width: number, height: number) {
  const key = `${width}x${height}:${transform[0].toFixed(1)}:${transform[1].toFixed(1)}:${transform[2].toFixed(3)}:${chromeKey()}`;
  if (key === frameCacheKey) return frameCache;
  frameCacheKey = key;
  frameCache = measureFrame(transform);
  return frameCache;
}

/** Visible canvas minus the top toolbars, with the minimap kept as an obstacle. */
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
  const map = document.querySelector(".react-flow__minimap")?.getBoundingClientRect();
  const obstacles =
    map && map.width > 0 && map.height > 0 ? [flowRect(pane, tx, ty, zoom, map, VIEW_MARGIN)] : [];
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

function ClampedToolbar({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const shiftRef = useRef(0);
  const [shift, setShift] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    const pane = document.querySelector(".react-flow");
    if (!el || !pane) return;
    const box = el.getBoundingClientRect();
    const bounds = pane.getBoundingClientRect();
    const pad = 8;
    const left = box.left - shiftRef.current;
    const right = box.right - shiftRef.current;
    let next = 0;
    if (left < bounds.left + pad) next = bounds.left + pad - left;
    if (right + next > bounds.right - pad) next += bounds.right - pad - (right + next);
    if (Math.abs(shiftRef.current - next) <= 0.5) return;
    shiftRef.current = next;
    setShift(next);
  });
  return (
    <div ref={ref} style={{ pointerEvents: "auto", transform: shift ? `translateX(${shift}px)` : undefined }}>
      {children}
    </div>
  );
}

function ScreenEdgeToolbar({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  const [panX, panY, zoom] = useStore(
    (state) => state.transform,
    (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2],
  );
  const safeZoom = zoom || 1;
  return (
    <FloatingPanel
      layer="toolbar"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "max-content",
        pointerEvents: "none",
        transform: `translate(${x * safeZoom + panX}px, ${y * safeZoom + panY}px) translate(-50%, -100%)`,
      }}
    >
      <ClampedToolbar>{children}</ClampedToolbar>
    </FloatingPanel>
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
  const frame = useStore((state) =>
    routeFrame(state.transform as [number, number, number], state.width, state.height),
  );
  const route = layoutNoodle({
    shape: data.shape,
    source,
    target,
    sourcePosition,
    targetPosition,
    bends: data.bends,
    curveOffset: data.curveOffset,
    frame,
  });
  const startId = markerId(props.id, "start");
  const endId = markerId(props.id, "end");
  const width = thicknessPx(data.thickness);
  const label = data.label.trim();
  const zoom = useStore((state) => state.transform[2] || 1);
  const lift = 18 / zoom;
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
      {props.selected
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
      {props.selected && sourceType !== ENDPOINT_TYPE ? (
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
      {props.selected && targetType !== ENDPOINT_TYPE ? (
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
      {label ? (
        <EdgeLabelRenderer>
          <div
            className="noodle-edge-label"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              color: data.color,
              pointerEvents: "none",
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
      {props.selected ? (
        <ScreenEdgeToolbar x={labelX} y={labelY - 28 / zoom}>
          <NoodleToolbar edgeId={props.id} data={data} />
        </ScreenEdgeToolbar>
      ) : null}
    </>
  );
}

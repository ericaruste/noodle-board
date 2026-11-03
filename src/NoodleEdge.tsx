import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { BaseEdge, EdgeLabelRenderer, Position, useReactFlow, useStore, useStoreApi, type EdgeProps } from "@xyflow/react";
import { FloatingPanel } from "./FloatingPanel";
import { ENDPOINT_TYPE, edgeAnchor, forwardEndDrag, knobOnRim, outward } from "./noodleEnds";
import { isSide, nodeBox, pointOnSide, resolveAttachments, sidePosition, type SideId } from "./attachment";
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
import { bendsFromPoints, layoutNoodle, moveSegment, type NoodleAnchor } from "./noodleRoute";
import NoodleToolbar from "./NoodleToolbar";

const ROUTE_GAP = 8;

type FlowNode = {
  measured?: { width?: number | null; height?: number | null };
  internals?: { positionAbsolute: { x: number; y: number } };
};

function atGap(node: FlowNode | undefined, position: Position, x: number, y: number, gap: number) {
  const width = node?.measured?.width;
  const height = node?.measured?.height;
  const origin = node?.internals?.positionAbsolute;
  if (!origin || !width || !height) return { x, y };
  if (position === Position.Left) return { x: origin.x - gap, y };
  if (position === Position.Right) return { x: origin.x + width + gap, y };
  if (position === Position.Top) return { x, y: origin.y - gap };
  return { x, y: origin.y + height + gap };
}

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
  return pointOnSide(box, side, fraction ?? 0.5);
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
  const [shift, setShift] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    const pane = document.querySelector(".react-flow");
    if (!el || !pane) return;
    const box = el.getBoundingClientRect();
    const bounds = pane.getBoundingClientRect();
    const pad = 8;
    let delta = 0;
    if (box.left < bounds.left + pad) delta = bounds.left + pad - box.left;
    if (box.right + delta > bounds.right - pad) delta += bounds.right - pad - (box.right + delta);
    if (Math.abs(delta) > 0.5) setShift((current) => current + delta);
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
      {children}
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
  const source =
    sourceType === ENDPOINT_TYPE
      ? { x: props.sourceX, y: props.sourceY }
      : atGap(sourceNode, sourcePosition, sourceOnSide.x, sourceOnSide.y, ROUTE_GAP);
  const target =
    targetType === ENDPOINT_TYPE
      ? { x: props.targetX, y: props.targetY }
      : atGap(targetNode, targetPosition, targetOnSide.x, targetOnSide.y, ROUTE_GAP);
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
          <ClampedToolbar>
            <NoodleToolbar edgeId={props.id} data={data} />
          </ClampedToolbar>
        </ScreenEdgeToolbar>
      ) : null}
    </>
  );
}

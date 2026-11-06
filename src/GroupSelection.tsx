import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { useReactFlow, useStore, useStoreApi, type Edge, type Node, type ReactFlowState } from "@xyflow/react";
import GroupChrome, { type SameKind } from "./GroupChrome";
import { applyGroupScale, captureGroupScale, publishGroupGeometry, type GroupScaleSnapshot } from "./groupScale";
import { layers } from "./layers";
import { applyNoodleData, readNoodle, type NoodleData } from "./noodleData";
import { ResizeHandles, useNoodleResizeStyle } from "./NoodleResizer";
import { useConnectChromeHidden } from "./portHot";
import { type ResizeHandle } from "./resizeMath";
import { selectedObjectCount } from "./selectionScope";
import { isShapeColor, isShapeKind, type ShapeData, type ShapeKind } from "./shapeData";
import { type StickyColor, type StickyData } from "./StickyNode";
import { coerceBody, sameBody, type TextBody } from "./textBody";
import { ENDPOINT_TYPE } from "./noodleEnds";

export const GROUP_STYLE_EVENT = "noodle-group-style";

export type GroupKind = SameKind | "image" | "mixed";

export type GroupStyleDetail = (
  | { property: "fill"; value: string | null }
  | { property: "stroke"; value: string | null }
  | { property: "sticky"; value: StickyColor }
  | { property: "kind"; value: ShapeKind }
  | { property: "noodle"; value: string }
  | { property: "noodlePatch"; patch: Partial<NoodleData> }
  | { property: "text"; type: "sticky" | "text" | "shape"; map: (body: TextBody) => TextBody }
) & { history?: boolean };

export function publishGroupStyle(detail: GroupStyleDetail) {
  window.dispatchEvent(new CustomEvent(GROUP_STYLE_EVENT, { detail }));
}

type Box = { x: number; y: number; width: number; height: number };

type GroupModel = {
  count: number;
  box: Box | null;
  kind: GroupKind | null;
};

function union(rects: Box[]): Box | null {
  if (rects.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }
  if (!Number.isFinite(minX)) return null;
  let x = minX;
  let y = minY;
  let width = maxX - minX;
  let height = maxY - minY;
  if (width < 8) {
    x -= (8 - width) / 2;
    width = 8;
  }
  if (height < 8) {
    y -= (8 - height) / 2;
    height = 8;
  }
  return { x, y, width, height };
}

function sameBox(a: Box | null, b: Box | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

function sameModel(a: GroupModel, b: GroupModel) {
  return a.count === b.count && a.kind === b.kind && sameBox(a.box, b.box);
}

function groupKind(kinds: ReadonlySet<string>): GroupKind | null {
  if (kinds.size === 0) return null;
  if (kinds.size > 1) return "mixed";
  const only = [...kinds][0];
  if (only === "sticky" || only === "text" || only === "shape" || only === "image" || only === "noodle") return only;
  return "mixed";
}

function pushNodeBox(rects: Box[], node: Node, lookup: ReactFlowState["nodeLookup"]) {
  const internal = lookup.get(node.id);
  const width = internal?.measured.width ?? node.width;
  const height = internal?.measured.height ?? node.height;
  const origin = internal?.internals.positionAbsolute ?? node.position;
  if (!width || !height || !origin) return;
  rects.push({ x: origin.x, y: origin.y, width, height });
}

function readGroup(state: ReactFlowState): GroupModel {
  const rects: Box[] = [];
  const selectedNodes = new Set<string>();
  const kinds = new Set<string>();

  for (const node of state.nodes) {
    if (!node.selected || node.type === ENDPOINT_TYPE) continue;
    selectedNodes.add(node.id);
    if (node.type) kinds.add(node.type);
    pushNodeBox(rects, node, state.nodeLookup);
  }

  for (const edge of state.edges) {
    if (!edge.selected) continue;
    kinds.add("noodle");
    const data = readNoodle(edge.data);
    for (const bend of data.bends) rects.push({ x: bend.x, y: bend.y, width: 0, height: 0 });
    for (const id of [edge.source, edge.target]) {
      if (selectedNodes.has(id)) continue;
      const internal = state.nodeLookup.get(id);
      const origin = internal?.internals.positionAbsolute;
      if (!origin) continue;
      const width = internal.measured.width ?? 0;
      const height = internal.measured.height ?? 0;
      rects.push({ x: origin.x + width / 2, y: origin.y + height / 2, width: 0, height: 0 });
    }
  }

  return {
    count: selectedObjectCount(state.nodes, state.edges),
    box: union(rects),
    kind: groupKind(kinds),
  };
}

/** One box, its handles, and one set of toolbars around every selected element and noodle. */
export default function GroupSelection() {
  const resizeStyle = useNoodleResizeStyle();
  const model = useStore(readGroup, sameModel);
  const flowRoot = useStore((state) => state.domNode);
  const store = useStoreApi();
  const { screenToFlowPosition } = useReactFlow();
  const hideChrome = useConnectChromeHidden();
  const [dragBox, setDragBox] = useState<Box | null>(null);
  const screenRef = useRef(screenToFlowPosition);
  screenRef.current = screenToFlowPosition;
  const dragRef = useRef<{
    pointerId: number;
    handle: ResizeHandle;
    snap: GroupScaleSnapshot;
    moved: boolean;
    lastX: number;
    lastY: number;
  } | null>(null);

  const onHandleDown = (handle: ResizeHandle, event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !model.box) return;
    event.preventDefault();
    event.stopPropagation();
    const state = store.getState();
    const drag = {
      pointerId: event.pointerId,
      handle,
      snap: captureGroupScale(state.nodes, state.edges, state.nodeLookup, model.box),
      moved: false,
      lastX: event.clientX,
      lastY: event.clientY,
    };
    dragRef.current = drag;
    const apply = (clientX: number, clientY: number, shift: boolean, resizing: boolean) => {
      const current = dragRef.current;
      if (!current) return;
      const pointer = screenRef.current({ x: clientX, y: clientY }, { snapToGrid: false });
      const latest = store.getState();
      const next = applyGroupScale(latest.nodes, latest.edges, current.snap, pointer, current.handle, shift, resizing);
      publishGroupGeometry({ nodes: next.nodes, edges: next.edges });
      setDragBox(resizing ? next.box : null);
    };
    const onMove = (moveEvent: PointerEvent) => {
      const current = dragRef.current;
      if (!current || moveEvent.pointerId !== current.pointerId) return;
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      current.lastX = moveEvent.clientX;
      current.lastY = moveEvent.clientY;
      if (!current.moved) {
        current.moved = true;
        window.dispatchEvent(new Event("noodle-snapshot"));
      }
      apply(moveEvent.clientX, moveEvent.clientY, moveEvent.shiftKey, true);
    };
    const onKey = (keyEvent: KeyboardEvent) => {
      const current = dragRef.current;
      if (!current?.moved || keyEvent.key !== "Shift") return;
      apply(current.lastX, current.lastY, keyEvent.type === "keydown", true);
    };
    const finish = (upEvent: PointerEvent) => {
      const current = dragRef.current;
      if (!current || upEvent.pointerId !== current.pointerId) return;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      if (current.moved) apply(upEvent.clientX, upEvent.clientY, upEvent.shiftKey, false);
      dragRef.current = null;
      setDragBox(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
  };

  const viewport = flowRoot?.querySelector(".react-flow__viewport");
  const box = dragBox ?? model.box;
  if (model.count < 2 || !box || !viewport) return null;
  const showTools =
    !hideChrome &&
    (model.kind === "sticky" || model.kind === "text" || model.kind === "shape" || model.kind === "noodle");

  return (
    <>
      {createPortal(
        <div
          className="noodle-resize-layer noodle-group-box"
          style={{
            ...resizeStyle,
            transform: `translate(${box.x}px, ${box.y}px)`,
            width: box.width,
            height: box.height,
            zIndex: layers.selection,
          }}
        >
          <svg className="noodle-selection-stroke" width="100%" height="100%" aria-hidden>
            <rect width="100%" height="100%" />
          </svg>
          {hideChrome ? null : <ResizeHandles onPointerDown={onHandleDown} />}
        </div>,
        viewport,
      )}
      {showTools && model.kind && model.kind !== "image" && model.kind !== "mixed" ? (
        <GroupChrome kind={model.kind} box={box} />
      ) : null}
    </>
  );
}

export function applyGroupStyle(
  nodes: Node[],
  edges: Edge[],
  detail: GroupStyleDetail,
): { nodes: Node[]; edges: Edge[] } | null {
  let nodesChanged = false;
  let edgesChanged = false;
  const nextNodes = nodes.map((node) => {
    if (!node.selected || !node.data || typeof node.data !== "object") return node;
    if ((detail.property === "fill" || detail.property === "stroke") && node.type === "shape") {
      const data = node.data as ShapeData;
      const current = detail.property === "fill" ? (isShapeColor(data.fill) ? data.fill : null) : isShapeColor(data.stroke) ? data.stroke : null;
      if (current === detail.value) return node;
      nodesChanged = true;
      return { ...node, data: { ...data, [detail.property]: detail.value } };
    }
    if (detail.property === "sticky" && node.type === "sticky") {
      const data = node.data as StickyData;
      if (data.color === detail.value) return node;
      nodesChanged = true;
      return { ...node, data: { ...data, color: detail.value } };
    }
    if (detail.property === "kind" && node.type === "shape") {
      const data = node.data as ShapeData;
      const current = isShapeKind(data.kind) ? data.kind : "rect";
      if (current === detail.value) return node;
      nodesChanged = true;
      return { ...node, data: { ...data, kind: detail.value } };
    }
    if (detail.property === "text" && node.type === detail.type) {
      const data = node.data as StickyData & { paragraphs?: unknown; text?: string };
      const body = node.type === "sticky" ? coerceBody(data.paragraphs, data.text) : coerceBody(data.paragraphs);
      const nextBody = detail.map(body);
      if (sameBody(nextBody, body)) return node;
      nodesChanged = true;
      if (node.type === "sticky") return { ...node, data: { color: data.color, paragraphs: nextBody } };
      return { ...node, data: { ...data, paragraphs: nextBody } };
    }
    return node;
  });
  const nextEdges =
    detail.property === "noodle" || detail.property === "noodlePatch"
      ? edges.map((edge) => {
          if (!edge.selected) return edge;
          const data = readNoodle(edge.data);
          if (detail.property === "noodle") {
            if (data.color === detail.value) return edge;
            edgesChanged = true;
            return applyNoodleData(edge, { ...data, color: detail.value });
          }
          let changed = false;
          const next = { ...data };
          for (const key of Object.keys(detail.patch) as (keyof NoodleData)[]) {
            const value = detail.patch[key];
            if (value === undefined || data[key] === value) continue;
            changed = true;
            Object.assign(next, { [key]: value });
          }
          if (!changed) return edge;
          edgesChanged = true;
          return applyNoodleData(edge, next);
        })
      : edges;
  if (!nodesChanged && !edgesChanged) return null;
  return {
    nodes: nodesChanged ? nextNodes : nodes,
    edges: edgesChanged ? nextEdges : edges,
  };
}

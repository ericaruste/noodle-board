import type { Edge, Node, ReactFlowState } from "@xyflow/react";
import { isSide, nodeBox, pointOnSide, projectOntoBox, type NodeBox } from "./attachment";
import { applyNoodleData, readNoodle, type NoodleData } from "./noodleData";
import { ENDPOINT_TYPE } from "./noodleEnds";
import { groupScale, scaleBox, scalePoint, type FlowBox, type Point, type ResizeHandle } from "./resizeMath";
import { SHAPE_MIN_SIZE, type ShapeData } from "./shapeData";

export const GROUP_GEOMETRY_EVENT = "noodle-group-geometry";

export type GroupGeometryDetail = { nodes: Node[]; edges: Edge[] };

export function publishGroupGeometry(detail: GroupGeometryDetail) {
  window.dispatchEvent(new CustomEvent(GROUP_GEOMETRY_EVENT, { detail }));
}

const STICKY_MIN = 140;
const TEXT_MIN_WIDTH = 120;
const TEXT_MIN_HEIGHT = 32;

export function minSizeFor(type: string | undefined) {
  if (type === "sticky") return { width: STICKY_MIN, height: STICKY_MIN };
  if (type === "text") return { width: TEXT_MIN_WIDTH, height: TEXT_MIN_HEIGHT };
  if (type === "shape") return { width: SHAPE_MIN_SIZE, height: SHAPE_MIN_SIZE };
  if (type === "image") return { width: 1, height: 1 };
  return { width: 1, height: 1 };
}

type Member = {
  id: string;
  type?: string;
  x: number;
  y: number;
  absX: number;
  absY: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  sizable: boolean;
};

type EdgeSnap = {
  id: string;
  data: NoodleData;
  sourceHandle: string | null;
  targetHandle: string | null;
  sourcePoint: Point;
  targetPoint: Point;
  targetBox: NodeBox | null;
  targetMoves: boolean;
};

export type GroupScaleSnapshot = {
  box: FlowBox;
  members: Member[];
  edges: EdgeSnap[];
};

function absOf(node: Node, lookup: ReactFlowState["nodeLookup"]): { abs: FlowBox; x: number; y: number } | null {
  const internal = lookup.get(node.id);
  const box = nodeBox(internal ?? node);
  if (!box) return null;
  return { abs: box, x: node.position.x, y: node.position.y };
}

function endPoint(
  nodeId: string,
  handle: string | null | undefined,
  fraction: number | undefined,
  lookup: ReactFlowState["nodeLookup"],
  nodes: readonly Node[],
): { point: Point; box: NodeBox | null; moves: boolean } {
  const node = nodes.find((item) => item.id === nodeId);
  const internal = lookup.get(nodeId);
  const box = nodeBox(internal ?? node);
  if (node?.type === ENDPOINT_TYPE && box) {
    return {
      point: { x: box.x + box.width / 2, y: box.y + box.height / 2 },
      box: null,
      moves: true,
    };
  }
  if (box && isSide(handle)) return { point: pointOnSide(box, handle, fraction ?? 0.5), box, moves: Boolean(node?.selected) };
  if (box) return { point: { x: box.x + box.width / 2, y: box.y + box.height / 2 }, box, moves: Boolean(node?.selected) };
  return { point: { x: 0, y: 0 }, box: null, moves: false };
}

export function captureGroupScale(
  nodes: readonly Node[],
  edges: readonly Edge[],
  lookup: ReactFlowState["nodeLookup"],
  box: FlowBox,
): GroupScaleSnapshot {
  const selectedNodes = new Set<string>();
  const endpointIds = new Set<string>();
  for (const edge of edges) {
    if (!edge.selected) continue;
    for (const id of [edge.source, edge.target]) {
      const node = lookup.get(id);
      if (node?.type === ENDPOINT_TYPE) endpointIds.add(id);
    }
  }
  const members: Member[] = [];
  for (const node of nodes) {
    const sizable = Boolean(node.selected && node.type !== ENDPOINT_TYPE);
    const endpoint = endpointIds.has(node.id);
    if (!sizable && !endpoint) continue;
    if (sizable) selectedNodes.add(node.id);
    const placed = absOf(node, lookup);
    if (!placed) continue;
    const min = minSizeFor(node.type);
    members.push({
      id: node.id,
      type: node.type,
      x: placed.x,
      y: placed.y,
      absX: placed.abs.x,
      absY: placed.abs.y,
      width: placed.abs.width,
      height: placed.abs.height,
      minWidth: min.width,
      minHeight: min.height,
      sizable,
    });
  }
  const edgeSnaps: EdgeSnap[] = [];
  for (const edge of edges) {
    if (!edge.selected) continue;
    const data = readNoodle(edge.data);
    const source = endPoint(edge.source, edge.sourceHandle, 0.5, lookup, nodes);
    const target = endPoint(edge.target, edge.targetHandle, data.targetFraction, lookup, nodes);
    edgeSnaps.push({
      id: edge.id,
      data,
      sourceHandle: edge.sourceHandle ?? null,
      targetHandle: edge.targetHandle ?? null,
      sourcePoint: source.point,
      targetPoint: target.point,
      targetBox: target.box,
      targetMoves: target.moves || selectedNodes.has(edge.target),
    });
  }
  return { box, members, edges: edgeSnaps };
}

function floors(members: readonly Member[]) {
  let floorX = 0.02;
  let floorY = 0.02;
  for (const member of members) {
    if (!member.sizable || member.width < 1 || member.height < 1) continue;
    floorX = Math.max(floorX, member.minWidth / member.width);
    floorY = Math.max(floorY, member.minHeight / member.height);
  }
  return { floorX, floorY };
}

function placeMember(member: Member, anchor: Point, sx: number, sy: number) {
  if (!member.sizable) {
    const center = scalePoint(
      { x: member.absX + member.width / 2, y: member.absY + member.height / 2 },
      anchor,
      sx,
      sy,
    );
    const absX = center.x - member.width / 2;
    const absY = center.y - member.height / 2;
    return {
      x: member.x + (absX - member.absX),
      y: member.y + (absY - member.absY),
      width: member.width,
      height: member.height,
    };
  }
  const rect = scaleBox(
    { x: member.absX, y: member.absY, width: member.width, height: member.height },
    anchor,
    sx,
    sy,
  );
  return {
    x: member.x + (rect.x - member.absX),
    y: member.y + (rect.y - member.absY),
    width: Math.max(rect.width, member.minWidth),
    height: Math.max(rect.height, member.minHeight),
  };
}

export function applyGroupScale(
  nodes: Node[],
  edges: Edge[],
  snap: GroupScaleSnapshot,
  pointer: Point,
  handle: ResizeHandle,
  shift: boolean,
  resizing: boolean,
): { nodes: Node[]; edges: Edge[]; box: FlowBox } {
  const { floorX, floorY } = floors(snap.members);
  const scaled = groupScale(snap.box, handle, pointer, shift, floorX, floorY);
  const placed = new Map(snap.members.map((member) => [member.id, placeMember(member, scaled.anchor, scaled.sx, scaled.sy)]));
  const nextNodes = nodes.map((node) => {
    const next = placed.get(node.id);
    if (!next) return node;
    const member = snap.members.find((item) => item.id === node.id);
    if (!member?.sizable) {
      return { ...node, position: { x: next.x, y: next.y } };
    }
    let data = node.data;
    if (node.type === "shape" && data && typeof data === "object" && Math.abs(next.height - member.height) > 1) {
      const shape = data as ShapeData;
      data = { ...shape, manualHeight: Math.round(next.height) };
    }
    return {
      ...node,
      data,
      position: { x: next.x, y: next.y },
      width: next.width,
      height: next.height,
      resizing,
      measured: { width: next.width, height: next.height },
      style: { ...node.style, width: next.width, height: next.height },
    };
  });

  const snaps = new Map(snap.edges.map((edge) => [edge.id, edge]));
  let edgesChanged = false;
  const nextEdges = edges.map((edge) => {
    const start = snaps.get(edge.id);
    if (!start) return edge;
    const chordX = Math.abs(start.targetPoint.x - start.sourcePoint.x);
    const chordY = Math.abs(start.targetPoint.y - start.sourcePoint.y);
    const perp = chordX >= chordY ? scaled.sy : scaled.sx;
    let targetHandle = start.targetHandle;
    let targetFraction = start.data.targetFraction;
    if (!start.targetMoves && start.targetBox && isSide(start.targetHandle)) {
      const moved = scalePoint(start.targetPoint, scaled.anchor, scaled.sx, scaled.sy);
      const hit = projectOntoBox(start.targetBox, moved);
      targetHandle = hit.side;
      targetFraction = hit.fraction;
    }
    const data: NoodleData = {
      ...start.data,
      bends: start.data.bends.map((point) => scalePoint(point, scaled.anchor, scaled.sx, scaled.sy)),
      curveOffset: start.data.curveOffset * perp,
      targetFraction,
    };
    edgesChanged = true;
    const next = applyNoodleData(edge, data);
    if (targetHandle === (edge.targetHandle ?? null)) return next;
    return { ...next, targetHandle };
  });

  return {
    nodes: nextNodes,
    edges: edgesChanged ? nextEdges : edges,
    box: scaled.box,
  };
}

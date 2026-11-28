import type { Edge, Node } from "@xyflow/react";
import { applyNoodleData, readNoodle } from "./noodleData";
import { ENDPOINT_TYPE } from "./noodleEnds";

type Delta = { x: number; y: number };

function sameDelta(a: Delta, b: Delta) {
  return Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01;
}

/**
 * Keep noodles with a dragged selection.
 * Endpoint ends of a selected noodle follow the end that moved.
 * Bends translate when both ends moved by the same amount.
 * `edges` is the graph from before this drag frame, so the shift is not applied twice.
 */
export function carryDraggedNoodles(
  before: readonly Node[],
  after: Node[],
  edges: readonly Edge[],
): { nodes: Node[]; edges: Edge[] } | null {
  const beforePos = new Map(before.map((node) => [node.id, node.position]));
  const deltas = new Map<string, Delta>();
  for (const node of after) {
    const prev = beforePos.get(node.id);
    if (!prev) continue;
    const delta = { x: node.position.x - prev.x, y: node.position.y - prev.y };
    if (delta.x !== 0 || delta.y !== 0) deltas.set(node.id, delta);
  }
  if (deltas.size === 0) return null;

  const typeOf = new Map(after.map((node) => [node.id, node.type]));
  const endpointDelta = new Map<string, Delta>();
  for (const edge of edges) {
    if (!edge.selected) continue;
    const source = deltas.get(edge.source);
    const target = deltas.get(edge.target);
    if (source && !target && typeOf.get(edge.target) === ENDPOINT_TYPE) endpointDelta.set(edge.target, source);
    if (target && !source && typeOf.get(edge.source) === ENDPOINT_TYPE) endpointDelta.set(edge.source, target);
  }

  let nodes = after;
  if (endpointDelta.size > 0) {
    nodes = after.map((node) => {
      const delta = endpointDelta.get(node.id);
      if (!delta) return node;
      deltas.set(node.id, delta);
      return { ...node, position: { x: node.position.x + delta.x, y: node.position.y + delta.y } };
    });
  }

  let edgesChanged = false;
  const nextEdges = edges.map((edge) => {
    const source = deltas.get(edge.source);
    const target = deltas.get(edge.target);
    if (!source || !target || !sameDelta(source, target)) return edge;
    const data = readNoodle(edge.data);
    if (data.bends.length === 0) return edge;
    edgesChanged = true;
    return applyNoodleData(edge, {
      ...data,
      bends: data.bends.map((point) => ({ x: point.x + source.x, y: point.y + source.y })),
    });
  });

  if (endpointDelta.size === 0 && !edgesChanged) return null;
  return { nodes, edges: edgesChanged ? nextEdges : [...edges] };
}

import type { Edge, Node } from "@xyflow/react";
import { ENDPOINT_TYPE, makeEndpoint } from "./noodleEnds";

/** First Ctrl+D in a chain steps copies this far to the right, in flow px. */
export const DUPLICATE_GAP = 32;

const STEP_EPSILON = 0.01;

export type FlowPoint = { x: number; y: number };

/** Last duplicate gesture, so the next Ctrl+D can repeat or adopt a move. */
export type RepeatMemory = {
  ids: Set<string>;
  birth: Map<string, FlowPoint>;
  step: FlowPoint;
};

export type DuplicateResult = {
  nodes: Node[];
  edges: Edge[];
  /** Non-endpoint clone ids. These are the selection after Ctrl+D. */
  cloneIds: string[];
  birth: Map<string, FlowPoint>;
};

function meaningful(step: FlowPoint) {
  return Math.abs(step.x) > STEP_EPSILON || Math.abs(step.y) > STEP_EPSILON;
}

function sameIds(a: ReadonlySet<string>, b: ReadonlySet<string>) {
  if (a.size !== b.size) return false;
  for (const id of a) if (!b.has(id)) return false;
  return true;
}

/**
 * Step for the next Ctrl+D.
 * A fresh selection starts at {@link DUPLICATE_GAP}.
 * When the selection is still the last clones, a later move replaces the step
 * with the delta from where that gesture created them. Otherwise the previous step is kept.
 */
export function nextDuplicateStep(
  nodes: readonly Node[],
  selectedIds: ReadonlySet<string>,
  memory: RepeatMemory | null,
): FlowPoint {
  const fresh = { x: DUPLICATE_GAP, y: 0 };
  if (!memory || !sameIds(selectedIds, memory.ids)) return fresh;
  for (const node of nodes) {
    if (!selectedIds.has(node.id)) continue;
    const origin = memory.birth.get(node.id);
    if (!origin) return memory.step;
    const delta = { x: node.position.x - origin.x, y: node.position.y - origin.y };
    return meaningful(delta) ? delta : memory.step;
  }
  return memory.step;
}

/** Alt-drag spacing: drag delta, and birth positions of the nodes that moved. */
export function repeatFromDrag(
  nodes: readonly Node[],
  nodeId: string,
  origin: FlowPoint,
  rootIds: ReadonlySet<string>,
): RepeatMemory | null {
  const moved = nodes.find((node) => node.id === nodeId);
  if (!moved) return null;
  const step = { x: moved.position.x - origin.x, y: moved.position.y - origin.y };
  if (!meaningful(step)) return null;
  const ids = new Set<string>();
  const birth = new Map<string, FlowPoint>();
  for (const node of nodes) {
    if (!rootIds.has(node.id) || node.type === ENDPOINT_TYPE) continue;
    ids.add(node.id);
    birth.set(node.id, { x: node.position.x, y: node.position.y });
  }
  if (ids.size === 0) return null;
  return { ids, birth, step };
}

function shiftedData(data: Edge["data"], delta: FlowPoint): Edge["data"] {
  if (!data || typeof data !== "object") return data;
  const cloned = structuredClone(data) as Record<string, unknown>;
  if (!Array.isArray(cloned.bends)) return cloned;
  cloned.bends = cloned.bends.map((point) => {
    if (!point || typeof point !== "object") return point;
    const bend = point as { x?: unknown; y?: unknown };
    if (typeof bend.x !== "number" || typeof bend.y !== "number") return point;
    return { ...bend, x: bend.x + delta.x, y: bend.y + delta.y };
  });
  return cloned;
}

function cloneNode(node: Node, id: string, delta: FlowPoint, selected: boolean): Node {
  const position = { x: node.position.x + delta.x, y: node.position.y + delta.y };
  if (node.type === ENDPOINT_TYPE) return makeEndpoint(id, position);
  const clone: Node = {
    id,
    type: node.type,
    position,
    data: node.data && typeof node.data === "object" ? structuredClone(node.data) : {},
    selected,
  };
  if (node.style) clone.style = structuredClone(node.style);
  if (typeof node.width === "number") clone.width = node.width;
  if (typeof node.height === "number") clone.height = node.height;
  if (typeof node.zIndex === "number") clone.zIndex = node.zIndex;
  return clone;
}

function cloneEdge(edge: Edge, id: string, source: string, target: string, delta: FlowPoint): Edge {
  const clone: Edge = {
    id,
    type: edge.type ?? "smoothstep",
    source,
    target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    data: shiftedData(edge.data, delta),
    selected: false,
  };
  if (edge.style) clone.style = structuredClone(edge.style);
  if (typeof edge.label === "string") clone.label = edge.label;
  if (typeof edge.zIndex === "number") clone.zIndex = edge.zIndex;
  return clone;
}

/**
 * Clone `rootIds` plus endpoint nodes required by noodles whose other end is in that set.
 * A noodle is copied only when both ends are in the resulting set.
 * `delta` is added to each clone position and to each copied bend.
 */
export function duplicateGraph(
  nodes: readonly Node[],
  edges: readonly Edge[],
  rootIds: ReadonlySet<string>,
  delta: FlowPoint,
  selectClones: boolean,
): DuplicateResult | null {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const roots = new Set<string>();
  for (const id of rootIds) {
    const node = byId.get(id);
    if (node && node.type !== ENDPOINT_TYPE) roots.add(id);
  }
  if (roots.size === 0) return null;

  const included = new Set(roots);
  for (const edge of edges) {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) continue;
    if (roots.has(source.id) && target.type === ENDPOINT_TYPE) included.add(target.id);
    if (roots.has(target.id) && source.type === ENDPOINT_TYPE) included.add(source.id);
  }

  const idMap = new Map<string, string>();
  for (const id of included) idMap.set(id, crypto.randomUUID());

  const cloneNodes: Node[] = [];
  const cloneIds: string[] = [];
  const birth = new Map<string, FlowPoint>();
  for (const node of nodes) {
    if (!included.has(node.id)) continue;
    const id = idMap.get(node.id);
    if (!id) continue;
    const selected = selectClones && node.type !== ENDPOINT_TYPE;
    const clone = cloneNode(node, id, delta, selected);
    cloneNodes.push(clone);
    if (node.type === ENDPOINT_TYPE) continue;
    cloneIds.push(id);
    birth.set(id, { x: clone.position.x, y: clone.position.y });
  }

  const cloneEdges: Edge[] = [];
  for (const edge of edges) {
    if (!included.has(edge.source) || !included.has(edge.target)) continue;
    const source = idMap.get(edge.source);
    const target = idMap.get(edge.target);
    if (!source || !target) continue;
    cloneEdges.push(cloneEdge(edge, crypto.randomUUID(), source, target, delta));
  }

  return { nodes: cloneNodes, edges: cloneEdges, cloneIds, birth };
}

/** Plain-text token written on Ctrl+C so paste can tell this board's copy from other text. */
export const NODE_CLIPBOARD_MARKER = "noodle-board/nodes";

export type NodeClipboard = {
  nodes: Node[];
  edges: Edge[];
  /** Pastes already made from this copy. The next one steps one gap further. */
  pastes: number;
};

/** Snapshot of the selected nodes and the noodles that stay inside that set. */
export function takeClipboard(
  nodes: readonly Node[],
  edges: readonly Edge[],
  rootIds: ReadonlySet<string>,
): NodeClipboard | null {
  const result = duplicateGraph(nodes, edges, rootIds, { x: 0, y: 0 }, false);
  if (!result) return null;
  return { nodes: result.nodes, edges: result.edges, pastes: 0 };
}

/**
 * Paste another copy of a clipboard.
 * Each paste is one gap further down and right than the last, so repeats do not stack.
 */
export function pasteClipboard(clip: NodeClipboard): { clipboard: NodeClipboard; result: DuplicateResult } | null {
  const rootIds = new Set(
    clip.nodes.filter((node) => node.type !== ENDPOINT_TYPE).map((node) => node.id),
  );
  const step = clip.pastes + 1;
  const result = duplicateGraph(
    clip.nodes,
    clip.edges,
    rootIds,
    { x: DUPLICATE_GAP * step, y: DUPLICATE_GAP * step },
    true,
  );
  if (!result) return null;
  return {
    clipboard: { nodes: clip.nodes, edges: clip.edges, pastes: step },
    result,
  };
}

/** Append clones that a later node/edge update would otherwise drop. */
export function appendMissing<T extends { id: string }>(current: readonly T[], extras: readonly T[] | null | undefined): T[] {
  if (!extras || extras.length === 0) return current as T[];
  const ids = new Set(current.map((item) => item.id));
  const missing = extras.filter((item) => !ids.has(item.id));
  if (missing.length === 0) return current as T[];
  return [...current, ...missing];
}

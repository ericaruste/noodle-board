import type { Connection, Edge, HandleType, Node, Position } from "@xyflow/react";
import { Position as Side } from "@xyflow/react";

/** Hit radius of the edge-updater circles. The visible knob is centered on that circle. */
export const END_RADIUS = 10;

/** Screen pixels. Larger than the default 10px reconnect grab radius. */
export const PORT_SCREEN_RADIUS = 48;

export const ENDPOINT_TYPE = "endpoint";
export const ENDPOINT_HANDLE = "end";
export const ENDPOINT_SIZE = 14;
export const ENDPOINT_Z = 2100;

export type HotPort = { nodeId: string; handleId: string | null };

export function draggedEnd(stationary: HandleType): HandleType {
  return stationary === "source" ? "target" : "source";
}

export function outward(fromX: number, fromY: number, toX: number, toY: number): Position {
  const dx = toX - fromX;
  const dy = toY - fromY;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? Side.Right : Side.Left;
  return dy >= 0 ? Side.Bottom : Side.Top;
}

export function knobCenter(x: number, y: number, position: Position) {
  if (position === Side.Left) return { cx: x - END_RADIUS, cy: y };
  if (position === Side.Right) return { cx: x + END_RADIUS, cy: y };
  if (position === Side.Top) return { cx: x, cy: y - END_RADIUS };
  return { cx: x, cy: y + END_RADIUS };
}

export function makeEndpoint(id: string, position: { x: number; y: number }): Node {
  return {
    id,
    type: ENDPOINT_TYPE,
    position,
    width: ENDPOINT_SIZE,
    height: ENDPOINT_SIZE,
    draggable: false,
    selectable: false,
    deletable: false,
    connectable: false,
    focusable: false,
    zIndex: ENDPOINT_Z,
    className: "nopan nodrag",
    data: {},
    style: { width: ENDPOINT_SIZE, height: ENDPOINT_SIZE },
  };
}

export function connectionForDrop(edge: Edge, dragged: HandleType, port: HotPort): Connection {
  if (dragged === "source") {
    return {
      source: port.nodeId,
      sourceHandle: port.handleId,
      target: edge.target,
      targetHandle: edge.targetHandle ?? null,
    };
  }
  return {
    source: edge.source,
    sourceHandle: edge.sourceHandle ?? null,
    target: port.nodeId,
    targetHandle: port.handleId,
  };
}

export function connectionForPark(edge: Edge, dragged: HandleType, endpointId: string): Connection {
  if (dragged === "source") {
    return {
      source: endpointId,
      sourceHandle: ENDPOINT_HANDLE,
      target: edge.target,
      targetHandle: edge.targetHandle ?? null,
    };
  }
  return {
    source: edge.source,
    sourceHandle: edge.sourceHandle ?? null,
    target: endpointId,
    targetHandle: ENDPOINT_HANDLE,
  };
}

export function sameEnds(edge: Edge, connection: Connection) {
  return (
    edge.source === connection.source &&
    edge.target === connection.target &&
    (edge.sourceHandle ?? null) === (connection.sourceHandle ?? null) &&
    (edge.targetHandle ?? null) === (connection.targetHandle ?? null)
  );
}

type EndConnection = {
  source?: string | null;
  target?: string | null;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

export function sameHandle(connection: EndConnection) {
  return (
    !!connection.source &&
    connection.source === connection.target &&
    (connection.sourceHandle ?? null) === (connection.targetHandle ?? null)
  );
}

export function allowsPort(nodes: Node[], dragged: HandleType, connection: EndConnection) {
  if (!connection.source || !connection.target) return false;
  if (sameHandle(connection)) return false;
  const nextId = dragged === "source" ? connection.source : connection.target;
  return !nodes.some((node) => node.id === nextId && node.type === ENDPOINT_TYPE);
}

export function pruneEndpoints(nodes: Node[], edges: Edge[]) {
  const used = new Set<string>();
  for (const edge of edges) {
    used.add(edge.source);
    used.add(edge.target);
  }
  return nodes.filter((node) => node.type !== ENDPOINT_TYPE || used.has(node.id));
}

export function edgeAnchor(edgeId: string, end: "source" | "target") {
  return document.querySelector(
    `[data-testid="rf__edge-${CSS.escape(edgeId)}"] .react-flow__edgeupdater-${end}`,
  );
}

export function forwardEndDrag(anchor: Element, point: { clientX: number; clientY: number }) {
  anchor.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      clientX: point.clientX,
      clientY: point.clientY,
      button: 0,
      buttons: 1,
      view: window,
    }),
  );
}

export function pointFromEvent(event: MouseEvent | TouchEvent) {
  if ("changedTouches" in event && event.changedTouches.length > 0) {
    const touch = event.changedTouches[0];
    return { x: touch.clientX, y: touch.clientY };
  }
  const mouse = event as MouseEvent;
  return { x: mouse.clientX, y: mouse.clientY };
}

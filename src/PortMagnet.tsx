import { useEffect, useRef } from "react";
import { Position, useStoreApi, type ReactFlowState, type XYPosition } from "@xyflow/react";
import { ENDPOINT_TYPE, PORT_SCREEN_RADIUS, type HotPort } from "./noodleEnds";
import { setHotPort } from "./portHot";

export function nearestPort(state: ReactFlowState, pointer?: XYPosition | null): HotPort | null {
  const fromHandle = state.connection.fromHandle;
  const point = pointer === undefined ? (state.connection.inProgress ? state.connection.pointer : null) : pointer;
  const [tx, ty, zoom] = state.transform;
  if (!point || zoom === 0) return null;
  const x = (point.x - tx) / zoom;
  const y = (point.y - ty) / zoom;
  const radius = PORT_SCREEN_RADIUS / zoom;
  let best: { port: HotPort; distance: number } | null = null;

  for (const node of state.nodeLookup.values()) {
    if (node.type === ENDPOINT_TYPE) continue;
    const handles = node.internals.handleBounds?.source ?? [];
    for (const handle of handles) {
      if (
        fromHandle &&
        fromHandle.nodeId === node.id &&
        (fromHandle.id ?? null) === (handle.id ?? null)
      ) {
        continue;
      }
      const hx = node.internals.positionAbsolute.x + handle.x + handle.width / 2;
      const hy = node.internals.positionAbsolute.y + handle.y + handle.height / 2;
      const distance = Math.hypot(hx - x, hy - y);
      if (distance > radius) continue;
      if (!best || distance < best.distance) {
        best = { port: { nodeId: node.id, handleId: handle.id ?? null }, distance };
      }
    }
  }

  return best?.port ?? null;
}

export function clientToFlow(state: ReactFlowState, clientX: number, clientY: number): XYPosition | null {
  const bounds = state.domNode?.getBoundingClientRect();
  const zoom = state.transform[2];
  if (!bounds || !zoom) return null;
  const [tx, ty] = state.transform;
  return {
    x: (clientX - bounds.left - tx) / zoom,
    y: (clientY - bounds.top - ty) / zoom,
  };
}

export function nearestHandleOnNode(state: ReactFlowState, nodeId: string, point: XYPosition): HotPort | null {
  const node = state.nodeLookup.get(nodeId);
  if (!node || node.type === ENDPOINT_TYPE) return null;
  const handles = node.internals.handleBounds?.source ?? [];
  let best: { port: HotPort; distance: number } | null = null;
  for (const handle of handles) {
    const hx = node.internals.positionAbsolute.x + handle.x + handle.width / 2;
    const hy = node.internals.positionAbsolute.y + handle.y + handle.height / 2;
    const distance = Math.hypot(hx - point.x, hy - point.y);
    if (!best || distance < best.distance) {
      best = { port: { nodeId, handleId: handle.id ?? null }, distance };
    }
  }
  return best?.port ?? null;
}

export function portGeometry(state: ReactFlowState, nodeId: string, handleId: string | null) {
  const node = state.nodeLookup.get(nodeId);
  if (!node) return null;
  const handles = node.internals.handleBounds?.source ?? [];
  const handle = handles.find((item) => (item.id ?? null) === handleId) ?? handles[0];
  if (!handle) return null;
  return {
    x: node.internals.positionAbsolute.x + handle.x + handle.width / 2,
    y: node.internals.positionAbsolute.y + handle.y + handle.height / 2,
    position: handle.position ?? Position.Right,
  };
}

function nodeAtFlowPoint(state: ReactFlowState, point: XYPosition) {
  let best: { id: string; z: number } | null = null;
  for (const node of state.nodeLookup.values()) {
    if (node.type === ENDPOINT_TYPE) continue;
    const width = node.measured.width ?? 0;
    const height = node.measured.height ?? 0;
    const x = node.internals.positionAbsolute.x;
    const y = node.internals.positionAbsolute.y;
    if (point.x < x || point.y < y || point.x > x + width || point.y > y + height) continue;
    const z = node.internals.z;
    if (!best || z >= best.z) best = { id: node.id, z };
  }
  return best?.id ?? null;
}

/** Nearest port on the node under the pointer. Used by the Arrow tool. */
export function portAtClient(state: ReactFlowState, clientX: number, clientY: number): HotPort | null {
  const flow = clientToFlow(state, clientX, clientY);
  if (!flow) return null;
  const nodeId = nodeAtFlowPoint(state, flow);
  if (!nodeId) return null;
  return nearestHandleOnNode(state, nodeId, flow);
}

export default function PortMagnet({ connectMode }: { connectMode: boolean }) {
  const store = useStoreApi();
  const pointerRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const apply = () => {
      const state = store.getState();
      if (connectMode && pointerRef.current) {
        const hovered = portAtClient(state, pointerRef.current.x, pointerRef.current.y);
        if (hovered) {
          setHotPort(hovered);
          return;
        }
      }
      if (state.connection.inProgress) {
        setHotPort(nearestPort(state));
        return;
      }
      setHotPort(null);
    };
    apply();
    return store.subscribe(apply);
  }, [connectMode, store]);

  useEffect(() => {
    if (!connectMode) {
      pointerRef.current = null;
      if (!store.getState().connection.inProgress) setHotPort(null);
      return;
    }
    const onMove = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
      const state = store.getState();
      const hovered = portAtClient(state, event.clientX, event.clientY);
      if (hovered) setHotPort(hovered);
      else if (state.connection.inProgress) setHotPort(nearestPort(state));
      else setHotPort(null);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [connectMode, store]);

  return null;
}

import { useEffect, useRef } from "react";
import { Position, ViewportPortal, useStore, useStoreApi, type ReactFlowState, type XYPosition } from "@xyflow/react";
import {
  containsPoint,
  isSide,
  nodeBox,
  pointOnSide,
  projectOntoBox,
  projectOntoSideMidpoint,
  sidePosition,
  type SideId,
} from "./attachment";
import { layers } from "./layers";
import { ENDPOINT_TYPE, PORT_SCREEN_RADIUS, forwardEndDrag, type HotPort } from "./noodleEnds";
import { getConnectionOrigin, getHotPort, setConnectionOrigin, setHotPort, useHotPort } from "./portHot";

/** Screen pixels. Hover and handle-drag grab the side this far from the border. */
const BAND_SCREEN_PX = 28;

export function pointerToFlow(state: ReactFlowState, pointer?: XYPosition | null): XYPosition | null {
  const flow = flowPoint(state, pointer);
  if (!flow) return null;
  return { x: flow.x, y: flow.y };
}

function flowPoint(state: ReactFlowState, pointer?: XYPosition | null) {
  const point = pointer === undefined ? (state.connection.inProgress ? state.connection.pointer : null) : pointer;
  const [tx, ty, zoom] = state.transform;
  if (!point || zoom === 0) return null;
  return { x: (point.x - tx) / zoom, y: (point.y - ty) / zoom, zoom };
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

function portFromHit(nodeId: string, hit: { side: SideId; fraction: number }): HotPort {
  return { nodeId, handleId: hit.side, fraction: hit.fraction };
}

/** A source-end drag lands on midpoints. A target-end drag follows the edge. */
export type AttachmentMode = "midpoint" | "edge";

export function connectionAttachmentMode(state: ReactFlowState): AttachmentMode {
  if (!state.connection.inProgress) return "midpoint";
  // The stationary handle is the source while the target end moves. Until that
  // handle is known, stay on midpoints so the origin side does not flash a free point.
  return state.connection.fromHandle?.type === "source" ? "edge" : "midpoint";
}

function projectForMode(box: Parameters<typeof projectOntoBox>[0], point: { x: number; y: number }, mode: AttachmentMode) {
  return mode === "midpoint" ? projectOntoSideMidpoint(box, point) : projectOntoBox(box, point);
}

function skipOrigin(nodeId: string, side: SideId, fraction: number) {
  const from = getConnectionOrigin();
  if (!from || from.nodeId !== nodeId || from.handleId !== side) return false;
  return Math.abs(from.fraction - fraction) < 0.02;
}

/** Closest port on any object, within `radius` flow units. */
function closestPerimeter(
  state: ReactFlowState,
  point: XYPosition,
  radius: number,
  mode: AttachmentMode,
): HotPort | null {
  let best: { port: HotPort; distance: number; z: number } | null = null;
  for (const node of state.nodeLookup.values()) {
    if (node.type === ENDPOINT_TYPE) continue;
    const box = nodeBox(node);
    if (!box) continue;
    const hit = projectForMode(box, point, mode);
    if (hit.distance > radius || skipOrigin(node.id, hit.side, hit.fraction)) continue;
    const z = node.internals.z ?? 0;
    if (!best || hit.distance < best.distance - 0.5 || (Math.abs(hit.distance - best.distance) <= 0.5 && z >= best.z)) {
      best = { port: portFromHit(node.id, hit), distance: hit.distance, z };
    }
  }
  return best?.port ?? null;
}

export function nearestPort(
  state: ReactFlowState,
  pointer?: XYPosition | null,
  mode: AttachmentMode = connectionAttachmentMode(state),
): HotPort | null {
  const flow = flowPoint(state, pointer);
  if (!flow) return null;
  return closestPerimeter(state, flow, PORT_SCREEN_RADIUS / flow.zoom, mode);
}

export function nearestHandleOnNode(
  state: ReactFlowState,
  nodeId: string,
  point: XYPosition,
  mode: AttachmentMode = "midpoint",
): HotPort | null {
  const node = state.nodeLookup.get(nodeId);
  if (!node || node.type === ENDPOINT_TYPE) return null;
  const box = nodeBox(node);
  if (!box) return null;
  return portFromHit(nodeId, projectForMode(box, point, mode));
}

function nodeAtFlowPoint(state: ReactFlowState, point: XYPosition) {
  let best: { id: string; z: number } | null = null;
  for (const node of state.nodeLookup.values()) {
    if (node.type === ENDPOINT_TYPE) continue;
    const box = nodeBox(node);
    if (!box || !containsPoint(box, point)) continue;
    const z = node.internals.z ?? 0;
    if (!best || z >= best.z) best = { id: node.id, z };
  }
  return best?.id ?? null;
}

/** Nearest port on the object under the pointer, or just outside its border. Used by the Arrow tool. */
export function portAtClient(
  state: ReactFlowState,
  clientX: number,
  clientY: number,
  mode: AttachmentMode = "midpoint",
): HotPort | null {
  const flow = clientToFlow(state, clientX, clientY);
  if (!flow || state.transform[2] === 0) return null;
  const nodeId = nodeAtFlowPoint(state, flow);
  if (nodeId) return nearestHandleOnNode(state, nodeId, flow, mode);
  return closestPerimeter(state, flow, BAND_SCREEN_PX / state.transform[2], mode);
}

/**
 * Side band outside the object (and a few pixels inside the border).
 * Interior clicks still move the object. Used to start a noodle from an occupied side.
 */
export function portOnBand(state: ReactFlowState, clientX: number, clientY: number): HotPort | null {
  const flow = clientToFlow(state, clientX, clientY);
  const zoom = state.transform[2];
  if (!flow || !zoom) return null;
  const radius = BAND_SCREEN_PX / zoom;
  const insideSlop = 6 / zoom;
  let best: { port: HotPort; distance: number; z: number } | null = null;
  for (const node of state.nodeLookup.values()) {
    if (node.type === ENDPOINT_TYPE) continue;
    const box = nodeBox(node);
    if (!box) continue;
    const hit = projectOntoSideMidpoint(box, flow);
    if (hit.distance > radius) continue;
    if (containsPoint(box, flow) && hit.distance > insideSlop) continue;
    const z = node.internals.z ?? 0;
    if (!best || hit.distance < best.distance - 0.5 || (Math.abs(hit.distance - best.distance) <= 0.5 && z >= best.z)) {
      best = { port: portFromHit(node.id, hit), distance: hit.distance, z };
    }
  }
  return best?.port ?? null;
}

export function portGeometry(
  state: ReactFlowState,
  nodeId: string,
  handleId: string | null,
  fraction?: number,
) {
  const node = state.nodeLookup.get(nodeId);
  if (!node) return null;
  if (isSide(handleId)) {
    const box = nodeBox(node);
    if (box) {
      const point = pointOnSide(box, handleId, fraction ?? 0.5);
      return { ...point, position: sidePosition(handleId) };
    }
  }
  const handles = node.internals.handleBounds?.source ?? [];
  const handle = handles.find((item) => (item.id ?? null) === handleId) ?? handles[0];
  if (!handle) return null;
  return {
    x: node.internals.positionAbsolute.x + handle.x + handle.width / 2,
    y: node.internals.positionAbsolute.y + handle.y + handle.height / 2,
    position: handle.position ?? Position.Right,
  };
}

function readOutset(nodeId: string) {
  const el = document.querySelector(`.react-flow__node[data-id="${CSS.escape(nodeId)}"] .noodle-node`);
  if (!(el instanceof HTMLElement)) return 14;
  const parsed = parseFloat(getComputedStyle(el).getPropertyValue("--noodle-handle-outset"));
  return Number.isFinite(parsed) ? parsed : 14;
}

const placed = new Set<string>();

function handleElement(nodeId: string, side: string) {
  return document.querySelector(
    `.react-flow__handle[data-nodeid="${CSS.escape(nodeId)}"][data-handleid="${CSS.escape(side)}"]`,
  );
}

/** Move the side's handle (and its measured bounds) to `fraction` so a drag starts there. */
export function placeHandle(state: ReactFlowState, nodeId: string, side: SideId, fraction: number) {
  const node = state.nodeLookup.get(nodeId);
  const box = node ? nodeBox(node) : null;
  const bounds = node?.internals.handleBounds?.source;
  const handle = bounds?.find((item) => item.id === side);
  if (node && box && handle) {
    const center = pointOnSide(box, side, fraction);
    let cx = center.x - box.x;
    let cy = center.y - box.y;
    const outset = readOutset(nodeId);
    if (side === "right") cx += outset;
    if (side === "left") cx -= outset;
    if (side === "top") cy -= outset;
    if (side === "bottom") cy += outset;
    handle.x = cx - handle.width / 2;
    handle.y = cy - handle.height / 2;
  }
  const el = handleElement(nodeId, side);
  if (el instanceof HTMLElement) {
    const percent = `${Math.min(1, Math.max(0, fraction)) * 100}%`;
    if (side === "top" || side === "bottom") el.style.left = percent;
    else el.style.top = percent;
  }
  return el instanceof Element ? el : null;
}

function resetHandle(state: ReactFlowState, nodeId: string, side: SideId) {
  placeHandle(state, nodeId, side, 0.5);
  const el = handleElement(nodeId, side);
  if (el instanceof HTMLElement) {
    el.style.left = "";
    el.style.top = "";
  }
}

/** Keep the origin handle on its midpoint. Slide only a different side to the landing fraction. */
export function syncPlacedHandles(state: ReactFlowState) {
  const wanted = new Map<string, { nodeId: string; side: SideId; fraction: number }>();
  const from = getConnectionOrigin();
  const hot = getHotPort();
  if (from && isSide(from.handleId)) {
    wanted.set(`${from.nodeId}:${from.handleId}`, { nodeId: from.nodeId, side: from.handleId, fraction: 0.5 });
  }
  if (hot && isSide(hot.handleId) && hot.fraction != null) {
    const key = `${hot.nodeId}:${hot.handleId}`;
    if (!wanted.has(key)) {
      wanted.set(key, {
        nodeId: hot.nodeId,
        side: hot.handleId,
        fraction: hot.fraction,
      });
    }
  }
  for (const key of placed) {
    if (wanted.has(key)) continue;
    const split = key.indexOf(":");
    const nodeId = key.slice(0, split);
    const side = key.slice(split + 1);
    if (isSide(side)) resetHandle(state, nodeId, side);
    placed.delete(key);
  }
  for (const [key, item] of wanted) {
    placeHandle(state, item.nodeId, item.side, item.fraction);
    placed.add(key);
  }
}

function HotMarker() {
  const port = useHotPort();
  const nodeId = port && isSide(port.handleId) ? port.nodeId : "";
  const side = port && isSide(port.handleId) ? port.handleId : null;
  const fraction = port?.fraction ?? 0.5;
  const boxKey = useStore((state) => {
    if (!side) return "";
    const box = nodeBox(state.nodeLookup.get(nodeId));
    if (!box) return "";
    return `${box.x}:${box.y}:${box.width}:${box.height}`;
  });
  if (!side || !boxKey) return null;
  const [x, y, width, height] = boxKey.split(":").map(Number);
  const point = pointOnSide({ x, y, width, height }, side, fraction);
  const outset = readOutset(nodeId);
  const marker =
    side === "right"
      ? { x: point.x + outset, y: point.y }
      : side === "left"
        ? { x: point.x - outset, y: point.y }
        : side === "top"
          ? { x: point.x, y: point.y - outset }
          : { x: point.x, y: point.y + outset };
  return (
    <ViewportPortal>
      <div
        className="noodle-port-marker"
        style={{
          zIndex: layers.selection,
          transform: `translate(${marker.x}px, ${marker.y}px) translate(-50%, -50%)`,
        }}
        aria-hidden
      />
    </ViewportPortal>
  );
}

function ignoredBandTarget(target: Element) {
  return Boolean(
    target.closest(
      ".react-flow__handle, .noodle-end, .react-flow__resize-control, .react-flow__minimap, .react-flow__panel, [data-noodle-toolbar], [data-noodle-anchor], .react-flow__node-endpoint",
    ),
  );
}

function containerPointer(state: ReactFlowState, clientX: number, clientY: number): XYPosition | null {
  const bounds = state.domNode?.getBoundingClientRect();
  if (!bounds) return null;
  return { x: clientX - bounds.left, y: clientY - bounds.top };
}

export default function PortMagnet({ connectMode }: { connectMode: boolean }) {
  const store = useStoreApi();
  const pointerRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const apply = () => syncPlacedHandles(store.getState());
    apply();
    return store.subscribe(apply);
  }, [store]);

  useEffect(() => {
    const placeAt = (clientX: number, clientY: number) => {
      const state = store.getState();
      if (state.connection.inProgress) {
        const pointer = containerPointer(state, clientX, clientY);
        setHotPort(pointer ? nearestPort(state, pointer) : null);
        syncPlacedHandles(state);
        return;
      }
      if (connectMode) {
        setHotPort(portAtClient(state, clientX, clientY));
        syncPlacedHandles(state);
        return;
      }
      setHotPort(portOnBand(state, clientX, clientY));
      syncPlacedHandles(state);
    };
    const onPointerMove = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
      placeAt(event.clientX, event.clientY);
    };
    const onMouseMove = (event: MouseEvent) => {
      if (!store.getState().connection.inProgress) return;
      placeAt(event.clientX, event.clientY);
    };
    window.addEventListener("pointermove", onPointerMove);
    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("mouseup", onMouseMove, true);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mousemove", onMouseMove, true);
      document.removeEventListener("mouseup", onMouseMove, true);
    };
  }, [connectMode, store]);

  useEffect(() => {
    if (connectMode) return;
    const root = store.getState().domNode;
    if (!root) return;
    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = event.target;
      if (!(target instanceof Element) || ignoredBandTarget(target)) return;
      if (target instanceof HTMLElement && target.isContentEditable) return;
      const state = store.getState();
      if (state.connection.inProgress) return;
      const port = portOnBand(state, event.clientX, event.clientY);
      if (!port?.handleId || !isSide(port.handleId) || port.fraction == null) return;
      const pin = { nodeId: port.nodeId, handleId: port.handleId, fraction: port.fraction };
      setConnectionOrigin(pin);
      setHotPort(pin);
      syncPlacedHandles(state);
      const handle = placeHandle(state, port.nodeId, port.handleId, port.fraction);
      if (!handle) return;
      event.preventDefault();
      event.stopPropagation();
      forwardEndDrag(handle, event);
    };
    root.addEventListener("pointerdown", onDown, true);
    return () => root.removeEventListener("pointerdown", onDown, true);
  }, [connectMode, store]);

  return <HotMarker />;
}

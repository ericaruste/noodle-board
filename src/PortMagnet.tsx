import { useEffect, useRef } from "react";
import { Position, ViewportPortal, useStore, useStoreApi, type ReactFlowState, type XYPosition } from "@xyflow/react";
import {
  containsPoint,
  isSide,
  nodeBox,
  outlineRadius,
  pointOnOutline,
  pointOnSide,
  projectOntoOutline,
  projectOntoSideMidpoint,
  routeEnd,
  sidePosition,
  SIDES,
  type SideId,
} from "./attachment";
import { layers } from "./layers";
import { ENDPOINT_TYPE, PORT_SCREEN_RADIUS, forwardEndDrag, type HotPort } from "./noodleEnds";
import { ROUTE_GAP } from "./noodleRoute";
import {
  consumePortGesture,
  beginPortGesture,
  captureReleaseLanding,
  getConnectionOrigin,
  getHotPort,
  getHoverTarget,
  holdSelection,
  notePortRelease,
  portGestureOwnsClick,
  readReleaseLanding,
  setConnectSession,
  setConnectionOrigin,
  setDragFeedback,
  setHotPort,
  swallowsClick,
  useHotPort,
  useHoverTarget,
  type HoverTarget,
} from "./portHot";

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

/** A port connect must not leave the noodle selected. Pass `nodes: []` so other elements stay selected. */
export function clearEdgeSelection(state: ReactFlowState) {
  const selected = state.edges.filter((edge) => edge.selected);
  if (selected.length === 0) return;
  state.unselectNodesAndEdges({ nodes: [], edges: selected });
}

/** Screen pixels past the port snap before a filled port returns to an outline. */
const PORT_SNAP_EXIT_PX = PORT_SCREEN_RADIUS + 10;
/** How far outside the outline still counts as over the element. */
const EDGE_BAND_PX = 14;

/** A source-end drag lands on midpoints. A target-end drag follows the edge. */
export type AttachmentMode = "midpoint" | "edge";
export type DragKind = "origin" | "target";

export function dragKind(state: ReactFlowState): DragKind {
  if (state.connection.inProgress && state.connection.fromHandle?.type === "target") return "origin";
  return "target";
}

export function portFromHover(target: HoverTarget, kind: DragKind): HotPort {
  return {
    nodeId: target.elementId,
    handleId: target.side,
    fraction: kind === "origin" || target.mode === "port" ? 0.5 : target.fraction,
  };
}

export function connectionAttachmentMode(state: ReactFlowState): AttachmentMode {
  if (!state.connection.inProgress) return "midpoint";
  // The stationary handle is the source while the target end moves. Until that
  // handle is known, stay on midpoints so the origin side does not flash a free point.
  return state.connection.fromHandle?.type === "source" ? "edge" : "midpoint";
}

function projectForMode(
  node: { type?: string; data?: unknown },
  box: NonNullable<ReturnType<typeof nodeBox>>,
  point: { x: number; y: number },
  mode: AttachmentMode,
) {
  const radius = outlineRadius(node.type, node.data, box);
  if (mode === "midpoint") {
    let best: { side: SideId; x: number; y: number; distance: number } | null = null;
    for (const side of SIDES) {
      const mid = pointOnOutline(box, side, 0.5, radius);
      const distance = Math.hypot(mid.x - point.x, mid.y - point.y);
      if (!best || distance < best.distance) best = { side, x: mid.x, y: mid.y, distance };
    }
    return { side: best?.side ?? "top", fraction: 0.5, x: best?.x ?? point.x, y: best?.y ?? point.y, distance: best?.distance ?? Infinity };
  }
  return projectOntoOutline(box, point, radius);
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
    const hit = projectForMode(node, box, point, mode);
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
  return portFromHit(nodeId, projectForMode(node, box, point, mode));
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
      const point = routeEnd(box, handleId, fraction ?? 0.5, outlineRadius(node.type, node.data, box), ROUTE_GAP);
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

/** True when the point is inside the outline, including a rounded rectangle's curve. */
function insideOutline(box: NonNullable<ReturnType<typeof nodeBox>>, point: XYPosition, radius: number) {
  if (!containsPoint(box, point)) return false;
  if (radius < 0.5) return true;
  const left = point.x < box.x + radius ? box.x + radius - point.x : 0;
  const right = point.x > box.x + box.width - radius ? point.x - (box.x + box.width - radius) : 0;
  const top = point.y < box.y + radius ? box.y + radius - point.y : 0;
  const bottom = point.y > box.y + box.height - radius ? point.y - (box.y + box.height - radius) : 0;
  const dx = left || right;
  const dy = top || bottom;
  if (!dx || !dy) return true;
  return dx * dx + dy * dy <= radius * radius;
}

/**
 * The element under the pointer, or the midpoint dot the pointer is close to.
 * Midpoint hits win over a free edge point. An origin drag never uses a free edge.
 */
export function resolveHover(state: ReactFlowState, point: XYPosition, kind: DragKind): HoverTarget | null {
  const zoom = state.transform[2] || 1;
  const prev = getHoverTarget();
  let contained: { id: string; box: NonNullable<ReturnType<typeof nodeBox>>; radius: number; z: number } | null = null;
  let outside: { id: string; side: SideId; distance: number; z: number } | null = null;

  for (const node of state.nodeLookup.values()) {
    if (node.type === ENDPOINT_TYPE) continue;
    const box = nodeBox(node);
    if (!box) continue;
    const radius = outlineRadius(node.type, node.data, box);
    const z = node.internals?.z ?? 0;
    const projected = projectOntoOutline(box, point, radius);
    const over = insideOutline(box, point, radius) || projected.distance * zoom <= EDGE_BAND_PX;
    if (over) {
      if (!contained || z >= contained.z) contained = { id: node.id, box, radius, z };
      continue;
    }
    const port = nearestMidpoint(node.id, box, radius, point, prev, zoom);
    if (!port) continue;
    if (!outside || port.distance < outside.distance - 0.5 || (Math.abs(port.distance - outside.distance) <= 0.5 && z >= outside.z)) {
      outside = { id: node.id, side: port.side, distance: port.distance, z };
    }
  }

  if (contained) {
    const port = nearestMidpoint(contained.id, contained.box, contained.radius, point, prev, zoom);
    if (port) return { elementId: contained.id, mode: "port", side: port.side, fraction: 0.5 };
    const edge = projectOntoOutline(contained.box, point, contained.radius);
    if (kind === "origin") {
      const side = originSide(contained.id, contained.box, contained.radius, point, edge.side);
      return { elementId: contained.id, mode: "port", side, fraction: 0.5 };
    }
    return { elementId: contained.id, mode: "edge", side: edge.side, fraction: edge.fraction };
  }
  if (!outside) return null;
  return { elementId: outside.id, mode: "port", side: outside.side, fraction: 0.5 };
}

function nearestMidpoint(
  nodeId: string,
  box: NonNullable<ReturnType<typeof nodeBox>>,
  radius: number,
  point: XYPosition,
  prev: HoverTarget | null,
  zoom: number,
) {
  let best: { side: SideId; distance: number } | null = null;
  for (const side of SIDES) {
    const mid = pointOnOutline(box, side, 0.5, radius);
    const distance = Math.hypot(mid.x - point.x, mid.y - point.y);
    if (!best || distance < best.distance) best = { side, distance };
  }
  if (!best || !zoom) return null;
  const pixels = prev?.elementId === nodeId && prev.mode === "port" && prev.side === best.side ? PORT_SNAP_EXIT_PX : PORT_SCREEN_RADIUS;
  if (best.distance > pixels / zoom) return null;
  return best;
}

function originSide(
  nodeId: string,
  box: NonNullable<ReturnType<typeof nodeBox>>,
  radius: number,
  point: XYPosition,
  projected: SideId,
) {
  if (!skipOrigin(nodeId, projected, 0.5)) return projected;
  let best: { side: SideId; distance: number } | null = null;
  for (const side of SIDES) {
    if (skipOrigin(nodeId, side, 0.5)) continue;
    const mid = pointOnOutline(box, side, 0.5, radius);
    const distance = Math.hypot(mid.x - point.x, mid.y - point.y);
    if (!best || distance < best.distance) best = { side, distance };
  }
  return best?.side ?? projected;
}

/** The element under a pointerup, including its center. Prefers the value captured before hover is cleared. */
export function hoverForRelease(
  state: ReactFlowState,
  clientX: number,
  clientY: number,
  kind: DragKind,
): HoverTarget | null {
  const captured = readReleaseLanding();
  if (captured !== undefined) return captured;
  const flow = clientToFlow(state, clientX, clientY);
  return flow ? resolveHover(state, flow, kind) : null;
}

/** Where the preview line ends: outside the side, on the midpoint or the free edge. */
export function landingGeometry(state: ReactFlowState, target: HoverTarget) {
  const node = state.nodeLookup.get(target.elementId);
  const box = node ? nodeBox(node) : null;
  if (!node || !box) return null;
  const radius = outlineRadius(node.type, node.data, box);
  const fraction = dragKind(state) === "origin" || target.mode === "port" ? 0.5 : target.fraction;
  const point = routeEnd(box, target.side, fraction, radius, ROUTE_GAP);
  return { ...point, side: target.side, position: sidePosition(target.side) };
}

/** Keep the origin handle on its midpoint. Slide a free landing only when no drag outline is showing. */
export function syncPlacedHandles(state: ReactFlowState) {
  const wanted = new Map<string, { nodeId: string; side: SideId; fraction: number }>();
  const from = getConnectionOrigin();
  const hot = getHotPort();
  if (from && isSide(from.handleId)) {
    wanted.set(`${from.nodeId}:${from.handleId}`, { nodeId: from.nodeId, side: from.handleId, fraction: 0.5 });
  }
  if (!getHoverTarget() && hot && isSide(hot.handleId) && hot.fraction != null) {
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
  const landing = useHoverTarget();
  const port = useHotPort();
  const nodeId = port && isSide(port.handleId) ? port.nodeId : "";
  const side = port && isSide(port.handleId) ? port.handleId : null;
  const fraction = port?.fraction ?? 0.5;
  const boxKey = useStore((state) => {
    if (!side) return "";
    const node = state.nodeLookup.get(nodeId);
    const box = nodeBox(node);
    if (!node || !box) return "";
    return `${box.x}:${box.y}:${box.width}:${box.height}:${outlineRadius(node.type, node.data, box)}`;
  });
  if (landing || !side || !boxKey) return null;
  const [x, y, width, height, radius] = boxKey.split(":").map(Number);
  const point = pointOnOutline({ x, y, width, height }, side, fraction, radius);
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

function DragLanding() {
  const hover = useHoverTarget();
  const zoom = useStore((state) => state.transform[2] || 1);
  const kind = useStore((state) => dragKind(state));
  const boxKey = useStore((state) => {
    const id = getHoverTarget()?.elementId;
    if (!id) return "";
    const node = state.nodeLookup.get(id);
    const box = nodeBox(node);
    if (!node || !box) return "";
    return `${box.x}:${box.y}:${box.width}:${box.height}:${outlineRadius(node.type, node.data, box)}`;
  });
  if (!hover || !boxKey) return null;
  const [x, y, width, height, radius] = boxKey.split(":").map(Number);
  const box = { x, y, width, height };
  const showMarker = kind === "target" && hover.mode === "edge" && !skipOrigin(hover.elementId, hover.side, hover.fraction);
  const marker = showMarker ? pointOnOutline(box, hover.side, hover.fraction, radius) : null;
  const markerSize = 8 / zoom;
  return (
    <ViewportPortal>
      <svg className="noodle-landing" style={{ zIndex: layers.selection }} aria-hidden>
        <rect
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          rx={radius}
          ry={radius}
          fill="none"
          stroke="#334155"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {marker ? (
        <div
          className="noodle-edge-marker"
          style={{
            zIndex: layers.selection,
            width: markerSize,
            height: markerSize,
            transform: `translate(${marker.x}px, ${marker.y}px) translate(-50%, -50%)`,
          }}
          aria-hidden
        />
      ) : null}
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

export default function PortMagnet({ connectMode }: { connectMode: boolean }) {
  const store = useStoreApi();
  const pointerRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const apply = () => syncPlacedHandles(store.getState());
    apply();
    return store.subscribe(apply);
  }, [store]);

  useEffect(() => {
    const sync = () => {
      const state = store.getState();
      setConnectSession(Boolean(state.connection.inProgress || state.connectionClickStartHandle));
    };
    sync();
    return store.subscribe(sync);
  }, [store]);

  useEffect(() => {
    const placeAt = (clientX: number, clientY: number) => {
      const state = store.getState();
      const armed = connectMode && state.connectionClickStartHandle;
      if (state.connection.inProgress || armed) {
        const flow = clientToFlow(state, clientX, clientY);
        const kind = dragKind(state);
        const hover = flow ? resolveHover(state, flow, kind) : null;
        setDragFeedback(hover, hover ? portFromHover(hover, kind) : null);
        syncPlacedHandles(state);
        return;
      }
      if (connectMode) {
        setDragFeedback(null, portAtClient(state, clientX, clientY));
        syncPlacedHandles(state);
        return;
      }
      // A port stays hidden until the element is selected or the Arrow tool is on.
      setDragFeedback(null, null);
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
    // Capture the landing before React Flow ends the drag. A later mouseup must not clear it.
    const onRelease = (event: Event) => {
      if (!(event instanceof MouseEvent) || event.button !== 0) return;
      const state = store.getState();
      const live = state.connection.inProgress;
      const armed = state.connectionClickStartHandle != null;
      if (!live && !armed) return;
      holdSelection();
      if (!live) return;
      const kind = dragKind(state);
      const flow = clientToFlow(state, event.clientX, event.clientY);
      captureReleaseLanding(flow ? resolveHover(state, flow, kind) : null);
    };
    const onPress = (event: PointerEvent) => {
      if (!connectMode || event.button !== 0) return;
      const state = store.getState();
      if (state.connection.inProgress) {
        holdSelection();
        return;
      }
      // Arm the guard before React Flow can select the element under this press.
      if (portAtClient(state, event.clientX, event.clientY)) holdSelection();
    };
    window.addEventListener("pointerdown", onPress, true);
    window.addEventListener("pointermove", onPointerMove);
    document.addEventListener("mousemove", onMouseMove, true);
    window.addEventListener("pointerup", onRelease, true);
    window.addEventListener("mouseup", onRelease, true);
    return () => {
      window.removeEventListener("pointerdown", onPress, true);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mousemove", onMouseMove, true);
      window.removeEventListener("pointerup", onRelease, true);
      window.removeEventListener("mouseup", onRelease, true);
    };
  }, [connectMode, store]);

  useEffect(() => {
    const stop = (event: Event) => {
      const target = event.target;
      const onNoodle = target instanceof Element && Boolean(target.closest(".react-flow__edge"));
      const owns = portGestureOwnsClick() && onNoodle;
      if (!swallowsClick() && !owns) return;
      if (owns) consumePortGesture();
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener("click", stop, true);
    window.addEventListener("dblclick", stop, true);
    return () => {
      window.removeEventListener("click", stop, true);
      window.removeEventListener("dblclick", stop, true);
    };
  }, []);

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
      clearEdgeSelection(state);
      holdSelection();
      beginPortGesture();
      const onRelease = () => {
        notePortRelease();
        window.removeEventListener("pointerup", onRelease, true);
        window.removeEventListener("pointercancel", onRelease, true);
      };
      window.addEventListener("pointerup", onRelease, true);
      window.addEventListener("pointercancel", onRelease, true);
      event.preventDefault();
      event.stopPropagation();
      forwardEndDrag(handle, event);
    };
    root.addEventListener("pointerdown", onDown, true);
    return () => root.removeEventListener("pointerdown", onDown, true);
  }, [connectMode, store]);

  return (
    <>
      <DragLanding />
      <HotMarker />
    </>
  );
}

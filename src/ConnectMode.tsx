import { useEffect, useRef, useState } from "react";
import {
  Position,
  ViewportPortal,
  useStore,
  useStoreApi,
  type Connection,
  type ReactFlowState,
} from "@xyflow/react";
import { layers } from "./layers";
import { routeFrame, useChromeLayout } from "./NoodleEdge";
import { layoutNoodle } from "./noodleRoute";
import { forwardEndDrag } from "./noodleEnds";
import { clientToFlow, landingGeometry, nearestHandleOnNode, placeHandle, portAtClient, portGeometry, syncPlacedHandles } from "./PortMagnet";
import { isSide, sameAttachmentPoint } from "./attachment";
import { armClickSwallow, getConnectionOrigin, getHoverTarget, setConnectionOrigin, setHotPort, clearConnectionOrigin } from "./portHot";

type ConnectModeProps = {
  active: boolean;
  onConnect: (connection: Connection) => void;
  isValidConnection: (connection: Connection) => boolean;
};

const DRAG_START = 5;

function facing(fromX: number, fromY: number, toX: number, toY: number): Position {
  const dx = toX - fromX;
  const dy = toY - fromY;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? Position.Left : Position.Right;
  return dy >= 0 ? Position.Top : Position.Bottom;
}

function blockedTarget(target: Element) {
  return Boolean(
    target.closest(
      ".react-flow__minimap, .react-flow__edge-toolbar, .react-flow__panel, [data-noodle-toolbar], [data-noodle-anchor], .react-flow__resize-control, .react-flow__node-endpoint",
    ),
  );
}

export default function ConnectMode({ active, onConnect, isValidConnection }: ConnectModeProps) {
  const store = useStoreApi();
  const start = useStore((state) => state.connectionClickStartHandle);
  const dragging = useStore((state) => state.connection.inProgress);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const onConnectRef = useRef(onConnect);
  const isValidRef = useRef(isValidConnection);
  onConnectRef.current = onConnect;
  isValidRef.current = isValidConnection;

  useEffect(() => {
    if (!active) {
      store.setState({ connectionClickStartHandle: null });
      clearConnectionOrigin();
      return;
    }
    const root = store.getState().domNode;
    if (!root) return;

    let gesture: { nodeId: string; handleId: string; fraction: number; x: number; y: number; dragged: boolean } | null = null;

    const finishGesture = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    const onMove = (event: PointerEvent) => {
      if (!gesture || gesture.dragged) return;
      if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < DRAG_START) return;
      if (!isSide(gesture.handleId)) return;
      const state = store.getState();
      const port = { nodeId: gesture.nodeId, handleId: gesture.handleId, fraction: gesture.fraction };
      setConnectionOrigin(port);
      setHotPort(port);
      syncPlacedHandles(state);
      const handle = placeHandle(state, gesture.nodeId, gesture.handleId, gesture.fraction);
      if (!handle) return;
      gesture.dragged = true;
      store.setState({ connectionClickStartHandle: null });
      forwardEndDrag(handle, event);
    };

    const onUp = (event: PointerEvent) => {
      const current = gesture;
      gesture = null;
      finishGesture();
      if (!current || current.dragged || event.button !== 0) return;
      const state = store.getState();
      const flow = clientToFlow(state, event.clientX, event.clientY);
      const armed = state.connectionClickStartHandle;
      const completing = Boolean(armed && armed.nodeId !== current.nodeId);
      const port = flow ? nearestHandleOnNode(state, current.nodeId, flow, completing ? "edge" : "midpoint") : null;
      const nodeId = current.nodeId;
      const handleId = port?.handleId ?? current.handleId;
      const fraction = port?.fraction ?? current.fraction;
      if (!handleId || !isSide(handleId)) return;
      const pin = { nodeId, handleId, fraction: completing ? fraction : 0.5 };
      if (!armed || armed.nodeId === nodeId) {
        setConnectionOrigin(pin);
        setHotPort(pin);
        syncPlacedHandles(state);
        store.setState({ connectionClickStartHandle: { nodeId, id: handleId, type: "source" } });
        setPointer({ x: event.clientX, y: event.clientY });
        return;
      }
      setHotPort(pin);
      syncPlacedHandles(state);
      const connection: Connection = {
        source: armed.nodeId,
        sourceHandle: armed.id ?? null,
        target: nodeId,
        targetHandle: handleId,
      };
      store.setState({ connectionClickStartHandle: null });
      if (
        !sameAttachmentPoint(
          connection.source,
          connection.sourceHandle,
          0.5,
          connection.target,
          connection.targetHandle,
          fraction,
        ) &&
        isValidRef.current(connection)
      ) {
        armClickSwallow();
        onConnectRef.current(connection);
      }
      clearConnectionOrigin();
      setHotPort(null);
    };

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = event.target;
      if (!(target instanceof Element) || blockedTarget(target)) return;
      const state = store.getState();
      const port = portAtClient(state, event.clientX, event.clientY);
      if (!port?.handleId || !isSide(port.handleId)) {
        if (state.connectionClickStartHandle) {
          store.setState({ connectionClickStartHandle: null });
          clearConnectionOrigin();
          setHotPort(null);
        }
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      gesture = {
        nodeId: port.nodeId,
        handleId: port.handleId,
        fraction: port.fraction ?? 0.5,
        x: event.clientX,
        y: event.clientY,
        dragged: false,
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || blockedTarget(target)) return;
      if (!portAtClient(store.getState(), event.clientX, event.clientY)) return;
      event.stopPropagation();
      event.preventDefault();
    };

    root.addEventListener("pointerdown", onDown, true);
    root.addEventListener("click", onClick, true);
    return () => {
      gesture = null;
      finishGesture();
      root.removeEventListener("pointerdown", onDown, true);
      root.removeEventListener("click", onClick, true);
      store.setState({ connectionClickStartHandle: null });
      clearConnectionOrigin();
      setHotPort(null);
    };
  }, [active, store]);

  useEffect(() => {
    if (!active || !start) return;
    const onMove = (event: PointerEvent) => setPointer({ x: event.clientX, y: event.clientY });
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [active, start]);

  if (!active || !start || !pointer || dragging) return null;
  return <ConnectPreview start={start} pointer={pointer} />;
}

function ConnectPreview({
  start,
  pointer,
}: {
  start: NonNullable<ReactFlowState["connectionClickStartHandle"]>;
  pointer: { x: number; y: number };
}) {
  useChromeLayout();
  const frame = useStore((state) =>
    routeFrame(state.transform as [number, number, number], state.width, state.height),
  );
  const store = useStoreApi();
  const state = store.getState();
  const origin = getConnectionOrigin();
  const fraction =
    origin && origin.nodeId === start.nodeId && origin.handleId === (start.id ?? "") ? origin.fraction : undefined;
  const from = portGeometry(state, start.nodeId, start.id ?? null, fraction);
  if (!from) return null;
  const bounds = state.domNode?.getBoundingClientRect();
  if (!bounds || state.transform[2] === 0) return null;
  const [tx, ty, zoom] = state.transform;
  const raw = {
    x: (pointer.x - bounds.left - tx) / zoom,
    y: (pointer.y - bounds.top - ty) / zoom,
  };
  const hover = getHoverTarget();
  const landing = hover ? landingGeometry(state, hover) : null;
  const to = landing ?? raw;
  const path = layoutNoodle({
    shape: "elbow",
    source: { x: from.x, y: from.y },
    target: { x: to.x, y: to.y },
    sourcePosition: from.position,
    targetPosition: landing ? landing.position : facing(from.x, from.y, to.x, to.y),
    bends: [],
    curveOffset: 0,
    frame,
  }).path;

  return (
    <ViewportPortal>
      <svg className="noodle-connect-preview" style={{ zIndex: layers.canvas }} aria-hidden>
        <defs>
          <marker id="noodle-connect-preview-arrow" viewBox="0 0 16 16" markerWidth="14" markerHeight="14" refX="14" refY="8" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M2 2.5 14 8 2 13.5 5.2 8Z" fill="#334155" />
          </marker>
        </defs>
        <path d={path} fill="none" stroke="#334155" strokeWidth={2} markerEnd="url(#noodle-connect-preview-arrow)" />
      </svg>
    </ViewportPortal>
  );
}

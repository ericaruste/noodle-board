import { useEffect, useRef, useState } from "react";
import {
  Position,
  ViewportPortal,
  getSmoothStepPath,
  useStore,
  useStoreApi,
  type Connection,
  type ReactFlowState,
} from "@xyflow/react";
import { forwardEndDrag } from "./noodleEnds";
import { clientToFlow, nearestHandleOnNode, portGeometry } from "./PortMagnet";

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

function ignoredTarget(target: Element) {
  return Boolean(
    target.closest(
      ".react-flow__handle, .react-flow__edge, .react-flow__minimap, .react-flow__edge-toolbar, .react-flow__panel, [data-noodle-toolbar], [data-noodle-anchor]",
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
      return;
    }
    const root = store.getState().domNode;
    if (!root) return;

    let gesture: { nodeId: string; handleId: string; x: number; y: number; dragged: boolean } | null = null;

    const finishGesture = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    const onMove = (event: PointerEvent) => {
      if (!gesture || gesture.dragged) return;
      if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < DRAG_START) return;
      const handle = document.querySelector(
        `.react-flow__handle[data-nodeid="${CSS.escape(gesture.nodeId)}"][data-handleid="${CSS.escape(gesture.handleId)}"]`,
      );
      if (!(handle instanceof Element)) return;
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
      const port = flow ? nearestHandleOnNode(state, current.nodeId, flow) : null;
      const nodeId = current.nodeId;
      const handleId = port?.handleId ?? current.handleId;
      if (!handleId) return;
      const armed = state.connectionClickStartHandle;
      if (!armed) {
        store.setState({ connectionClickStartHandle: { nodeId, id: handleId, type: "source" } });
        setPointer({ x: event.clientX, y: event.clientY });
        return;
      }
      if (armed.nodeId === nodeId) {
        if ((armed.id ?? null) !== handleId) {
          store.setState({ connectionClickStartHandle: { nodeId, id: handleId, type: "source" } });
        }
        return;
      }
      const connection: Connection = {
        source: armed.nodeId,
        sourceHandle: armed.id ?? null,
        target: nodeId,
        targetHandle: handleId,
      };
      store.setState({ connectionClickStartHandle: null });
      if (isValidRef.current(connection)) onConnectRef.current(connection);
    };

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = event.target;
      if (!(target instanceof Element) || ignoredTarget(target)) return;
      const nodeEl = target.closest(".react-flow__node");
      if (!(nodeEl instanceof HTMLElement) || nodeEl.classList.contains("react-flow__node-endpoint")) {
        if (store.getState().connectionClickStartHandle) store.setState({ connectionClickStartHandle: null });
        return;
      }
      const nodeId = nodeEl.dataset.id;
      if (!nodeId) return;
      const state = store.getState();
      const flow = clientToFlow(state, event.clientX, event.clientY);
      const port = flow ? nearestHandleOnNode(state, nodeId, flow) : null;
      if (!port?.handleId) return;
      event.stopPropagation();
      event.preventDefault();
      gesture = { nodeId, handleId: port.handleId, x: event.clientX, y: event.clientY, dragged: false };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || ignoredTarget(target)) return;
      const nodeEl = target.closest(".react-flow__node");
      if (!(nodeEl instanceof HTMLElement) || nodeEl.classList.contains("react-flow__node-endpoint")) return;
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
  const store = useStoreApi();
  const state = store.getState();
  const from = portGeometry(state, start.nodeId, start.id ?? null);
  if (!from) return null;
  const bounds = state.domNode?.getBoundingClientRect();
  if (!bounds || state.transform[2] === 0) return null;
  const [tx, ty, zoom] = state.transform;
  const to = {
    x: (pointer.x - bounds.left - tx) / zoom,
    y: (pointer.y - bounds.top - ty) / zoom,
  };
  const [path] = getSmoothStepPath({
    sourceX: from.x,
    sourceY: from.y,
    sourcePosition: from.position,
    targetX: to.x,
    targetY: to.y,
    targetPosition: facing(from.x, from.y, to.x, to.y),
  });

  return (
    <ViewportPortal>
      <svg className="noodle-connect-preview" aria-hidden>
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

import { useEffect } from "react";
import { useStoreApi, type ReactFlowState } from "@xyflow/react";
import { ENDPOINT_TYPE, PORT_SCREEN_RADIUS, type HotPort } from "./noodleEnds";
import { setHotPort } from "./portHot";

function nearestPort(state: ReactFlowState): HotPort | null {
  if (!state.connection.inProgress) return null;
  const { pointer, fromHandle } = state.connection;
  const [tx, ty, zoom] = state.transform;
  if (!pointer || zoom === 0) return null;
  const x = (pointer.x - tx) / zoom;
  const y = (pointer.y - ty) / zoom;
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

export default function PortMagnet() {
  const store = useStoreApi();

  useEffect(() => {
    const apply = () => setHotPort(nearestPort(store.getState()));
    apply();
    return store.subscribe(apply);
  }, [store]);

  return null;
}

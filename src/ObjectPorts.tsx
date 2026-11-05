import { Handle, Position, useStore } from "@xyflow/react";
import type { SideId } from "./attachment";
import { useHandlePlacement, useHoverTarget, usePortsElement } from "./portHot";

const SIDES = ["Top", "Right", "Bottom", "Left"] as const;

function offsetStyle(side: SideId, fraction: number) {
  const percent = `${fraction * 100}%`;
  if (side === "left" || side === "right") return { top: percent };
  return { left: percent };
}

function ObjectPort({ nodeId, side }: { nodeId: string; side: (typeof SIDES)[number] }) {
  const handleId = side.toLowerCase() as SideId;
  const hover = useHoverTarget();
  const portsElementId = usePortsElement();
  const placement = useHandlePlacement(nodeId, handleId);
  const connecting = useStore((state) => state.connection.inProgress || state.connectionClickStartHandle != null);
  const landing = hover?.elementId === nodeId;
  const filled = landing && hover.mode === "port" && hover.side === handleId;
  const originPort = connecting && placement != null && !placement.hot;
  const showPorts = portsElementId === nodeId || originPort;
  const className = landing
    ? filled
      ? "noodle-port-fill"
      : "noodle-port-outline"
    : placement?.hot
      ? "noodle-port-hot"
      : showPorts
        ? "noodle-ports-show"
        : undefined;
  return (
    <Handle
      id={handleId}
      type="source"
      position={Position[side]}
      className={className}
      style={landing || !placement ? undefined : offsetStyle(handleId, placement.fraction)}
    />
  );
}

export default function ObjectPorts({ nodeId }: { nodeId: string }) {
  return (
    <>
      {SIDES.map((side) => (
        <ObjectPort key={side} nodeId={nodeId} side={side} />
      ))}
    </>
  );
}

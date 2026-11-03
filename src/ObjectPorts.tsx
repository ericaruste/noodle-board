import { Handle, Position } from "@xyflow/react";
import type { SideId } from "./attachment";
import { useHandlePlacement, useHoverTarget } from "./portHot";

const SIDES = ["Top", "Right", "Bottom", "Left"] as const;

function offsetStyle(side: SideId, fraction: number) {
  const percent = `${fraction * 100}%`;
  if (side === "left" || side === "right") return { top: percent };
  return { left: percent };
}

function ObjectPort({ nodeId, side }: { nodeId: string; side: (typeof SIDES)[number] }) {
  const handleId = side.toLowerCase() as SideId;
  const hover = useHoverTarget();
  const placement = useHandlePlacement(nodeId, handleId);
  const landing = hover?.elementId === nodeId;
  const filled = landing && hover.mode === "port" && hover.side === handleId;
  const className = landing ? (filled ? "noodle-port-fill" : "noodle-port-outline") : placement?.hot ? "noodle-port-hot" : undefined;
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

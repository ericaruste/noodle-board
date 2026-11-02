import { Handle, Position } from "@xyflow/react";
import type { SideId } from "./attachment";
import { useHandlePlacement } from "./portHot";

const SIDES = ["Top", "Right", "Bottom", "Left"] as const;

function offsetStyle(side: SideId, fraction: number) {
  const percent = `${fraction * 100}%`;
  if (side === "left" || side === "right") return { top: percent };
  return { left: percent };
}

function ObjectPort({ nodeId, side }: { nodeId: string; side: (typeof SIDES)[number] }) {
  const handleId = side.toLowerCase() as SideId;
  const placement = useHandlePlacement(nodeId, handleId);
  return (
    <Handle
      id={handleId}
      type="source"
      position={Position[side]}
      className={placement?.hot ? "noodle-port-hot" : undefined}
      style={placement ? offsetStyle(handleId, placement.fraction) : undefined}
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

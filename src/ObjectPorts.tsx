import { Handle, Position } from "@xyflow/react";
import { usePortHot } from "./portHot";

const SIDES = ["Top", "Right", "Bottom", "Left"] as const;

function ObjectPort({ nodeId, side }: { nodeId: string; side: (typeof SIDES)[number] }) {
  const handleId = side.toLowerCase();
  const hot = usePortHot(nodeId, handleId);
  return (
    <Handle
      id={handleId}
      type="source"
      position={Position[side]}
      className={hot ? "noodle-port-hot" : undefined}
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

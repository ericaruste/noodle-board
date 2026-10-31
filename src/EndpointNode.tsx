import { Handle, Position, useStore, type Node, type NodeProps } from "@xyflow/react";
import { ENDPOINT_HANDLE, edgeAnchor, forwardEndDrag } from "./noodleEnds";

export type EndpointNodeType = Node<Record<string, never>, "endpoint">;

export default function EndpointNode({ id }: NodeProps<EndpointNodeType>) {
  const edge = useStore((state) => {
    for (const item of state.edges) {
      if (item.source === id || item.target === id) return item;
    }
    return undefined;
  });

  return (
    <div
      className={`noodle-endpoint nodrag nopan${edge?.selected ? " noodle-endpoint-selected" : ""}`}
      aria-label="Noodle end"
      onPointerDown={(event) => {
        if (event.button !== 0 || !edge) return;
        const end = edge.source === id ? "source" : "target";
        const anchor = edgeAnchor(edge.id, end);
        if (!(anchor instanceof Element)) return;
        event.preventDefault();
        event.stopPropagation();
        forwardEndDrag(anchor, event);
      }}
    >
      <Handle id={ENDPOINT_HANDLE} type="source" position={Position.Left} isConnectable={false} />
    </div>
  );
}

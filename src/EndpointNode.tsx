import { Handle, Position, useStore, type Node, type NodeProps } from "@xyflow/react";
import { ENDPOINT_HANDLE } from "./noodleEnds";

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
      onMouseDown={(event) => {
        if (event.button !== 0 || !edge) return;
        const end = edge.source === id ? "source" : "target";
        const anchor = document.querySelector(
          `[data-testid="rf__edge-${CSS.escape(edge.id)}"] .react-flow__edgeupdater-${end}`,
        );
        if (!(anchor instanceof Element)) return;
        event.preventDefault();
        event.stopPropagation();
        anchor.dispatchEvent(
          new MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            clientX: event.clientX,
            clientY: event.clientY,
            button: 0,
            buttons: 1,
            view: window,
          }),
        );
      }}
    >
      <Handle id={ENDPOINT_HANDLE} type="source" position={Position.Left} isConnectable={false} />
    </div>
  );
}

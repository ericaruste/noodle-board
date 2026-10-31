import { Position, SmoothStepEdge, useStore, type EdgeProps } from "@xyflow/react";
import { GAP_PX, zoomCompensate } from "./NoodleResizer";
import { ENDPOINT_TYPE, edgeAnchor, forwardEndDrag, knobOnRim, outward } from "./noodleEnds";

type FlowNode = {
  measured?: { width?: number | null; height?: number | null };
  internals?: { positionAbsolute: { x: number; y: number } };
};

function atGap(node: FlowNode | undefined, position: Position, x: number, y: number, gap: number) {
  const width = node?.measured?.width;
  const height = node?.measured?.height;
  const origin = node?.internals?.positionAbsolute;
  if (!origin || !width || !height) return { x, y };
  if (position === Position.Left) return { x: origin.x - gap, y };
  if (position === Position.Right) return { x: origin.x + width + gap, y };
  if (position === Position.Top) return { x, y: origin.y - gap };
  return { x, y: origin.y + height + gap };
}

function EndKnob({
  edgeId,
  x,
  y,
  position,
  end,
}: {
  edgeId: string;
  x: number;
  y: number;
  position: Position;
  end: "source" | "target";
}) {
  const size = 14;
  const { cx, cy } = knobOnRim(x, y, position, size / 2);
  return (
    <foreignObject x={cx - size / 2} y={cy - size / 2} width={size} height={size} className="noodle-end">
      <div
        role="button"
        aria-label={`Drag ${end} end`}
        className="noodle-end-dot nodrag nopan"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          const anchor = edgeAnchor(edgeId, end);
          if (!(anchor instanceof Element)) return;
          event.preventDefault();
          event.stopPropagation();
          forwardEndDrag(anchor, event);
        }}
      />
    </foreignObject>
  );
}

export default function NoodleEdge(props: EdgeProps) {
  const sourceNode = useStore((state) => state.nodeLookup.get(props.source));
  const targetNode = useStore((state) => state.nodeLookup.get(props.target));
  const zoom = useStore((state) => state.transform[2]);
  const sourceType = sourceNode?.type;
  const targetType = targetNode?.type;
  const sourcePosition =
    sourceType === ENDPOINT_TYPE
      ? outward(props.sourceX, props.sourceY, props.targetX, props.targetY)
      : props.sourcePosition;
  const targetPosition =
    targetType === ENDPOINT_TYPE
      ? outward(props.targetX, props.targetY, props.sourceX, props.sourceY)
      : props.targetPosition;
  const gap = GAP_PX * zoomCompensate(zoom);
  const source =
    sourceType === ENDPOINT_TYPE
      ? { x: props.sourceX, y: props.sourceY }
      : atGap(sourceNode, sourcePosition, props.sourceX, props.sourceY, gap);
  const target =
    targetType === ENDPOINT_TYPE
      ? { x: props.targetX, y: props.targetY }
      : atGap(targetNode, targetPosition, props.targetX, props.targetY, gap);

  return (
    <>
      <SmoothStepEdge
        {...props}
        sourceX={source.x}
        sourceY={source.y}
        targetX={target.x}
        targetY={target.y}
        sourcePosition={sourcePosition}
        targetPosition={targetPosition}
      />
      {props.selected && sourceType !== ENDPOINT_TYPE && (
        <EndKnob edgeId={props.id} x={source.x} y={source.y} position={sourcePosition} end="source" />
      )}
      {props.selected && targetType !== ENDPOINT_TYPE && (
        <EndKnob edgeId={props.id} x={target.x} y={target.y} position={targetPosition} end="target" />
      )}
    </>
  );
}

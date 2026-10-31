import { SmoothStepEdge, useStore, type EdgeProps, type Position } from "@xyflow/react";
import { ENDPOINT_TYPE, edgeAnchor, forwardEndDrag, knobCenter, outward } from "./noodleEnds";

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
  const { cx, cy } = knobCenter(x, y, position);
  const size = 14;
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
  const sourceType = useStore((state) => state.nodeLookup.get(props.source)?.type);
  const targetType = useStore((state) => state.nodeLookup.get(props.target)?.type);
  const sourcePosition =
    sourceType === ENDPOINT_TYPE
      ? outward(props.sourceX, props.sourceY, props.targetX, props.targetY)
      : props.sourcePosition;
  const targetPosition =
    targetType === ENDPOINT_TYPE
      ? outward(props.targetX, props.targetY, props.sourceX, props.sourceY)
      : props.targetPosition;

  return (
    <>
      <SmoothStepEdge {...props} sourcePosition={sourcePosition} targetPosition={targetPosition} />
      {props.selected && sourceType !== ENDPOINT_TYPE && (
        <EndKnob edgeId={props.id} x={props.sourceX} y={props.sourceY} position={props.sourcePosition} end="source" />
      )}
      {props.selected && targetType !== ENDPOINT_TYPE && (
        <EndKnob edgeId={props.id} x={props.targetX} y={props.targetY} position={props.targetPosition} end="target" />
      )}
    </>
  );
}

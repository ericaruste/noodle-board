import { SmoothStepEdge, useStore, type EdgeProps, type Position } from "@xyflow/react";
import { ENDPOINT_TYPE, knobCenter, outward } from "./noodleEnds";

function EndKnob({
  x,
  y,
  position,
  end,
}: {
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
        onMouseDown={(event) => {
          if (event.button !== 0) return;
          const edge = event.currentTarget.closest(".react-flow__edge");
          const anchor = edge?.querySelector(`.react-flow__edgeupdater-${end}`);
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
      {sourceType !== ENDPOINT_TYPE && (
        <EndKnob x={props.sourceX} y={props.sourceY} position={props.sourcePosition} end="source" />
      )}
      {targetType !== ENDPOINT_TYPE && (
        <EndKnob x={props.targetX} y={props.targetY} position={props.targetPosition} end="target" />
      )}
    </>
  );
}

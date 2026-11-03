import { useStore, type ConnectionLineComponentProps, type Node } from "@xyflow/react";
import { routeFrame } from "./NoodleEdge";
import { landingGeometry } from "./PortMagnet";
import { layoutNoodle } from "./noodleRoute";
import { getHoverTarget, useHoverTarget } from "./portHot";

/** Preview follows the landing point. The raw pointer is never the end while a landing is active. */
export default function NoodleConnectionLine({
  fromX,
  fromY,
  fromPosition,
  toX,
  toY,
  toPosition,
}: ConnectionLineComponentProps<Node>) {
  const hover = useHoverTarget();
  const landing = useStore((state) => {
    const current = getHoverTarget();
    if (!current) return "";
    const point = landingGeometry(state, current);
    if (!point) return "";
    return `${point.x}:${point.y}:${point.position}`;
  });
  let targetX = toX;
  let targetY = toY;
  let targetPosition = toPosition;
  if (hover && landing) {
    const [x, y, position] = landing.split(":");
    targetX = Number(x);
    targetY = Number(y);
    targetPosition = position as typeof toPosition;
  }
  const frame = useStore((state) =>
    routeFrame(state.transform as [number, number, number], state.width, state.height),
  );
  const path = layoutNoodle({
    shape: "elbow",
    source: { x: fromX, y: fromY },
    target: { x: targetX, y: targetY },
    sourcePosition: fromPosition,
    targetPosition,
    bends: [],
    curveOffset: 0,
    frame,
  }).path;
  return (
    <>
      <defs>
        <marker
          id="noodle-drag-arrow"
          viewBox="0 0 16 16"
          markerWidth="14"
          markerHeight="14"
          refX="14"
          refY="8"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M2 2.5 14 8 2 13.5 5.2 8Z" fill="#334155" />
        </marker>
      </defs>
      <path
        d={path}
        fill="none"
        stroke="#334155"
        strokeWidth={2}
        className="react-flow__connection-path"
        markerEnd="url(#noodle-drag-arrow)"
      />
    </>
  );
}

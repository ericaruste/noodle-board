import { memo } from "react";
import { type Node, type NodeProps } from "@xyflow/react";
import { NoodleResizer, useNoodleResizeStyle } from "./NoodleResizer";
import ObjectPorts from "./ObjectPorts";

export type ImageData = {
  src: string;
};

export type ImageNodeType = Node<ImageData, "image">;

/** Smallest grab size. The short side of a thin image may already be under 80px,
 *  and the other minimum stays proportional so a resize cannot crop it back. */
function imageResizeBounds(width?: number | null, height?: number | null) {
  const w = typeof width === "number" && width > 0 ? width : 1;
  const h = typeof height === "number" && height > 0 ? height : 1;
  const floor = Math.min(8, w, h);
  if (w <= h) return { minWidth: floor, minHeight: (floor * h) / w };
  return { minWidth: (floor * w) / h, minHeight: floor };
}

function ImageNode({ id, data, selected, width, height }: NodeProps<ImageNodeType>) {
  const resizeStyle = useNoodleResizeStyle();
  const bounds = imageResizeBounds(width, height);

  return (
    <div
      role="img"
      aria-label="Image"
      className="noodle-node relative h-full w-full"
      style={resizeStyle}
    >
      <NoodleResizer
        selected={selected}
        keepAspectRatio
        minWidth={bounds.minWidth}
        minHeight={bounds.minHeight}
        onResizeStart={() => window.dispatchEvent(new Event("noodle-snapshot"))}
      />
      <img
        src={data.src}
        alt=""
        draggable={false}
        className="block h-full w-full"
        style={{ filter: "drop-shadow(2px 4px 12px rgba(15, 23, 42, 0.18))" }}
      />
      <ObjectPorts nodeId={id} />
    </div>
  );
}

export default memo(ImageNode);

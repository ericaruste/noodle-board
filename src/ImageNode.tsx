import { memo } from "react";
import { useStore, type Node, type NodeProps } from "@xyflow/react";
import { NoodleResizer, useNoodleResizeStyle } from "./NoodleResizer";
import ObjectPorts from "./ObjectPorts";

export type ImageData = {
  src: string;
};

export type ImageNodeType = Node<ImageData, "image">;

type Size = { width: number; height: number };

function sameSize(a: Size | null, b: Size | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.width === b.width && a.height === b.height;
}

/** Short side may stay under 80. The other minimum stays proportional so a resize cannot crop the picture. */
function imageResizeBounds(width: number, height: number) {
  const floor = Math.min(8, width, height);
  if (width <= height) return { minWidth: floor, minHeight: (floor * height) / width };
  return { minWidth: (floor * width) / height, minHeight: floor };
}

function ImageNode({ id, data, selected }: NodeProps<ImageNodeType>) {
  const resizeStyle = useNoodleResizeStyle();
  const measured = useStore((state) => {
    const node = state.nodeLookup.get(id);
    const width = node?.measured.width;
    const height = node?.measured.height;
    if (!width || !height) return null;
    return { width, height };
  }, sameSize);
  const bounds = measured
    ? imageResizeBounds(measured.width, measured.height)
    : { minWidth: 8, minHeight: 8 };

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
        className="block h-full w-full object-contain"
        style={{ filter: "drop-shadow(2px 4px 12px rgba(15, 23, 42, 0.18))" }}
      />
      <ObjectPorts nodeId={id} />
    </div>
  );
}

export default memo(ImageNode);

import { memo } from "react";
import { type Node, type NodeProps } from "@xyflow/react";
import { NoodleResizer, useNoodleResizeStyle } from "./NoodleResizer";
import ObjectPorts from "./ObjectPorts";

export type ImageData = {
  src: string;
};

export type ImageNodeType = Node<ImageData, "image">;

function ImageNode({ id, data, selected }: NodeProps<ImageNodeType>) {
  const resizeStyle = useNoodleResizeStyle();

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
        minWidth={1}
        minHeight={1}
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

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
        minWidth={80}
        minHeight={80}
        onResizeStart={() => window.dispatchEvent(new Event("noodle-snapshot"))}
      />
      <div className="h-full w-full overflow-hidden rounded-md bg-white shadow-[2px_4px_12px_rgba(15,23,42,0.18)]">
        <img
          src={data.src}
          alt=""
          draggable={false}
          className="h-full w-full object-cover"
        />
      </div>
      <ObjectPorts nodeId={id} />
    </div>
  );
}

export default memo(ImageNode);

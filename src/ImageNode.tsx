import { memo } from "react";
import {
  Handle,
  NodeResizer,
  Position,
  type Node,
  type NodeProps,
} from "@xyflow/react";

export type ImageData = {
  src: string;
};

export type ImageNodeType = Node<ImageData, "image">;

function ImageNode({ data, selected }: NodeProps<ImageNodeType>) {

  return (
    <div
      role="img"
      aria-label="Image"
      className="relative h-full w-full overflow-hidden rounded-md bg-white shadow-[2px_4px_12px_rgba(15,23,42,0.18)]"
    >
      <NodeResizer
        isVisible={selected}
        keepAspectRatio
        minWidth={80}
        minHeight={80}
        lineClassName="border-slate-400"
        handleClassName="h-2 w-2 rounded-sm border border-slate-500 bg-white"
        onResizeStart={() => window.dispatchEvent(new Event("noodle-snapshot"))}
      />
      {(["Top", "Right", "Bottom", "Left"] as const).map((side) => (
        <Handle
          key={side}
          id={side.toLowerCase()}
          type="source"
          position={Position[side]}
        />
      ))}
      <img
        src={data.src}
        alt=""
        draggable={false}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

export default memo(ImageNode);

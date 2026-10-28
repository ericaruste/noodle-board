import { memo, useEffect, useRef, useState } from "react";
import {
  Handle,
  NodeResizer,
  Position,
  type Node,
  type NodeProps,
} from "@xyflow/react";

function snapshot() {
  window.dispatchEvent(new Event("noodle-snapshot"));
}

export const STICKY_COLORS = {
  yellow: "#fef08a",
  pink: "#fbcfe8",
  blue: "#bfdbfe",
  green: "#bbf7d0",
} as const;

export type StickyColor = keyof typeof STICKY_COLORS;

export type StickyData = {
  text: string;
  color: StickyColor;
};

export type StickyNodeType = Node<StickyData, "sticky">;

function StickyNode({ id, data, selected }: NodeProps<StickyNodeType>) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(data.text);
  }, [data.text]);

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft === data.text) return;
    snapshot();
    window.dispatchEvent(
      new CustomEvent("noodle-update-node", {
        detail: { id, data: { ...data, text: draft } },
      }),
    );
  };

  return (
    <div
      role="group"
      aria-label="Sticky note"
      className="relative h-full w-full rounded-sm shadow-[2px_4px_12px_rgba(15,23,42,0.18)]"
      style={{ background: STICKY_COLORS[data.color] }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        setEditing(true);
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={140}
        minHeight={140}
        lineClassName="border-slate-400"
        handleClassName="h-2 w-2 rounded-sm border border-slate-500 bg-white"
        onResizeStart={snapshot}
      />
      {(["Top", "Right", "Bottom", "Left"] as const).map((side) => (
        <Handle
          key={side}
          id={side.toLowerCase()}
          type="source"
          position={Position[side]}
        />
      ))}
      {editing ? (
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Escape") {
              setDraft(data.text);
              setEditing(false);
            }
          }}
          className="nodrag nopan nowheel h-full w-full resize-none bg-transparent p-3 text-sm leading-5 text-slate-800 outline-none"
        />
      ) : (
        <div className="h-full w-full whitespace-pre-wrap p-3 text-sm leading-5 text-slate-800">
          {data.text || "Double-click to write"}
        </div>
      )}
      {selected && (
        <div className="nodrag nopan absolute -bottom-8 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-white p-1 shadow">
          {(Object.keys(STICKY_COLORS) as StickyColor[]).map((color) => (
            <button
              key={color}
              type="button"
              aria-label={color}
              className="h-5 w-5 rounded-full border border-black/10"
              style={{ background: STICKY_COLORS[color] }}
              onClick={(event) => {
                event.stopPropagation();
                if (color === data.color) return;
                snapshot();
                window.dispatchEvent(
                  new CustomEvent("noodle-update-node", {
                    detail: { id, data: { ...data, color } },
                  }),
                );
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(StickyNode);

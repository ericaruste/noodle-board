import { memo, useMemo, useRef, useState } from "react";
import { type Node, type NodeProps } from "@xyflow/react";
import { NoodleResizer, useNoodleResizeStyle } from "./NoodleResizer";
import ObjectPorts from "./ObjectPorts";
import RichText from "./RichText";
import { coerceBody, isTextBody, sameBody, type TextBody, type TextParagraph } from "./textBody";

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
  text?: string;
  color: StickyColor;
  paragraphs?: TextParagraph[];
};

export type StickyNodeType = Node<StickyData, "sticky">;

function publish(id: string, data: StickyData) {
  window.dispatchEvent(
    new CustomEvent("noodle-update-node", {
      detail: { id, data },
    }),
  );
}

function StickyNode({ id, data, selected }: NodeProps<StickyNodeType>) {
  const body = useMemo(
    () => coerceBody(data.paragraphs, data.text),
    [data.paragraphs, data.text],
  );
  const [editing, setEditing] = useState(false);
  const resizeStyle = useNoodleResizeStyle();
  const dataRef = useRef(data);
  dataRef.current = data;

  const commit = (next: TextBody) => {
    setEditing(false);
    const current = dataRef.current;
    const stored = isTextBody(current.paragraphs) ? coerceBody(current.paragraphs) : body;
    if (sameBody(next, stored)) return;
    const nextData: StickyData = { color: current.color, paragraphs: next };
    dataRef.current = nextData;
    snapshot();
    publish(id, nextData);
  };

  const format = (next: TextBody) => {
    const current = dataRef.current;
    const stored = isTextBody(current.paragraphs) ? coerceBody(current.paragraphs) : body;
    if (sameBody(next, stored)) return;
    const nextData: StickyData = { color: current.color, paragraphs: next };
    dataRef.current = nextData;
    snapshot();
    publish(id, nextData);
  };

  return (
    <div
      role="group"
      aria-label="Sticky note"
      className="noodle-node relative h-full w-full rounded-sm shadow-[2px_4px_12px_rgba(15,23,42,0.18)]"
      style={{ ...resizeStyle, background: STICKY_COLORS[data.color] }}
      onClick={(event) => {
        if (!selected || editing) return;
        if ((event.target as HTMLElement).closest("[data-text-toolbar], [data-sticky-colors], a, input")) return;
        setEditing(true);
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        setEditing(true);
      }}
    >
      <NoodleResizer
        selected={selected}
        minWidth={140}
        minHeight={140}
        onResizeStart={snapshot}
      />
      <ObjectPorts nodeId={id} />
      <RichText
        body={body}
        editing={editing}
        selected={selected}
        fill
        placeholder="Double-click to write"
        onCommit={commit}
        onCancel={() => setEditing(false)}
        onFormat={format}
      />
      {selected ? (
        <div
          data-sticky-colors
          className="noodle-sticky-colors nodrag nopan absolute left-1/2 z-10 flex -translate-x-1/2 gap-1 rounded-full bg-white p-1 shadow"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
        >
          {(Object.keys(STICKY_COLORS) as StickyColor[]).map((color) => (
            <button
              key={color}
              type="button"
              aria-label={color}
              className="h-5 w-5 rounded-full border border-black/10"
              style={{ background: STICKY_COLORS[color] }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={(event) => {
                event.stopPropagation();
                const current = dataRef.current;
                if (color === current.color) return;
                const nextData: StickyData = { ...current, color };
                dataRef.current = nextData;
                snapshot();
                publish(id, nextData);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default memo(StickyNode);

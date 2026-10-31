import { memo, useMemo, useRef, useState } from "react";
import { type Node, type NodeProps } from "@xyflow/react";
import { NoodleResizer, useNoodleResizeStyle } from "./NoodleResizer";
import ObjectPorts from "./ObjectPorts";
import RichText from "./RichText";
import { coerceBody, isTextBody, sameBody, type TextBody, type TextParagraph } from "./textBody";

function snapshot() {
  window.dispatchEvent(new Event("noodle-snapshot"));
}

export type TextData = {
  paragraphs: TextParagraph[];
  fontSize?: number;
};

export type TextNodeType = Node<TextData, "text">;

function publish(id: string, data: TextData) {
  window.dispatchEvent(
    new CustomEvent("noodle-update-node", {
      detail: { id, data },
    }),
  );
}

function TextNode({ id, data, selected }: NodeProps<TextNodeType>) {
  const body = useMemo(() => coerceBody(data.paragraphs), [data.paragraphs]);
  const [editing, setEditing] = useState(false);
  const resizeStyle = useNoodleResizeStyle();
  const dataRef = useRef(data);
  dataRef.current = data;

  const commit = (next: TextBody) => {
    setEditing(false);
    const current = dataRef.current;
    const stored = isTextBody(current.paragraphs) ? coerceBody(current.paragraphs) : body;
    if (sameBody(next, stored)) return;
    const nextData: TextData = { ...current, paragraphs: next };
    dataRef.current = nextData;
    snapshot();
    publish(id, nextData);
  };

  const format = (next: TextBody) => {
    const current = dataRef.current;
    if (sameBody(next, coerceBody(current.paragraphs))) return;
    const nextData: TextData = { ...current, paragraphs: next };
    dataRef.current = nextData;
    snapshot();
    publish(id, nextData);
  };

  return (
    <div
      role="group"
      aria-label="Text"
      className="noodle-node relative"
      style={{ ...resizeStyle, width: "100%", height: "100%" }}
      onClick={(event) => {
        if (!selected || editing) return;
        if ((event.target as HTMLElement).closest("[data-text-toolbar], a, input")) return;
        setEditing(true);
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        setEditing(true);
      }}
    >
      <NoodleResizer
        selected={selected}
        minWidth={120}
        minHeight={32}
        onResizeStart={snapshot}
      />
      <ObjectPorts nodeId={id} />
      <RichText
        body={body}
        editing={editing}
        selected={selected}
        fontSize={data.fontSize}
        placeholder="Double-click to write"
        onCommit={commit}
        onCancel={() => setEditing(false)}
        onFormat={format}
      />
    </div>
  );
}

export default memo(TextNode);

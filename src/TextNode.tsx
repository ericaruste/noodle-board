import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useStoreApi, type Node, type NodeProps } from "@xyflow/react";
import { NoodleResizer, useNoodleResizeStyle } from "./NoodleResizer";
import ObjectPorts from "./ObjectPorts";
import RichText from "./RichText";
import { selectionHeld, swallowsClick, useConnectChromeHidden } from "./portHot";
import { useSelectedObjectCount } from "./selectionScope";
import { clearTextEdit, peekTextEdit } from "./textEdit";
import { keepReleasedSize } from "./alignSnap";
import { coerceBody, isTextBody, sameBody, type TextBody, type TextParagraph } from "./textBody";

function snapshot() {
  window.dispatchEvent(new Event("noodle-snapshot"));
}

type InkBox = { left: number; top: number; width: number; height: number };

/** Screen box of the glyphs. Block boxes are full-width, so only the runs count. */
function inkBounds(content: HTMLElement): InkBox {
  const pieces = content.querySelectorAll<HTMLElement>("[data-style], [data-marker]");
  const rects: DOMRect[] = [];
  if (pieces.length > 0) {
    pieces.forEach((piece) => {
      const range = document.createRange();
      range.selectNodeContents(piece);
      rects.push(...range.getClientRects());
    });
  } else {
    const box = content.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(content);
    for (const rect of range.getClientRects()) {
      if (rect.width >= box.width - 1 && rect.height >= box.height - 1) continue;
      rects.push(rect);
    }
    if (rects.length === 0) rects.push(box);
  }
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (const rect of rects) {
    if (rect.width <= 0 && rect.height <= 0) continue;
    left = Math.min(left, rect.left);
    right = Math.max(right, rect.right);
    top = Math.min(top, rect.top);
    bottom = Math.max(bottom, rect.bottom);
  }
  if (!(right > left) || !(bottom > top)) {
    const box = content.getBoundingClientRect();
    return { left: box.left, top: box.top, width: box.width, height: box.height };
  }
  return { left, top, width: right - left, height: bottom - top };
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
  const rootRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(() => peekTextEdit(id));
  // The placement click finishes after this node mounts and would blur an immediate focus.
  useLayoutEffect(() => {
    if (!peekTextEdit(id)) return;
    const timer = window.setTimeout(() => {
      rootRef.current?.querySelector<HTMLElement>("[contenteditable='true']")?.focus();
      clearTextEdit(id);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [id]);
  const resizeStyle = useNoodleResizeStyle();
  const store = useStoreApi();
  const hideChrome = useConnectChromeHidden();
  const soloSelection = useSelectedObjectCount() === 1;
  const showChrome = selected && !hideChrome && soloSelection;
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

  const fitToText = useCallback(() => {
    const root = rootRef.current;
    const frame = root?.querySelector<HTMLElement>("[data-text-frame]");
    const content = frame?.querySelector<HTMLElement>(".noodle-text-editor") ?? frame?.firstElementChild;
    if (!root || !frame || !(content instanceof HTMLElement)) return;
    const node = store.getState().nodeLookup.get(id);
    const zoom = store.getState().transform[2];
    const currentWidth = node?.measured.width;
    const currentHeight = node?.measured.height;
    if (!node || !currentWidth || !currentHeight || !(zoom > 0)) return;
    const ink = inkBounds(content);
    const style = getComputedStyle(frame);
    const padLeft = Number.parseFloat(style.paddingLeft) || 0;
    const padRight = Number.parseFloat(style.paddingRight) || 0;
    const padTop = Number.parseFloat(style.paddingTop) || 0;
    const padBottom = Number.parseFloat(style.paddingBottom) || 0;
    const nodeBox = root.getBoundingClientRect();
    const width = Math.max(8, Math.ceil(ink.width / zoom + padLeft + padRight));
    const height = Math.max(8, Math.ceil(ink.height / zoom + padTop + padBottom));
    const position = {
      x: node.position.x + (ink.left - nodeBox.left) / zoom - padLeft,
      y: node.position.y + (ink.top - nodeBox.top) / zoom - padTop,
    };
    if (
      Math.abs(width - currentWidth) < 1 &&
      Math.abs(height - currentHeight) < 1 &&
      Math.abs(position.x - node.position.x) < 1 &&
      Math.abs(position.y - node.position.y) < 1
    ) {
      return;
    }
    snapshot();
    keepReleasedSize(id);
    store.getState().triggerNodeChanges([
      { id, type: "position", position },
      {
        id,
        type: "dimensions",
        resizing: false,
        setAttributes: true,
        dimensions: { width, height },
      },
    ]);
  }, [id, store]);

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label="Text"
      className="noodle-node relative"
      style={{ ...resizeStyle, width: "100%", height: "100%" }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        if (selectionHeld() || swallowsClick()) return;
        setEditing(true);
      }}
    >
      <NoodleResizer
        selected={showChrome}
        minWidth={8}
        minHeight={8}
        onResizeStart={snapshot}
        onHandleDoubleClick={fitToText}
      />
      <ObjectPorts nodeId={id} />
      <RichText
        body={body}
        editing={editing}
        selected={showChrome}
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

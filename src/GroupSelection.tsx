import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useStore, type Edge, type Node, type ReactFlowState } from "@xyflow/react";
import { FloatingPanel } from "./FloatingPanel";
import { useChromeLayout } from "./NoodleEdge";
import { layers } from "./layers";
import { applyNoodleData, NOODLE_COLORS, readNoodle } from "./noodleData";
import { useNoodleResizeStyle } from "./NoodleResizer";
import { selectedObjectCount } from "./selectionScope";
import { FILL_SWATCHES, isShapeColor, STROKE_SWATCHES, type ShapeData } from "./shapeData";
import { STICKY_COLORS, type StickyColor, type StickyData } from "./StickyNode";
import { ENDPOINT_TYPE } from "./noodleEnds";

export const GROUP_STYLE_EVENT = "noodle-group-style";

export type GroupStyleDetail = (
  | { property: "fill"; value: string | null }
  | { property: "stroke"; value: string | null }
  | { property: "sticky"; value: StickyColor }
  | { property: "noodle"; value: string }
) & { history?: boolean };

export function publishGroupStyle(detail: GroupStyleDetail) {
  window.dispatchEvent(new CustomEvent(GROUP_STYLE_EVENT, { detail }));
}

type Box = { x: number; y: number; width: number; height: number };

type GroupModel = {
  count: number;
  box: Box | null;
  fills: (string | null)[];
  strokes: (string | null)[];
  stickies: StickyColor[];
  noodles: string[];
};

function union(rects: Box[]): Box | null {
  if (rects.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }
  if (!Number.isFinite(minX)) return null;
  let x = minX;
  let y = minY;
  let width = maxX - minX;
  let height = maxY - minY;
  if (width < 8) {
    x -= (8 - width) / 2;
    width = 8;
  }
  if (height < 8) {
    y -= (8 - height) / 2;
    height = 8;
  }
  return { x, y, width, height };
}

function sameBox(a: Box | null, b: Box | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

function sameList<T>(a: readonly T[], b: readonly T[]) {
  return a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
}

function sameModel(a: GroupModel, b: GroupModel) {
  return (
    a.count === b.count &&
    sameBox(a.box, b.box) &&
    sameList(a.fills, b.fills) &&
    sameList(a.strokes, b.strokes) &&
    sameList(a.stickies, b.stickies) &&
    sameList(a.noodles, b.noodles)
  );
}

function pushNodeBox(rects: Box[], node: Node, lookup: ReactFlowState["nodeLookup"]) {
  const internal = lookup.get(node.id);
  const width = internal?.measured.width ?? node.width;
  const height = internal?.measured.height ?? node.height;
  const origin = internal?.internals.positionAbsolute ?? node.position;
  if (!width || !height || !origin) return;
  rects.push({ x: origin.x, y: origin.y, width, height });
}

function readGroup(state: ReactFlowState): GroupModel {
  const fills: (string | null)[] = [];
  const strokes: (string | null)[] = [];
  const stickies: StickyColor[] = [];
  const noodles: string[] = [];
  const rects: Box[] = [];
  const selectedNodes = new Set<string>();

  for (const node of state.nodes) {
    if (!node.selected || node.type === ENDPOINT_TYPE) continue;
    selectedNodes.add(node.id);
    pushNodeBox(rects, node, state.nodeLookup);
    if (node.type === "shape" && node.data && typeof node.data === "object") {
      const data = node.data as ShapeData;
      fills.push(isShapeColor(data.fill) ? data.fill : null);
      strokes.push(isShapeColor(data.stroke) ? data.stroke : null);
    }
    if (node.type === "sticky" && node.data && typeof node.data === "object") {
      const color = (node.data as StickyData).color;
      if (typeof color === "string" && color in STICKY_COLORS) stickies.push(color as StickyColor);
    }
  }

  for (const edge of state.edges) {
    if (!edge.selected) continue;
    const data = readNoodle(edge.data);
    noodles.push(data.color);
    for (const bend of data.bends) rects.push({ x: bend.x, y: bend.y, width: 0, height: 0 });
    for (const id of [edge.source, edge.target]) {
      if (selectedNodes.has(id)) continue;
      const internal = state.nodeLookup.get(id);
      const origin = internal?.internals.positionAbsolute;
      if (!origin) continue;
      const width = internal.measured.width ?? 0;
      const height = internal.measured.height ?? 0;
      rects.push({ x: origin.x + width / 2, y: origin.y + height / 2, width: 0, height: 0 });
    }
  }

  return {
    count: selectedObjectCount(state.nodes, state.edges),
    box: union(rects),
    fills,
    strokes,
    stickies,
    noodles,
  };
}

function consensus<T>(values: readonly T[]): { mixed: boolean; value: T | null } {
  if (values.length === 0) return { mixed: false, value: null };
  const first = values[0];
  if (values.every((value) => Object.is(value, first))) return { mixed: false, value: first };
  return { mixed: true, value: null };
}

function Swatch({
  name,
  value,
  active,
  onPick,
}: {
  name: string;
  value: string;
  active: boolean;
  onPick: (value: string) => void;
}) {
  return (
    <button
      type="button"
      title={name}
      aria-label={name}
      aria-pressed={active}
      className={`h-4 w-4 rounded-full border border-black/10 ${active ? "ring-2 ring-slate-900 ring-offset-1" : ""}`}
      style={{ background: value }}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onPick(value)}
    />
  );
}

function NoneSwatch({ active, label, onPick }: { active: boolean; label: string; onPick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`relative h-4 w-4 rounded-full border border-slate-300 bg-white ${active ? "ring-2 ring-slate-900 ring-offset-1" : ""}`}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onPick}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-px w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-slate-500"
      />
    </button>
  );
}

function PaintGroup({
  label,
  values,
  swatches,
  noneLabel,
  onPick,
}: {
  label: string;
  values: readonly (string | null)[];
  swatches: readonly { name: string; value: string }[];
  noneLabel: string;
  onPick: (value: string | null) => void;
}) {
  const agreed = consensus(values);
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      {swatches.map((swatch) => (
        <Swatch
          key={swatch.value}
          name={`${swatch.name} ${label.toLowerCase()}`}
          value={swatch.value}
          active={!agreed.mixed && agreed.value === swatch.value}
          onPick={(value) => onPick(value)}
        />
      ))}
      <NoneSwatch label={noneLabel} active={!agreed.mixed && agreed.value === null} onPick={() => onPick(null)} />
    </div>
  );
}

function GroupToolbar({
  box,
  panX,
  panY,
  zoom,
  model,
}: {
  box: Box;
  panX: number;
  panY: number;
  zoom: number;
  model: GroupModel;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const host = useStore((state) => state.domNode);
  useChromeLayout();
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const showFill = model.fills.length > 0;
  const showStroke = model.strokes.length > 0;
  const showSticky = model.stickies.length > 0;
  const showNoodle = model.noodles.length > 0;
  const colorHistory = useRef(false);
  const noodle = consensus(model.noodles);
  const sticky = consensus(model.stickies);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const renderer = host?.querySelector(".react-flow__renderer");
    if (!root || !(renderer instanceof HTMLElement)) return;
    const width = root.offsetWidth;
    const height = root.offsetHeight;
    const anchor = {
      left: box.x * zoom + panX,
      top: box.y * zoom + panY,
      width: box.width * zoom,
      height: box.height * zoom,
    };
    const gap = 10;
    let left = anchor.left + anchor.width / 2 - width / 2;
    let top = anchor.top + anchor.height + gap;
    const boundsW = renderer.clientWidth;
    const boundsH = renderer.clientHeight;
    if (width > 0 && top + height > boundsH - 8) top = anchor.top - gap - height;
    if (width > 0) left = Math.max(8, Math.min(left, boundsW - width - 8));
    if (height > 0) top = Math.max(8, Math.min(top, boundsH - height - 8));
    const tools = document.querySelector(".board-toolbar");
    const layer = document.querySelector("[data-floating-layer]");
    if (tools instanceof HTMLElement && layer instanceof HTMLElement && width > 0 && height > 0) {
      const origin = layer.getBoundingClientRect();
      const pill = tools.getBoundingClientRect();
      const pillTop = pill.top - origin.top;
      const hits =
        left + width > pill.left - origin.left &&
        left < pill.right - origin.left &&
        top + height > pillTop &&
        top < pill.bottom - origin.top;
      if (hits) top = Math.max(8, pillTop - gap - height);
    }
    setPos((prev) =>
      prev && Math.abs(prev.left - left) < 0.5 && Math.abs(prev.top - top) < 0.5 ? prev : { left, top },
    );
  });

  if (!showFill && !showStroke && !showSticky && !showNoodle) return null;

  return (
    <FloatingPanel
      layer="toolbar"
      panelRef={rootRef}
      ariaLabel="Selection"
      data-group-toolbar=""
      className="flex max-w-[36rem] flex-wrap items-center gap-2 rounded-xl border border-white/50 bg-white/40 p-1.5 shadow-lg backdrop-blur-xl"
      style={{
        position: "absolute",
        left: pos?.left ?? -9999,
        top: pos?.top ?? -9999,
        width: "max-content",
        visibility: pos ? "visible" : "hidden",
      }}
    >
      {showFill ? (
        <PaintGroup
          label="Fill"
          values={model.fills}
          swatches={FILL_SWATCHES}
          noneLabel="No fill"
          onPick={(value) => publishGroupStyle({ property: "fill", value })}
        />
      ) : null}
      {showStroke ? (
        <PaintGroup
          label="Stroke"
          values={model.strokes}
          swatches={STROKE_SWATCHES}
          noneLabel="No stroke"
          onPick={(value) => publishGroupStyle({ property: "stroke", value })}
        />
      ) : null}
      {showSticky ? (
        <div role="group" aria-label="Sticky color" className="flex items-center gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Color</span>
          {(Object.keys(STICKY_COLORS) as StickyColor[]).map((color) => (
            <Swatch
              key={color}
              name={color}
              value={STICKY_COLORS[color]}
              active={!sticky.mixed && sticky.value === color}
              onPick={() => publishGroupStyle({ property: "sticky", value: color })}
            />
          ))}
        </div>
      ) : null}
      {showNoodle ? (
        <div role="group" aria-label="Noodle color" className="flex items-center gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Noodle</span>
          {NOODLE_COLORS.map((swatch) => (
            <Swatch
              key={swatch.value}
              name={swatch.name}
              value={swatch.value}
              active={!noodle.mixed && noodle.value === swatch.value}
              onPick={(value) => publishGroupStyle({ property: "noodle", value })}
            />
          ))}
          {noodle.mixed ? null : (
            <label className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
              Custom
              <input
                type="color"
                aria-label="Custom noodle color"
                value={noodle.value ?? "#334155"}
                className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
                onFocus={() => {
                  colorHistory.current = false;
                }}
                onChange={(event) => {
                  const history = !colorHistory.current;
                  colorHistory.current = true;
                  publishGroupStyle({ property: "noodle", value: event.target.value, history });
                }}
                onBlur={() => {
                  colorHistory.current = false;
                }}
              />
            </label>
          )}
        </div>
      ) : null}
    </FloatingPanel>
  );
}

/** One box and one toolbar around every selected element and noodle. */
export default function GroupSelection() {
  const resizeStyle = useNoodleResizeStyle();
  const model = useStore(readGroup, sameModel);
  const transform = useStore((state) => state.transform);
  const flowRoot = useStore((state) => state.domNode);
  const viewport = flowRoot?.querySelector(".react-flow__viewport");
  if (model.count < 2 || !model.box || !viewport) return null;
  const [panX, panY, zoom] = transform;

  return (
    <>
      {createPortal(
        <div
          className="noodle-resize-layer"
          style={{
            ...resizeStyle,
            transform: `translate(${model.box.x}px, ${model.box.y}px)`,
            width: model.box.width,
            height: model.box.height,
            zIndex: layers.selection,
          }}
        >
          <svg className="noodle-selection-stroke" width="100%" height="100%" aria-hidden>
            <rect width="100%" height="100%" />
          </svg>
        </div>,
        viewport,
      )}
      <GroupToolbar box={model.box} panX={panX} panY={panY} zoom={zoom || 1} model={model} />
    </>
  );
}

export function applyGroupStyle(
  nodes: Node[],
  edges: Edge[],
  detail: GroupStyleDetail,
): { nodes: Node[]; edges: Edge[] } | null {
  let nodesChanged = false;
  let edgesChanged = false;
  const nextNodes = nodes.map((node) => {
    if (!node.selected || !node.data || typeof node.data !== "object") return node;
    if ((detail.property === "fill" || detail.property === "stroke") && node.type === "shape") {
      const data = node.data as ShapeData;
      const current = detail.property === "fill" ? (isShapeColor(data.fill) ? data.fill : null) : isShapeColor(data.stroke) ? data.stroke : null;
      if (current === detail.value) return node;
      nodesChanged = true;
      return { ...node, data: { ...data, [detail.property]: detail.value } };
    }
    if (detail.property === "sticky" && node.type === "sticky") {
      const data = node.data as StickyData;
      if (data.color === detail.value) return node;
      nodesChanged = true;
      return { ...node, data: { ...data, color: detail.value } };
    }
    return node;
  });
  const nextEdges =
    detail.property === "noodle"
      ? edges.map((edge) => {
          if (!edge.selected) return edge;
          const data = readNoodle(edge.data);
          if (data.color === detail.value) return edge;
          edgesChanged = true;
          return applyNoodleData(edge, { ...data, color: detail.value });
        })
      : edges;
  if (!nodesChanged && !edgesChanged) return null;
  return {
    nodes: nodesChanged ? nextNodes : nodes,
    edges: edgesChanged ? nextEdges : edges,
  };
}

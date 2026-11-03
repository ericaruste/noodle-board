import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { type Node, type NodeProps, useStore } from "@xyflow/react";
import { NoodleResizer, useNoodleResizeStyle } from "./NoodleResizer";
import ObjectPorts from "./ObjectPorts";
import RichText from "./RichText";
import SelectionChrome from "./SelectionChrome";
import {
  FILL_SWATCHES,
  SHAPE_DEFAULT_HEIGHT,
  SHAPE_DEFAULT_WIDTH,
  SHAPE_LABELS,
  SHAPE_MIN_SIZE,
  STROKE_SWATCHES,
  STROKE_WIDTH,
  isShapeColor,
  roundRectRadius,
  isShapeKind,
  shapeHeightForText,
  shapeTextFrame,
  type ShapeData,
  type ShapeKind,
} from "./shapeData";
import { coerceBody, isTextBody, sameBody, type TextBody } from "./textBody";

function paintedShape(current: ShapeData, patch: Partial<ShapeData> = {}): ShapeData {
  const kind = isShapeKind(patch.kind) ? patch.kind : isShapeKind(current.kind) ? current.kind : "rect";
  const fill = patch.fill === undefined ? (isShapeColor(current.fill) ? current.fill : null) : patch.fill;
  const stroke = patch.stroke === undefined ? (isShapeColor(current.stroke) ? current.stroke : null) : patch.stroke;
  const next: ShapeData = { kind, fill, stroke };
  const paragraphs = patch.paragraphs === undefined ? current.paragraphs : patch.paragraphs;
  if (isTextBody(paragraphs)) next.paragraphs = paragraphs;
  const manualHeight = patch.manualHeight === undefined ? current.manualHeight : patch.manualHeight;
  if (typeof manualHeight === "number") next.manualHeight = manualHeight;
  return next;
}

function shapeHasText(root: HTMLElement) {
  const runs = root.querySelectorAll("[data-runs]");
  if (runs.length === 0) return false;
  return [...runs].some((run) => (run.textContent ?? "").replace(/\u200b/g, "").trim().length > 0);
}

function snapshot() {
  window.dispatchEvent(new Event("noodle-snapshot"));
}

export type { ShapeData, ShapeKind } from "./shapeData";
export type ShapeNodeType = Node<ShapeData, "shape">;

function publish(id: string, data: ShapeData, size?: { width?: number; height?: number }) {
  window.dispatchEvent(
    new CustomEvent("noodle-update-node", {
      detail: { id, data, ...size },
    }),
  );
}

function publishHeight(id: string, height: number) {
  window.dispatchEvent(
    new CustomEvent("noodle-update-node", {
      detail: { id, height },
    }),
  );
}

export function ShapeKindIcon({ kind }: { kind: ShapeKind }) {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden className="shrink-0">
      {kind === "rect" ? (
        <rect x="3" y="5" width="14" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" />
      ) : null}
      {kind === "round-rect" ? (
        <rect x="3" y="5" width="14" height="10" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      ) : null}
      {kind === "ellipse" ? (
        <ellipse cx="10" cy="10" rx="7" ry="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      ) : null}
      {kind === "triangle" ? (
        <polygon points="10,3 17,16 3,16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      ) : null}
      {kind === "diamond" ? (
        <polygon points="10,2 18,10 10,18 2,10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      ) : null}
    </svg>
  );
}

function insetPolygon(points: Array<[number, number]>, width: number, height: number, inset: number) {
  const cx = width / 2;
  const cy = height / 2;
  const sx = width > inset * 2 ? (width - inset * 2) / width : 0;
  const sy = height > inset * 2 ? (height - inset * 2) / height : 0;
  return points.map(([x, y]) => `${cx + (x - cx) * sx},${cy + (y - cy) * sy}`).join(" ");
}

type Paint = {
  fill: string;
  stroke: string;
  strokeWidth: number;
};

function cornerRadius(width: number, height: number) {
  return roundRectRadius(width, height);
}

/** Matches the painted geometry so empty corners of the node box are not a hit target. */
function hitClip(kind: ShapeKind, width: number, height: number) {
  if (kind === "ellipse") return "ellipse(50% 50% at 50% 50%)";
  if (kind === "round-rect") return `inset(0 round ${cornerRadius(width, height)}px)`;
  if (kind === "triangle") return "polygon(50% 0%, 100% 100%, 0% 100%)";
  if (kind === "diamond") return "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
  return "none";
}

function ShapeGeometry({
  kind,
  width,
  height,
  paint,
}: {
  kind: ShapeKind;
  width: number;
  height: number;
  paint: Paint;
}) {
  const inset = STROKE_WIDTH / 2;
  const shared = {
    className: "noodle-shape-geometry",
    fill: paint.fill,
    stroke: paint.stroke,
    strokeWidth: paint.strokeWidth,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
    pointerEvents: "none" as const,
  };

  if (kind === "ellipse") {
    return (
      <ellipse
        cx={width / 2}
        cy={height / 2}
        rx={Math.max(0, width / 2 - inset)}
        ry={Math.max(0, height / 2 - inset)}
        {...shared}
      />
    );
  }

  if (kind === "triangle") {
    return (
      <polygon
        points={insetPolygon(
          [
            [width / 2, 0],
            [width, height],
            [0, height],
          ],
          width,
          height,
          inset,
        )}
        {...shared}
      />
    );
  }

  if (kind === "diamond") {
    return (
      <polygon
        points={insetPolygon(
          [
            [width / 2, 0],
            [width, height / 2],
            [width / 2, height],
            [0, height / 2],
          ],
          width,
          height,
          inset,
        )}
        {...shared}
      />
    );
  }

  const innerWidth = Math.max(0, width - inset * 2);
  const innerHeight = Math.max(0, height - inset * 2);
  const radius = kind === "round-rect" ? cornerRadius(width, height) : 0;

  return <rect x={inset} y={inset} width={innerWidth} height={innerHeight} rx={radius} ry={radius} {...shared} />;
}

function PaintSwatch({
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
      onClick={(event) => {
        event.stopPropagation();
        onPick(value);
      }}
    />
  );
}

function PaintNone({
  label,
  active,
  onPick,
}: {
  label: string;
  active: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`relative h-4 w-4 rounded-full border border-slate-300 bg-white ${active ? "ring-2 ring-slate-900 ring-offset-1" : ""}`}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        event.stopPropagation();
        onPick();
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-px w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-slate-500"
      />
    </button>
  );
}

function PaintRow({
  label,
  value,
  swatches,
  noneLabel,
  onChange,
}: {
  label: string;
  value: string | null;
  swatches: readonly { name: string; value: string }[];
  noneLabel: string;
  onChange: (value: string | null) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1">
      <span className="w-11 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      {swatches.map((swatch) => (
        <PaintSwatch
          key={swatch.value}
          name={`${swatch.name} ${label.toLowerCase()}`}
          value={swatch.value}
          active={value === swatch.value}
          onPick={onChange}
        />
      ))}
      <PaintNone label={noneLabel} active={value === null} onPick={() => onChange(null)} />
    </div>
  );
}

function ShapeNode({ id, data, selected, width, height }: NodeProps<ShapeNodeType>) {
  const resizeStyle = useNoodleResizeStyle();
  const resizing = useStore((state) => Boolean(state.nodeLookup.get(id)?.resizing));
  const dataRef = useRef(data);
  dataRef.current = data;
  const rootRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [contentFloor, setContentFloor] = useState(SHAPE_MIN_SIZE);
  const kind = isShapeKind(data.kind) ? data.kind : "rect";
  const fill = isShapeColor(data.fill) ? data.fill : null;
  const stroke = isShapeColor(data.stroke) ? data.stroke : null;
  const body = useMemo(() => coerceBody(data.paragraphs), [data.paragraphs]);
  const boxWidth = width && width > 0 ? width : SHAPE_DEFAULT_WIDTH;
  const boxHeight = height && height > 0 ? height : SHAPE_DEFAULT_HEIGHT;
  const frame = shapeTextFrame(kind, boxWidth, boxHeight);
  const contentFloorRef = useRef(contentFloor);
  const manualHeightRef = useRef(data.manualHeight);
  const resizeCommitRef = useRef<number | null>(null);
  const sizeRef = useRef({ width: boxWidth, height: boxHeight });
  sizeRef.current = { width: boxWidth, height: boxHeight };
  const sizeAtStartRef = useRef(sizeRef.current);

  const beginResize = useCallback(() => {
    sizeAtStartRef.current = { ...sizeRef.current };
    snapshot();
  }, []);

  const rememberManualSize = useCallback((_event: unknown, params: { width: number; height: number }) => {
    const userHeight = Math.round(params.height);
    const userWidth = Math.round(params.width);
    const start = sizeAtStartRef.current;
    const heightChanged = Math.abs(userHeight - start.height) > 1;
    const widthChanged = Math.abs(userWidth - start.width) > 1;
    if (!heightChanged && !widthChanged) return;
    if (!Number.isFinite(userHeight) || userHeight <= 0) return;
    if (!heightChanged) {
      publish(id, dataRef.current, { width: userWidth, height: userHeight });
      return;
    }
    resizeCommitRef.current = userHeight;
    const next = paintedShape(dataRef.current, { manualHeight: userHeight });
    dataRef.current = next;
    publish(id, next, { width: userWidth, height: userHeight });
  }, [id]);

  const commitPaint = (patch: Partial<Pick<ShapeData, "fill" | "stroke">>) => {
    const current = dataRef.current;
    const next = paintedShape(current, patch);
    const currentFill = isShapeColor(current.fill) ? current.fill : null;
    const currentStroke = isShapeColor(current.stroke) ? current.stroke : null;
    if (next.fill === currentFill && next.stroke === currentStroke) return;
    dataRef.current = next;
    snapshot();
    publish(id, next);
  };

  const commitText = (next: TextBody) => {
    setEditing(false);
    const current = dataRef.current;
    const stored = isTextBody(current.paragraphs) ? coerceBody(current.paragraphs) : body;
    if (sameBody(next, stored)) return;
    const nextData = paintedShape(current, { paragraphs: next });
    dataRef.current = nextData;
    snapshot();
    publish(id, nextData);
  };

  const formatText = (next: TextBody) => {
    const current = dataRef.current;
    const stored = isTextBody(current.paragraphs) ? coerceBody(current.paragraphs) : body;
    if (sameBody(next, stored)) return;
    const nextData = paintedShape(current, { paragraphs: next });
    dataRef.current = nextData;
    snapshot();
    publish(id, nextData);
  };

  useLayoutEffect(() => {
    const root = rootRef.current;
    const measure = measureRef.current;
    if (!root || !measure) return;

    if (resizeCommitRef.current != null) {
      manualHeightRef.current = resizeCommitRef.current;
      resizeCommitRef.current = null;
    } else {
      manualHeightRef.current = data.manualHeight;
    }

    const fit = () => {
      const contentHeight = measure.offsetHeight;
      if (contentHeight < 1) return;
      const fitted = shapeHeightForText(kind, boxWidth, contentHeight);
      const floor = Math.round(Math.max(SHAPE_MIN_SIZE, fitted));
      contentFloorRef.current = floor;
      if (!resizing) setContentFloor((prev) => (Math.abs(prev - floor) <= 1 ? prev : floor));
      if (resizing) return;
      const hasText = shapeHasText(measure);
      const manual = manualHeightRef.current;
      const target =
        typeof manual === "number"
          ? Math.round(Math.max(manual, floor))
          : Math.round(hasText ? floor : Math.max(SHAPE_DEFAULT_HEIGHT, fitted));
      if (Math.abs(target - boxHeight) <= 1) return;
      publishHeight(id, target);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(measure);
    return () => observer.disconnect();
  }, [id, kind, boxWidth, boxHeight, body, editing, resizing, data.manualHeight]);

  return (
    <div
      ref={rootRef}
      data-shape-kind={kind}
      className="noodle-node pointer-events-none relative h-full w-full"
      style={resizeStyle}
      onDoubleClick={(event) => {
        event.stopPropagation();
        setEditing(true);
      }}
    >
      <NoodleResizer
        selected={selected}
        minWidth={SHAPE_MIN_SIZE}
        minHeight={contentFloor}
        onResizeStart={beginResize}
        onResizeEnd={rememberManualSize}
      />
      <svg width={boxWidth} height={boxHeight} className="overflow-visible" style={{ pointerEvents: "none" }}>
        <ShapeGeometry
          kind={kind}
          width={boxWidth}
          height={boxHeight}
          paint={{
            fill: fill ?? "transparent",
            stroke: stroke ?? "none",
            strokeWidth: stroke ? STROKE_WIDTH : 0,
          }}
        />
      </svg>
      <div
        role="button"
        tabIndex={-1}
        aria-label={SHAPE_LABELS[kind]}
        className="noodle-shape-hit pointer-events-auto absolute inset-0 z-0 cursor-grab outline-none"
        style={{ clipPath: hitClip(kind, boxWidth, boxHeight) }}
      />
      <div
        className="noodle-shape-text"
        style={{ left: frame.left, top: frame.top, width: frame.width, height: frame.height }}
      >
        <div ref={measureRef} className="noodle-shape-text-measure">
          <RichText
            body={body}
            editing={editing}
            selected={selected}
            placeholder="Double-click to write"
            onCommit={commitText}
            onCancel={() => setEditing(false)}
            onFormat={formatText}
          />
        </div>
      </div>
      <ObjectPorts nodeId={id} />
      {selected ? (
        <SelectionChrome side="below">
          <div
            data-shape-colors
            className="noodle-shape-colors nodrag nopan nowheel pointer-events-auto flex flex-col gap-1 rounded-xl bg-white p-1.5 shadow"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={(event) => event.stopPropagation()}
          >
            <PaintRow
              label="Fill"
              value={fill}
              swatches={FILL_SWATCHES}
              noneLabel="No fill"
              onChange={(value) => commitPaint({ fill: value })}
            />
            <PaintRow
              label="Stroke"
              value={stroke}
              swatches={STROKE_SWATCHES}
              noneLabel="No stroke"
              onChange={(value) => commitPaint({ stroke: value })}
            />
          </div>
        </SelectionChrome>
      ) : null}
    </div>
  );
}

export default memo(ShapeNode);

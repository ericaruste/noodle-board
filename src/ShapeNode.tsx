import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { type Node, type NodeProps, useStore } from "@xyflow/react";
import { NoodleResizer, useNoodleResizeStyle } from "./NoodleResizer";
import ObjectPorts from "./ObjectPorts";
import RichText from "./RichText";
import SelectionChrome from "./SelectionChrome";
import ShapeToolbar from "./ShapeToolbar";
import {
  DEFAULT_SHAPE_FILL,
  DEFAULT_SHAPE_STROKE,
  SHAPE_CORNER_RADIUS,
  SHAPE_DEFAULT_HEIGHT,
  SHAPE_LABELS,
  SHAPE_MIN_SIZE,
  STROKE_WIDTH,
  isShapeColor,
  roundRectRadius,
  isShapeKind,
  shapeDefaultSize,
  shapeFillOpacity,
  shapeHeightForText,
  shapeLineStyle,
  shapeTextFrame,
  shapeThickness,
  shapeThicknessPx,
  type ShapeData,
  type ShapeKind,
} from "./shapeData";
import { selectionHeld, swallowsClick, useConnectChromeHidden } from "./portHot";
import { useSelectedObjectCount } from "./selectionScope";
import { coerceBody, isTextBody, sameBody, type TextBody } from "./textBody";

function paintedShape(current: ShapeData, patch: Partial<ShapeData> = {}): ShapeData {
  const kind = isShapeKind(patch.kind) ? patch.kind : isShapeKind(current.kind) ? current.kind : "rect";
  const fill = patch.fill === undefined ? (isShapeColor(current.fill) ? current.fill : null) : patch.fill;
  const stroke = patch.stroke === undefined ? (isShapeColor(current.stroke) ? current.stroke : null) : patch.stroke;
  const next: ShapeData = {
    kind,
    fill,
    stroke,
    fillOpacity: patch.fillOpacity === undefined ? shapeFillOpacity(current) : shapeFillOpacity(patch),
    thickness: patch.thickness === undefined ? shapeThickness(current) : shapeThickness(patch),
    lineStyle: patch.lineStyle === undefined ? shapeLineStyle(current) : shapeLineStyle(patch),
  };
  const paragraphs = patch.paragraphs === undefined ? current.paragraphs : patch.paragraphs;
  if (isTextBody(paragraphs)) next.paragraphs = paragraphs;
  const manualHeight = patch.manualHeight === undefined ? current.manualHeight : patch.manualHeight;
  if (typeof manualHeight === "number") next.manualHeight = manualHeight;
  return next;
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

export { ShapeKindIcon } from "./shapeKindIcon";

function insetPoints(points: Array<[number, number]>, width: number, height: number, inset: number) {
  const cx = width / 2;
  const cy = height / 2;
  const sx = width > inset * 2 ? (width - inset * 2) / width : 0;
  const sy = height > inset * 2 ? (height - inset * 2) / height : 0;
  return points.map(([x, y]): [number, number] => [cx + (x - cx) * sx, cy + (y - cy) * sy]);
}

function pathNum(value: number) {
  return String(Math.round(value * 1000) / 1000);
}

/** Circular fillet of `radius` px at each vertex. The straight edges stay put. */
function roundedPolygonPath(points: Array<[number, number]>, radius: number) {
  const count = points.length;
  if (count < 3) return "";
  if (!(radius > 0)) {
    return `${points.map((point, index) => `${index === 0 ? "M" : "L"}${pathNum(point[0])} ${pathNum(point[1])}`).join(" ")} Z`;
  }

  const cuts = points.map((curr, index) => {
    const prev = points[(index - 1 + count) % count];
    const next = points[(index + 1) % count];
    const toPrevX = prev[0] - curr[0];
    const toPrevY = prev[1] - curr[1];
    const toNextX = next[0] - curr[0];
    const toNextY = next[1] - curr[1];
    const lenPrev = Math.hypot(toPrevX, toPrevY);
    const lenNext = Math.hypot(toNextX, toNextY);
    if (lenPrev < 1e-6 || lenNext < 1e-6) {
      return { start: curr, end: curr, r: 0, sweep: 1 as const };
    }
    const prevX = toPrevX / lenPrev;
    const prevY = toPrevY / lenPrev;
    const nextX = toNextX / lenNext;
    const nextY = toNextY / lenNext;
    const dot = Math.min(1, Math.max(-1, prevX * nextX + prevY * nextY));
    const angle = Math.acos(dot);
    const tanHalf = Math.tan(angle / 2);
    let dist = tanHalf > 1e-6 ? radius / tanHalf : 0;
    dist = Math.min(dist, lenPrev / 2, lenNext / 2);
    const fitted = tanHalf > 1e-6 ? dist * tanHalf : 0;
    const inX = curr[0] - prev[0];
    const inY = curr[1] - prev[1];
    const outX = next[0] - curr[0];
    const outY = next[1] - curr[1];
    const sweep = inX * outY - inY * outX >= 0 ? 1 : 0;
    return {
      start: [curr[0] + prevX * dist, curr[1] + prevY * dist] as [number, number],
      end: [curr[0] + nextX * dist, curr[1] + nextY * dist] as [number, number],
      r: fitted,
      sweep: sweep as 0 | 1,
    };
  });

  const arc = (cut: (typeof cuts)[number]) =>
    cut.r > 0.05
      ? `A ${pathNum(cut.r)} ${pathNum(cut.r)} 0 0 ${cut.sweep} ${pathNum(cut.end[0])} ${pathNum(cut.end[1])}`
      : `L ${pathNum(cut.end[0])} ${pathNum(cut.end[1])}`;

  const commands = [`M ${pathNum(cuts[0].end[0])} ${pathNum(cuts[0].end[1])}`];
  for (let index = 1; index < count; index += 1) {
    commands.push(`L ${pathNum(cuts[index].start[0])} ${pathNum(cuts[index].start[1])}`);
    commands.push(arc(cuts[index]));
  }
  commands.push(`L ${pathNum(cuts[0].start[0])} ${pathNum(cuts[0].start[1])}`);
  commands.push(arc(cuts[0]));
  commands.push("Z");
  return commands.join(" ");
}

type Paint = {
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
};

function cornerRadius(width: number, height: number, strokeWidth: number) {
  return roundRectRadius(width, height, strokeWidth);
}

/** Matches the painted geometry so empty corners of the node box are not a hit target. */
function hitClip(kind: ShapeKind, width: number, height: number, strokeWidth: number) {
  if (kind === "ellipse") return "ellipse(50% 50% at 50% 50%)";
  if (kind === "round-rect") return `inset(0 round ${cornerRadius(width, height, strokeWidth)}px)`;
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
  const inset = paint.strokeWidth / 2;
  const shared = {
    className: "noodle-shape-geometry",
    fill: paint.fill,
    fillOpacity: paint.fillOpacity,
    stroke: paint.stroke,
    strokeWidth: paint.strokeWidth,
    strokeDasharray: paint.strokeDasharray,
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

  if (kind === "triangle" || kind === "diamond") {
    const vertices: Array<[number, number]> =
      kind === "triangle"
        ? [
            [width / 2, 0],
            [width, height],
            [0, height],
          ]
        : [
            [width / 2, 0],
            [width, height / 2],
            [width / 2, height],
            [0, height / 2],
          ];
    return <path d={roundedPolygonPath(insetPoints(vertices, width, height, inset), SHAPE_CORNER_RADIUS)} {...shared} />;
  }

  const innerWidth = Math.max(0, width - inset * 2);
  const innerHeight = Math.max(0, height - inset * 2);
  const radius = kind === "round-rect" ? cornerRadius(width, height, paint.strokeWidth) : SHAPE_CORNER_RADIUS;

  return <rect x={inset} y={inset} width={innerWidth} height={innerHeight} rx={radius} ry={radius} {...shared} />;
}

export function ShapePreview({
  kind,
  width,
  height,
}: {
  kind: ShapeKind;
  width: number;
  height: number;
}) {
  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden>
      <ShapeGeometry
        kind={kind}
        width={width}
        height={height}
        paint={{
          fill: DEFAULT_SHAPE_FILL,
          fillOpacity: 1,
          stroke: DEFAULT_SHAPE_STROKE,
          strokeWidth: STROKE_WIDTH,
        }}
      />
    </svg>
  );
}


function ShapeNode({ id, data, selected, width, height }: NodeProps<ShapeNodeType>) {
  const resizeStyle = useNoodleResizeStyle();
  const hideChrome = useConnectChromeHidden();
  const soloSelection = useSelectedObjectCount() === 1;
  const showChrome = selected && !hideChrome && soloSelection;
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
  const fillOpacity = shapeFillOpacity(data);
  const thickness = shapeThickness(data);
  const lineStyle = shapeLineStyle(data);
  const strokeWidth = stroke ? shapeThicknessPx(thickness) : 0;
  const body = useMemo(() => coerceBody(data.paragraphs), [data.paragraphs]);
  const defaults = shapeDefaultSize(kind);
  const boxWidth = width && width > 0 ? width : defaults.width;
  const boxHeight = height && height > 0 ? height : defaults.height;
  const frame = shapeTextFrame(kind, boxWidth, boxHeight);
  const contentFloorRef = useRef(contentFloor);
  const manualHeightRef = useRef(data.manualHeight);
  const prevKindRef = useRef(kind);
  /** Height before a kind change. Text-fit may grow past it, and may not shrink below it. */
  const kindHeightRef = useRef<number | null>(null);
  /** Height when text editing started. The hint leaves the flow, and the shape must not shrink with it. */
  const editHeightRef = useRef<number | null>(null);
  /** The edit hold is one pass. A later measurement can return a short label to the base. */
  const editHeldRef = useRef(false);
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

  const commitPaint = (patch: Partial<Pick<ShapeData, "fill" | "stroke" | "fillOpacity" | "thickness" | "lineStyle">>, history: boolean) => {
    const current = dataRef.current;
    const next = paintedShape(current, patch);
    if (
      next.fill === (isShapeColor(current.fill) ? current.fill : null) &&
      next.stroke === (isShapeColor(current.stroke) ? current.stroke : null) &&
      next.fillOpacity === shapeFillOpacity(current) &&
      next.thickness === shapeThickness(current) &&
      next.lineStyle === shapeLineStyle(current)
    ) {
      return;
    }
    dataRef.current = next;
    if (history) snapshot();
    publish(id, next);
  };

  const commitKind = (nextKind: ShapeKind) => {
    const current = dataRef.current;
    const currentKind = isShapeKind(current.kind) ? current.kind : "rect";
    if (nextKind === currentKind) return;
    const next = paintedShape(current, { kind: nextKind });
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

    if (prevKindRef.current !== kind) {
      kindHeightRef.current = boxHeight;
      prevKindRef.current = kind;
    } else {
      kindHeightRef.current = null;
    }

    if (editing) {
      if (editHeightRef.current == null && !editHeldRef.current) {
        editHeightRef.current = boxHeight;
        editHeldRef.current = true;
      }
    } else {
      editHeightRef.current = null;
      editHeldRef.current = false;
    }

    let release = 0;
    const fit = () => {
      const contentHeight = measure.offsetHeight;
      if (contentHeight < 1) return;
      const fitted = shapeHeightForText(kind, boxWidth, contentHeight);
      const floor = Math.round(Math.max(SHAPE_MIN_SIZE, fitted));
      contentFloorRef.current = floor;
      if (!resizing) setContentFloor((prev) => (Math.abs(prev - floor) <= 1 ? prev : floor));
      if (resizing) return;
      const manual = manualHeightRef.current;
      const base = typeof manual === "number" ? manual : SHAPE_DEFAULT_HEIGHT;
      const settled = Math.round(Math.max(base, floor));
      let target = settled;
      const held = kindHeightRef.current;
      if (held != null) {
        target = Math.max(target, Math.round(held));
        // Keep the hold for every measurement in this pass. The frame below
        // returns a short label to the base once the new text band has settled.
        if (target - settled > 1) {
          if (release) cancelAnimationFrame(release);
          const releaseKind = kind;
          const releaseWidth = boxWidth;
          release = requestAnimationFrame(() => {
            const nextHeight = measure.offsetHeight;
            if (nextHeight < 1) return;
            const nextFloor = Math.round(
              Math.max(SHAPE_MIN_SIZE, shapeHeightForText(releaseKind, releaseWidth, nextHeight)),
            );
            const manualNow = manualHeightRef.current;
            const nextBase = typeof manualNow === "number" ? manualNow : SHAPE_DEFAULT_HEIGHT;
            let nextTarget = Math.round(Math.max(nextBase, nextFloor));
            const editNow = editHeightRef.current;
            if (editNow != null) nextTarget = Math.max(nextTarget, Math.round(editNow));
            const nodeNow = root.closest(".react-flow__node");
            const paintedNow = nodeNow instanceof HTMLElement ? Number.parseFloat(nodeNow.style.height) : Number.NaN;
            const currentNow = Number.isFinite(paintedNow) && paintedNow > 0 ? paintedNow : sizeRef.current.height;
            if (Math.abs(nextTarget - currentNow) <= 1) return;
            publishHeight(id, nextTarget);
          });
        }
      }
      const editFloor = editHeightRef.current;
      if (editFloor != null) {
        target = Math.max(target, Math.round(editFloor));
        editHeightRef.current = null;
      }
      // The height prop can be the measured content. The painted box is the style.
      const node = root.closest(".react-flow__node");
      const painted = node instanceof HTMLElement ? Number.parseFloat(node.style.height) : Number.NaN;
      const current = Number.isFinite(painted) && painted > 0 ? painted : boxHeight;
      if (Math.abs(target - current) <= 1) return;
      publishHeight(id, target);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(measure);
    return () => {
      if (release) cancelAnimationFrame(release);
      observer.disconnect();
    };
  }, [id, kind, boxWidth, boxHeight, body, editing, resizing, data.manualHeight]);

  return (
    <div
      ref={rootRef}
      data-shape-kind={kind}
      className="noodle-node pointer-events-none relative h-full w-full"
      style={resizeStyle}
      onDoubleClick={(event) => {
        event.stopPropagation();
        if (selectionHeld() || swallowsClick()) return;
        setEditing(true);
      }}
    >
      <NoodleResizer
        selected={showChrome}
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
            fillOpacity: fill == null ? 0 : fillOpacity / 100,
            stroke: stroke ?? "none",
            strokeWidth,
            strokeDasharray: stroke && lineStyle === "dashed" ? "8 6" : undefined,
          }}
        />
      </svg>
      <div
        role="button"
        tabIndex={-1}
        aria-label={SHAPE_LABELS[kind]}
        className="noodle-shape-hit pointer-events-auto absolute inset-0 z-0 cursor-grab outline-none"
        style={{ clipPath: hitClip(kind, boxWidth, boxHeight, strokeWidth) }}
      />
      <div
        className="noodle-shape-text"
        style={{ left: frame.left, top: frame.top, width: frame.width, height: frame.height }}
      >
        <div ref={measureRef} className="noodle-shape-text-measure">
          <RichText
            body={body}
            editing={editing}
            selected={showChrome}
            canvasDefault
            placeholder="Add text"
            toolbarOnSelect={false}
            onCommit={commitText}
            onCancel={() => setEditing(false)}
            onFormat={formatText}
          />
        </div>
      </div>
      <ObjectPorts nodeId={id} />
      {showChrome && !editing ? (
        <SelectionChrome side="below">
          <ShapeToolbar
            kind={kind}
            fill={fill}
            stroke={stroke}
            fillOpacity={fillOpacity}
            thickness={thickness}
            lineStyle={lineStyle}
            onKind={commitKind}
            onFill={(value, history) => commitPaint({ fill: value }, history)}
            onStroke={(value, history) => commitPaint({ stroke: value }, history)}
            onFillOpacity={(value, history) => commitPaint({ fillOpacity: value }, history)}
            onThickness={(value) => commitPaint({ thickness: value }, true)}
            onLineStyle={(value) => commitPaint({ lineStyle: value }, true)}
          />
        </SelectionChrome>
      ) : null}
    </div>
  );
}

export default memo(ShapeNode);

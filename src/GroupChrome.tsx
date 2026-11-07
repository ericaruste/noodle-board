import { useLayoutEffect, useState, type ReactNode } from "react";
import { useStore, type Node } from "@xyflow/react";
import { isShapeColor, isShapeKind, type ShapeData, type ShapeKind } from "./shapeData";
import { ShapeColorBar, ShapeKindMenu } from "./ShapeNode";
import SelectionChrome from "./SelectionChrome";
import { publishGroupStyle } from "./GroupSelection";
import { drawnNoodle } from "./drawnNoodle";
import { NoodleToolbarSlot, useChromeLayout } from "./NoodleEdge";
import { readNoodle, sameNoodle, thicknessPx } from "./noodleData";
import NoodleToolbar from "./NoodleToolbar";
import { STICKY_COLORS, type StickyColor, type StickyData } from "./StickyNode";
import TextToolbar from "./TextToolbar";
import {
  ALIGN_LABELS,
  FONT_STYLE_LABELS,
  alignsInRange,
  applyAlign,
  applyFamily,
  applyHref,
  applySize,
  applyStyle,
  coerceBody,
  familiesInRange,
  fullRange,
  hrefsInRange,
  listsInRange,
  sizesInRange,
  stylesInRange,
  uniformFamily,
  uniformNumber,
  uniformOf,
  type FontFamily,
  type FontStyle,
  type ListKind,
  type TextAlign,
  type TextBody,
} from "./textBody";

export type SameKind = "sticky" | "text" | "shape" | "noodle";

type Box = { x: number; y: number; width: number; height: number };

type Pressed = boolean | "mixed";

const NOODLE_KEYS = ["color", "lineStyle", "thickness", "shape", "markerStart", "markerEnd"] as const;

function selectedNodes(nodes: Node[], type: string) {
  return nodes.filter((node) => node.selected && node.type === type);
}

type TextSource = { body: TextBody; fontSize?: number };

function textSources(nodes: Node[], type: "sticky" | "text" | "shape"): TextSource[] {
  const sources: TextSource[] = [];
  for (const node of selectedNodes(nodes, type)) {
    if (!node.data || typeof node.data !== "object") continue;
    if (type === "sticky") {
      const data = node.data as StickyData;
      sources.push({ body: coerceBody(data.paragraphs, data.text) });
    } else {
      const data = node.data as { paragraphs?: TextBody; fontSize?: number };
      const fontSize = typeof data.fontSize === "number" && data.fontSize > 0 ? data.fontSize : undefined;
      sources.push({ body: coerceBody(data.paragraphs), fontSize });
    }
  }
  return sources;
}

function setList(body: TextBody, list: ListKind): TextBody {
  return body.map((paragraph) => (paragraph.list === list ? paragraph : { ...paragraph, list }));
}

function listPressed(sources: TextSource[], kind: "bullet" | "numbered"): Pressed {
  const lists = sources.flatMap((source) => listsInRange(source.body, fullRange(source.body)));
  if (lists.length > 0 && lists.every((list) => list === kind)) return true;
  if (lists.some((list) => list === kind)) return "mixed";
  return false;
}

function GroupTextBar({
  type,
  box,
  extra,
}: {
  type: "sticky" | "text" | "shape";
  box: Box;
  extra?: ReactNode;
}) {
  const sources = useStore((state) => textSources(state.nodes, type));
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkMixed, setLinkMixed] = useState(false);
  const styles = uniformOf(sources.flatMap((source) => stylesInRange(source.body, fullRange(source.body))));
  const aligns = uniformOf(sources.flatMap((source) => alignsInRange(source.body, fullRange(source.body))));
  const families = uniformFamily(sources.flatMap((source) => familiesInRange(source.body, fullRange(source.body))));
  const sizes = uniformNumber(
    sources.flatMap((source) => sizesInRange(source.body, fullRange(source.body), source.fontSize)),
  );
  const hrefs = sources.flatMap((source) => hrefsInRange(source.body, fullRange(source.body)));
  const linked = hrefs.filter((href) => href).length;
  const linkActive = hrefs.length > 0 && linked === hrefs.length;

  const publish = (map: (body: TextBody) => TextBody) => {
    publishGroupStyle({ property: "text", type, map });
  };

  return (
    <>
      <SelectionChrome side="above" box={box} scope="group">
        <TextToolbar
          styleLabel={styles === "mixed" ? "Mixed" : FONT_STYLE_LABELS[styles]}
          alignLabel={aligns === "mixed" ? "Mixed" : ALIGN_LABELS[aligns]}
          activeStyle={styles}
          activeAlign={aligns}
          activeFamily={families}
          sizeLabel={sizes === "mixed" ? "Mixed" : String(sizes)}
          bullet={listPressed(sources, "bullet")}
          numbered={listPressed(sources, "numbered")}
          linkActive={linkActive}
          extra={extra}
          onStyle={(style: FontStyle) => publish((body) => applyStyle(body, fullRange(body), style))}
          onFamily={(family: FontFamily) => publish((body) => applyFamily(body, fullRange(body), family))}
          onSize={(size: number) => publish((body) => applySize(body, fullRange(body), size))}
          onAlign={(align: TextAlign) => publish((body) => applyAlign(body, fullRange(body), align))}
          onBullet={() => {
            const on = listPressed(sources, "bullet") === true;
            publish((body) => setList(body, on ? "none" : "bullet"));
          }}
          onNumbered={() => {
            const on = listPressed(sources, "numbered") === true;
            publish((body) => setList(body, on ? "none" : "numbered"));
          }}
          onLink={() => {
            if (linkOpen) {
              setLinkOpen(false);
              return;
            }
            const unique = [...new Set(hrefs.map((href) => href ?? ""))];
            setLinkMixed(unique.length > 1);
            setLinkUrl(unique.length === 1 ? unique[0] : "");
            setLinkOpen(true);
          }}
        />
      </SelectionChrome>
      {linkOpen ? (
        <SelectionChrome side="above" order={1} box={box} scope="group">
          <form
            data-text-toolbar
            className="nodrag nopan nowheel"
            onSubmit={(event) => {
              event.preventDefault();
              publish((body) => applyHref(body, fullRange(body), linkUrl));
              setLinkOpen(false);
            }}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <input
              aria-label="Link URL"
              placeholder={linkMixed ? "Multiple links" : "Paste a link"}
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === "Enter") {
                  event.preventDefault();
                  publish((body) => applyHref(body, fullRange(body), linkUrl));
                  setLinkOpen(false);
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  setLinkOpen(false);
                }
              }}
              className="w-56 rounded-lg border border-white/50 bg-white/40 px-2 py-1 text-sm text-slate-800 shadow-lg outline-none backdrop-blur-xl focus:border-slate-400"
            />
          </form>
        </SelectionChrome>
      ) : null}
    </>
  );
}

function StickyColors({ box }: { box: Box }) {
  const active = useStore((state) => {
    const colors: StickyColor[] = [];
    for (const node of selectedNodes(state.nodes, "sticky")) {
      const color = (node.data as StickyData | undefined)?.color;
      if (typeof color === "string" && color in STICKY_COLORS) colors.push(color as StickyColor);
    }
    if (colors.length === 0) return null;
    return colors.every((color) => color === colors[0]) ? colors[0] : null;
  });
  return (
    <SelectionChrome side="below" box={box} scope="group">
      <div
        data-sticky-colors
        className="noodle-sticky-colors nodrag nopan nowheel flex gap-1 rounded-full border border-white/50 bg-white/40 p-1 shadow backdrop-blur-xl"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        {(Object.keys(STICKY_COLORS) as StickyColor[]).map((color) => (
          <button
            key={color}
            type="button"
            aria-label={color}
            aria-pressed={active === color}
            className={`h-5 w-5 rounded-full border border-black/10 ${active === color ? "ring-2 ring-slate-900 ring-offset-1" : ""}`}
            style={{ background: STICKY_COLORS[color] }}
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.stopPropagation();
              publishGroupStyle({ property: "sticky", value: color });
            }}
          />
        ))}
      </div>
    </SelectionChrome>
  );
}

function ShapeBars({ box }: { box: Box }) {
  const paint = useStore((state) => {
    const fills: (string | null)[] = [];
    const strokes: (string | null)[] = [];
    const kinds: ShapeKind[] = [];
    for (const node of selectedNodes(state.nodes, "shape")) {
      const data = node.data as ShapeData | undefined;
      if (!data) continue;
      fills.push(isShapeColor(data.fill) ? data.fill : null);
      strokes.push(isShapeColor(data.stroke) ? data.stroke : null);
      if (isShapeKind(data.kind)) kinds.push(data.kind);
    }
    const agreed = <T,>(values: T[]): T | null =>
      values.length > 0 && values.every((value) => Object.is(value, values[0])) ? values[0] : null;
    return {
      fill: agreed(fills),
      stroke: agreed(strokes),
      fillMixed: fills.length > 1 && agreed(fills) === null,
      strokeMixed: strokes.length > 1 && agreed(strokes) === null,
      kind: agreed(kinds),
    };
  });
  return (
    <>
      <GroupTextBar
        type="shape"
        box={box}
        extra={<ShapeKindMenu kind={paint.kind} onPick={(kind) => publishGroupStyle({ property: "kind", value: kind })} />}
      />
      <SelectionChrome side="below" box={box} scope="group">
        <ShapeColorBar
          fill={paint.fill}
          stroke={paint.stroke}
          fillMixed={paint.fillMixed}
          strokeMixed={paint.strokeMixed}
          onFill={(value) => publishGroupStyle({ property: "fill", value })}
          onStroke={(value) => publishGroupStyle({ property: "stroke", value })}
        />
      </SelectionChrome>
    </>
  );
}

function noodlePaths(ids: string[]) {
  const paths: { path: string; points: { x: number; y: number }[] }[] = [];
  for (const id of ids) {
    const edge = document.querySelector(`.react-flow__edge[data-id="${CSS.escape(id)}"] .react-flow__edge-path`);
    const drawn = edge instanceof SVGPathElement ? edge.getAttribute("d") : drawnNoodle(id)?.d;
    if (drawn) paths.push({ path: drawn, points: [] });
  }
  return paths;
}

function sameNoodleModel(
  a: { id: string; ids: string; width: number; mixed: ReadonlySet<string>; data: ReturnType<typeof readNoodle> } | null,
  b: { id: string; ids: string; width: number; mixed: ReadonlySet<string>; data: ReturnType<typeof readNoodle> } | null,
) {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.id !== b.id || a.ids !== b.ids || a.width !== b.width || !sameNoodle(a.data, b.data)) return false;
  if (a.mixed.size !== b.mixed.size) return false;
  for (const key of a.mixed) if (!b.mixed.has(key)) return false;
  return true;
}

function GroupNoodles({ box }: { box: Box }) {
  const chrome = useChromeLayout();
  const model = useStore((state) => {
    const selected = state.edges.filter((edge) => edge.selected);
    const datas = selected.map((edge) => readNoodle(edge.data));
    const first = datas[0];
    if (!first) return null;
    const mixed = new Set<string>();
    for (const key of NOODLE_KEYS) {
      if (datas.some((data) => data[key] !== first[key])) mixed.add(key);
    }
    const width = datas.reduce((max, data) => Math.max(max, thicknessPx(data.thickness)), 2);
    return { id: selected[0].id, data: first, mixed, width, ids: selected.map((edge) => edge.id).join("\n") };
  }, sameNoodleModel);
  const [paths, setPaths] = useState<{ path: string; points: { x: number; y: number }[] }[]>([]);
  const pathKey = model?.ids ?? "";
  useLayoutEffect(() => {
    if (!model) return;
    const next = noodlePaths(model.ids.split("\n").filter(Boolean));
    // Strokes are absent on the first layout. Dropping a measured path for that
    // empty read moves the toolbar and measures the strokes again.
    if (next.length === 0 || next.some((item) => !item.path)) return;
    const text = next.map((item) => item.path).join("|");
    setPaths((prev) => (prev.map((item) => item.path).join("|") === text ? prev : next));
  }, [pathKey, box.x, box.y, box.width, box.height, model]);
  void chrome;
  if (!model) return null;
  return (
    <NoodleToolbarSlot
      paths={paths}
      midX={box.x + box.width / 2}
      midY={box.y + box.height / 2}
      strokeWidth={model.width}
    >
      <NoodleToolbar
        edgeId={model.id}
        data={model.data}
        mixed={model.mixed}
        onWrite={(patch, history) => {
          if (Object.keys(patch).length === 0) return;
          publishGroupStyle({ property: "noodlePatch", patch, history });
        }}
      />
    </NoodleToolbarSlot>
  );
}

/** The toolbars one object of this type already has, anchored to the group box. */
export default function GroupChrome({ kind, box }: { kind: SameKind; box: Box }) {
  if (kind === "noodle") return <GroupNoodles box={box} />;
  if (kind === "shape") return <ShapeBars box={box} />;
  if (kind === "sticky") {
    return (
      <>
        <GroupTextBar type="sticky" box={box} />
        <StickyColors box={box} />
      </>
    );
  }
  return <GroupTextBar type="text" box={box} />;
}

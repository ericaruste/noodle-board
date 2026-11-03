import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { FloatingPanel, useAnchoredBox } from "./FloatingPanel";
import {
  NOODLE_ARROW_LABELS,
  NOODLE_ARROWS,
  NOODLE_COLORS,
  publishNoodle,
  sameNoodle,
  snapshotBoard,
  type NoodleArrow,
  type NoodleData,
  type NoodleLineStyle,
  type NoodleShape,
  type NoodleThickness,
} from "./noodleData";

type NoodleToolbarProps = {
  edgeId: string;
  data: NoodleData;
};

function ArrowGlyph({ kind }: { kind: NoodleArrow }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinejoin: "round" as const };
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden>
      <path d="M1 7H11" {...common} />
      {kind === "arrow" ? <path d="M8 3.5 12.5 7 8 10.5 9.4 7Z" fill="currentColor" stroke="none" /> : null}
      {kind === "open" ? <path d="M8 3.5 12.5 7 8 10.5" {...common} /> : null}
      {kind === "triangle" ? <path d="M8 3.2 13 7 8 10.8Z" fill="currentColor" stroke="none" /> : null}
      {kind === "circle" ? <circle cx="12" cy="7" r="2.3" fill="currentColor" /> : null}
      {kind === "diamond" ? <path d="M10 7 12.2 4.6 14.4 7 12.2 9.4Z" fill="currentColor" stroke="none" /> : null}
    </svg>
  );
}

function LineGlyph({ dashed, weight }: { dashed?: boolean; weight: number }) {
  return (
    <svg width="22" height="12" viewBox="0 0 22 12" aria-hidden>
      <path
        d="M2 6H20"
        fill="none"
        stroke="currentColor"
        strokeWidth={weight}
        strokeDasharray={dashed ? "3 2.5" : undefined}
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShapeGlyph({ shape }: { shape: NoodleShape }) {
  const d = shape === "straight" ? "M2 9 L16 3" : shape === "elbow" ? "M2 10 H9 V3 H16" : "M2 9 C6 9 8 3 16 3";
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function NoodleToolbar({ edgeId, data }: NoodleToolbarProps) {
  const dataRef = useRef(data);
  dataRef.current = data;
  const [menu, setMenu] = useState<"color" | "start" | "end" | null>(null);
  const labelHistory = useRef(false);
  const colorHistory = useRef(false);

  const write = (next: NoodleData, history: boolean) => {
    if (sameNoodle(dataRef.current, next)) return;
    dataRef.current = next;
    if (history) snapshotBoard();
    publishNoodle(edgeId, next);
  };

  useEffect(() => {
    if (!menu) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-noodle-toolbar]")) return;
      setMenu(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menu]);

  const pick =
    <K extends keyof NoodleData>(key: K, value: NoodleData[K]) =>
    () => {
      setMenu(null);
      write({ ...dataRef.current, [key]: value }, true);
    };

  return (
    <div
      data-noodle-toolbar
      data-noodle-menu={menu ? "" : undefined}
      className="nodrag nopan nowheel flex max-w-[36rem] flex-wrap items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => {
        if ((event.target as HTMLElement).closest("input")) return;
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <ColorMenu open={menu === "color"} color={data.color} onToggle={() => setMenu((current) => (current === "color" ? null : "color"))}>
          <div className="flex w-44 flex-wrap gap-1">
            {NOODLE_COLORS.map((swatch) => (
              <button
                key={swatch.value}
                type="button"
                role="menuitemradio"
                aria-checked={data.color === swatch.value}
                aria-label={swatch.name}
                title={swatch.name}
                onClick={pick("color", swatch.value)}
                className={`h-6 w-6 rounded-full border ${data.color === swatch.value ? "border-slate-900 ring-2 ring-slate-300" : "border-slate-300"}`}
                style={{ background: swatch.value }}
              />
            ))}
            <label className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
              Custom
              <input
                type="color"
                aria-label="Custom color"
                value={data.color}
                className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
                onFocus={() => {
                  colorHistory.current = false;
                }}
                onChange={(event) => {
                  const history = !colorHistory.current;
                  colorHistory.current = true;
                  write({ ...dataRef.current, color: event.target.value }, history);
                }}
                onBlur={() => {
                  colorHistory.current = false;
                }}
              />
            </label>
          </div>
      </ColorMenu>

      <span className="mx-0.5 h-5 w-px bg-slate-200" />

      {(["solid", "dashed"] as NoodleLineStyle[]).map((style) => (
        <button
          key={style}
          type="button"
          aria-label={style === "solid" ? "Solid line" : "Dashed line"}
          aria-pressed={data.lineStyle === style}
          title={style === "solid" ? "Solid" : "Dashed"}
          onClick={pick("lineStyle", style)}
          className={`rounded-lg px-1.5 py-1 ${data.lineStyle === style ? "bg-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-100"}`}
        >
          <LineGlyph dashed={style === "dashed"} weight={1.6} />
        </button>
      ))}

      <span className="mx-0.5 h-5 w-px bg-slate-200" />

      {(
        [
          ["thin", "Thin"],
          ["medium", "Medium"],
          ["thick", "Thick"],
        ] as const
      ).map(([thickness, label]) => (
        <button
          key={thickness}
          type="button"
          aria-label={`${label} line`}
          aria-pressed={data.thickness === thickness}
          title={label}
          onClick={pick("thickness", thickness as NoodleThickness)}
          className={`rounded-lg px-1.5 py-1 ${data.thickness === thickness ? "bg-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-100"}`}
        >
          <LineGlyph weight={thickness === "thin" ? 1 : thickness === "medium" ? 2 : 3.2} />
        </button>
      ))}

      <span className="mx-0.5 h-5 w-px bg-slate-200" />

      {(
        [
          ["straight", "Straight"],
          ["elbow", "Elbow"],
          ["curve", "Curve"],
        ] as const
      ).map(([shape, label]) => (
        <button
          key={shape}
          type="button"
          aria-label={`${label} line`}
          aria-pressed={data.shape === shape}
          title={label}
          onClick={pick("shape", shape)}
          className={`rounded-lg px-1.5 py-1 ${data.shape === shape ? "bg-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-100"}`}
        >
          <ShapeGlyph shape={shape} />
        </button>
      ))}

      <span className="mx-0.5 h-5 w-px bg-slate-200" />

      <input
        aria-label="Text label"
        value={data.label}
        placeholder="Label"
        maxLength={160}
        onFocus={() => {
          labelHistory.current = false;
        }}
        onChange={(event) => {
          const history = !labelHistory.current;
          labelHistory.current = true;
          write({ ...dataRef.current, label: event.target.value }, history);
        }}
        onBlur={() => {
          labelHistory.current = false;
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.currentTarget.blur();
            event.stopPropagation();
          }
        }}
        className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-800 outline-none focus:border-slate-400"
      />

      <ArrowMenu
        label="Start arrowhead"
        value={data.markerStart}
        open={menu === "start"}
        onToggle={() => setMenu((current) => (current === "start" ? null : "start"))}
        onPick={(value) => {
          setMenu(null);
          write({ ...dataRef.current, markerStart: value }, true);
        }}
      />
      <ArrowMenu
        label="End arrowhead"
        value={data.markerEnd}
        open={menu === "end"}
        onToggle={() => setMenu((current) => (current === "end" ? null : "end"))}
        onPick={(value) => {
          setMenu(null);
          write({ ...dataRef.current, markerEnd: value }, true);
        }}
      />
    </div>
  );
}

function AnchoredMenu({
  open,
  anchorRef,
  label,
  className,
  children,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLButtonElement | null>;
  label: string;
  className: string;
  children: ReactNode;
}) {
  const { menuRef, box } = useAnchoredBox(open, anchorRef, "start");
  if (!open) return null;
  return (
    <FloatingPanel
      layer="dropdown"
      panelRef={menuRef}
      role="menu"
      ariaLabel={label}
      data-noodle-toolbar=""
      className={className}
      style={{
        position: "absolute",
        top: box?.top ?? 0,
        left: box?.left ?? 0,
        visibility: box ? "visible" : "hidden",
      }}
    >
      {children}
    </FloatingPanel>
  );
}

function ColorMenu({
  open,
  color,
  onToggle,
  children,
}: {
  open: boolean;
  color: string;
  onToggle: () => void;
  children: ReactNode;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  return (
    <div>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Color"
        aria-expanded={open}
        title="Color"
        onClick={onToggle}
        className="flex items-center gap-1 rounded-lg px-1.5 py-1 hover:bg-slate-100"
      >
        <span className="h-4 w-4 rounded-full border border-slate-300" style={{ background: color }} />
      </button>
      <AnchoredMenu
        open={open}
        anchorRef={buttonRef}
        label="Color"
        className="flex rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
      >
        {children}
      </AnchoredMenu>
    </div>
  );
}

function ArrowMenu({
  label,
  value,
  open,
  onToggle,
  onPick,
}: {
  label: string;
  value: NoodleArrow;
  open: boolean;
  onToggle: () => void;
  onPick: (value: NoodleArrow) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  return (
    <div>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        title={label}
        onClick={onToggle}
        className="flex items-center gap-0.5 rounded-lg px-1 py-0.5 text-slate-700 hover:bg-slate-100"
      >
        <ArrowGlyph kind={value} />
        <svg width="8" height="8" viewBox="0 0 10 10" aria-hidden className="fill-slate-500">
          <path d="M2 3.5 5 7l3-3.5" />
        </svg>
      </button>
      <AnchoredMenu
        open={open}
        anchorRef={buttonRef}
        label={label}
        className="w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
      >
        {NOODLE_ARROWS.map((kind) => (
          <button
            key={kind}
            type="button"
            role="menuitemradio"
            aria-checked={value === kind}
            onClick={() => onPick(kind)}
            className={`flex w-full items-center gap-2 px-2 py-1 text-left text-xs ${
              value === kind ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <ArrowGlyph kind={kind} />
            {NOODLE_ARROW_LABELS[kind]}
          </button>
        ))}
      </AnchoredMenu>
    </div>
  );
}

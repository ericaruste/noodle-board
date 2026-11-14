import { memo, useMemo, useRef, useState } from "react";
import { type Node, type NodeProps } from "@xyflow/react";
import ColorPickerToolbar, { type ColorPickerChoice } from "./ColorPickerToolbar";
import { SWATCH_FAMILIES, swatchColor, type SwatchFamily } from "./ColorSwatch";
import { NoodleResizer, useNoodleResizeStyle } from "./NoodleResizer";
import ObjectPorts from "./ObjectPorts";
import RichText from "./RichText";
import SelectionChrome from "./SelectionChrome";
import { selectionHeld, swallowsClick, useConnectChromeHidden } from "./portHot";
import { useSelectedObjectCount } from "./selectionScope";
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

export type StickyPaint =
  | { kind: "none" }
  | { kind: "swatch"; family: SwatchFamily }
  | { kind: "custom"; hex: string };

export type StickyData = {
  text?: string;
  color: StickyColor;
  /** Palette, custom, or none. Absent on notes saved before the color picker. */
  paint?: StickyPaint;
  /** Last custom color, kept when a palette swatch is selected. Six digits, no #. */
  customHex?: string;
  paragraphs?: TextParagraph[];
};

const LEGACY_FAMILY: Record<StickyColor, SwatchFamily> = {
  yellow: "yellow",
  pink: "pink",
  blue: "sky",
  green: "lime",
};

const FAMILY_LEGACY: Partial<Record<SwatchFamily, StickyColor>> = {
  yellow: "yellow",
  pink: "pink",
  sky: "blue",
  lime: "green",
};

const HEX = /^[0-9A-F]{6}$/;

function cleanHex(raw: string) {
  return raw.replace(/#/g, "").replace(/[^0-9a-fA-F]/g, "").slice(0, 6).toUpperCase();
}

export function isStickyPaint(value: unknown): value is StickyPaint {
  if (!value || typeof value !== "object") return false;
  const paint = value as StickyPaint;
  if (paint.kind === "none") return true;
  if (paint.kind === "swatch") return (SWATCH_FAMILIES as readonly string[]).includes(paint.family);
  if (paint.kind === "custom") return typeof paint.hex === "string" && HEX.test(paint.hex);
  return false;
}

export function legacyStickyPaint(color: StickyColor): StickyPaint {
  return { kind: "swatch", family: LEGACY_FAMILY[color] };
}

export function stickyCustomHex(data: Pick<StickyData, "paint" | "customHex">) {
  if (isStickyPaint(data.paint) && data.paint.kind === "custom") return data.paint.hex;
  const stored = data.customHex ? cleanHex(data.customHex) : "";
  return HEX.test(stored) ? stored : "EBCFFF";
}

export function stickyChoice(data: Pick<StickyData, "color" | "paint">): ColorPickerChoice {
  if (isStickyPaint(data.paint)) {
    if (data.paint.kind === "swatch") return { kind: "swatch", family: data.paint.family };
    if (data.paint.kind === "custom") return { kind: "custom" };
    return { kind: "none" };
  }
  const family = data.color in LEGACY_FAMILY ? LEGACY_FAMILY[data.color] : undefined;
  return family ? { kind: "swatch", family } : { kind: "none" };
}

export function sameStickyChoice(a: ColorPickerChoice, b: ColorPickerChoice) {
  if (a.kind !== b.kind) return false;
  if (a.kind === "swatch" && b.kind === "swatch") return a.family === b.family;
  return true;
}

export function stickyFill(data: Pick<StickyData, "color" | "paint">) {
  if (!isStickyPaint(data.paint)) return STICKY_COLORS[data.color] ?? STICKY_COLORS.yellow;
  if (data.paint.kind === "none") return "transparent";
  if (data.paint.kind === "custom") return `#${data.paint.hex}`;
  return swatchColor(data.paint.family, 200);
}

export function applyStickyChoice(data: StickyData, choice: ColorPickerChoice, hex: string): StickyData {
  if (choice.kind === "mixed") return data;
  const customHex = HEX.test(cleanHex(hex)) ? cleanHex(hex) : stickyCustomHex(data);
  if (choice.kind === "none") return { ...data, customHex, paint: { kind: "none" } };
  if (choice.kind === "swatch") {
    return {
      ...data,
      color: FAMILY_LEGACY[choice.family] ?? data.color,
      customHex,
      paint: { kind: "swatch", family: choice.family },
    };
  }
  return { ...data, customHex, paint: { kind: "custom", hex: customHex } };
}

export function sameStickyPaint(a: StickyData, b: StickyData) {
  return a.color === b.color && a.customHex === b.customHex && JSON.stringify(a.paint ?? null) === JSON.stringify(b.paint ?? null);
}

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
    const { text: _text, ...rest } = current;
    const nextData: StickyData = { ...rest, paragraphs: next };
    dataRef.current = nextData;
    snapshot();
    publish(id, nextData);
  };

  const format = (next: TextBody) => {
    const current = dataRef.current;
    const stored = isTextBody(current.paragraphs) ? coerceBody(current.paragraphs) : body;
    if (sameBody(next, stored)) return;
    const { text: _text, ...rest } = current;
    const nextData: StickyData = { ...rest, paragraphs: next };
    dataRef.current = nextData;
    snapshot();
    publish(id, nextData);
  };

  const paint = (choice: ColorPickerChoice, hex: string, recordHistory: boolean) => {
    const nextData = applyStickyChoice(dataRef.current, choice, hex);
    if (sameStickyPaint(dataRef.current, nextData)) return;
    if (recordHistory) snapshot();
    dataRef.current = nextData;
    publish(id, nextData);
  };

  return (
    <div
      role="group"
      aria-label="Sticky note"
      className="noodle-node relative h-full w-full rounded-sm shadow-[2px_4px_12px_rgba(15,23,42,0.18)]"
      style={{ ...resizeStyle, background: stickyFill(data) }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        if (selectionHeld() || swallowsClick()) return;
        setEditing(true);
      }}
    >
      <NoodleResizer
        selected={showChrome}
        minWidth={140}
        minHeight={140}
        onResizeStart={snapshot}
      />
      <ObjectPorts nodeId={id} />
      <RichText
        body={body}
        editing={editing}
        selected={showChrome}
        fill
        canvasDefault
        placeholder="Double-click to write"
        onCommit={commit}
        onCancel={() => setEditing(false)}
        onFormat={format}
      />
      {showChrome ? (
        <SelectionChrome side="below">
          <StickyColorToolbar
            choice={stickyChoice(data)}
            customHex={stickyCustomHex(data)}
            onApply={paint}
          />
        </SelectionChrome>
      ) : null}
    </div>
  );
}

/**
 * The open picker lives in this toolbar. It mounts only while the note is
 * selected, so a click on the canvas and a later click on the note start collapsed.
 */
export function StickyColorToolbar({
  choice,
  customHex,
  onApply,
}: {
  choice: ColorPickerChoice;
  customHex: string;
  onApply: (choice: ColorPickerChoice, hex: string, recordHistory: boolean) => void;
}) {
  const gesture = useRef(false);
  const pending = useRef<{ choice: ColorPickerChoice; hex: string } | null>(null);
  const scheduled = useRef(false);
  const hexRef = useRef(customHex);
  const onApplyRef = useRef(onApply);
  onApplyRef.current = onApply;
  if (!scheduled.current) hexRef.current = customHex;

  function flush() {
    scheduled.current = false;
    const next = pending.current;
    pending.current = null;
    if (!next || next.choice.kind === "mixed") return;
    const recordHistory = !gesture.current;
    gesture.current = true;
    onApplyRef.current(next.choice, next.hex, recordHistory);
  }

  function schedule(next: { choice: ColorPickerChoice; hex: string }) {
    pending.current = next;
    if (scheduled.current) return;
    scheduled.current = true;
    queueMicrotask(flush);
  }

  return (
    <div
      data-sticky-colors
      className="nodrag nopan nowheel"
      onMouseDownCapture={() => {
        gesture.current = false;
      }}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      <ColorPickerToolbar
        scale={200}
        choice={choice}
        customHex={customHex}
        onChoiceChange={(next) => schedule({ choice: next, hex: hexRef.current })}
        onCustomHexChange={(hex) => {
          hexRef.current = hex;
          schedule({ choice: { kind: "custom" }, hex });
        }}
      />
    </div>
  );
}

export default memo(StickyNode);

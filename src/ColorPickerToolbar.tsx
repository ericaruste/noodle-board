import { useLayoutEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Copy, Pipette } from "lucide-react";
import { ColorSwatch, SWATCH_FAMILIES, swatchColor, type SwatchFamily, type SwatchScale } from "./ColorSwatch";
import { FloatingLayer, FloatingPanel, floatingSlot } from "./FloatingPanel";
import { HexInput } from "./HexInput";
import { IconButton } from "./IconButton";
import { layers } from "./layers";

export type ColorPickerChoice =
  | { kind: "none" }
  | { kind: "swatch"; family: SwatchFamily }
  | { kind: "custom" }
  | { kind: "mixed" };

type ColorPickerToolbarProps = {
  /** Fill and sticky notes use 200. Stroke and noodles use 500. */
  scale?: SwatchScale;
  choice?: ColorPickerChoice;
  defaultChoice?: ColorPickerChoice;
  /** Six hex digits for the custom swatch, without the #. */
  customHex?: string;
  defaultCustomHex?: string;
  /** Extended shows the picker. Collapsed hides it. */
  expanded?: boolean;
  defaultExpanded?: boolean;
  onChoiceChange?: (choice: ColorPickerChoice) => void;
  onCustomHexChange?: (hex: string) => void;
  onExpandedChange?: (expanded: boolean) => void;
};

/**
 * Hex digits for `alias.swatch`, copied from the brand colors in tokens.css.
 * The discs themselves paint the CSS variables. The field needs the digits.
 */
const SWATCH_HEX: Record<SwatchFamily, Record<SwatchScale, string>> = {
  purple: { 200: "EBCFFF", 500: "BF66FF" },
  sky: { 200: "CBECFF", 500: "66C7FF" },
  lime: { 200: "E9FFDB", 500: "A5F075" },
  orange: { 200: "FFDBA7", 500: "FFC066" },
  yellow: { 200: "FFF6BF", 500: "F0DE75" },
  coral: { 200: "FFD4C4", 500: "FF8F66" },
  tomato: { 200: "FF9E97", 500: "FF7066" },
  pink: { 200: "FFE4ED", 500: "FF99BB" },
};

type PickerSide = "left" | "right";

/** The picker hangs off the toolbar. It stays off the measured box so the centered bar does not shift. */
function pickerSideFor(toolbar: HTMLElement, picker: HTMLElement): PickerSide {
  const host = floatingSlot("toolbar")?.getBoundingClientRect();
  const leftEdge = host?.left ?? 0;
  const rightEdge = host?.right ?? window.innerWidth;
  const pad = 8;
  const gapRaw = getComputedStyle(document.documentElement).getPropertyValue("--brand-scale-100");
  const gap = Number.parseFloat(gapRaw);
  const space = Number.isFinite(gap) ? gap : 4;
  const box = toolbar.getBoundingClientRect();
  const width = picker.offsetWidth;
  const roomRight = rightEdge - pad - box.right - space;
  const roomLeft = box.left - space - (leftEdge + pad);
  if (roomRight >= width) return "right";
  return roomLeft > roomRight ? "left" : "right";
}

/** Resting paint of the custom disc. The picked color shows only while custom is selected. */
const DEFAULT_CUSTOM_HEX = "EBCFFF";

const fullHex = /^[0-9A-F]{6}$/;

type EyeDropperWindow = Window & {
  EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
};

function digitsOf(raw: string) {
  return raw.replace(/#/g, "").replace(/[^0-9a-fA-F]/g, "").slice(0, 6).toUpperCase();
}

export default function ColorPickerToolbar({
  scale = 200,
  choice: choiceProp,
  defaultChoice = { kind: "none" },
  customHex: customHexProp,
  defaultCustomHex = DEFAULT_CUSTOM_HEX,
  expanded: expandedProp,
  defaultExpanded = false,
  onChoiceChange,
  onCustomHexChange,
  onExpandedChange,
}: ColorPickerToolbarProps) {
  const [choiceState, setChoiceState] = useState(defaultChoice);
  const [hexState, setHexState] = useState(() => digitsOf(defaultCustomHex));
  const [expandedState, setExpandedState] = useState(defaultExpanded);
  const [pickerSide, setPickerSide] = useState<PickerSide>("right");
  const toolbarRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const choice = choiceProp ?? choiceState;
  const customHex = digitsOf(customHexProp ?? hexState);
  const expanded = expandedProp ?? expandedState;
  const held = useRef(fullHex.test(customHex) ? customHex : DEFAULT_CUSTOM_HEX);
  if (fullHex.test(customHex)) held.current = customHex;

  function setChoice(next: ColorPickerChoice) {
    if (choiceProp === undefined) setChoiceState(next);
    onChoiceChange?.(next);
  }

  function setCustomHex(next: string) {
    const clean = digitsOf(next);
    if (customHexProp === undefined) setHexState(clean);
    onCustomHexChange?.(clean);
  }

  function setExpanded(next: boolean) {
    if (expandedProp === undefined) setExpandedState(next);
    onExpandedChange?.(next);
  }

  const shown = choice.kind === "swatch" ? SWATCH_HEX[choice.family][scale] : customHex;
  const pickerHex = held.current;

  useLayoutEffect(() => {
    if (!expanded) return;
    let frame = 0;
    const place = () => {
      const toolbar = toolbarRef.current;
      const picker = pickerRef.current;
      if (toolbar && picker) {
        const next = pickerSideFor(toolbar, picker);
        setPickerSide((prev) => (prev === next ? prev : next));
      }
      frame = requestAnimationFrame(place);
    };
    place();
    return () => cancelAnimationFrame(frame);
  }, [expanded]);

  function onCustomClick() {
    const nextExpanded = choice.kind === "custom" ? !expanded : true;
    // Opening custom from a palette keeps that fill. The picker starts on it
    // instead of the last custom color.
    if (choice.kind === "swatch") setCustomHex(SWATCH_HEX[choice.family][scale]);
    if (choice.kind !== "custom") setChoice({ kind: "custom" });
    setExpanded(nextExpanded);
  }

  function onHex(next: string) {
    setCustomHex(next);
    setChoice({ kind: "custom" });
  }

  function onCopy() {
    const digits = fullHex.test(shown) ? shown : pickerHex;
    void navigator.clipboard.writeText(`#${digits}`);
  }

  async function onPipette() {
    const Dropper = (window as EyeDropperWindow).EyeDropper;
    if (!Dropper) return;
    try {
      const result = await new Dropper().open();
      const next = digitsOf(result.sRGBHex);
      if (!fullHex.test(next)) return;
      setCustomHex(next);
      setChoice({ kind: "custom" });
    } catch {
      // The eyedropper was dismissed.
    }
  }

  const panelClass =
    "rounded-alias-border-radius-xxl border border-alias-border-width-xsm border-mapped-border-default bg-mapped-surface-default p-brand-scale-200 shadow-lg backdrop-blur-xl";

  return (
    <div
      data-color-toolbar
      data-color-expanded={expanded ? "true" : "false"}
      role="group"
      aria-label="Color picker"
      data-color-picker-side={expanded ? pickerSide : "closed"}
      className="relative w-max"
      onMouseDown={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest(".react-colorful")) {
          event.stopPropagation();
          return;
        }
        if (target.closest("[data-hex-input], input, textarea")) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.querySelector("[data-hex-input] input")?.blur();
      }}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      {/* The swatch grid is 152px: five 24px discs and four 8px gaps. The hex row matches that width. No spacing token is 152px. */}
      <div ref={toolbarRef} className={`noodle-color-toolbar grid w-max grid-cols-1 gap-brand-scale-400 ${panelClass}`}>
        <div className="grid grid-cols-5 gap-brand-scale-200">
          <ColorSwatch
            type="none"
            selected={choice.kind === "none"}
            onClick={() => {
              setChoice({ kind: "none" });
              setExpanded(false);
            }}
          />
          {SWATCH_FAMILIES.map((family) => (
            <ColorSwatch
              key={family}
              type="color"
              color={swatchColor(family, scale)}
              selected={choice.kind === "swatch" && choice.family === family}
              ariaLabel={`${family} ${scale}`}
              onClick={() => {
                setChoice({ kind: "swatch", family });
                setExpanded(false);
              }}
            />
          ))}
          <ColorSwatch
            type="custom"
            color={choice.kind === "custom" ? `#${pickerHex}` : `#${DEFAULT_CUSTOM_HEX}`}
            selected={choice.kind === "custom"}
            onClick={onCustomClick}
          />
        </div>
        <div className="flex w-0 min-w-full items-center gap-brand-scale-100">
          <HexInput className="min-w-0 flex-1" value={shown} onValueChange={onHex} />
          <div className="flex shrink-0 items-center gap-brand-scale-100">
            <IconButton icon={Copy} size="md" ariaLabel="Copy hex" onClick={onCopy} />
            <IconButton icon={Pipette} size="md" ariaLabel="Pick a color from the screen" onClick={() => void onPipette()} />
          </div>
        </div>
      </div>
      {expanded ? (
        <div
          ref={pickerRef}
          className={`${panelClass} absolute top-0 ${
            pickerSide === "left"
              ? "right-[calc(100%+var(--brand-scale-100))]"
              : "left-[calc(100%+var(--brand-scale-100))]"
          }`}
          role="group"
          aria-label="Color picker panel"
        >
          <HexColorPicker
            className="noodle-color-picker"
            color={`#${pickerHex}`}
            onChange={(next) => onHex(digitsOf(next))}
          />
        </div>
      ) : null}
    </div>
  );
}

const captionClass =
  "font-alias-font-family-body text-responsive-desktop-body-md-size leading-responsive-desktop-body-md-line-height-tight";

function LayerCheck() {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    let frame = 0;
    const place = () => {
      const anchor = anchorRef.current;
      const layer = floatingSlot("toolbar");
      if (anchor && layer) {
        const anchorBox = anchor.getBoundingClientRect();
        const layerBox = layer.getBoundingClientRect();
        const next = { top: anchorBox.top - layerBox.top + 16, left: anchorBox.left - layerBox.left + 24 };
        setBox((prev) =>
          prev && Math.abs(prev.top - next.top) < 0.5 && Math.abs(prev.left - next.left) < 0.5 ? prev : next,
        );
      }
      frame = requestAnimationFrame(place);
    };
    place();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="flex flex-col items-start gap-brand-scale-100">
      <p className={captionClass}>Above a selected element and a dragging element</p>
      <div ref={anchorRef} className="relative h-[360px] w-[420px]">
        <div
          className="absolute left-0 top-0 flex h-[220px] w-[280px] items-end bg-mapped-surface-action-selected p-brand-scale-200"
          style={{ zIndex: layers.selection }}
        >
          <span className={captionClass}>Selected</span>
        </div>
        <div
          className="absolute left-[140px] top-[48px] flex h-[180px] w-[240px] items-end bg-mapped-surface-action-hover p-brand-scale-200"
          style={{ zIndex: layers.selection }}
        >
          <span className={captionClass}>Dragging</span>
        </div>
        {box ? (
          <FloatingPanel
            layer="toolbar"
            ariaLabel="Color picker toolbar"
            className="absolute"
            style={{ left: box.left, top: box.top }}
          >
            <ColorPickerToolbar defaultChoice={{ kind: "custom" }} defaultCustomHex="EBCFFF" defaultExpanded />
          </FloatingPanel>
        ) : null}
      </div>
    </div>
  );
}

export function ColorPickerToolbarPreview() {
  const [choice, setChoice] = useState<ColorPickerChoice>({ kind: "none" });
  const [hex, setHex] = useState("EBCFFF");
  const [expanded, setExpanded] = useState(false);
  const choiceLabel =
    choice.kind === "swatch" ? choice.family : choice.kind;

  return (
    <main className="relative flex h-full flex-col gap-brand-scale-600 overflow-auto bg-mapped-surface-page p-brand-scale-600 text-mapped-text-caption">
      <FloatingLayer />
      <p className={captionClass}>Color picker toolbar</p>
      <div className="flex flex-wrap items-start gap-brand-scale-600">
        <div className="flex flex-col items-start gap-brand-scale-100">
          <p className={captionClass}>Collapsed</p>
          <ColorPickerToolbar choice={{ kind: "none" }} customHex="EBCFFF" expanded={false} />
        </div>
        <div className="flex flex-col items-start gap-brand-scale-100">
          <p className={captionClass}>Extended</p>
          <ColorPickerToolbar choice={{ kind: "custom" }} customHex="EBCFFF" expanded />
        </div>
      </div>
      <div className="flex flex-col items-start gap-brand-scale-100">
        <p className={captionClass}>Live</p>
        <ColorPickerToolbar
          choice={choice}
          customHex={hex}
          expanded={expanded}
          onChoiceChange={setChoice}
          onCustomHexChange={setHex}
          onExpandedChange={setExpanded}
        />
        <p className={captionClass}>
          custom #{fullHex.test(hex) ? hex : "EBCFFF"} · {choiceLabel} · {expanded ? "extended" : "collapsed"}
        </p>
      </div>
      <LayerCheck />
    </main>
  );
}

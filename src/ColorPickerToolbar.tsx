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
  | { kind: "custom" };

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
  defaultCustomHex = "EBCFFF",
  expanded: expandedProp,
  defaultExpanded = false,
  onChoiceChange,
  onCustomHexChange,
  onExpandedChange,
}: ColorPickerToolbarProps) {
  const [choiceState, setChoiceState] = useState(defaultChoice);
  const [hexState, setHexState] = useState(() => digitsOf(defaultCustomHex));
  const [expandedState, setExpandedState] = useState(defaultExpanded);
  const choice = choiceProp ?? choiceState;
  const customHex = digitsOf(customHexProp ?? hexState);
  const expanded = expandedProp ?? expandedState;
  const held = useRef(fullHex.test(customHex) ? customHex : "EBCFFF");
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

  function onCustomClick() {
    const nextExpanded = choice.kind === "custom" ? !expanded : true;
    setChoice({ kind: "custom" });
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

  return (
    <div
      data-color-toolbar
      role="group"
      aria-label="Color picker"
      className="noodle-color-toolbar flex w-max flex-col gap-brand-scale-400 rounded-alias-border-radius-lg border border-alias-border-width-xsm border-mapped-border-default bg-mapped-surface-default p-brand-scale-200 shadow-lg backdrop-blur-xl"
      onMouseDown={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("[data-hex-input], input, textarea")) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.querySelector("[data-hex-input] input")?.blur();
      }}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      {/* 172px is 5 discs of 28px plus 4 gaps of 8px. No spacing token is 172px. TODO token mismatch: Figma 172px */}
      <div className="flex w-[172px] flex-col gap-brand-scale-400">
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
            color={`#${pickerHex}`}
            selected={choice.kind === "custom"}
            onClick={onCustomClick}
          />
        </div>
        {expanded ? (
          <HexColorPicker
            className="noodle-color-picker"
            color={`#${pickerHex}`}
            onChange={(next) => onHex(digitsOf(next))}
          />
        ) : null}
        <div className="flex items-center justify-between gap-brand-scale-100">
          <HexInput value={shown} onValueChange={onHex} />
          <div className="flex items-center gap-brand-scale-100">
            <IconButton icon={Copy} size="md" ariaLabel="Copy hex" onClick={onCopy} />
            <IconButton icon={Pipette} size="md" ariaLabel="Pick a color from the screen" onClick={() => void onPipette()} />
          </div>
        </div>
      </div>
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
    choice.kind === "swatch" ? choice.family : choice.kind === "custom" ? "custom" : "none";

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

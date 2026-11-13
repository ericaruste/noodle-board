import { forwardRef, useState } from "react";

export type ColorSwatchType = "none" | "color" | "custom";
export type ColorSwatchState = "default" | "hover" | "selected";

/** The purple on the Figma specimen. Color swatches in the product use `alias.swatch`. */
export const colorSwatchExample = "var(--alias-swatch-purple-500)";

/** `alias.swatch` families, in the order they appear in the token file. */
export const SWATCH_FAMILIES = [
  "purple",
  "sky",
  "lime",
  "orange",
  "yellow",
  "coral",
  "tomato",
  "pink",
] as const;

export type SwatchFamily = (typeof SWATCH_FAMILIES)[number];

/** Fill and sticky notes use 200. Stroke and noodles use 500. */
export type SwatchScale = 200 | 500;

export function swatchColor(family: SwatchFamily, scale: SwatchScale) {
  return `var(--alias-swatch-${family}-${scale})`;
}

/** Stand-in for the color a react-colorful picker will pass later. Not an alias swatch. */
const customPickerSample = "#E23D8C";

/**
 * Figma angular gradient on the custom swatch. Not a token.
 * 0% sits at the left, where the stop handles sit on the frame.
 * The circle on top is the color the user picks, with a 1px white stroke inside it.
 */
const customWheel =
  "conic-gradient(from 270deg, #F43F5E 0%, #F59E0B 14%, #EAB308 29%, #22C55E 43%, #06B6D4 57%, #6366F1 71%, #D946EF 86%, #F43F5E 100%)";

type ColorSwatchProps = {
  type?: ColorSwatchType;
  /** An `alias.swatch` on the color type. The picker color on the custom type. */
  color?: string;
  /** Painted variant. Leave unset to follow selected and real hover. */
  state?: ColorSwatchState;
  selected?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
};

// Figma draws this ring as a drop shadow so a second stroke does not change
// the disc border. Outline sits outside the disc and leaves that border alone.
// Hover and selected are 4px, alias.border-width.md. The frame measures 3px.
const ringClass: Record<ColorSwatchState, string> = {
  default: "[outline:none]",
  hover: "[outline:var(--alias-border-width-md)_solid_var(--mapped-border-action-ring)]",
  selected: "[outline:var(--alias-border-width-md)_solid_var(--mapped-border-action-ring-focus)]",
};

const discClass =
  "group relative inline-flex size-brand-scale-600 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 [outline-offset:0]";

const hairlineClass =
  "pointer-events-none absolute inset-0 rounded-full group-focus-visible:hidden [box-shadow:inset_0_0_0_var(--alias-border-width-xsm)_var(--mapped-border-control)]";

function labelFor(type: ColorSwatchType) {
  if (type === "none") return "No color";
  if (type === "custom") return "Custom color";
  return "Color";
}

export const ColorSwatch = forwardRef<HTMLButtonElement, ColorSwatchProps>(function ColorSwatch(
  { type = "color", color = colorSwatchExample, state, selected = false, onClick, ariaLabel },
  ref,
) {
  const [hovered, setHovered] = useState(false);
  const visual: ColorSwatchState = state ?? (selected ? "selected" : hovered ? "hover" : "default");

  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel ?? labelFor(type)}
      aria-pressed={selected || state === "selected"}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`${discClass} ${ringClass[visual]} ${
        visual === "default"
          ? "focus-visible:[outline:var(--alias-border-width-md)_solid_var(--mapped-border-action-ring)]"
          : ""
      }`}
    >
      {type === "none" ? (
        <span className="absolute inset-0 rounded-full bg-brand-foundation-white">
          <span className="absolute left-1/2 top-1/2 h-brand-scale-50 w-brand-scale-500 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-mapped-icon-disabled" />
        </span>
      ) : null}
      {type === "color" ? (
        <span className="absolute inset-0 rounded-full" style={{ background: color }} />
      ) : null}
      {type === "custom" ? (
        <>
          <span className="absolute inset-0 rounded-full" style={{ background: customWheel }} />
          <span
            className="absolute left-1/2 top-1/2 box-border size-brand-scale-300 -translate-x-1/2 -translate-y-1/2 rounded-full border border-alias-border-width-xsm border-brand-foundation-white"
            style={{ background: color }}
          />
        </>
      ) : null}
      {type !== "custom" && visual === "default" ? <span className={hairlineClass} /> : null}
    </button>
  );
});

const previewTypes: ColorSwatchType[] = ["none", "color", "custom"];
const previewStates: ColorSwatchState[] = ["default", "hover", "selected"];

const captionClass =
  "font-alias-font-family-body text-responsive-desktop-body-md-size leading-responsive-desktop-body-md-line-height-tight";

function SwatchScaleRow({
  label,
  scale,
  selected,
  onSelect,
}: {
  label: string;
  scale: SwatchScale;
  selected: SwatchFamily;
  onSelect: (family: SwatchFamily) => void;
}) {
  return (
    <div className="flex flex-col items-start gap-brand-scale-100">
      <p className={captionClass}>{label}</p>
      <div className="flex items-center gap-brand-scale-200">
        {SWATCH_FAMILIES.map((family) => (
          <ColorSwatch
            key={family}
            type="color"
            color={swatchColor(family, scale)}
            selected={selected === family}
            onClick={() => onSelect(family)}
            ariaLabel={`${family} ${scale}`}
          />
        ))}
      </div>
    </div>
  );
}

export function ColorSwatchPreview() {
  const [fill, setFill] = useState<SwatchFamily>("purple");
  const [stroke, setStroke] = useState<SwatchFamily>("sky");
  const [customSelected, setCustomSelected] = useState(false);

  return (
    <main className="flex min-h-screen flex-col gap-brand-scale-600 bg-mapped-surface-page p-brand-scale-600 text-mapped-text-caption">
      <p className={captionClass}>Color swatch</p>
      <div className="flex flex-col gap-brand-scale-400">
        {previewTypes.map((type) => (
          <div key={type} className="flex items-center gap-brand-scale-600">
            <p className={`w-brand-scale-1200 ${captionClass}`}>{type}</p>
            {previewStates.map((state) => (
              <ColorSwatch key={state} type={type} state={state} ariaLabel={`${type} ${state}`} />
            ))}
          </div>
        ))}
      </div>
      <SwatchScaleRow label="Fill and sticky, 200" scale={200} selected={fill} onSelect={setFill} />
      <SwatchScaleRow
        label="Stroke and noodles, 500"
        scale={500}
        selected={stroke}
        onSelect={setStroke}
      />
      <div className="flex flex-col items-start gap-brand-scale-100">
        <p className={captionClass}>Custom</p>
        <ColorSwatch
          type="custom"
          color={customPickerSample}
          selected={customSelected}
          onClick={() => setCustomSelected((on) => !on)}
          ariaLabel="Custom color"
        />
      </div>
    </main>
  );
}

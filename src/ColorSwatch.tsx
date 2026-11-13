import { forwardRef, useState } from "react";

export type ColorSwatchType = "none" | "color" | "custom";
export type ColorSwatchState = "default" | "hover" | "selected";

/** The purple on the spec. A later color picker can pass any CSS color. */
export const colorSwatchExample = "var(--alias-swatch-purple-500)";

/**
 * Hue wheel for the custom type. Not a token.
 * The circle on top is the color the user picks.
 */
const customWheel = "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)";

type ColorSwatchProps = {
  type?: ColorSwatchType;
  /** Fill, or the preview circle on the custom type. */
  color?: string;
  /** Painted variant. Leave unset to follow selected and real hover. */
  state?: ColorSwatchState;
  selected?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
};

// Figma draws this ring as a drop shadow so a second stroke does not change
// the disc border. Outline sits outside the disc and leaves that border alone.
// TODO token mismatch: Figma ring is 3px. Nearest widths are 2px and 4px.
// 2px is alias.border-width.sm, the same width as the hex input focus ring.
const ringClass: Record<ColorSwatchState, string> = {
  default: "[outline:none]",
  hover: "[outline:var(--alias-border-width-sm)_solid_var(--mapped-border-action-ring)]",
  selected:
    "[outline:var(--alias-border-width-sm)_solid_var(--mapped-border-action-ring-selected)]",
};

const discClass =
  "relative inline-flex size-brand-scale-700 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 [outline-offset:0]";

const hairlineClass =
  "pointer-events-none absolute inset-0 rounded-full [box-shadow:inset_0_0_0_var(--alias-border-width-xsm)_var(--mapped-border-control)]";

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
          ? "focus-visible:[outline:var(--alias-border-width-sm)_solid_var(--mapped-border-action-ring)]"
          : ""
      }`}
    >
      {type === "none" ? (
        <span className="absolute inset-0 rounded-full bg-brand-foundation-white">
          <span className="absolute left-1/2 top-1/2 h-brand-scale-50 w-brand-scale-600 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-mapped-icon-action" />
        </span>
      ) : null}
      {type === "color" ? (
        <span className="absolute inset-0 rounded-full" style={{ background: color }} />
      ) : null}
      {type === "custom" ? (
        <>
          <span className="absolute inset-0 rounded-full" style={{ background: customWheel }} />
          <span className="absolute left-1/2 top-1/2 size-brand-scale-400 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-foundation-white" />
          <span
            className="absolute left-1/2 top-1/2 size-brand-scale-300 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: color }}
          />
        </>
      ) : null}
      <span className={hairlineClass} />
    </button>
  );
});

const previewTypes: ColorSwatchType[] = ["none", "color", "custom"];
const previewStates: ColorSwatchState[] = ["default", "hover", "selected"];

const livePalette = [
  { name: "Purple", value: "var(--alias-swatch-purple-500)" },
  { name: "Sky", value: "var(--alias-swatch-sky-500)" },
  { name: "Lime", value: "var(--alias-swatch-lime-500)" },
  { name: "Orange", value: "var(--alias-swatch-orange-500)" },
  { name: "Tomato", value: "var(--alias-swatch-tomato-500)" },
];

export function ColorSwatchPreview() {
  const [picked, setPicked] = useState<string | null>(colorSwatchExample);

  return (
    <main className="flex min-h-screen flex-col gap-brand-scale-600 bg-mapped-surface-page p-brand-scale-600 text-mapped-text-caption">
      <p className="font-alias-font-family-body text-responsive-desktop-body-md-size leading-responsive-desktop-body-md-line-height-tight">
        Color swatch
      </p>
      <div className="flex flex-col gap-brand-scale-400">
        {previewTypes.map((type) => (
          <div key={type} className="flex items-center gap-brand-scale-600">
            <p className="w-brand-scale-1200 font-alias-font-family-body text-responsive-desktop-body-md-size leading-responsive-desktop-body-md-line-height-tight">
              {type}
            </p>
            {previewStates.map((state) => (
              <ColorSwatch key={state} type={type} state={state} ariaLabel={`${type} ${state}`} />
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-col items-start gap-brand-scale-200">
        <p className="font-alias-font-family-body text-responsive-desktop-body-md-size leading-responsive-desktop-body-md-line-height-tight">
          Live
        </p>
        <div className="flex items-center gap-brand-scale-200">
          <ColorSwatch
            type="none"
            selected={picked === null}
            onClick={() => setPicked(null)}
            ariaLabel="No color"
          />
          {livePalette.map((swatch) => (
            <ColorSwatch
              key={swatch.name}
              color={swatch.value}
              selected={picked === swatch.value}
              onClick={() => setPicked(swatch.value)}
              ariaLabel={swatch.name}
            />
          ))}
          <ColorSwatch
            type="custom"
            color={picked ?? colorSwatchExample}
            ariaLabel="Custom preview"
          />
        </div>
      </div>
    </main>
  );
}

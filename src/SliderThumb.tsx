import type { CSSProperties } from "react";

export type SliderThumbState = "default" | "hover" | "pressed" | "disabled";

/** `sm` is 12px and is the default. `md` is 16px. */
export type SliderThumbSize = "sm" | "md";

type SliderThumbProps = {
  /** Painted variant from the spec. Leave unset for the resting disc. */
  state?: SliderThumbState;
  /** Leave unset for `sm`, the 12px disc. `md` is 16px. */
  size?: SliderThumbSize;
  className?: string;
  style?: CSSProperties;
};

const thumbSizeClass: Record<SliderThumbSize, string> = {
  sm: "size-brand-scale-300",
  md: "size-brand-scale-400",
};

const paint: Record<SliderThumbState, string> = {
  default: "[box-shadow:inset_0_0_0_var(--alias-border-width-xsm)_var(--mapped-border-control)]",
  hover: "[outline:var(--alias-border-width-sm)_solid_var(--mapped-border-action-ring)] [outline-offset:0]",
  pressed: "[outline:var(--alias-border-width-sm)_solid_var(--mapped-border-action-ring-pressed)] [outline-offset:0]",
  disabled: "[box-shadow:inset_0_0_0_var(--alias-border-width-xsm)_var(--mapped-border-disabled)]",
};

/** Figma `slider/thumb`. `sm` is 12px. `md` is 16px. Hover and pressed hide the stroke and draw the ring outside. */
export function SliderThumb({ state = "default", size = "sm", className = "", style }: SliderThumbProps) {
  return (
    <span
      data-slider-thumb=""
      data-state={state}
      data-size={size}
      style={style}
      className={`inline-block shrink-0 rounded-full bg-mapped-surface-action-solid ${thumbSizeClass[size]} ${paint[state]} ${className}`}
    />
  );
}

const previewStates: SliderThumbState[] = ["default", "hover", "pressed", "disabled"];
const previewSizes: SliderThumbSize[] = ["sm", "md"];

export function SliderThumbPreview() {
  return (
    <main className="flex min-h-screen flex-col gap-brand-scale-600 bg-mapped-surface-page p-brand-scale-600">
      <p className="font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight text-mapped-text-default">
        Thumb
      </p>
      {previewSizes.map((size) => (
        <div key={size} className="flex flex-col gap-brand-scale-200">
          <p className="font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight text-mapped-text-default">
            {size}
          </p>
          <div className="flex items-end gap-brand-scale-800">
            {previewStates.map((state) => (
              <div key={state} className="flex flex-col items-center gap-brand-scale-200">
                <SliderThumb state={state} size={size} />
                <p className="font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight text-mapped-text-default">
                  {state}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}

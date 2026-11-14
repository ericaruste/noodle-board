import type { CSSProperties } from "react";

export type SliderThumbState = "default" | "hover" | "pressed" | "disabled";

type SliderThumbProps = {
  /** Painted variant from the spec. Leave unset for the resting disc. */
  state?: SliderThumbState;
  className?: string;
  style?: CSSProperties;
};

const paint: Record<SliderThumbState, string> = {
  default: "[box-shadow:inset_0_0_0_var(--alias-border-width-xsm)_var(--mapped-border-control)]",
  hover: "[outline:var(--alias-border-width-sm)_solid_var(--mapped-border-action-ring)] [outline-offset:0]",
  pressed: "[outline:var(--alias-border-width-sm)_solid_var(--mapped-border-action-ring-pressed)] [outline-offset:0]",
  disabled: "[box-shadow:inset_0_0_0_var(--alias-border-width-xsm)_var(--mapped-border-disabled)]",
};

/** 12px disc. Figma `slider/thumb`. Hover and pressed hide the stroke and draw the ring outside. */
export function SliderThumb({ state = "default", className = "", style }: SliderThumbProps) {
  return (
    <span
      data-slider-thumb=""
      data-state={state}
      style={style}
      className={`inline-block size-brand-scale-300 shrink-0 rounded-full bg-mapped-surface-action-solid ${paint[state]} ${className}`}
    />
  );
}

const previewStates: SliderThumbState[] = ["default", "hover", "pressed", "disabled"];

export function SliderThumbPreview() {
  return (
    <main className="flex min-h-screen flex-col gap-brand-scale-600 bg-mapped-surface-page p-brand-scale-600">
      <p className="font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight text-mapped-text-default">
        Thumb
      </p>
      <div className="flex items-end gap-brand-scale-800">
        {previewStates.map((state) => (
          <div key={state} className="flex flex-col items-center gap-brand-scale-200">
            <SliderThumb state={state} />
            <p className="font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight text-mapped-text-default">
              {state}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}

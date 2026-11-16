/** `sm` is 8px. `md` is 12px and is the default. */
export type SliderTrackSize = "sm" | "md";

export const sliderTrackSizeClass: Record<SliderTrackSize, string> = {
  sm: "h-brand-scale-200",
  md: "h-brand-scale-300",
};

type SliderTrackProps = {
  /**
   * Opaque end of the fade. The Figma specimen is `#6579F8`, which is not a token.
   * A caller passes the current swatch color.
   */
  color?: string;
  /** Leave unset for the 12px `md` pill. */
  size?: SliderTrackSize;
  className?: string;
};

/** Specimen on the slider sheet. Not a swatch token. */
export const SLIDER_SPECIMEN_COLOR = "#6579F8";

const hexColor = /^#[0-9A-Fa-f]{6}$/;

function fade(color: string) {
  const solid = hexColor.test(color) ? color : SLIDER_SPECIMEN_COLOR;
  return `linear-gradient(90deg, rgb(255 255 255 / 0%), ${solid})`;
}

/**
 * 120px pill. Figma `slider/track/color-opacity`.
 * `md` is 12px. `sm` is 8px. The checker is the image fill.
 * The gradient fades from clear to the swatch color.
 */
export function SliderTrack({ color = SLIDER_SPECIMEN_COLOR, size = "md", className = "" }: SliderTrackProps) {
  return (
    <span
      data-slider-track=""
      data-size={size}
      className={`relative inline-block w-[120px] overflow-hidden rounded-full ${sliderTrackSizeClass[size]} ${className}`}
    >
      {/* 120px is the frame width. No spacing token is 120px. TODO token mismatch: Figma 120px */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundColor: "var(--brand-foundation-white)",
          backgroundImage:
            "repeating-conic-gradient(var(--mapped-border-disabled) 0% 25%, var(--brand-foundation-white) 0% 50%)",
          backgroundSize: "8px 8px",
        }}
      />
      <span aria-hidden className="absolute inset-0" style={{ backgroundImage: fade(color) }} />
      <span
        aria-hidden
        className="absolute inset-0 rounded-full [box-shadow:inset_0_0_0_var(--alias-border-width-xsm)_var(--mapped-border-control)]"
      />
    </span>
  );
}

export function SliderTrackPreview() {
  return (
    <main className="flex min-h-screen flex-col gap-brand-scale-600 bg-mapped-surface-page p-brand-scale-600">
      <p className="font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight text-mapped-text-default">
        Track
      </p>
      <p className="font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight text-mapped-text-default">
        md
      </p>
      <SliderTrack />
      <SliderTrack color="#BF66FF" />
      <p className="font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight text-mapped-text-default">
        sm
      </p>
      <SliderTrack size="sm" />
    </main>
  );
}

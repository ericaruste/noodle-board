type SliderTrackProps = {
  /**
   * Opaque end of the fade. The Figma specimen is `#6579F8`, which is not a token.
   * A caller passes the current swatch color.
   */
  color?: string;
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
 * 120 by 6 pill. Figma `slider/track/color-opacity`.
 * The checker is the image fill. The gradient fades from clear to the swatch color.
 */
export function SliderTrack({ color = SLIDER_SPECIMEN_COLOR, className = "" }: SliderTrackProps) {
  return (
    <span
      data-slider-track=""
      className={`relative inline-block h-brand-scale-150 w-[120px] overflow-hidden rounded-full ${className}`}
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
      <SliderTrack />
      <SliderTrack color="#BF66FF" />
    </main>
  );
}

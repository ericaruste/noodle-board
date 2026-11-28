import { useEffect, useRef, type ReactNode } from "react";

export type SaveIndicatorSize = "lg" | "md" | "sm";
export type SaveIndicatorType = "success" | "error";

type SaveIndicatorProps = {
  size?: SaveIndicatorSize;
  type?: SaveIndicatorType;
  /** Success plays the ring while saving. Error stays still. */
  saving?: boolean;
  /** Ring cycles on `::after` while saving. The breath does not call this. */
  onSavePulseIteration?: () => void;
};

const slotClass: Record<SaveIndicatorSize, string> = {
  lg: "size-brand-scale-40",
  md: "size-brand-scale-32",
  sm: "size-brand-scale-24",
};

export function SaveIndicator({
  size = "lg",
  type = "success",
  saving = false,
  onSavePulseIteration,
}: SaveIndicatorProps) {
  const discRef = useRef<HTMLSpanElement>(null);
  const onIterationRef = useRef(onSavePulseIteration);
  onIterationRef.current = onSavePulseIteration;
  const motion = type === "error" ? "still" : saving ? "saving" : "saved";

  useEffect(() => {
    if (!saving) return;
    const disc = discRef.current;
    if (!disc) return;
    // The ring runs on ::after. That pseudo-element does not fire animationiteration
    // on the disc, so the three-loop hold follows the ring's own iteration.
    let last = -1;
    let frame = 0;
    const tick = () => {
      const ring = disc.getAnimations({ subtree: true }).find((anim) => {
        const name = (anim as Animation & { animationName?: string }).animationName;
        return name === "save-indicator-ring";
      });
      const iteration = ring?.effect?.getComputedTiming().currentIteration;
      if (typeof iteration === "number") {
        if (last >= 0 && iteration > last && onIterationRef.current) {
          const steps = iteration - last;
          for (let i = 0; i < steps; i += 1) onIterationRef.current();
        }
        last = iteration;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [saving]);

  return (
    <span
      data-save-indicator
      data-size={size}
      data-type={type}
      data-motion={motion}
      className={`inline-flex shrink-0 items-center justify-center overflow-visible ${slotClass[size]}`}
    >
      <span
        ref={discRef}
        className={`save-indicator-disc relative size-brand-scale-8 shrink-0 rounded-full ${
          type === "error" ? "bg-mapped-icon-error" : "bg-mapped-icon-success-light"
        }`}
        data-motion={motion}
      />
    </span>
  );
}

const sizes: SaveIndicatorSize[] = ["lg", "md", "sm"];

const caption =
  "font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight text-mapped-text-caption";

function Row({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-brand-scale-8">
      <p className={caption}>{label}</p>
      <div className="flex items-center gap-brand-scale-16">{children}</div>
    </section>
  );
}

export function SaveIndicatorPreview() {
  return (
    <main className="flex min-h-screen flex-col gap-brand-scale-24 bg-mapped-surface-page p-brand-scale-24">
      <p className={caption}>Save indicator</p>
      <Row label="Success">
        {sizes.map((size) => (
          <SaveIndicator key={size} size={size} type="success" />
        ))}
      </Row>
      <Row label="Error">
        {sizes.map((size) => (
          <SaveIndicator key={size} size={size} type="error" saving />
        ))}
      </Row>
      <Row label="Saved">
        <SaveIndicator size="lg" type="success" />
      </Row>
      <Row label="Saving">
        <SaveIndicator size="lg" type="success" saving />
      </Row>
    </main>
  );
}

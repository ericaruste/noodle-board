import { useRef, type HTMLAttributes, type ReactNode } from "react";
import { Link, List, Type } from "lucide-react";
import { ContextualButton } from "./ContextualButton";
import { useSlidingPill } from "../hooks/useSlidingPill";

const PILL_TRANSITION =
  "transform var(--motion-glide-duration) var(--motion-glide-ease), width var(--motion-glide-duration) var(--motion-glide-ease), height var(--motion-glide-duration) var(--motion-glide-ease), opacity var(--motion-fade-duration) var(--motion-fade-ease)";

type PillRowProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /**
   * Pill fill class. A function sees the control the pill is on, including while the pill fades.
   * The default is the contextual hover, not the main toolbar's strong hover.
   */
  fill?: string | ((active: HTMLElement | null) => string);
};

export function PillRow({
  children,
  className,
  fill = "bg-mapped-surface-action-hover",
  ...rest
}: PillRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const pill = useSlidingPill(rowRef);
  const toneRef = useRef<HTMLElement | null>(null);
  if (pill.active) toneRef.current = pill.active;
  const fillClass = typeof fill === "function" ? fill(pill.active ?? toneRef.current) : fill;

  return (
    <div ref={rowRef} className={["pill-row relative", className].filter(Boolean).join(" ")} {...rest}>
      {pill.box ? (
        <span
          aria-hidden
          className={`pointer-events-none absolute left-0 top-0 rounded-alias-border-radius-lg ${fillClass}`}
          style={{
            width: pill.box.width,
            height: pill.box.height,
            transform: `translate(${pill.box.x}px, ${pill.box.y}px)`,
            opacity: pill.active ? 1 : 0,
            transition: PILL_TRANSITION,
          }}
        />
      ) : null}
      {children}
    </div>
  );
}

export function PillRowPreview() {
  return (
    <main className="flex min-h-screen flex-col gap-brand-scale-24 bg-mapped-surface-page p-brand-scale-24 text-mapped-text-caption">
      <p className="font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight">
        Sliding pill
      </p>
      <div className="flex w-max items-center rounded-alias-border-radius-xl border border-alias-border-width-xsm border-mapped-border-default bg-mapped-surface-default p-brand-scale-4 shadow-lg backdrop-blur-xl">
        <PillRow className="flex items-center gap-brand-scale-2">
          <ContextualButton
            ariaLabel="Type"
            showLeftIcon={false}
            showLabel={false}
            showDropdownIcon={false}
            showRightIcon
            icon={Type}
          />
          <ContextualButton
            ariaLabel="List"
            pressed
            showLeftIcon={false}
            showLabel={false}
            showDropdownIcon={false}
            showRightIcon
            icon={List}
          />
          <ContextualButton
            ariaLabel="Link"
            showLeftIcon={false}
            showLabel={false}
            showDropdownIcon={false}
            showRightIcon
            icon={Link}
          />
          <ContextualButton
            ariaLabel="Disabled"
            disabled
            showLeftIcon={false}
            showLabel={false}
            showDropdownIcon={false}
            showRightIcon
            icon={Link}
          />
        </PillRow>
      </div>
    </main>
  );
}

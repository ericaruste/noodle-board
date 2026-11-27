import { forwardRef, useId, useState } from "react";
import logoRaw from "./assets/icons/noodle-logo.svg?raw";

export type LogoButtonState = "default" | "hover" | "selected";

type LogoButtonProps = {
  /** Painted variant. Leave unset to follow selected and real hover. */
  state?: LogoButtonState;
  selected?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  title?: string;
};

/** Brand red for the logo mark. It is not a design token. */
const brandRed = "#B11F24";

const circleRadius = "var(--brand-scale-20)";
// TODO token mismatch: Figma 6.2px
const expandedRadius = "var(--alias-border-radius-lg)";

function LogoMark() {
  const id = useId().replace(/:/g, "");
  const svg = logoRaw
    .replace(/<path d="M0 20C0 8\.95431[^"]*" fill="#B11F24"\/>\s*/, "")
    .replace(/clip0_518_2534/g, `logo-clip-${id}`)
    .replace(/mask0_518_2534/g, `logo-mask-${id}`)
    .replace("<svg", `<svg class="size-full" aria-hidden="true"`);
  return <span className="contents" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export const LogoButton = forwardRef<HTMLButtonElement, LogoButtonProps>(function LogoButton(
  { state, selected = false, onClick, ariaLabel = "Noodle", title },
  ref,
) {
  const [hovered, setHovered] = useState(false);
  const painted = state != null;
  const expanded = painted ? state === "hover" || state === "selected" : hovered || selected;

  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      title={title}
      aria-pressed={painted ? state === "selected" : selected}
      onClick={onClick}
      onPointerEnter={() => {
        if (!painted) setHovered(true);
      }}
      onPointerLeave={() => {
        if (!painted) setHovered(false);
      }}
      className="inline-flex size-brand-scale-40 shrink-0 items-center justify-center overflow-hidden border-0 p-0 transition-[border-radius] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
      style={{
        backgroundColor: brandRed,
        borderRadius: expanded ? expandedRadius : circleRadius,
      }}
    >
      <LogoMark />
    </button>
  );
});

export function LogoButtonPreview() {
  const [selected, setSelected] = useState(false);

  return (
    <main className="flex min-h-screen flex-col gap-brand-scale-24 bg-mapped-surface-page p-brand-scale-24 text-mapped-text-caption">
      <p className="font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight">
        Logo button
      </p>
      <div className="flex items-center gap-brand-scale-16">
        <LogoButton state="default" ariaLabel="Default" />
        <LogoButton state="hover" ariaLabel="Hover" />
        <LogoButton state="selected" ariaLabel="Selected" />
      </div>
      <div className="flex items-center gap-brand-scale-16">
        <LogoButton
          selected={selected}
          ariaLabel="Live logo"
          onClick={() => setSelected((on) => !on)}
        />
      </div>
    </main>
  );
}

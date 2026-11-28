import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ForwardedRef,
  type PointerEvent,
  type TransitionEvent,
} from "react";
import logoRaw from "../assets/icons/noodle-logo.svg?raw";

export type LogoButtonState = "default" | "hover" | "selected";
export type LogoButtonSize = "lg" | "md";

type LogoButtonProps = {
  /** Unset is `lg`, the 40px button. */
  size?: LogoButtonSize;
  /** Painted variant. Leave unset to follow selected and real hover. */
  state?: LogoButtonState;
  selected?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  title?: string;
};

/** Brand red for the logo mark. It is not a design token. */
const brandRed = "#B11F24";

/**
 * The pressed corner is 42% of the button, as a length so it can spring back to the square.
 * The dip is the 1.6px dip on the 64px reference, scaled to the button. Neither is a design token.
 */
const sizes: Record<LogoButtonSize, { className: string; circle: string; pressed: string; dip: string }> = {
  lg: { className: "size-brand-scale-40", circle: "var(--brand-scale-20)", pressed: "16.8px", dip: "translateY(1px)" },
  md: { className: "size-brand-scale-32", circle: "var(--brand-scale-16)", pressed: "13.44px", dip: "translateY(0.8px)" },
};
const glyphRest = "translateY(0)";
// TODO token mismatch: Figma 6.2px on lg
const expandedRadius = "var(--alias-border-radius-lg)";

type RadiusMotion = "rest" | "press" | "release";

/** The release length comes from the motion list. The 80ms buffer stays here. */
function releaseWaitMs(node: HTMLElement | null) {
  const raw = getComputedStyle(node ?? document.documentElement).getPropertyValue("--motion-release-duration");
  const releaseMs = parseFloat(raw);
  return (Number.isFinite(releaseMs) ? releaseMs : 0) + 80;
}

function assignRef(ref: ForwardedRef<HTMLButtonElement>, node: HTMLButtonElement | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}

function LogoMark({ dipped, dip, motion }: { dipped: boolean; dip: string; motion: RadiusMotion }) {
  const id = useId().replace(/:/g, "");
  const svg = logoRaw
    .replace(/<path d="M0 20C0 8\.95431[^"]*" fill="#B11F24"\/>\s*/, "")
    .replace(/clip0_518_2534/g, `logo-clip-${id}`)
    .replace(/mask0_518_2534/g, `logo-mask-${id}`)
    .replace("<svg", `<svg class="size-full" aria-hidden="true"`);
  return (
    <span
      className={`block size-full transition-transform ${motion === "press" ? "motion-press" : "motion-release"}`}
      style={{ transform: dipped ? dip : glyphRest }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export const LogoButton = forwardRef<HTMLButtonElement, LogoButtonProps>(function LogoButton(
  { size = "lg", state, selected = false, onClick, ariaLabel = "Noodle", title },
  ref,
) {
  const shape = sizes[size];
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [radiusMotion, setRadiusMotion] = useState<RadiusMotion>("rest");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const releaseAfterTiming = useRef(false);
  const painted = state != null;
  const expanded = painted ? state === "hover" || state === "selected" : hovered || selected;

  useEffect(() => {
    if (radiusMotion !== "release") return;
    // The spring is already running. This only restores the hover ease if the transition never ends.
    const id = window.setTimeout(() => setRadiusMotion("rest"), releaseWaitMs(buttonRef.current));
    return () => window.clearTimeout(id);
  }, [radiusMotion]);

  useLayoutEffect(() => {
    if (!releaseAfterTiming.current || radiusMotion !== "release") return;
    releaseAfterTiming.current = false;
    // The release timing is in the DOM. Flush it, then let the shape and the mark move.
    void buttonRef.current?.offsetWidth;
    setPressed(false);
  }, [radiusMotion]);

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    releaseAfterTiming.current = false;
    setPressed(true);
    setRadiusMotion("press");
    // Keep the press if the pointer leaves the button before the release.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // The pointer can already be gone. Pointer up and pointer cancel still release the press.
    }
  }

  function releasePress() {
    releaseAfterTiming.current = true;
    setRadiusMotion("release");
  }

  function onRadiusTransitionEnd(event: TransitionEvent<HTMLButtonElement>) {
    if (event.propertyName !== "border-radius") return;
    if (event.target !== event.currentTarget) return;
    setRadiusMotion((current) => (current === "release" ? "rest" : current));
  }

  const radiusMotionClass =
    radiusMotion === "press"
      ? "transition-[border-radius] motion-press"
      : radiusMotion === "release"
        ? "transition-[border-radius] motion-release"
        : expanded
          ? "transition-[border-radius] motion-hover"
          : "transition-[border-radius] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]";

  return (
    <button
      ref={(node) => {
        buttonRef.current = node;
        assignRef(ref, node);
      }}
      type="button"
      aria-label={ariaLabel}
      title={title}
      aria-pressed={painted ? state === "selected" : selected}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerUp={releasePress}
      onPointerCancel={releasePress}
      onTransitionEnd={onRadiusTransitionEnd}
      onPointerEnter={() => {
        if (!painted) setHovered(true);
      }}
      onPointerLeave={() => {
        if (!painted) setHovered(false);
      }}
      data-size={size}
      className={`inline-flex ${shape.className} shrink-0 items-center justify-center overflow-hidden border-0 p-0 ${radiusMotionClass}`}
      style={{
        backgroundColor: brandRed,
        borderRadius: pressed ? shape.pressed : expanded ? expandedRadius : shape.circle,
      }}
    >
      <LogoMark dipped={pressed} dip={shape.dip} motion={radiusMotion} />
    </button>
  );
});

const previewSizes: LogoButtonSize[] = ["lg", "md"];

const previewCaption =
  "font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight";

function LiveLogo({ size }: { size: LogoButtonSize }) {
  const [selected, setSelected] = useState(false);
  return (
    <LogoButton size={size} selected={selected} ariaLabel={`Live ${size} logo`} onClick={() => setSelected((on) => !on)} />
  );
}

export function LogoButtonPreview() {
  return (
    <main className="flex min-h-screen flex-col gap-brand-scale-24 bg-mapped-surface-page p-brand-scale-24 text-mapped-text-caption">
      <p className={previewCaption}>Logo button</p>
      {previewSizes.map((size) => (
        <section key={size} className="flex flex-col gap-brand-scale-8">
          <p className={previewCaption}>{size}</p>
          <div className="flex items-center gap-brand-scale-16">
            <LogoButton size={size} state="default" ariaLabel={`${size} default`} />
            <LogoButton size={size} state="hover" ariaLabel={`${size} hover`} />
            <LogoButton size={size} state="selected" ariaLabel={`${size} selected`} />
            <LiveLogo size={size} />
          </div>
        </section>
      ))}
    </main>
  );
}

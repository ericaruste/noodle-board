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

/**
 * Pressed corner, 42% of the 40px button. A length, so it can spring back to the
 * square. It is not a design token.
 */
const pressedRadius = "16.8px";
/** 1.6px on the 64px reference, scaled to this 40px button. It is not a design token. */
const glyphDip = "translateY(1px)";
const glyphRest = "translateY(0)";
/** Release spring from the shape-press transition. It is not a design token. */
const releaseMs = 280;

const circleRadius = "var(--brand-scale-20)";
// TODO token mismatch: Figma 6.2px
const expandedRadius = "var(--alias-border-radius-lg)";

type RadiusMotion = "rest" | "press" | "release";

function assignRef(ref: ForwardedRef<HTMLButtonElement>, node: HTMLButtonElement | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}

function LogoMark({ dipped, quick }: { dipped: boolean; quick: boolean }) {
  const id = useId().replace(/:/g, "");
  const svg = logoRaw
    .replace(/<path d="M0 20C0 8\.95431[^"]*" fill="#B11F24"\/>\s*/, "")
    .replace(/clip0_518_2534/g, `logo-clip-${id}`)
    .replace(/mask0_518_2534/g, `logo-mask-${id}`)
    .replace("<svg", `<svg class="size-full" aria-hidden="true"`);
  return (
    <span
      className={`block size-full motion-reduce:!transition-none ${
        quick
          ? "transition-transform duration-[80ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          : "transition-transform duration-[280ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
      }`}
      style={{ transform: dipped ? glyphDip : glyphRest }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export const LogoButton = forwardRef<HTMLButtonElement, LogoButtonProps>(function LogoButton(
  { state, selected = false, onClick, ariaLabel = "Noodle", title },
  ref,
) {
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
    const id = window.setTimeout(() => setRadiusMotion("rest"), releaseMs + 80);
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
      ? "transition-[border-radius] duration-[80ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
      : radiusMotion === "release"
        ? "transition-[border-radius] duration-[280ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
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
      className={`inline-flex size-brand-scale-40 shrink-0 items-center justify-center overflow-hidden border-0 p-0 motion-reduce:!transition-none ${radiusMotionClass}`}
      style={{
        backgroundColor: brandRed,
        borderRadius: pressed ? pressedRadius : expanded ? expandedRadius : circleRadius,
      }}
    >
      <LogoMark dipped={pressed} quick={radiusMotion === "press"} />
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

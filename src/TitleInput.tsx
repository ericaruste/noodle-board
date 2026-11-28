import { forwardRef, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";

export type TitleInputState = "default" | "hover" | "focus";

type TitleInputProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (title: string) => void;
  /** Enter blurs. Blur calls this with the draft. Escape restores `value` and skips it. */
  onCommit?: (title: string) => void;
  /** Painted variant from the spec. Leave unset to follow real hover and focus. */
  state?: TitleInputState;
  readOnly?: boolean;
  id?: string;
};

/** The frame cap. No spacing token is 320px. TODO token mismatch: Figma 320px */
const maxTitleWidthPx = 320;

const focusRing =
  "bg-mapped-surface-default [outline:var(--alias-border-width-sm)_solid_var(--mapped-border-action-ring-focus)]";

const shellClass: Record<TitleInputState, string> = {
  default: "bg-transparent",
  hover: "bg-mapped-surface-action-hover",
  focus: focusRing,
};

const fieldType =
  "font-alias-font-family-body text-responsive-desktop-body-md-size leading-responsive-desktop-body-md-line-height-tight text-mapped-text-default";

export const TitleInput = forwardRef<HTMLInputElement, TitleInputProps>(function TitleInput(
  { value, defaultValue = "Title", onValueChange, onCommit, state, readOnly = false, id },
  ref,
) {
  const [draft, setDraft] = useState(defaultValue);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const sizerRef = useRef<HTMLSpanElement>(null);
  const draftRef = useRef(defaultValue);
  const skipCommit = useRef(false);
  const drafting = onCommit !== undefined;
  const shown = drafting && focused ? draft : (value ?? draft);
  const locked = readOnly || state !== undefined;
  const visual: TitleInputState = state ?? (focused ? "focus" : hovered ? "hover" : "default");
  const fullTitle = truncated && shown.length > 0 ? shown : undefined;

  useLayoutEffect(() => {
    const sizer = sizerRef.current;
    if (!sizer) return;
    const measure = () => setTruncated(sizer.scrollWidth - sizer.clientWidth > 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(sizer);
    return () => observer.disconnect();
  }, [shown]);

  function onFocus() {
    skipCommit.current = false;
    if (drafting) {
      const next = value ?? draftRef.current;
      draftRef.current = next;
      setDraft(next);
    }
    setFocused(true);
  }

  function onBlur() {
    setFocused(false);
    if (!onCommit) return;
    if (skipCommit.current) {
      skipCommit.current = false;
      return;
    }
    onCommit(draftRef.current);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!onCommit) return;
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      skipCommit.current = true;
      const restored = value ?? defaultValue;
      draftRef.current = restored;
      setDraft(restored);
      event.currentTarget.blur();
    }
  }

  function onFieldMouseDown(event: MouseEvent<HTMLLabelElement>) {
    event.stopPropagation();
    const input = event.currentTarget.querySelector("input");
    if (!(input instanceof HTMLInputElement) || input.readOnly) return;
    if (document.activeElement === input) return;
    input.focus();
  }

  return (
    <span className="group/tip relative">
      <label
        data-title-input
        className={`${state ? "" : "noodle-title-input"} inline-grid h-brand-scale-40 max-w-[320px] cursor-text items-center rounded-alias-border-radius-xl px-brand-scale-12 ${fieldType} ${shellClass[visual]}`}
        style={{ gridTemplateColumns: "minmax(0, max-content)", maxWidth: maxTitleWidthPx }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseDown={onFieldMouseDown}
      >
        <span
          ref={sizerRef}
          aria-hidden="true"
          className={`invisible col-start-1 row-start-1 min-w-0 overflow-hidden whitespace-nowrap ${fieldType}`}
        >
          {shown || "\u00a0"}
        </span>
        <input
          ref={ref}
          id={id}
          value={shown}
          readOnly={locked}
          size={1}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          aria-label="Project title"
          onChange={(event) => {
            const next = event.target.value;
            if (value === undefined || drafting) {
              draftRef.current = next;
              setDraft(next);
            }
            onValueChange?.(next);
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          className={`col-start-1 row-start-1 m-0 min-w-0 w-full truncate border-0 bg-transparent p-0 outline-none ${fieldType}`}
        />
      </label>
      {fullTitle ? (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 w-max -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-left text-xs font-medium text-white opacity-0 shadow-lg group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
          style={{ maxWidth: maxTitleWidthPx }}
        >
          {shown}
        </span>
      ) : null}
    </span>
  );
});

const previewStates: TitleInputState[] = ["default", "hover", "focus"];

const longTitle =
  "Noodle Board project title that is long enough to pass the three hundred twenty pixel cap";

export function TitleInputPreview() {
  const [live, setLive] = useState(longTitle);

  return (
    <main className="flex min-h-screen flex-col gap-brand-scale-24 bg-mapped-surface-page p-brand-scale-24 text-mapped-text-caption">
      <p className="font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight">
        Title input
      </p>
      <div className="flex items-end gap-brand-scale-24">
        {previewStates.map((state) => (
          <div key={state} className="flex flex-col items-start gap-brand-scale-4">
            <p className="font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight">
              {state}
            </p>
            <TitleInput state={state} />
          </div>
        ))}
      </div>
      <div className="flex max-w-full flex-col items-start gap-brand-scale-4">
        <p className="font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight">
          Live
        </p>
        <div className="pt-brand-scale-48">
          <TitleInput value={live} onValueChange={setLive} />
        </div>
      </div>
    </main>
  );
}

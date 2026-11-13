import { forwardRef, useState, type ClipboardEvent } from "react";

export type HexInputState = "default" | "hover" | "focus";

type HexInputProps = {
  /** Six hex digits, without the #. The # is drawn beside the field and never changes. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (hex: string) => void;
  /** Painted variant from the spec. Leave unset to follow real hover and focus. */
  state?: HexInputState;
  readOnly?: boolean;
  id?: string;
};

const focusRing =
  "bg-mapped-surface-default [outline:var(--alias-border-width-sm)_solid_var(--mapped-border-action-ring-focus)]";

const shellClass: Record<HexInputState, string> = {
  default: "bg-transparent",
  hover: "bg-mapped-surface-action-hover",
  focus: focusRing,
};

function hexDigits(raw: string) {
  return raw.replace(/#/g, "").replace(/[^0-9a-fA-F]/g, "").slice(0, 6).toUpperCase();
}

export const HexInput = forwardRef<HTMLInputElement, HexInputProps>(function HexInput(
  { value, defaultValue = "EBCFFF", onValueChange, state, readOnly = false, id },
  ref,
) {
  const [draft, setDraft] = useState(() => hexDigits(defaultValue));
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const shown = hexDigits(value ?? draft);

  function commit(next: string) {
    const clean = hexDigits(next);
    if (value === undefined) setDraft(clean);
    onValueChange?.(clean);
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text");
    const cleanedPaste = hexDigits(pasted);
    const looksLikeCode = /#/.test(pasted) || /^[0-9a-fA-F]{3,8}$/.test(pasted.trim());
    if (looksLikeCode && cleanedPaste.length > 0) {
      commit(cleanedPaste);
      return;
    }
    const input = event.currentTarget;
    const start = input.selectionStart ?? shown.length;
    const end = input.selectionEnd ?? shown.length;
    commit(shown.slice(0, start) + pasted + shown.slice(end));
  }

  function onFocus() {
    setFocused(true);
  }

  const visual: HexInputState = state ?? (focused ? "focus" : hovered ? "hover" : "default");

  return (
    <label
      className={`flex h-brand-scale-700 w-[108px] shrink-0 cursor-text items-center gap-brand-scale-100 rounded-alias-border-radius-lg p-brand-scale-200 font-alias-font-family-body text-responsive-desktop-body-md-size leading-responsive-desktop-body-md-line-height-tight text-mapped-text-default ${shellClass[visual]}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 108px is the frame width. No spacing token is 108px. TODO token mismatch: Figma 108px */}
      <span aria-hidden="true" className="select-none">
        #
      </span>
      <input
        ref={ref}
        id={id}
        value={shown}
        readOnly={readOnly || state !== undefined}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
        inputMode="text"
        maxLength={6}
        aria-label="Hex code"
        onChange={(event) => commit(event.target.value)}
        onPaste={onPaste}
        onFocus={onFocus}
        onBlur={() => setFocused(false)}
        className="m-0 min-w-0 flex-1 border-0 bg-transparent p-0 font-alias-font-family-body text-responsive-desktop-body-md-size leading-responsive-desktop-body-md-line-height-tight text-mapped-text-default outline-none"
      />
    </label>
  );
});

const previewStates: HexInputState[] = ["default", "hover", "focus"];

export function HexInputPreview() {
  const [live, setLive] = useState("EBCFFF");

  return (
    <main className="flex min-h-screen flex-col gap-brand-scale-600 bg-mapped-surface-page p-brand-scale-600 text-mapped-text-caption">
      <p className="font-alias-font-family-body text-responsive-desktop-body-md-size leading-responsive-desktop-body-md-line-height-tight">
        Hex input
      </p>
      <div className="flex items-end gap-brand-scale-600">
        {previewStates.map((state) => (
          <div key={state} className="flex flex-col items-start gap-brand-scale-100">
            <p className="font-alias-font-family-body text-responsive-desktop-body-md-size leading-responsive-desktop-body-md-line-height-tight">
              {state}
            </p>
            <HexInput state={state} />
          </div>
        ))}
      </div>
      <div className="flex flex-col items-start gap-brand-scale-100">
        <p className="font-alias-font-family-body text-responsive-desktop-body-md-size leading-responsive-desktop-body-md-line-height-tight">
          Live
        </p>
        <HexInput value={live} onValueChange={setLive} />
        <p className="font-alias-font-family-body text-responsive-desktop-body-md-size leading-responsive-desktop-body-md-line-height-tight">
          #{live}
        </p>
      </div>
    </main>
  );
}

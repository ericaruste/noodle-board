import { CaseSensitive, ChevronDown } from "lucide-react";

export type ContextualButtonState = "default" | "hover" | "selected" | "disabled";

type ContextualButtonProps = {
  label?: string;
  showLabel?: boolean;
  showLeftIcon?: boolean;
  showRightIcon?: boolean;
  showDropdownIcon?: boolean;
  /** Painted variant from the spec. Leave unset to follow selected, disabled, and real hover. */
  state?: ContextualButtonState;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

const surfaceClass: Record<ContextualButtonState, string> = {
  default: "bg-mapped-surface-action enabled:hover:bg-mapped-surface-action-hover",
  hover: "bg-mapped-surface-action-hover",
  selected: "bg-mapped-surface-action-selected",
  disabled: "bg-mapped-surface-action",
};

const textClass: Record<ContextualButtonState, string> = {
  default: "text-mapped-text-action group-hover:text-mapped-text-action-hover",
  hover: "text-mapped-text-action-hover",
  selected: "text-mapped-text-action-selected",
  disabled: "text-mapped-text-disabled",
};

const iconClass: Record<ContextualButtonState, string> = {
  default: "text-mapped-icon-action group-hover:text-mapped-icon-action-hover",
  hover: "text-mapped-icon-action-hover",
  selected: "text-mapped-icon-action-selected",
  disabled: "text-mapped-icon-disabled",
};

function visualState(
  state: ContextualButtonState | undefined,
  selected: boolean | undefined,
  disabled: boolean | undefined,
): ContextualButtonState {
  if (state) return state;
  if (disabled) return "disabled";
  if (selected) return "selected";
  return "default";
}

export function ContextualButton({
  label = "Label",
  showLabel = true,
  showLeftIcon = true,
  showRightIcon = true,
  showDropdownIcon = true,
  state,
  selected,
  disabled = false,
  onClick,
}: ContextualButtonProps) {
  const visual = visualState(state, selected, disabled);
  const isDisabled = disabled || visual === "disabled";

  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-pressed={selected === undefined && state !== "selected" ? undefined : visual === "selected"}
      onClick={onClick}
      className={`group inline-flex h-brand-scale-700 items-center gap-brand-scale-100 rounded-alias-border-radius-lg p-brand-scale-200 font-alias-font-family-body text-[12px] leading-[1em] ${surfaceClass[visual]}`}
    >
      {showLeftIcon ? <CaseSensitive className={`size-brand-scale-400 ${iconClass[visual]}`} aria-hidden /> : null}
      {showLabel ? <span className={textClass[visual]}>{label}</span> : null}
      {showRightIcon ? <CaseSensitive className={`size-brand-scale-400 ${iconClass[visual]}`} aria-hidden /> : null}
      {showDropdownIcon ? <ChevronDown className={`size-brand-scale-200 ${iconClass[visual]}`} aria-hidden /> : null}
    </button>
  );
}

const previewStates: ContextualButtonState[] = ["default", "hover", "selected", "disabled"];

export function ContextualButtonPreview() {
  return (
    <main className="flex min-h-screen flex-col gap-brand-scale-600 bg-mapped-surface-page p-brand-scale-600 text-mapped-text-caption">
      <p className="font-alias-font-family-body text-[12px] leading-[1em]">Contextual button</p>
      <div className="flex items-center gap-brand-scale-400">
        {previewStates.map((state) => (
          <ContextualButton key={state} state={state} />
        ))}
      </div>
      <div className="flex items-center gap-brand-scale-400">
        {previewStates.map((state) => (
          <ContextualButton key={state} state={state} showLeftIcon={false} showLabel={false} />
        ))}
      </div>
    </main>
  );
}

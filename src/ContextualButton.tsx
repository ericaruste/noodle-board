import { forwardRef, type ReactNode, type Ref } from "react";
import { CaseSensitive, ChevronDown, type LucideIcon } from "lucide-react";

export type ContextualButtonState = "default" | "hover" | "selected" | "disabled";

type ContextualButtonProps = {
  label?: string;
  /** Invisible copy of this text holds the label width so the button does not resize. */
  reserveLabel?: string;
  /** Replaces the text label. The control becomes a group so a field can sit in that slot. */
  labelControl?: ReactNode;
  showLabel?: boolean;
  showLeftIcon?: boolean;
  showRightIcon?: boolean;
  showDropdownIcon?: boolean;
  /** Right-hand icon. Defaults to the case-sensitive icon from the component spec. */
  icon?: LucideIcon;
  leftIcon?: LucideIcon;
  /** Painted variant from the spec. Leave unset to follow selected, disabled, and real hover. */
  state?: ContextualButtonState;
  selected?: boolean;
  /** "mixed" is not painted in the spec. It keeps the default fill and sets aria-pressed. */
  pressed?: boolean | "mixed";
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  title?: string;
  ariaExpanded?: boolean;
  ariaHasPopup?: "menu" | "listbox" | "true";
};

const surfaceClass: Record<ContextualButtonState, string> = {
  default: "bg-mapped-surface-action",
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
  selected: boolean,
  disabled: boolean | undefined,
): ContextualButtonState {
  if (state) return state;
  if (disabled) return "disabled";
  if (selected) return "selected";
  return "default";
}

export const ContextualButton = forwardRef<HTMLElement, ContextualButtonProps>(function ContextualButton(
  {
    label = "Label",
    reserveLabel,
    labelControl,
    showLabel = true,
    showLeftIcon = true,
    showRightIcon = true,
    showDropdownIcon = true,
    icon,
    leftIcon,
    state,
    selected,
    pressed,
    disabled = false,
    onClick,
    ariaLabel,
    title,
    ariaExpanded,
    ariaHasPopup,
  },
  ref,
) {
  const pressedValue = pressed ?? (selected === undefined ? undefined : selected);
  const visual = visualState(state, pressedValue === true || state === "selected", disabled);
  const isDisabled = disabled || visual === "disabled";
  const LeftIcon = leftIcon ?? CaseSensitive;
  const RightIcon = icon ?? CaseSensitive;
  const hoverClass = labelControl
    ? "hover:bg-mapped-surface-action-hover"
    : "enabled:hover:bg-mapped-surface-action-hover";
  const classes = `group inline-flex h-brand-scale-700 items-center gap-brand-scale-100 rounded-alias-border-radius-lg p-brand-scale-200 font-alias-font-family-body text-[12px] leading-[1em] ${surfaceClass[visual]} ${visual === "default" ? hoverClass : ""}`;
  const ariaPressed =
    pressedValue === "mixed" ? "mixed" : pressedValue === true || state === "selected" ? true : pressedValue === false ? false : undefined;

  const icons = (
    <>
      {showLeftIcon ? <LeftIcon className={`size-brand-scale-400 ${iconClass[visual]}`} aria-hidden /> : null}
      {showLabel ? (
        labelControl ?? (
          <span className={`inline-grid whitespace-nowrap text-left ${textClass[visual]}`}>
            {reserveLabel ? (
              <span className="invisible col-start-1 row-start-1" aria-hidden>
                {reserveLabel}
              </span>
            ) : null}
            <span className="col-start-1 row-start-1">{label}</span>
          </span>
        )
      ) : null}
      {showRightIcon ? <RightIcon className={`size-brand-scale-400 ${iconClass[visual]}`} aria-hidden /> : null}
    </>
  );

  if (labelControl) {
    return (
      <div ref={ref as Ref<HTMLDivElement>} className={classes} role="group" aria-label={ariaLabel}>
        {icons}
        {showDropdownIcon ? (
          <button
            type="button"
            title={title}
            aria-label={ariaLabel}
            aria-expanded={ariaExpanded}
            aria-haspopup={ariaHasPopup}
            onClick={onClick}
          >
            <ChevronDown className={`size-brand-scale-200 ${iconClass[visual]}`} aria-hidden />
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type="button"
      disabled={isDisabled}
      aria-label={ariaLabel}
      title={title}
      aria-pressed={ariaPressed}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup}
      onClick={onClick}
      className={classes}
    >
      {icons}
      {showDropdownIcon ? <ChevronDown className={`size-brand-scale-200 ${iconClass[visual]}`} aria-hidden /> : null}
    </button>
  );
});

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

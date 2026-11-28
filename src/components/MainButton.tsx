import { forwardRef, type ComponentType } from "react";
import { CaseSensitive, type LucideIcon } from "lucide-react";

type MainButtonIcon = LucideIcon | ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

export type MainButtonState = "default" | "hover" | "selected" | "disabled";
export type MainButtonType = "default" | "destructive";

type MainButtonProps = {
  label?: string;
  /** Right-hand icon. Defaults to the case-sensitive glyph from the spec. */
  icon?: MainButtonIcon;
  leftIcon?: MainButtonIcon;
  showLabel?: boolean;
  showLeftIcon?: boolean;
  showRightIcon?: boolean;
  type?: MainButtonType;
  /** Painted variant from the spec. Leave unset to follow selected, disabled, and real hover. */
  state?: MainButtonState;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  ariaHasPopup?: "menu";
  title?: string;
};

const defaultSurface: Record<MainButtonState, string> = {
  default: "bg-mapped-surface-action",
  hover: "bg-mapped-surface-action-strong-hover",
  selected: "bg-mapped-surface-action-strong-selected",
  disabled: "bg-mapped-surface-action",
};

const destructiveSurface: Record<MainButtonState, string> = {
  default: "bg-mapped-surface-error",
  hover: "bg-mapped-surface-error-hover",
  // Selected is not painted on the destructive type.
  selected: "bg-mapped-surface-error",
  disabled: "bg-mapped-surface-error",
};

const defaultText: Record<MainButtonState, string> = {
  default: "text-mapped-text-action group-hover:text-mapped-text-action-hover",
  hover: "text-mapped-text-action-hover",
  selected: "text-mapped-text-action-strong-selected",
  disabled: "text-mapped-text-disabled",
};

const destructiveText: Record<MainButtonState, string> = {
  default: "text-mapped-text-error group-hover:text-mapped-text-error-hover",
  hover: "text-mapped-text-error-hover",
  selected: "text-mapped-text-error",
  disabled: "text-mapped-text-disabled",
};

const defaultIcon: Record<MainButtonState, string> = {
  default: "text-mapped-icon-action group-hover:text-mapped-icon-action-hover",
  hover: "text-mapped-icon-action-hover",
  selected: "text-mapped-icon-action-strong-selected",
  disabled: "text-mapped-icon-disabled",
};

const destructiveIcon: Record<MainButtonState, string> = {
  default: "text-mapped-icon-error group-hover:text-mapped-icon-error-hover",
  hover: "text-mapped-icon-error-hover",
  selected: "text-mapped-icon-error",
  disabled: "text-mapped-icon-disabled",
};

function visualState(
  type: MainButtonType,
  state: MainButtonState | undefined,
  selected: boolean | undefined,
  disabled: boolean | undefined,
): MainButtonState {
  if (state) {
    if (type === "destructive" && state === "selected") return "default";
    return state;
  }
  if (disabled) return "disabled";
  if (selected && type !== "destructive") return "selected";
  return "default";
}

export const MainButton = forwardRef<HTMLButtonElement, MainButtonProps>(function MainButton(
  {
    label = "Label",
    icon: Icon = CaseSensitive,
    leftIcon: LeftIcon = CaseSensitive,
    showLabel = true,
    showLeftIcon = true,
    showRightIcon = true,
    type = "default",
    state,
    selected,
    disabled = false,
    onClick,
    ariaLabel,
    ariaExpanded,
    ariaHasPopup,
    title,
  },
  ref,
) {
  const visual = visualState(type, state, selected, disabled);
  const isDisabled = disabled || visual === "disabled";
  const surface = type === "destructive" ? destructiveSurface : defaultSurface;
  const text = type === "destructive" ? destructiveText : defaultText;
  const glyph = type === "destructive" ? destructiveIcon : defaultIcon;
  const hoverClass =
    visual === "default"
      ? type === "destructive"
        ? "enabled:hover:bg-mapped-surface-error-hover"
        : "enabled:hover:bg-mapped-surface-action-strong-hover"
      : "";
  const name = ariaLabel ?? (showLabel ? undefined : "Main button");

  return (
    <button
      ref={ref}
      type="button"
      disabled={isDisabled}
      aria-label={name}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup}
      title={title}
      aria-pressed={
        type === "destructive" ? undefined : selected === true || state === "selected" ? true : selected === false ? false : undefined
      }
      onClick={onClick}
      className={`group inline-flex h-brand-scale-40 shrink-0 items-center gap-brand-scale-8 rounded-alias-border-radius-lg p-brand-scale-12 font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight ${surface[visual]} ${hoverClass}`}
    >
      {showLeftIcon ? <LeftIcon className={`size-brand-scale-16 ${glyph[visual]}`} aria-hidden /> : null}
      {showLabel ? <span className={`whitespace-nowrap ${text[visual]}`}>{label}</span> : null}
      {showRightIcon ? <Icon className={`size-brand-scale-16 ${glyph[visual]}`} aria-hidden /> : null}
    </button>
  );
});

const defaultStates: MainButtonState[] = ["default", "hover", "selected", "disabled"];
const destructiveStates: MainButtonState[] = ["default", "hover", "disabled"];

export function MainButtonPreview() {
  return (
    <main className="flex min-h-screen flex-col gap-brand-scale-24 bg-mapped-surface-page p-brand-scale-24 text-mapped-text-caption">
      <p className="font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight">
        Main button
      </p>
      {(["default", "destructive"] as const).map((type) => (
        <div key={type} className="flex flex-col gap-brand-scale-8">
          <p className="font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight">
            {type}
          </p>
          <div className="flex items-center gap-brand-scale-8">
            {(type === "destructive" ? destructiveStates : defaultStates).map((state) => (
              <MainButton key={state} type={type} state={state} ariaLabel={`${type} ${state}`} />
            ))}
          </div>
        </div>
      ))}
      <div className="flex flex-col gap-brand-scale-8">
        <p className="font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight">
          icon only
        </p>
        <div className="flex items-center gap-brand-scale-8">
          <MainButton showLabel={false} showRightIcon={false} ariaLabel="Icon only" />
          <MainButton type="destructive" showLabel={false} showRightIcon={false} ariaLabel="Destructive icon only" />
        </div>
      </div>
      <div className="flex items-center gap-brand-scale-8">
        <MainButton showLeftIcon={false} ariaLabel="No left icon" />
        <MainButton showRightIcon={false} ariaLabel="No right icon" />
        <MainButton showLabel={false} ariaLabel="No label" />
      </div>
      <div className="flex items-center gap-brand-scale-8">
        <MainButton ariaLabel="Live default" />
        <MainButton type="destructive" ariaLabel="Live destructive" />
        <MainButton selected ariaLabel="Live selected" />
      </div>
    </main>
  );
}

import { forwardRef } from "react";
import { CaseSensitive, type LucideIcon } from "lucide-react";

export type IconButtonState = "default" | "hover" | "selected" | "disabled";
export type IconButtonSize = "sm" | "md" | "lg";
export type IconButtonType = "default" | "destructive";

type IconButtonProps = {
  /** The only content. Defaults to the case-sensitive glyph from the spec. */
  icon?: LucideIcon;
  size?: IconButtonSize;
  type?: IconButtonType;
  /** Painted variant from the spec. Leave unset to follow selected, disabled, and real hover. */
  state?: IconButtonState;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  title?: string;
};

const defaultSurface: Record<IconButtonState, string> = {
  default: "bg-mapped-surface-action",
  hover: "bg-mapped-surface-action-hover",
  selected: "bg-mapped-surface-action-selected",
  disabled: "bg-mapped-surface-action",
};

const destructiveSurface: Record<IconButtonState, string> = {
  default: "bg-mapped-surface-error",
  hover: "bg-mapped-surface-error-hover",
  // Selected is not painted on the destructive type.
  selected: "bg-mapped-surface-error",
  disabled: "bg-mapped-surface-error",
};

const defaultIcon: Record<IconButtonState, string> = {
  default: "text-mapped-icon-action group-hover:text-mapped-icon-action-hover",
  hover: "text-mapped-icon-action-hover",
  selected: "text-mapped-icon-action-selected",
  disabled: "text-mapped-icon-disabled",
};

const destructiveIcon: Record<IconButtonState, string> = {
  default: "text-mapped-icon-error group-hover:text-mapped-icon-error-hover",
  hover: "text-mapped-icon-error-hover",
  selected: "text-mapped-icon-error",
  disabled: "text-mapped-icon-disabled",
};

const boxClass: Record<IconButtonSize, string> = {
  lg: "size-brand-scale-800",
  md: "size-brand-scale-700",
  sm: "size-brand-scale-500",
};

const iconClass: Record<IconButtonSize, string> = {
  lg: "size-brand-scale-400",
  md: "size-brand-scale-300",
  sm: "size-brand-scale-300",
};

const radiusClass: Record<IconButtonSize, string> = {
  lg: "rounded-alias-border-radius-lg",
  md: "rounded-alias-border-radius-lg",
  sm: "rounded-alias-border-radius-md",
};

function visualState(
  type: IconButtonType,
  state: IconButtonState | undefined,
  selected: boolean | undefined,
  disabled: boolean | undefined,
): IconButtonState {
  if (state) {
    if (type === "destructive" && state === "selected") return "default";
    return state;
  }
  if (disabled) return "disabled";
  if (selected && type !== "destructive") return "selected";
  return "default";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    icon: Icon = CaseSensitive,
    size = "lg",
    type = "default",
    state,
    selected,
    disabled = false,
    onClick,
    ariaLabel = "Icon button",
    title,
  },
  ref,
) {
  const visual = visualState(type, state, selected, disabled);
  const isDisabled = disabled || visual === "disabled";
  const surface = type === "destructive" ? destructiveSurface : defaultSurface;
  const glyph = type === "destructive" ? destructiveIcon : defaultIcon;
  const hoverClass =
    visual === "default"
      ? type === "destructive"
        ? "enabled:hover:bg-mapped-surface-error-hover"
        : "enabled:hover:bg-mapped-surface-action-hover"
      : "";

  return (
    <button
      ref={ref}
      type="button"
      disabled={isDisabled}
      aria-label={ariaLabel}
      title={title}
      aria-pressed={
        type === "destructive" ? undefined : selected === true || state === "selected" ? true : selected === false ? false : undefined
      }
      onClick={onClick}
      className={`group inline-flex shrink-0 items-center justify-center ${radiusClass[size]} ${boxClass[size]} ${surface[visual]} ${hoverClass}`}
    >
      <Icon className={`${iconClass[size]} ${glyph[visual]}`} aria-hidden />
    </button>
  );
});

const defaultStates: IconButtonState[] = ["default", "hover", "selected", "disabled"];
const destructiveStates: IconButtonState[] = ["default", "hover", "disabled"];

export function IconButtonPreview() {
  return (
    <main className="flex min-h-screen flex-col gap-brand-scale-600 bg-mapped-surface-page p-brand-scale-600 text-mapped-text-caption">
      <p className="font-alias-font-family-body text-[12px] leading-[1em]">Icon button</p>
      {(["default", "destructive"] as const).map((type) => (
        <div key={type} className="flex flex-col gap-brand-scale-200">
          <p className="font-alias-font-family-body text-[12px] leading-[1em]">{type}</p>
          <div className="flex items-start gap-brand-scale-600">
            {(["lg", "md", "sm"] as const).map((size) => (
              <div key={size} className="flex flex-col gap-brand-scale-100">
                <p className="font-alias-font-family-body text-[12px] leading-[1em]">{size}</p>
                <div className="flex items-center gap-brand-scale-200">
                  {(type === "destructive" ? destructiveStates : defaultStates).map((state) => (
                    <IconButton key={state} type={type} size={size} state={state} ariaLabel={`${type} ${size} ${state}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-brand-scale-200">
        <IconButton ariaLabel="Live default" />
        <IconButton type="destructive" ariaLabel="Live destructive" />
      </div>
    </main>
  );
}

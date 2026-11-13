import { forwardRef } from "react";
import { ChevronRight } from "lucide-react";

export type MenuItemState = "default" | "hover" | "selected" | "disabled";
export type MenuItemSize = "sm" | "md";

type MenuItemProps = {
  label?: string;
  caption?: string;
  showLabel?: boolean;
  showCaption?: boolean;
  showChevron?: boolean;
  size?: MenuItemSize;
  /** Painted variant from the spec. Leave unset to follow selected, disabled, and real hover. */
  state?: MenuItemState;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

const surfaceClass: Record<MenuItemState, string> = {
  default: "bg-mapped-surface-action",
  hover: "bg-mapped-surface-action-hover",
  selected: "bg-mapped-surface-action-selected",
  disabled: "bg-mapped-surface-action",
};

const labelClass: Record<MenuItemState, string> = {
  default: "text-mapped-text-action group-hover:text-mapped-text-action-hover",
  hover: "text-mapped-text-action-hover",
  selected: "text-mapped-text-action-selected",
  disabled: "text-mapped-text-disabled",
};

const captionClass: Record<MenuItemState, string> = {
  default: "text-mapped-text-caption",
  hover: "text-mapped-text-caption",
  selected: "text-mapped-text-caption",
  disabled: "text-mapped-text-disabled",
};

function visualState(
  state: MenuItemState | undefined,
  selected: boolean | undefined,
  disabled: boolean | undefined,
): MenuItemState {
  if (state) return state;
  if (disabled) return "disabled";
  if (selected) return "selected";
  return "default";
}

export const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(function MenuItem(
  {
    label = "Label",
    caption = "caption",
    showLabel = true,
    showCaption = true,
    showChevron = true,
    size = "md",
    state,
    selected,
    disabled = false,
    onClick,
  },
  ref,
) {
  const visual = visualState(state, selected, disabled);
  const isDisabled = disabled || visual === "disabled";
  const hoverClass = visual === "default" ? "enabled:hover:bg-mapped-surface-action-hover" : "";
  // sm is 28px. No spacing token is 28px. TODO token mismatch: Figma 28px
  const heightClass = size === "sm" ? "h-[28px]" : "h-brand-scale-700";

  return (
    <button
      ref={ref}
      type="button"
      role="menuitem"
      disabled={isDisabled}
      onClick={onClick}
      className={`group flex w-full items-center justify-between gap-brand-scale-200 rounded-alias-border-radius-lg px-brand-scale-200 font-alias-font-family-body ${heightClass} ${surfaceClass[visual]} ${hoverClass}`}
    >
      {showLabel ? (
        <span className={`whitespace-nowrap text-left text-[12px] leading-[1em] ${labelClass[visual]}`}>{label}</span>
      ) : (
        <span />
      )}
      {showCaption || showChevron ? (
        <span className="flex shrink-0 items-center gap-brand-scale-100">
          {showCaption ? (
            <span className={`whitespace-nowrap text-[10px] leading-[1em] ${captionClass[visual]}`}>{caption}</span>
          ) : null}
          {showChevron ? (
            <ChevronRight className={`size-brand-scale-300 ${captionClass[visual]}`} aria-hidden />
          ) : null}
        </span>
      ) : null}
    </button>
  );
});

const previewStates: MenuItemState[] = ["default", "hover", "selected", "disabled"];

export function MenuItemPreview() {
  return (
    <main className="flex min-h-screen flex-col gap-brand-scale-600 bg-mapped-surface-page p-brand-scale-600 text-mapped-text-caption">
      <p className="font-alias-font-family-body text-[12px] leading-[1em]">Menu item</p>
      <div className="flex items-start gap-brand-scale-600">
        {(["md", "sm"] as const).map((size) => (
          <div key={size} className="flex w-48 flex-col gap-brand-scale-100">
            <p className="font-alias-font-family-body text-[12px] leading-[1em]">{size}</p>
            <div className="flex flex-col gap-brand-scale-50" role="menu" aria-label={`${size} menu items`}>
              {previewStates.map((state) => (
                <MenuItem key={state} size={size} state={state} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex w-48 flex-col gap-brand-scale-50" role="menu" aria-label="Menu item slots">
        <MenuItem showChevron={false} />
        <MenuItem showCaption={false} />
        <MenuItem showCaption={false} showChevron={false} />
      </div>
    </main>
  );
}

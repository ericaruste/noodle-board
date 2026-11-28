import { type ComponentType, forwardRef, useLayoutEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";

export type MenuItemState = "default" | "hover" | "selected" | "disabled";
export type MenuItemSize = "sm" | "md";

type SlotIcon = ComponentType<{ className?: string }>;

type MenuItemProps = {
  label?: string;
  caption?: string;
  showLabel?: boolean;
  showCaption?: boolean;
  showChevron?: boolean;
  showLeftIcon?: boolean;
  /** Left-hand icon. Defaults to chevron-right. */
  leftIcon?: SlotIcon;
  /** Extra classes for the label, such as an alias typeface. */
  labelClassName?: string;
  /** Replaces the full-width row. A scale width keeps every row in one menu the same size. */
  widthClassName?: string;
  /** Left padding becomes brand.scale.32. The right padding stays brand.scale.8. The fill still covers the whole row. */
  indent?: boolean;
  /** Clip the label to the row. A clipped label shows the full text in the main toolbar hover label. */
  truncateLabel?: boolean;
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

const iconClass: Record<MenuItemState, string> = {
  default: "text-mapped-text-caption group-hover:text-mapped-icon-action-hover",
  hover: "text-mapped-icon-action-hover",
  selected: "text-mapped-icon-action-selected",
  disabled: "text-mapped-icon-disabled",
};

const leftIconClass: Record<MenuItemState, string> = {
  default: "text-mapped-icon-action-light group-hover:text-mapped-icon-action-hover",
  hover: "text-mapped-icon-action-hover",
  selected: "text-mapped-icon-action-selected",
  disabled: "text-mapped-icon-disabled",
};

/** The title hover label wraps at the title field cap. No spacing token is 320px. TODO token mismatch: Figma 320px */
const fullLabelMaxWidthPx = 320;

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
    showLeftIcon = true,
    leftIcon,
    labelClassName,
    widthClassName = "w-full",
    indent = false,
    truncateLabel = false,
    size = "md",
    state,
    selected,
    disabled = false,
    onClick,
  },
  ref,
) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);
  const visual = visualState(state, selected, disabled);
  const isDisabled = disabled || visual === "disabled";
  const hoverClass = visual === "default" ? "enabled:hover:bg-mapped-surface-action-hover" : "";
  const heightClass = size === "sm" ? "h-brand-scale-28" : "h-brand-scale-32";
  const paddingClass = indent ? "pl-brand-scale-32 pr-brand-scale-8" : "px-brand-scale-8";
  const LeftIcon = leftIcon ?? ChevronRight;
  const fullLabel = truncateLabel && truncated && label.length > 0 ? label : undefined;

  useLayoutEffect(() => {
    if (!truncateLabel) return;
    const node = labelRef.current;
    if (!node) return;
    const measure = () => setTruncated(node.scrollWidth - node.clientWidth > 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [truncateLabel, label]);

  return (
    <button
      ref={ref}
      type="button"
      role="menuitem"
      disabled={isDisabled}
      onClick={onClick}
      className={`group ${truncateLabel ? "group/tip relative min-w-0" : ""} flex ${widthClassName} shrink-0 items-center justify-between gap-brand-scale-8 rounded-alias-border-radius-lg ${paddingClass} font-alias-font-family-body ${heightClass} ${surfaceClass[visual]} ${hoverClass}`}
    >
      <span className="flex min-w-0 items-center gap-brand-scale-8">
        {showLeftIcon ? <LeftIcon className={`size-brand-scale-16 shrink-0 ${leftIconClass[visual]}`} aria-hidden /> : null}
        {showLabel ? (
          <span
            ref={labelRef}
            className={`${truncateLabel ? "min-w-0 truncate" : "whitespace-nowrap"} text-left text-[12px] leading-[1em] ${labelClass[visual]} ${labelClassName ?? ""}`}
          >
            {label}
          </span>
        ) : null}
      </span>
      {fullLabel ? (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 w-max -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-left text-xs font-medium text-white opacity-0 shadow-lg group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
          style={{ maxWidth: `min(100%, ${fullLabelMaxWidthPx}px)` }}
        >
          {label}
        </span>
      ) : null}
      {showCaption || showChevron ? (
        <span className="flex shrink-0 items-center gap-brand-scale-4">
          {showCaption ? (
            <span className={`whitespace-nowrap text-[10px] leading-[1em] ${captionClass[visual]}`}>{caption}</span>
          ) : null}
          {showChevron ? (
            <ChevronRight className={`size-brand-scale-12 ${iconClass[visual]}`} aria-hidden />
          ) : null}
        </span>
      ) : null}
    </button>
  );
});

const previewStates: MenuItemState[] = ["default", "hover", "selected", "disabled"];

export function MenuItemPreview() {
  return (
    <main className="flex min-h-screen flex-col gap-brand-scale-24 bg-mapped-surface-page p-brand-scale-24 text-mapped-text-caption">
      <p className="font-alias-font-family-body text-[12px] leading-[1em]">Menu item</p>
      <div className="flex items-start gap-brand-scale-24">
        {(["md", "sm"] as const).map((size) => (
          <div key={size} className="flex w-48 flex-col gap-brand-scale-4">
            <p className="font-alias-font-family-body text-[12px] leading-[1em]">{size}</p>
            <div className="flex flex-col gap-brand-scale-2" role="menu" aria-label={`${size} menu items`}>
              {previewStates.map((state) => (
                <MenuItem key={state} size={size} state={state} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex w-48 flex-col gap-brand-scale-2" role="menu" aria-label="Menu item slots">
        <MenuItem showLeftIcon={false} />
        <MenuItem showChevron={false} />
        <MenuItem showCaption={false} />
        <MenuItem showCaption={false} showChevron={false} showLeftIcon={false} />
      </div>
      <div className="flex w-48 flex-col gap-brand-scale-2" role="menu" aria-label="Indented menu item">
        <p className="font-alias-font-family-body text-[12px] leading-[1em]">indented</p>
        <MenuItem indent />
      </div>
      <div className="flex w-[220px] flex-col gap-brand-scale-2 pt-brand-scale-48" role="menu" aria-label="Truncated menu item">
        <p className="font-alias-font-family-body text-[12px] leading-[1em]">truncated</p>
        <MenuItem
          truncateLabel
          indent
          showCaption={false}
          showChevron={false}
          label="Noodle Board project title that is long enough to pass the three hundred twenty pixel cap"
        />
      </div>
    </main>
  );
}

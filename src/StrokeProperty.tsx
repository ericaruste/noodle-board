import type { ComponentType } from "react";
import { ContextualButton } from "./ContextualButton";
import { TypeDashedIcon, TypeMediumIcon, TypeStraightIcon, TypeThickIcon, TypeThinIcon } from "./noodleIcons";

export const STROKE_THICKNESS = ["thin", "medium", "thick"] as const;
export type StrokeThickness = (typeof STROKE_THICKNESS)[number];

export const STROKE_LINE_STYLES = ["solid", "dashed"] as const;
export type StrokeLineStyle = (typeof STROKE_LINE_STYLES)[number];

type SlotIcon = ComponentType<{ className?: string }>;

const THICKNESS_ICONS: Record<StrokeThickness, SlotIcon> = {
  thin: TypeThinIcon,
  medium: TypeMediumIcon,
  thick: TypeThickIcon,
};

const LINE_STYLE_ICONS: Record<StrokeLineStyle, SlotIcon> = {
  solid: TypeStraightIcon,
  dashed: TypeDashedIcon,
};

const THICKNESS_LABELS: Record<StrokeThickness, string> = {
  thin: "Thin line",
  medium: "Medium line",
  thick: "Thick line",
};

const LINE_STYLE_LABELS: Record<StrokeLineStyle, string> = {
  solid: "Solid line",
  dashed: "Dashed line",
};

type StrokePropertyProps = {
  thickness: StrokeThickness;
  lineStyle: StrokeLineStyle;
  thicknessMixed?: boolean;
  lineStyleMixed?: boolean;
  onThickness: (thickness: StrokeThickness) => void;
  onLineStyle: (lineStyle: StrokeLineStyle) => void;
};

function IconChoice({
  label,
  pressed,
  icon,
  onClick,
}: {
  label: string;
  pressed: boolean;
  icon: SlotIcon;
  onClick: () => void;
}) {
  return (
    <ContextualButton
      ariaLabel={label}
      title={label}
      pressed={pressed}
      onClick={onClick}
      showLeftIcon={false}
      showLabel={false}
      showDropdownIcon={false}
      showRightIcon
      icon={icon}
    />
  );
}

/**
 * Line weight and line type for a noodle and for a shape. The toolbar that
 * opens this row owns the menu and writes its own data. Choosing a value
 * leaves the row open.
 */
export default function StrokeProperty({
  thickness,
  lineStyle,
  thicknessMixed = false,
  lineStyleMixed = false,
  onThickness,
  onLineStyle,
}: StrokePropertyProps) {
  return (
    <div
      className="flex items-center gap-brand-scale-100 rounded-alias-border-radius-xl border border-alias-border-width-xsm border-mapped-border-default bg-mapped-surface-default p-brand-scale-100 shadow-lg backdrop-blur-xl"
      role="menu"
      aria-label="Line weight and line type"
    >
      <div className="flex items-center gap-brand-scale-50 border-r border-r-alias-border-width-xsm border-mapped-border-default pr-brand-scale-100">
        {STROKE_THICKNESS.map((option) => (
          <IconChoice
            key={option}
            label={THICKNESS_LABELS[option]}
            pressed={!thicknessMixed && thickness === option}
            icon={THICKNESS_ICONS[option]}
            onClick={() => onThickness(option)}
          />
        ))}
      </div>
      <div className="flex items-center gap-brand-scale-50">
        {STROKE_LINE_STYLES.map((option) => (
          <IconChoice
            key={option}
            label={LINE_STYLE_LABELS[option]}
            pressed={!lineStyleMixed && lineStyle === option}
            icon={LINE_STYLE_ICONS[option]}
            onClick={() => onLineStyle(option)}
          />
        ))}
      </div>
    </div>
  );
}

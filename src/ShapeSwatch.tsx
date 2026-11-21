import type { ComponentType } from "react";
import { ContextualButton } from "./ContextualButton";
import { SHAPE_KINDS, SHAPE_LABELS, type ShapeKind } from "./shapeData";
import { ShapeKindIcon } from "./shapeKindIcon";

type SlotIcon = ComponentType<{ className?: string }>;

type ShapeSwatchProps = {
  /** The current kind. Null is a mixed selection, so no button is selected. */
  kind: ShapeKind | null;
  onKind: (kind: ShapeKind) => void;
};

function kindIcon(kind: ShapeKind): SlotIcon {
  return function KindIcon({ className }: { className?: string }) {
    return <ShapeKindIcon kind={kind} className={className} />;
  };
}

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
 * The five shape kinds, in the existing order. The shape toolbar and the
 * bottom Shapes tool both open this row. The caller owns the menu and decides
 * what a choice writes. Choosing a kind does not close the menu by itself.
 */
export default function ShapeSwatch({ kind, onKind }: ShapeSwatchProps) {
  return (
    <div
      className="flex items-center gap-brand-scale-2 rounded-alias-border-radius-xl border border-alias-border-width-xsm border-mapped-border-default bg-mapped-surface-default p-brand-scale-4 shadow-lg backdrop-blur-xl"
      role="menu"
      aria-label="Shape"
    >
      {SHAPE_KINDS.map((option) => (
        <IconChoice
          key={option}
          label={SHAPE_LABELS[option]}
          pressed={kind === option}
          icon={kindIcon(option)}
          onClick={() => onKind(option)}
        />
      ))}
    </div>
  );
}

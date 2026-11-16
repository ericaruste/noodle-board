import { useEffect, useRef, useState, type ComponentType, type ReactNode, type RefObject } from "react";
import ColorPickerToolbar, { type ColorPickerChoice } from "./ColorPickerToolbar";
import { swatchFamilyForHex, swatchHex } from "./ColorSwatch";
import { ContextualButton } from "./ContextualButton";
import FillOpacitySlider from "./FillOpacitySlider";
import { FloatingPanel, useAnchoredBox } from "./FloatingPanel";
import { LineWeightMenuIcon, TypeDashedIcon, TypeMediumIcon, TypeStraightIcon, TypeThickIcon, TypeThinIcon } from "./noodleIcons";
import { ShapeKindIcon } from "./shapeKindIcon";
import {
  SHAPE_KINDS,
  SHAPE_LABELS,
  SHAPE_LINE_STYLES,
  SHAPE_THICKNESS,
  type ShapeKind,
  type ShapeLineStyle,
  type ShapeThickness,
} from "./shapeData";

type ShapeToolbarProps = {
  kind: ShapeKind | null;
  fill: string | null;
  stroke: string | null;
  fillOpacity: number;
  thickness: ShapeThickness;
  lineStyle: ShapeLineStyle;
  fillMixed?: boolean;
  strokeMixed?: boolean;
  opacityMixed?: boolean;
  thicknessMixed?: boolean;
  lineStyleMixed?: boolean;
  /** Track color when the fill itself is mixed or missing. */
  sliderColor?: string;
  onKind: (kind: ShapeKind) => void;
  onFill: (value: string | null, history: boolean) => void;
  onStroke: (value: string | null, history: boolean) => void;
  onFillOpacity: (value: number, history: boolean) => void;
  onThickness: (thickness: ShapeThickness) => void;
  onLineStyle: (lineStyle: ShapeLineStyle) => void;
};

type OpenMenu = "kind" | "stroke" | "weight" | "fill";

type SlotIcon = ComponentType<{ className?: string }>;

/** Step 200, the pastel grid painted beside the shape toolbar. Both fill and stroke use it. */
const SHAPE_SWATCH_SCALE = 200;
const CUSTOM_DISC_HEX = "EBCFFF";
const NONE_SLIDER_COLOR = "#C0C4C9";

const THICKNESS_ICONS: Record<ShapeThickness, SlotIcon> = {
  thin: TypeThinIcon,
  medium: TypeMediumIcon,
  thick: TypeThickIcon,
};

const LINE_STYLE_ICONS: Record<ShapeLineStyle, SlotIcon> = {
  solid: TypeStraightIcon,
  dashed: TypeDashedIcon,
};

function shapeColorChoice(color: string | null): ColorPickerChoice {
  if (color == null) return { kind: "none" };
  const family = swatchFamilyForHex(color, SHAPE_SWATCH_SCALE);
  return family ? { kind: "swatch", family } : { kind: "custom" };
}

function shapeCustomHex(color: string | null, choice: ColorPickerChoice) {
  if (choice.kind !== "custom") return CUSTOM_DISC_HEX;
  const digits = (color ?? "").replace(/#/g, "").toUpperCase();
  return /^[0-9A-F]{6}$/.test(digits) ? digits : CUSTOM_DISC_HEX;
}

function shapeColorValue(choice: ColorPickerChoice, hex: string) {
  if (choice.kind === "none" || choice.kind === "mixed") return null;
  if (choice.kind === "swatch") return `#${swatchHex(choice.family, SHAPE_SWATCH_SCALE)}`;
  if (choice.kind === "custom" && /^[0-9A-F]{6}$/.test(hex)) return `#${hex}`;
  return null;
}

/**
 * The color swatch's default paint, at 16px. The swatch is a button and a 24px
 * disc, and neither fits the contextual button's icon slot.
 */
function PaintMark({ className, type, color }: { className?: string; type: "none" | "color"; color?: string }) {
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center ${className ?? ""}`}>
      <span className="pointer-events-none absolute left-1/2 top-1/2 size-brand-scale-600 origin-center -translate-x-1/2 -translate-y-1/2 scale-[0.6667]">
        {type === "none" ? (
          <span className="absolute inset-0 rounded-full bg-brand-foundation-white">
            <span className="absolute left-1/2 top-1/2 h-brand-scale-50 w-brand-scale-500 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-mapped-icon-disabled" />
          </span>
        ) : (
          <span className="absolute inset-0 rounded-full" style={{ background: color }} />
        )}
        <span className="pointer-events-none absolute inset-0 rounded-full [box-shadow:inset_0_0_0_var(--alias-border-width-xsm)_var(--mapped-border-control)]" />
      </span>
    </span>
  );
}

function kindIcon(kind: ShapeKind): SlotIcon {
  return function KindIcon({ className }: { className?: string }) {
    return <ShapeKindIcon kind={kind} className={className} />;
  };
}

const menuChrome =
  "flex items-center rounded-alias-border-radius-xl border border-alias-border-width-xsm border-mapped-border-default bg-mapped-surface-default p-brand-scale-100 shadow-lg backdrop-blur-xl";

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

export default function ShapeToolbar({
  kind,
  fill,
  stroke,
  fillOpacity,
  thickness,
  lineStyle,
  fillMixed = false,
  strokeMixed = false,
  thicknessMixed = false,
  lineStyleMixed = false,
  sliderColor,
  onKind,
  onFill,
  onStroke,
  onFillOpacity,
  onThickness,
  onLineStyle,
}: ShapeToolbarProps) {
  const [menu, setMenu] = useState<OpenMenu | null>(null);
  const opacityDrag = useRef(false);
  const opacityGesture = useRef(false);

  useEffect(() => {
    if (!menu) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-shape-colors]")) return;
      setMenu(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menu]);

  const toggle = (next: OpenMenu) => {
    setMenu((current) => (current === next ? null : next));
  };

  function FillIcon({ className }: { className?: string }) {
    if (fillMixed || fill == null) return <PaintMark className={className} type={fillMixed ? "color" : "none"} />;
    return <PaintMark className={className} type="color" color={fill} />;
  }

  function StrokeIcon({ className }: { className?: string }) {
    if (strokeMixed || stroke == null) return <PaintMark className={className} type={strokeMixed ? "color" : "none"} />;
    return <PaintMark className={className} type="color" color={stroke} />;
  }

  const track = sliderColor ?? fill ?? NONE_SLIDER_COLOR;

  return (
    <div
      data-shape-colors=""
      className="nodrag nopan nowheel flex items-center gap-brand-scale-100 rounded-alias-border-radius-xl border border-alias-border-width-xsm border-mapped-border-default bg-mapped-surface-default p-brand-scale-100 shadow-lg backdrop-blur-xl"
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => {
        const target = event.target;
        if (target instanceof Element && target.closest("[data-fill-opacity], input, textarea")) return;
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-brand-scale-50 border-r border-r-alias-border-width-xsm border-mapped-border-default pr-brand-scale-100">
        <MenuButton
          label={kind ? `Shape, ${SHAPE_LABELS[kind]}` : "Shape, mixed"}
          icon={kindIcon(kind ?? "diamond")}
          open={menu === "kind"}
          onToggle={() => toggle("kind")}
        >
          <div className={`${menuChrome} gap-brand-scale-50`} role="menu" aria-label="Shape">
            {SHAPE_KINDS.map((option) => (
              <IconChoice
                key={option}
                label={SHAPE_LABELS[option]}
                pressed={kind === option}
                icon={kindIcon(option)}
                onClick={() => {
                  setMenu(null);
                  onKind(option);
                }}
              />
            ))}
          </div>
        </MenuButton>
      </div>
      <div className="flex items-center gap-brand-scale-50 border-r border-r-alias-border-width-xsm border-mapped-border-default pr-brand-scale-100">
        <MenuButton
          label="Stroke"
          text="Stroke"
          icon={StrokeIcon}
          open={menu === "stroke"}
          onToggle={() => toggle("stroke")}
        >
          <ShapeColorMenu color={stroke} mixed={strokeMixed} onColor={onStroke} />
        </MenuButton>
        <MenuButton
          label="Line weight and line type"
          icon={LineWeightMenuIcon}
          open={menu === "weight"}
          onToggle={() => toggle("weight")}
        >
          <div className={`${menuChrome} gap-brand-scale-100`} role="menu" aria-label="Line weight and line type">
            <div className="flex items-center gap-brand-scale-50 border-r border-r-alias-border-width-xsm border-mapped-border-default pr-brand-scale-100">
              {SHAPE_THICKNESS.map((option) => (
                <IconChoice
                  key={option}
                  label={option === "thin" ? "Thin line" : option === "medium" ? "Medium line" : "Thick line"}
                  pressed={!thicknessMixed && thickness === option}
                  icon={THICKNESS_ICONS[option]}
                  onClick={() => onThickness(option)}
                />
              ))}
            </div>
            <div className="flex items-center gap-brand-scale-50">
              {SHAPE_LINE_STYLES.map((option) => (
                <IconChoice
                  key={option}
                  label={option === "solid" ? "Solid line" : "Dashed line"}
                  pressed={!lineStyleMixed && lineStyle === option}
                  icon={LINE_STYLE_ICONS[option]}
                  onClick={() => onLineStyle(option)}
                />
              ))}
            </div>
          </div>
        </MenuButton>
      </div>
      <div className="flex items-center gap-brand-scale-200">
        <MenuButton label="Fill" text="Fill" icon={FillIcon} open={menu === "fill"} onToggle={() => toggle("fill")}>
          <ShapeColorMenu color={fill} mixed={fillMixed} onColor={onFill} />
        </MenuButton>
        <div
          className="flex items-center"
          onPointerDownCapture={() => {
            opacityDrag.current = true;
            opacityGesture.current = false;
          }}
          onPointerUp={() => {
            opacityDrag.current = false;
            opacityGesture.current = false;
          }}
          onPointerCancel={() => {
            opacityDrag.current = false;
            opacityGesture.current = false;
          }}
        >
          <FillOpacitySlider
            size="sm"
            value={fillOpacity}
            color={track}
            onValueChange={(value) => {
              const history = !opacityDrag.current || !opacityGesture.current;
              if (opacityDrag.current) opacityGesture.current = true;
              onFillOpacity(value, history);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ShapeColorMenu({
  color,
  mixed,
  onColor,
}: {
  color: string | null;
  mixed: boolean;
  onColor: (value: string | null, history: boolean) => void;
}) {
  const initial = mixed ? ({ kind: "mixed" } as const) : shapeColorChoice(color);
  const [choice, setChoice] = useState<ColorPickerChoice>(initial);
  const [hex, setHex] = useState(() => shapeCustomHex(color, initial));
  const written = useRef(color);
  const mixedRef = useRef(mixed);
  const applied = useRef<string | null>(null);
  const gesture = useRef(false);
  const pending = useRef<{ choice: ColorPickerChoice; hex: string } | null>(null);
  const scheduled = useRef(false);
  const hexRef = useRef(hex);
  const onColorRef = useRef(onColor);
  onColorRef.current = onColor;

  if (color !== written.current || mixed !== mixedRef.current) {
    const fromUs = applied.current === color;
    written.current = color;
    mixedRef.current = mixed;
    applied.current = null;
    if (!fromUs) {
      const nextChoice = mixed ? ({ kind: "mixed" } as const) : shapeColorChoice(color);
      const nextHex = shapeCustomHex(color, nextChoice);
      setChoice(nextChoice);
      setHex(nextHex);
      hexRef.current = nextHex;
    }
  }

  function flush() {
    scheduled.current = false;
    const next = pending.current;
    pending.current = null;
    if (!next || next.choice.kind === "mixed") return;
    const value = shapeColorValue(next.choice, next.hex);
    if (next.choice.kind !== "none" && value == null) return;
    const recordHistory = !gesture.current;
    gesture.current = true;
    applied.current = value;
    written.current = value;
    onColorRef.current(value, recordHistory);
  }

  function schedule(next: { choice: ColorPickerChoice; hex: string }) {
    setChoice(next.choice);
    setHex(next.hex);
    hexRef.current = next.hex;
    pending.current = next;
    if (scheduled.current) return;
    scheduled.current = true;
    queueMicrotask(flush);
  }

  return (
    <div
      data-shape-colors=""
      onMouseDownCapture={() => {
        gesture.current = false;
      }}
    >
      <ColorPickerToolbar
        scale={SHAPE_SWATCH_SCALE}
        leading="none"
        choice={choice}
        customHex={hex}
        onChoiceChange={(next) => schedule({ choice: next, hex: hexRef.current })}
        onCustomHexChange={(nextHex) => {
          hexRef.current = nextHex;
          schedule({ choice: { kind: "custom" }, hex: nextHex });
        }}
      />
    </div>
  );
}

function MenuButton({
  label,
  text,
  icon,
  open,
  onToggle,
  children,
}: {
  label: string;
  text?: string;
  icon: SlotIcon;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  return (
    <div className="relative">
      <ContextualButton
        ref={buttonRef}
        label={text}
        ariaLabel={label}
        title={label}
        ariaExpanded={open}
        ariaHasPopup="menu"
        onClick={onToggle}
        showLeftIcon={false}
        showLabel={text != null}
        showRightIcon
        showDropdownIcon
        icon={icon}
      />
      <AnchoredMenu open={open} anchorRef={buttonRef} label={label}>
        {children}
      </AnchoredMenu>
    </div>
  );
}

function AnchoredMenu({
  open,
  anchorRef,
  label,
  children,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLButtonElement | null>;
  label: string;
  children: ReactNode;
}) {
  const { menuRef, box } = useAnchoredBox(open, anchorRef, "start");
  if (!open) return null;
  return (
    <FloatingPanel
      layer="dropdown"
      panelRef={menuRef}
      ariaLabel={label}
      data-shape-colors=""
      style={{
        position: "absolute",
        top: box?.top ?? 0,
        left: box?.left ?? 0,
        visibility: box ? "visible" : "hidden",
      }}
    >
      {children}
    </FloatingPanel>
  );
}

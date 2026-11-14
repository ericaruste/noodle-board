import { useEffect, useRef, useState, type ComponentType, type ReactNode, type RefObject } from "react";
import ColorPickerToolbar, { type ColorPickerChoice } from "./ColorPickerToolbar";
import { NEUTRAL_SWATCH_HEX, swatchFamilyForHex, swatchHex } from "./ColorSwatch";
import { ContextualButton } from "./ContextualButton";
import { FloatingPanel, useAnchoredBox } from "./FloatingPanel";
import {
  LineWeightMenuIcon,
  TypeCurveIcon,
  TypeDashedIcon,
  TypeElbowIcon,
  TypeMediumIcon,
  TypeStraightIcon,
  TypeThickIcon,
  TypeThinIcon,
} from "./noodleIcons";
import {
  NOODLE_ARROWS,
  NOODLE_ARROW_LABELS,
  publishNoodle,
  sameNoodle,
  snapshotBoard,
  type NoodleArrow,
  type NoodleData,
  type NoodleLineStyle,
  type NoodleShape,
  type NoodleThickness,
} from "./noodleData";
import { releaseNoodleLabel, retainNoodleLabel, toggleNoodleLabel, useNoodleLabelEditing } from "./noodleLabel";

type NoodleToolbarProps = {
  edgeId: string;
  data: NoodleData;
  /** When set, only the changed fields are handed here instead of publishing to `edgeId` alone. */
  onWrite?: (patch: Partial<NoodleData>, history: boolean) => void;
  /** Keys whose values disagree across the selection. Those controls stay neutral. */
  mixed?: ReadonlySet<string>;
};

type OpenMenu = "color" | "weight" | "shape" | "start" | "end";

type SlotIcon = ComponentType<{ className?: string }>;

const SHAPE_ICONS: Record<NoodleShape, SlotIcon> = {
  straight: TypeStraightIcon,
  elbow: TypeElbowIcon,
  curve: TypeCurveIcon,
};

const THICKNESS_ICONS: Record<NoodleThickness, SlotIcon> = {
  thin: TypeThinIcon,
  medium: TypeMediumIcon,
  thick: TypeThickIcon,
};

const LINE_STYLE_ICONS: Record<NoodleLineStyle, SlotIcon> = {
  solid: TypeStraightIcon,
  dashed: TypeDashedIcon,
};

const NOODLE_SWATCH_SCALE = 500;
const CUSTOM_DISC_HEX = "EBCFFF";

function noodleColorChoice(color: string): ColorPickerChoice {
  const digits = color.replace(/#/g, "").toUpperCase();
  if (digits === NEUTRAL_SWATCH_HEX[NOODLE_SWATCH_SCALE]) return { kind: "swatch", family: "neutral" };
  const family = swatchFamilyForHex(digits, NOODLE_SWATCH_SCALE);
  return family ? { kind: "swatch", family } : { kind: "custom" };
}

function noodleCustomHex(color: string, choice: ColorPickerChoice) {
  if (choice.kind !== "custom" && choice.kind !== "mixed") return CUSTOM_DISC_HEX;
  const digits = color.replace(/#/g, "").toUpperCase();
  return /^[0-9A-F]{6}$/.test(digits) ? digits : CUSTOM_DISC_HEX;
}

function noodleColorValue(choice: ColorPickerChoice, hex: string) {
  if (choice.kind === "swatch") return `#${swatchHex(choice.family, NOODLE_SWATCH_SCALE)}`;
  if (choice.kind === "custom" && /^[0-9A-F]{6}$/.test(hex)) return `#${hex}`;
  return null;
}

function TypeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 14" fill="none" aria-hidden>
      <path d="M4.5 3.25h9M9 3.25v7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ArrowGlyph({ kind, className }: { kind: NoodleArrow; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinejoin: "round" as const };
  return (
    <svg className={className} viewBox="0 0 18 14" fill="none" aria-hidden>
      <path d="M1 7H11" {...common} />
      {kind === "arrow" ? <path d="M8 3.5 12.5 7 8 10.5 9.4 7Z" fill="currentColor" stroke="none" /> : null}
      {kind === "open" ? <path d="M8 3.5 12.5 7 8 10.5" {...common} /> : null}
      {kind === "triangle" ? <path d="M8 3.2 13 7 8 10.8Z" fill="currentColor" stroke="none" /> : null}
      {kind === "circle" ? <circle cx="12" cy="7" r="2.3" fill="currentColor" /> : null}
      {kind === "diamond" ? <path d="M10 7 12.2 4.6 14.4 7 12.2 9.4Z" fill="currentColor" stroke="none" /> : null}
    </svg>
  );
}

function arrowIcon(kind: NoodleArrow): SlotIcon {
  return function ArrowIcon({ className }: { className?: string }) {
    return <ArrowGlyph kind={kind} className={className} />;
  };
}

const ARROW_ICONS: Record<NoodleArrow, SlotIcon> = {
  none: arrowIcon("none"),
  arrow: arrowIcon("arrow"),
  open: arrowIcon("open"),
  triangle: arrowIcon("triangle"),
  circle: arrowIcon("circle"),
  diamond: arrowIcon("diamond"),
};

function ColorMark({ className, color }: { className?: string; color?: string }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full border border-alias-border-width-xsm border-mapped-border-control ${className ?? ""}`}
      style={color ? { background: color } : undefined}
    />
  );
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

export default function NoodleToolbar({ edgeId, data, onWrite, mixed }: NoodleToolbarProps) {
  const dataRef = useRef(data);
  dataRef.current = data;
  const [menu, setMenu] = useState<OpenMenu | null>(null);
  const editing = useNoodleLabelEditing(edgeId);
  const colorMixed = mixed?.has("color") ?? false;

  function ColorIcon({ className }: { className?: string }) {
    return <ColorMark className={className} color={colorMixed ? undefined : data.color} />;
  }

  const write = (next: NoodleData, history: boolean, patch?: Partial<NoodleData>) => {
    if (onWrite) {
      dataRef.current = next;
      onWrite(patch ?? {}, history);
      return;
    }
    if (sameNoodle(dataRef.current, next)) return;
    dataRef.current = next;
    if (history) snapshotBoard();
    publishNoodle(edgeId, next);
  };

  const on = (key: keyof NoodleData, value: NoodleData[keyof NoodleData]) => !mixed?.has(key) && data[key] === value;

  useEffect(() => {
    if (!menu) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-noodle-toolbar]")) return;
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

  const pick =
    <K extends keyof NoodleData>(key: K, value: NoodleData[K]) =>
    () => {
      setMenu(null);
      write({ ...dataRef.current, [key]: value }, true, { [key]: value });
    };

  const toggle = (next: OpenMenu) => {
    setMenu((current) => (current === next ? null : next));
  };

  return (
    <div
      data-noodle-toolbar
      data-noodle-menu={menu ? "" : undefined}
      className="nodrag nopan nowheel flex items-center gap-brand-scale-100 rounded-alias-border-radius-xl border border-alias-border-width-xsm border-mapped-border-default bg-mapped-surface-default p-brand-scale-100 shadow-lg backdrop-blur-xl"
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-brand-scale-50 border-r border-r-alias-border-width-xsm border-mapped-border-default pr-brand-scale-100">
        <ContextualButton
          ariaLabel="Text"
          title="Text"
          pressed={editing}
          onPointerDown={() => retainNoodleLabel()}
          onPointerCancel={() => releaseNoodleLabel()}
          onClick={() => {
            setMenu(null);
            toggleNoodleLabel(edgeId);
          }}
          showLeftIcon={false}
          showLabel={false}
          showDropdownIcon={false}
          showRightIcon
          icon={TypeIcon}
        />
        <MenuButton
          label="Color"
          icon={ColorIcon}
          open={menu === "color"}
          onToggle={() => toggle("color")}
        >
          <NoodleColorMenu
            color={data.color}
            mixed={colorMixed}
            onColor={(color, history) => {
              write({ ...dataRef.current, color }, history, { color });
            }}
          />
        </MenuButton>
        <MenuButton
          label="Line weight and line type"
          icon={LineWeightMenuIcon}
          open={menu === "weight"}
          onToggle={() => toggle("weight")}
        >
          <div className={`${menuChrome} gap-brand-scale-100`} role="menu" aria-label="Line weight and line type">
            <div className="flex items-center gap-brand-scale-50 border-r border-r-alias-border-width-xsm border-mapped-border-default pr-brand-scale-100">
              {(
                [
                  ["thin", "Thin"],
                  ["medium", "Medium"],
                  ["thick", "Thick"],
                ] as const
              ).map(([thickness, label]) => (
                <IconChoice
                  key={thickness}
                  label={`${label} line`}
                  pressed={on("thickness", thickness)}
                  icon={THICKNESS_ICONS[thickness]}
                  onClick={() => write({ ...dataRef.current, thickness }, true, { thickness })}
                />
              ))}
            </div>
            <div className="flex items-center gap-brand-scale-50">
              {(
                [
                  ["solid", "Solid line"],
                  ["dashed", "Dashed line"],
                ] as const
              ).map(([style, label]) => (
                <IconChoice
                  key={style}
                  label={label}
                  pressed={on("lineStyle", style)}
                  icon={LINE_STYLE_ICONS[style]}
                  onClick={() => write({ ...dataRef.current, lineStyle: style }, true, { lineStyle: style })}
                />
              ))}
            </div>
          </div>
        </MenuButton>
        <MenuButton
          label="Noodle type"
          icon={mixed?.has("shape") ? TypeStraightIcon : SHAPE_ICONS[data.shape]}
          open={menu === "shape"}
          onToggle={() => toggle("shape")}
        >
          <div className={`${menuChrome} gap-brand-scale-50`} role="menu" aria-label="Noodle type">
            {(
              [
                ["straight", "Straight"],
                ["elbow", "Elbow"],
                ["curve", "Curve"],
              ] as const
            ).map(([shape, label]) => (
              <IconChoice
                key={shape}
                label={`${label} line`}
                pressed={on("shape", shape)}
                icon={SHAPE_ICONS[shape]}
                onClick={pick("shape", shape)}
              />
            ))}
          </div>
        </MenuButton>
      </div>
      <div className="flex items-center gap-brand-scale-50">
        <ArrowMenu
          label="Start arrowhead"
          value={data.markerStart}
          neutral={mixed?.has("markerStart")}
          open={menu === "start"}
          onToggle={() => toggle("start")}
          onPick={(value) => {
            setMenu(null);
            write({ ...dataRef.current, markerStart: value }, true, { markerStart: value });
          }}
        />
        <ArrowMenu
          label="End arrowhead"
          value={data.markerEnd}
          neutral={mixed?.has("markerEnd")}
          open={menu === "end"}
          onToggle={() => toggle("end")}
          onPick={(value) => {
            setMenu(null);
            write({ ...dataRef.current, markerEnd: value }, true, { markerEnd: value });
          }}
        />
      </div>
    </div>
  );
}

/**
 * The open picker lives in this menu. It mounts only while Color is open, so
 * the next open starts collapsed. A drag is one undo. An outside color change
 * (undo, a file opening) replaces the selection. A change this menu just wrote
 * does not, so custom stays selected when the stroke still matches a swatch.
 */
function NoodleColorMenu({
  color,
  mixed,
  onColor,
}: {
  color: string;
  mixed: boolean;
  onColor: (color: string, history: boolean) => void;
}) {
  const initial = mixed ? ({ kind: "mixed" } as const) : noodleColorChoice(color);
  const [choice, setChoice] = useState<ColorPickerChoice>(initial);
  const [hex, setHex] = useState(() => noodleCustomHex(color, initial));
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
      const nextChoice = mixed ? ({ kind: "mixed" } as const) : noodleColorChoice(color);
      const nextHex = noodleCustomHex(color, nextChoice);
      setChoice(nextChoice);
      setHex(nextHex);
      hexRef.current = nextHex;
    }
  }

  function flush() {
    scheduled.current = false;
    const next = pending.current;
    pending.current = null;
    if (!next || next.choice.kind === "mixed" || next.choice.kind === "none") return;
    const value = noodleColorValue(next.choice, next.hex);
    if (!value) return;
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
      data-noodle-color-menu
      onMouseDownCapture={() => {
        gesture.current = false;
      }}
    >
      <ColorPickerToolbar
        scale={NOODLE_SWATCH_SCALE}
        leading="neutral"
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
  icon,
  open,
  onToggle,
  children,
}: {
  label: string;
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
        ariaLabel={label}
        title={label}
        ariaExpanded={open}
        ariaHasPopup="menu"
        onClick={onToggle}
        showLeftIcon={false}
        showLabel={false}
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
      data-noodle-toolbar=""
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

function ArrowMenu({
  label,
  value,
  neutral = false,
  open,
  onToggle,
  onPick,
}: {
  label: string;
  value: NoodleArrow;
  neutral?: boolean;
  open: boolean;
  onToggle: () => void;
  onPick: (value: NoodleArrow) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  return (
    <div className="relative">
      <ContextualButton
        ref={buttonRef}
        ariaLabel={label}
        title={label}
        ariaExpanded={open}
        ariaHasPopup="menu"
        onClick={onToggle}
        showLeftIcon={false}
        showLabel={false}
        showRightIcon
        showDropdownIcon
        icon={ARROW_ICONS[neutral ? "none" : value]}
      />
      <AnchoredMenu open={open} anchorRef={buttonRef} label={label}>
        <div className={`${menuChrome} gap-brand-scale-50`} role="menu" aria-label={label}>
          {NOODLE_ARROWS.map((kind) => (
            <IconChoice
              key={kind}
              label={NOODLE_ARROW_LABELS[kind]}
              pressed={!neutral && value === kind}
              icon={ARROW_ICONS[kind]}
              onClick={() => onPick(kind)}
            />
          ))}
        </div>
      </AnchoredMenu>
    </div>
  );
}

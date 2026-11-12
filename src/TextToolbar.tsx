import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  CaseSensitive,
  Link,
  List,
  ListOrdered,
  TextAlignCenter,
  TextAlignEnd,
  TextAlignJustify,
  TextAlignStart,
  type LucideIcon,
} from "lucide-react";
import { ContextualButton } from "./ContextualButton";
import { FloatingPanel, useAnchoredBox } from "./FloatingPanel";
import {
  ALIGN_LABELS,
  FONT_FAMILIES,
  FONT_FAMILY_STACK,
  FONT_SIZE_PRESETS,
  FONT_STYLE_LABELS,
  FONT_STYLES,
  TEXT_ALIGNS,
  parseFontSize,
  type FontFamily,
  type FontStyle,
  type TextAlign,
} from "./textBody";

const ALIGN_ICONS: Record<TextAlign, LucideIcon> = {
  left: TextAlignStart,
  center: TextAlignCenter,
  right: TextAlignEnd,
  justify: TextAlignJustify,
};

type Pressed = boolean | "mixed";

type OpenMenu = "family" | "size" | "style" | "align";

type TextToolbarProps = {
  styleLabel: string;
  alignLabel: string;
  activeStyle: FontStyle | "mixed";
  activeAlign: TextAlign | "mixed";
  activeFamily: FontFamily | "mixed" | "none";
  sizeLabel: string;
  bullet: Pressed;
  numbered: Pressed;
  onStyle: (style: FontStyle) => void;
  onAlign: (align: TextAlign) => void;
  onFamily: (family: FontFamily) => void;
  onSize: (size: number) => void;
  onBullet: () => void;
  onNumbered: () => void;
  onLink: () => void;
  linkActive: boolean;
  extra?: ReactNode;
};

function Menu({
  label,
  reserveLabel,
  menuLabel,
  icon,
  horizontal = false,
  open,
  onToggle,
  children,
}: {
  label: string;
  reserveLabel?: string;
  menuLabel: string;
  icon?: LucideIcon;
  horizontal?: boolean;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { menuRef, box } = useAnchoredBox(open, buttonRef, "start");

  return (
    <div className="relative">
      <ContextualButton
        ref={buttonRef}
        ariaLabel={menuLabel}
        title={icon ? label : undefined}
        ariaExpanded={open}
        ariaHasPopup="menu"
        onClick={onToggle}
        showLeftIcon={false}
        showLabel={!icon}
        label={label}
        reserveLabel={reserveLabel}
        showRightIcon={Boolean(icon)}
        icon={icon}
        showDropdownIcon
      />
      {open ? (
        <FloatingPanel
          layer="dropdown"
          panelRef={menuRef}
          role="menu"
          ariaLabel={menuLabel}
          data-text-toolbar=""
          className={
            horizontal
              ? "flex items-center gap-0.5 rounded-xl border border-white/50 bg-white/40 p-1 shadow-lg backdrop-blur-xl"
              : "rounded-lg border border-white/50 bg-white/40 py-1 shadow-lg backdrop-blur-xl"
          }
          style={{
            position: "absolute",
            top: box?.top ?? 0,
            left: box?.left ?? 0,
            minWidth: box?.minWidth,
            visibility: box ? "visible" : "hidden",
          }}
        >
          {children}
        </FloatingPanel>
      ) : null}
    </div>
  );
}

function MenuItem({
  label,
  glyph,
  horizontal = false,
  active,
  onPick,
  style,
}: {
  label: string;
  glyph?: ReactNode;
  horizontal?: boolean;
  active: boolean;
  onPick: () => void;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-label={label}
      aria-checked={active}
      title={glyph ? label : undefined}
      onClick={onPick}
      style={style}
      className={
        horizontal
          ? `flex h-10 items-center justify-center rounded-lg px-2 text-slate-700 ${
              active ? "bg-slate-100" : "hover:bg-slate-50"
            }`
          : `block w-full whitespace-nowrap px-3 py-1.5 text-left text-xs ${
              active ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-700 hover:bg-slate-50"
            }`
      }
    >
      {glyph ?? label}
    </button>
  );
}

function isFontSizePreset(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest("[data-floating-panel='dropdown']")?.getAttribute("aria-label") === "Font size"
  );
}

function FontSizeField({
  value,
  open,
  onToggle,
  onClose,
  onCommit,
  onFocusField,
}: {
  value: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onCommit: (size: number) => void;
  onFocusField: () => void;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const { menuRef, box } = useAnchoredBox(open, anchorRef, "start");
  const [text, setText] = useState(value);
  const focused = useRef(false);
  const baseline = useRef(value);
  const commitRef = useRef<() => void>(() => {});
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (focused.current) return;
    setText(value);
    baseline.current = value;
  }, [value]);

  const commit = () => {
    const parsed = parseFontSize(text);
    if (parsed === null) {
      setText(baseline.current);
      return;
    }
    const next = String(parsed);
    const changed = next !== baseline.current;
    baseline.current = next;
    setText(next);
    if (changed) onCommit(parsed);
  };
  commitRef.current = commit;

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!focused.current) return;
      const target = event.target;
      if (!(target instanceof Node) || anchorRef.current?.contains(target)) return;
      if (isFontSizePreset(target)) return;
      focused.current = false;
      commitRef.current();
      onCloseRef.current();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  const arm = () => {
    if (!focused.current) baseline.current = text;
    focused.current = true;
    onFocusField();
  };

  return (
    <div ref={anchorRef} className="relative">
      <ContextualButton
        ariaLabel="Font size presets"
        ariaExpanded={open}
        ariaHasPopup="menu"
        onClick={onToggle}
        showLeftIcon={false}
        showRightIcon={false}
        showLabel
        showDropdownIcon
        labelControl={
          <input
            aria-label="Font size"
            inputMode="numeric"
            autoComplete="off"
            value={text}
            onPointerDown={arm}
            onFocus={arm}
            onChange={(event) => setText(event.target.value)}
            onBlur={(event) => {
              if (isFontSizePreset(event.relatedTarget)) return;
              focused.current = false;
              commit();
              onClose();
            }}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Enter") {
                event.preventDefault();
                commit();
                onClose();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                setText(baseline.current);
                onClose();
              }
            }}
            style={{ width: `${Math.max(text.length, 2)}ch` }}
            className="bg-transparent font-alias-font-family-body text-[12px] leading-[1em] text-mapped-text-action outline-none group-hover:text-mapped-text-action-hover"
          />
        }
      />
      {open ? (
        <FloatingPanel
          layer="dropdown"
          panelRef={menuRef}
          role="menu"
          ariaLabel="Font size"
          data-text-toolbar=""
          className="rounded-lg border border-white/50 bg-white/40 py-1 shadow-lg backdrop-blur-xl"
          style={{
            position: "absolute",
            top: box?.top ?? 0,
            left: box?.left ?? 0,
            minWidth: box?.minWidth,
            visibility: box ? "visible" : "hidden",
          }}
        >
          {FONT_SIZE_PRESETS.map((preset) => (
            <MenuItem
              key={preset}
              label={String(preset)}
              active={value === String(preset)}
              onPick={() => {
                const next = String(preset);
                baseline.current = next;
                setText(next);
                onCommit(preset);
                onClose();
              }}
            />
          ))}
        </FloatingPanel>
      ) : null}
    </div>
  );
}

function IconButton({
  label,
  pressed,
  icon,
  onClick,
}: {
  label: string;
  pressed: Pressed;
  icon: LucideIcon;
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

export default function TextToolbar({
  styleLabel,
  alignLabel,
  activeStyle,
  activeAlign,
  activeFamily,
  sizeLabel,
  bullet,
  numbered,
  onStyle,
  onAlign,
  onFamily,
  onSize,
  onBullet,
  onNumbered,
  onLink,
  linkActive,
  extra,
}: TextToolbarProps) {
  const [menu, setMenu] = useState<OpenMenu | null>(null);

  const toggle = (next: OpenMenu) => {
    setMenu((current) => (current === next ? null : next));
  };

  return (
    // Fill is surface/default (#F0F5FB). Opacity and blur match the existing frost: 40% and backdrop-blur-xl. Figma blur, Figma shadow, and the token's 30% are not applied.
    <div
      data-text-toolbar
      className="noodle-text-toolbar nodrag nopan nowheel flex items-center gap-brand-scale-100 rounded-alias-border-radius-xl border border-alias-border-width-xsm border-mapped-border-default p-brand-scale-100 shadow-lg backdrop-blur-xl"
      style={{ backgroundColor: "color-mix(in srgb, var(--alias-cool-neutral-400) 40%, transparent)" }}
      onMouseDown={(event) => {
        if ((event.target as HTMLElement).closest("input, textarea")) return;
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-brand-scale-50 border-r border-r-alias-border-width-xsm border-mapped-border-default pr-brand-scale-100">
      <Menu
        label={activeFamily === "mixed" ? "Mixed" : activeFamily === "none" ? "Font style" : activeFamily}
        menuLabel="Font style"
        icon={CaseSensitive}
        open={menu === "family"}
        onToggle={() => toggle("family")}
      >
        {FONT_FAMILIES.map((family) => (
          <MenuItem
            key={family}
            label={family}
            active={activeFamily === family}
            style={{ fontFamily: FONT_FAMILY_STACK[family] }}
            onPick={() => {
              setMenu(null);
              onFamily(family);
            }}
          />
        ))}
      </Menu>
      <FontSizeField
        value={sizeLabel}
        open={menu === "size"}
        onToggle={() => toggle("size")}
        onClose={() => setMenu((current) => (current === "size" ? null : current))}
        onFocusField={() => setMenu((current) => (current === "size" ? current : null))}
        onCommit={onSize}
      />
      {extra}
      <Menu
        label={styleLabel}
        reserveLabel={FONT_STYLE_LABELS["bold-italic"]}
        menuLabel="Weight"
        open={menu === "style"}
        onToggle={() => toggle("style")}
      >
        {FONT_STYLES.map((style) => (
          <MenuItem
            key={style}
            label={FONT_STYLE_LABELS[style]}
            active={activeStyle === style}
            onPick={() => {
              setMenu(null);
              onStyle(style);
            }}
          />
        ))}
      </Menu>
      <Menu
        label={alignLabel}
        menuLabel="Alignment"
        icon={activeAlign === "mixed" ? undefined : ALIGN_ICONS[activeAlign]}
        horizontal
        open={menu === "align"}
        onToggle={() => toggle("align")}
      >
        {TEXT_ALIGNS.map((align) => {
          const Icon = ALIGN_ICONS[align];
          return (
          <MenuItem
            key={align}
            label={ALIGN_LABELS[align]}
            glyph={<Icon className="size-brand-scale-400" aria-hidden />}
            horizontal
            active={activeAlign === align}
            onPick={() => {
              setMenu(null);
              onAlign(align);
            }}
          />
          );
        })}
      </Menu>
      </div>
      <div className="flex items-center gap-brand-scale-50">
      <IconButton label="Bulleted list" pressed={bullet} icon={List} onClick={onBullet} />
      <IconButton label="Numbered list" pressed={numbered} icon={ListOrdered} onClick={onNumbered} />
      <IconButton label="Link" pressed={linkActive} icon={Link} onClick={onLink} />
      </div>
    </div>
  );
}

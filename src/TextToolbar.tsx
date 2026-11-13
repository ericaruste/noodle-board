import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
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
import { MenuItem } from "./MenuItem";
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
  open,
  onToggle,
  children,
}: {
  label: string;
  reserveLabel?: string;
  menuLabel: string;
  icon?: LucideIcon;
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
          className="rounded-lg border border-white/50 bg-white/40 py-1 shadow-lg backdrop-blur-xl"
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

function FontStyleMenu({
  label,
  activeStyle,
  open,
  onToggle,
  onPick,
}: {
  label: string;
  activeStyle: FontStyle | "mixed";
  open: boolean;
  onToggle: () => void;
  onPick: (style: FontStyle) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { menuRef, box } = useAnchoredBox(open, buttonRef, "start");

  return (
    <div className="relative">
      <ContextualButton
        ref={buttonRef}
        ariaLabel="Weight"
        ariaExpanded={open}
        ariaHasPopup="menu"
        onClick={onToggle}
        showLeftIcon={false}
        showLabel
        label={label}
        reserveLabel={FONT_STYLE_LABELS["bold-italic"]}
        showRightIcon={false}
        showDropdownIcon
      />
      {open ? (
        <FloatingPanel
          layer="dropdown"
          panelRef={menuRef}
          role="menu"
          ariaLabel="Font style"
          data-text-toolbar=""
          className="flex w-[104px] flex-col rounded-alias-border-radius-lg border border-alias-border-width-xsm border-mapped-border-default bg-mapped-surface-default p-brand-scale-100 shadow-lg backdrop-blur-xl"
          style={{
            position: "absolute",
            top: box?.top ?? 0,
            left: box?.left ?? 0,
            visibility: box ? "visible" : "hidden",
            // 104px is the frame width. No spacing token is 104px. TODO token mismatch: Figma 104px
          }}
        >
          {FONT_STYLES.map((style) => (
            <MenuItem
              key={style}
              label={FONT_STYLE_LABELS[style]}
              size="sm"
              showCaption={false}
              showChevron={false}
              selected={activeStyle === style}
              onClick={() => onPick(style)}
            />
          ))}
        </FloatingPanel>
      ) : null}
    </div>
  );
}

function MenuRow({
  label,
  active,
  onPick,
  style,
}: {
  label: string;
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
      onClick={onPick}
      style={style}
      className={`block w-full whitespace-nowrap px-3 py-1.5 text-left text-xs ${
        active ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function AlignPopover({
  label,
  icon,
  open,
  activeAlign,
  onToggle,
  onPick,
}: {
  label: string;
  icon?: LucideIcon;
  open: boolean;
  activeAlign: TextAlign | "mixed";
  onToggle: () => void;
  onPick: (align: TextAlign) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { menuRef, box } = useAnchoredBox(open, buttonRef, "start");

  return (
    <div className="relative">
      <ContextualButton
        ref={buttonRef}
        ariaLabel="Alignment"
        title={icon ? label : undefined}
        ariaExpanded={open}
        ariaHasPopup="true"
        onClick={onToggle}
        showLeftIcon={false}
        showLabel={!icon}
        label={label}
        showRightIcon={Boolean(icon)}
        icon={icon}
        showDropdownIcon
      />
      {open ? (
        <FloatingPanel
          layer="dropdown"
          panelRef={menuRef}
          role="group"
          ariaLabel="Alignment"
          data-text-toolbar=""
          className="flex items-center gap-brand-scale-50 rounded-alias-border-radius-xl border border-alias-border-width-xsm border-mapped-border-default bg-mapped-surface-default p-brand-scale-100 shadow-lg backdrop-blur-xl"
          style={{
            position: "absolute",
            top: box?.top ?? 0,
            left: box?.left ?? 0,
            visibility: box ? "visible" : "hidden",
          }}
        >
          {TEXT_ALIGNS.map((align) => (
            <ContextualButton
              key={align}
              ariaLabel={ALIGN_LABELS[align]}
              title={ALIGN_LABELS[align]}
              pressed={activeAlign === align}
              onClick={() => onPick(align)}
              showLeftIcon={false}
              showLabel={false}
              showDropdownIcon={false}
              showRightIcon
              icon={ALIGN_ICONS[align]}
            />
          ))}
        </FloatingPanel>
      ) : null}
    </div>
  );
}

function isFontSizePreset(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest("[data-floating-panel='dropdown']")?.getAttribute("aria-label") === "Font size"
  );
}

/** Wait long enough to tell a single click from a double click before opening the menu. */
const FONT_SIZE_CLICK_MS = 300;

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
  const inputRef = useRef<HTMLInputElement>(null);
  const { menuRef, box } = useAnchoredBox(open, anchorRef, "start");
  const [text, setText] = useState(value);
  const [editing, setEditing] = useState(false);
  const focused = useRef(false);
  const baseline = useRef(value);
  const commitRef = useRef<() => void>(() => {});
  const onCloseRef = useRef(onClose);
  const openTimer = useRef<number | null>(null);
  const lastDown = useRef(0);
  const suppressOpenUntil = useRef(0);
  const skipBlurCommit = useRef(false);
  const editingRef = useRef(false);
  const fromPointer = useRef(false);
  const blockCaret = useRef(false);
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
      editingRef.current = false;
      setEditing(false);
      commitRef.current();
      onCloseRef.current();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  useEffect(() => {
    return () => {
      if (openTimer.current !== null) window.clearTimeout(openTimer.current);
    };
  }, []);

  const arm = () => {
    if (!focused.current) baseline.current = text;
    focused.current = true;
    onFocusField();
  };

  const cancelOpen = () => {
    if (openTimer.current === null) return;
    window.clearTimeout(openTimer.current);
    openTimer.current = null;
  };

  const beginEdit = () => {
    cancelOpen();
    suppressOpenUntil.current = performance.now() + FONT_SIZE_CLICK_MS;
    blockCaret.current = true;
    editingRef.current = true;
    setEditing(true);
    onClose();
    arm();
    const input = inputRef.current;
    input?.focus();
    input?.select();
  };

  const leaveEdit = () => {
    editingRef.current = false;
    focused.current = false;
    setEditing(false);
  };

  const onSizeClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    fromPointer.current = false;
    if (performance.now() < suppressOpenUntil.current) return;
    const onInput = event.target instanceof Element && Boolean(event.target.closest("input"));
    if (editingRef.current && onInput) return;
    if (event.detail > 1) return;
    cancelOpen();
    if (editingRef.current) {
      onToggle();
      return;
    }
    if (document.activeElement === inputRef.current) inputRef.current?.blur();
    openTimer.current = window.setTimeout(() => {
      openTimer.current = null;
      onToggle();
    }, FONT_SIZE_CLICK_MS);
  };

  const onSizeDoubleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (editingRef.current) return;
    event.preventDefault();
    beginEdit();
  };

  return (
    <div
      ref={anchorRef}
      className="relative"
      onPointerDownCapture={(event) => {
        if (event.button !== 0) return;
        const target = event.target;
        if (!(target instanceof Element) || !anchorRef.current?.contains(target)) return;
        fromPointer.current = true;
        const onInput = Boolean(target.closest("input"));
        const now = performance.now();
        const secondClick = now - lastDown.current < FONT_SIZE_CLICK_MS;
        lastDown.current = now;
        if (!editingRef.current && secondClick) {
          event.preventDefault();
          beginEdit();
          return;
        }
        if (!editingRef.current && onInput) event.preventDefault();
      }}
      onMouseDownCapture={(event) => {
        if (event.button !== 0) return;
        const target = event.target;
        if (!(target instanceof Element) || !target.closest("input")) return;
        if (blockCaret.current || !editingRef.current) {
          event.preventDefault();
          blockCaret.current = false;
        }
      }}
      onClick={onSizeClick}
      onDoubleClick={onSizeDoubleClick}
    >
      <ContextualButton
        ariaLabel="Font size presets"
        ariaExpanded={open}
        ariaHasPopup="menu"
        showLeftIcon={false}
        showRightIcon={false}
        showLabel
        showDropdownIcon
        labelControl={
          <input
            ref={inputRef}
            aria-label="Font size"
            inputMode="numeric"
            autoComplete="off"
            readOnly={!editing}
            value={text}
            onFocus={() => {
              if (editingRef.current) {
                arm();
                return;
              }
              if (fromPointer.current) {
                inputRef.current?.blur();
                return;
              }
              editingRef.current = true;
              setEditing(true);
              arm();
            }}
            onChange={(event) => setText(event.target.value)}
            onBlur={(event) => {
              const wasEditing = editingRef.current || focused.current;
              leaveEdit();
              if (!wasEditing) {
                skipBlurCommit.current = false;
                return;
              }
              if (isFontSizePreset(event.relatedTarget)) return;
              if (skipBlurCommit.current) {
                skipBlurCommit.current = false;
                return;
              }
              commit();
              onClose();
            }}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Enter") {
                event.preventDefault();
                leaveEdit();
                commit();
                onClose();
                event.currentTarget.blur();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                skipBlurCommit.current = true;
                setText(baseline.current);
                leaveEdit();
                onClose();
                event.currentTarget.blur();
              }
            }}
            style={{ width: `${Math.max(text.length, 2)}ch` }}
            className={`bg-transparent font-alias-font-family-body text-responsive-desktop-body-md-size leading-responsive-desktop-body-md-line-height-tight text-mapped-text-action outline-none group-hover:text-mapped-text-action-hover ${editing ? "cursor-text" : "cursor-pointer"}`}
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
            <MenuRow
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
    // Fill is mapped.surface.default at 40%. Blur is the existing 24px frost. Figma blur is ignored.
    <div
      data-text-toolbar
      className="noodle-text-toolbar nodrag nopan nowheel flex items-center gap-brand-scale-100 rounded-alias-border-radius-xl border border-alias-border-width-xsm border-mapped-border-default bg-mapped-surface-default p-brand-scale-100 shadow-lg backdrop-blur-xl"
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
          <MenuRow
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
      <FontStyleMenu
        label={styleLabel}
        activeStyle={activeStyle}
        open={menu === "style"}
        onToggle={() => toggle("style")}
        onPick={(style) => {
          setMenu(null);
          onStyle(style);
        }}
      />
      <AlignPopover
        label={alignLabel}
        icon={activeAlign === "mixed" ? undefined : ALIGN_ICONS[activeAlign]}
        activeAlign={activeAlign}
        open={menu === "align"}
        onToggle={() => toggle("align")}
        onPick={(align) => {
          setMenu(null);
          onAlign(align);
        }}
      />
      </div>
      <div className="flex items-center gap-brand-scale-50">
      <IconButton label="Bulleted list" pressed={bullet} icon={List} onClick={onBullet} />
      <IconButton label="Numbered list" pressed={numbered} icon={ListOrdered} onClick={onNumbered} />
      <IconButton label="Link" pressed={linkActive} icon={Link} onClick={onLink} />
      </div>
    </div>
  );
}

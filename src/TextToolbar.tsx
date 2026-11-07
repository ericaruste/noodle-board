import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  CaseSensitive,
  TextAlignCenter,
  TextAlignEnd,
  TextAlignJustify,
  TextAlignStart,
  type LucideIcon,
} from "lucide-react";
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

const alignIconProps = { size: 20, strokeWidth: 2, "aria-hidden": true as const };

const ALIGN_ICONS: Record<TextAlign, LucideIcon> = {
  left: TextAlignStart,
  center: TextAlignCenter,
  right: TextAlignEnd,
  justify: TextAlignJustify,
};

function AlignGlyph({ align }: { align: TextAlign }) {
  const Icon = ALIGN_ICONS[align];
  return <Icon {...alignIconProps} />;
}

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
  menuLabel,
  glyph,
  horizontal = false,
  open,
  onToggle,
  children,
}: {
  label: string;
  menuLabel: string;
  glyph?: ReactNode;
  horizontal?: boolean;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { menuRef, box } = useAnchoredBox(open, buttonRef, "start");

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={menuLabel}
        title={glyph ? label : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={onToggle}
        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 ${
          glyph ? "h-10" : ""
        }`}
      >
        {glyph ?? <span className="min-w-[4.5rem] text-left">{label}</span>}
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className="shrink-0 fill-slate-500">
          <path d="M2 3.5 5 7l3-3.5" />
        </svg>
      </button>
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
      if (target instanceof Element) {
        const panel = target.closest("[data-floating-panel='dropdown']");
        if (panel?.getAttribute("aria-label") === "Font size") return;
      }
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
      <div className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100">
        <input
          aria-label="Font size"
          inputMode="numeric"
          autoComplete="off"
          value={text}
          onPointerDown={arm}
          onFocus={arm}
          onChange={(event) => setText(event.target.value)}
          onBlur={(event) => {
            focused.current = false;
            const next = event.relatedTarget;
            if (next instanceof Element && next.closest("[data-floating-panel='dropdown']")) return;
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
          className="w-[4.5rem] min-w-[4.5rem] bg-transparent text-left text-xs font-medium text-slate-700 outline-none"
        />
        <button
          type="button"
          aria-label="Font size presets"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={onToggle}
          className="shrink-0"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className="shrink-0 fill-slate-500">
            <path d="M2 3.5 5 7l3-3.5" />
          </svg>
        </button>
      </div>
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
  onClick,
  children,
}: {
  label: string;
  pressed: Pressed;
  onClick: () => void;
  children: ReactNode;
}) {
  const on = pressed === true;
  const mixed = pressed === "mixed";
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={mixed ? "mixed" : on}
      title={label}
      onClick={onClick}
      className={`rounded-lg px-2 py-1 text-slate-700 hover:bg-slate-100 ${
        on ? "bg-slate-200" : mixed ? "bg-slate-100 ring-1 ring-slate-300" : ""
      }`}
    >
      {children}
    </button>
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
    <div
      data-text-toolbar
      className="noodle-text-toolbar nodrag nopan nowheel flex items-center gap-0.5 rounded-xl border border-white/50 bg-white/40 p-1 shadow-lg backdrop-blur-xl"
      onMouseDown={(event) => {
        if ((event.target as HTMLElement).closest("input, textarea")) return;
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      <Menu
        label={activeFamily === "mixed" ? "Mixed" : activeFamily === "none" ? "Font style" : activeFamily}
        menuLabel="Font style"
        glyph={<CaseSensitive {...alignIconProps} />}
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
      {extra ? (
        <>
          <span className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden />
          {extra}
          <span className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden />
        </>
      ) : null}
      <Menu
        label={styleLabel}
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
        glyph={
          activeAlign === "mixed" ? undefined : <AlignGlyph align={activeAlign} />
        }
        horizontal
        open={menu === "align"}
        onToggle={() => toggle("align")}
      >
        {TEXT_ALIGNS.map((align) => (
          <MenuItem
            key={align}
            label={ALIGN_LABELS[align]}
            glyph={<AlignGlyph align={align} />}
            horizontal
            active={activeAlign === align}
            onPick={() => {
              setMenu(null);
              onAlign(align);
            }}
          />
        ))}
      </Menu>
      <span className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden />
      <IconButton label="Bulleted list" pressed={bullet} onClick={onBullet}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="fill-current">
          <circle cx="3" cy="4" r="1.3" />
          <circle cx="3" cy="8" r="1.3" />
          <circle cx="3" cy="12" r="1.3" />
          <rect x="6" y="3.2" width="8" height="1.4" rx="0.4" />
          <rect x="6" y="7.2" width="8" height="1.4" rx="0.4" />
          <rect x="6" y="11.2" width="8" height="1.4" rx="0.4" />
        </svg>
      </IconButton>
      <IconButton label="Numbered list" pressed={numbered} onClick={onNumbered}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="fill-current">
          <text x="0.5" y="5.2" fontSize="5" fontFamily="sans-serif">
            1
          </text>
          <text x="0.5" y="9.4" fontSize="5" fontFamily="sans-serif">
            2
          </text>
          <text x="0.5" y="13.6" fontSize="5" fontFamily="sans-serif">
            3
          </text>
          <rect x="6" y="3.2" width="8" height="1.4" rx="0.4" />
          <rect x="6" y="7.2" width="8" height="1.4" rx="0.4" />
          <rect x="6" y="11.2" width="8" height="1.4" rx="0.4" />
        </svg>
      </IconButton>
      <IconButton label="Link" pressed={linkActive} onClick={onLink}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="fill-none stroke-current">
          <path
            d="M6.6 8.8a2.6 2.6 0 0 0 3.9.2l1.6-1.6a2.6 2.6 0 0 0-3.7-3.7L7.5 4.6"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M9.4 7.2a2.6 2.6 0 0 0-3.9-.2L3.9 8.6a2.6 2.6 0 0 0 3.7 3.7l.9-.9"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </IconButton>
    </div>
  );
}

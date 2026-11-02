import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ALIGN_LABELS,
  FONT_STYLE_LABELS,
  FONT_STYLES,
  TEXT_ALIGNS,
  type FontStyle,
  type TextAlign,
} from "./textBody";

type Pressed = boolean | "mixed";

type TextToolbarProps = {
  styleLabel: string;
  alignLabel: string;
  activeStyle: FontStyle | "mixed";
  activeAlign: TextAlign | "mixed";
  bullet: Pressed;
  numbered: Pressed;
  onStyle: (style: FontStyle) => void;
  onAlign: (align: TextAlign) => void;
  onBullet: () => void;
  onNumbered: () => void;
  onLink: () => void;
  linkActive: boolean;
  zoom: number;
};

function Menu({
  label,
  menuLabel,
  open,
  onToggle,
  zoom,
  children,
}: {
  label: string;
  menuLabel: string;
  open: boolean;
  onToggle: () => void;
  zoom: number;
  children: ReactNode;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [box, setBox] = useState<{ top: number; left: number; minWidth: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    let frame = 0;
    const place = () => {
      const button = buttonRef.current;
      if (button) {
        const rect = button.getBoundingClientRect();
        const next = {
          top: rect.bottom + 4,
          left: rect.left,
          minWidth: rect.width * (zoom > 0 ? zoom : 1),
        };
        setBox((prev) =>
          prev &&
          Math.abs(prev.top - next.top) < 0.5 &&
          Math.abs(prev.left - next.left) < 0.5 &&
          Math.abs(prev.minWidth - next.minWidth) < 0.5
            ? prev
            : next,
        );
      }
      frame = requestAnimationFrame(place);
    };
    place();
    return () => cancelAnimationFrame(frame);
  }, [open, zoom]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={menuLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={onToggle}
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
      >
        <span className="min-w-[4.5rem] text-left">{label}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className="shrink-0 fill-slate-500">
          <path d="M2 3.5 5 7l3-3.5" />
        </svg>
      </button>
      {open && box
        ? createPortal(
            <div
              role="menu"
              aria-label={menuLabel}
              data-text-toolbar
              className="nodrag nopan rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
              style={{
                position: "fixed",
                top: box.top,
                left: box.left,
                minWidth: box.minWidth,
                zIndex: 10001,
                transform: `scale(${zoom > 0 ? 1 / zoom : 1})`,
                transformOrigin: "top left",
              }}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={(event) => event.stopPropagation()}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function MenuItem({
  label,
  active,
  onPick,
}: {
  label: string;
  active: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={active}
      onClick={onPick}
      className={`block w-full whitespace-nowrap px-3 py-1.5 text-left text-xs ${
        active ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
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
  bullet,
  numbered,
  onStyle,
  onAlign,
  onBullet,
  onNumbered,
  onLink,
  linkActive,
  zoom,
}: TextToolbarProps) {
  const [menu, setMenu] = useState<"style" | "align" | null>(null);

  const toggle = (next: "style" | "align") => {
    setMenu((current) => (current === next ? null : next));
  };

  return (
    <div
      data-text-toolbar
      className="noodle-text-toolbar nodrag nopan absolute left-1/2 z-10 flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
      style={{ transform: `translateX(-50%) scale(${1 / zoom})`, transformOrigin: "center bottom" }}
      onMouseDown={(event) => {
        if ((event.target as HTMLElement).closest("input, textarea")) return;
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      <Menu
        label={styleLabel}
        menuLabel="Font style"
        open={menu === "style"}
        onToggle={() => toggle("style")}
        zoom={zoom}
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
        open={menu === "align"}
        onToggle={() => toggle("align")}
        zoom={zoom}
      >
        {TEXT_ALIGNS.map((align) => (
          <MenuItem
            key={align}
            label={ALIGN_LABELS[align]}
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

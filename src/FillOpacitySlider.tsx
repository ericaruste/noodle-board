import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { SliderThumb, type SliderThumbState } from "./SliderThumb";
import { SLIDER_SPECIMEN_COLOR, SliderTrack } from "./SliderTrack";

type FillOpacitySliderProps = {
  /** 0 to 100. Leave unset to keep the value inside the slider. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Opaque end of the track. The specimen is `#6579F8`. */
  color?: string;
  disabled?: boolean;
};

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function parsePercent(raw: string) {
  const digits = raw.replace(/%/g, "").trim();
  if (!/^\d{1,3}$/.test(digits)) return null;
  return clampPercent(Number(digits));
}

function percentFromClientX(track: HTMLElement, clientX: number) {
  const box = track.getBoundingClientRect();
  if (box.width <= 0) return 0;
  return clampPercent(((clientX - box.left) / box.width) * 100);
}

export default function FillOpacitySlider({
  value: valueProp,
  defaultValue = 50,
  onValueChange,
  color = SLIDER_SPECIMEN_COLOR,
  disabled = false,
}: FillOpacitySliderProps) {
  const [valueState, setValueState] = useState(() => clampPercent(defaultValue));
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const pointerFocus = useRef(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const trackRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fromPointer = useRef(false);
  const skipCommit = useRef(false);
  const editingRef = useRef(false);
  const lastDown = useRef(0);
  const value = valueProp === undefined ? valueState : clampPercent(valueProp);
  const shown = editing ? draft : `${value}%`;

  function setValue(next: number) {
    const clean = clampPercent(next);
    if (valueProp === undefined) setValueState(clean);
    onValueChange?.(clean);
  }

  function beginEdit() {
    if (disabled || editingRef.current) return;
    editingRef.current = true;
    setDraft(String(value));
    setEditing(true);
  }

  useLayoutEffect(() => {
    if (!editing) return;
    const input = inputRef.current;
    input?.focus();
    input?.select();
  }, [editing]);

  function commit() {
    const next = parsePercent(draft);
    if (next === null) return;
    setValue(next);
  }

  function onTrackPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled || event.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;
    event.preventDefault();
    pointerFocus.current = true;
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingRef.current = true;
    setDragging(true);
    setValue(percentFromClientX(track, event.clientX));
  }

  function onTrackPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const track = trackRef.current;
    if (!track) return;
    setValue(percentFromClientX(track, event.clientX));
  }

  function endDrag() {
    draggingRef.current = false;
    setDragging(false);
  }

  function onTrackKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    const step = event.shiftKey ? 10 : 1;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      setValue(value + step);
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      setValue(value - step);
    }
    if (event.key === "Home") {
      event.preventDefault();
      setValue(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      setValue(100);
    }
  }

  const thumb: SliderThumbState = disabled ? "disabled" : dragging ? "pressed" : hovered || focused ? "hover" : "default";

  return (
    <div data-fill-opacity="" className="inline-flex items-center gap-brand-scale-200">
      <div
        ref={trackRef}
        role="slider"
        aria-label="Fill opacity"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        className="relative h-brand-scale-300 w-[120px] touch-none outline-none"
        onPointerDown={onTrackPointerDown}
        onPointerMove={onTrackPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(!pointerFocus.current)}
        onBlur={() => {
          pointerFocus.current = false;
          setFocused(false);
        }}
        onKeyDown={onTrackKeyDown}
      >
        {/* 120px matches the track. No spacing token is 120px. TODO token mismatch: Figma 120px */}
        {/* The track keeps its own relative box. This wrapper centers that box on the thumb. */}
        <span className="pointer-events-none absolute inset-x-0 top-1/2 flex h-brand-scale-150 -translate-y-1/2">
          <SliderTrack color={color} />
        </span>
        <SliderThumb
          state={thumb}
          className="absolute top-1/2"
          // left is the percent. The disc stays centered on that point, above the track.
          style={{ left: `${value}%`, transform: "translate(-50%, -50%)" }}
        />
      </div>
      {/* TODO token mismatch: Figma #334155. Nearest text token is mapped.text.default #303132. */}
      <input
        ref={inputRef}
        aria-label="Fill opacity percent"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        readOnly={!editing}
        value={shown}
        style={{ width: `${Math.max(shown.length, 2)}ch` }}
        onPointerDown={(event) => {
          fromPointer.current = true;
          const now = performance.now();
          const secondClick = now - lastDown.current < 300;
          lastDown.current = now;
          if (!editingRef.current && secondClick) {
            event.preventDefault();
            beginEdit();
            return;
          }
          if (!editingRef.current) event.preventDefault();
        }}
        onMouseDown={(event) => {
          if (!editingRef.current) event.preventDefault();
        }}
        onDoubleClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          beginEdit();
        }}
        onFocus={() => {
          if (editingRef.current || fromPointer.current) return;
          beginEdit();
        }}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          const wasEditing = editingRef.current;
          editingRef.current = false;
          setEditing(false);
          fromPointer.current = false;
          if (!wasEditing) {
            skipCommit.current = false;
            return;
          }
          if (skipCommit.current) {
            skipCommit.current = false;
            return;
          }
          commit();
        }}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Enter") {
            event.preventDefault();
            setEditing(false);
            commit();
            event.currentTarget.blur();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            skipCommit.current = true;
            setDraft(String(value));
            setEditing(false);
            event.currentTarget.blur();
          }
        }}
        className={`m-0 border-0 bg-transparent p-0 font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight text-mapped-text-default outline-none disabled:text-mapped-text-disabled ${editing ? "cursor-text" : "cursor-pointer"}`}
      />
    </div>
  );
}

export function FillOpacitySliderPreview() {
  const [value, setValue] = useState(50);
  return (
    <main className="flex min-h-screen flex-col gap-brand-scale-600 bg-mapped-surface-page p-brand-scale-600">
      <p className="font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight text-mapped-text-default">
        Fill opacity
      </p>
      <div className="flex items-center gap-brand-scale-400">
        <span
          aria-hidden
          className="relative size-brand-scale-1200 overflow-hidden rounded-alias-border-radius-lg"
          style={{
            backgroundColor: "var(--brand-foundation-white)",
            backgroundImage:
              "repeating-conic-gradient(var(--mapped-border-disabled) 0% 25%, var(--brand-foundation-white) 0% 50%)",
            backgroundSize: "16px 16px",
          }}
        >
          <span className="absolute inset-0" style={{ backgroundColor: SLIDER_SPECIMEN_COLOR, opacity: value / 100 }} />
        </span>
        <FillOpacitySlider value={value} onValueChange={setValue} />
      </div>
    </main>
  );
}

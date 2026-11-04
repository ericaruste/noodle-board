import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Hand,
  Image,
  MousePointer2,
  MoveUpRight,
  Shapes,
  StickyNote,
  Trash,
  TypeOutline,
} from "lucide-react";
import { FloatingPanel, useAnchoredBox } from "./FloatingPanel";
import type { PlacementKind } from "./placement";
import { SHAPE_KINDS, SHAPE_LABELS, type ShapeKind } from "./shapeData";
import { ShapeKindIcon } from "./ShapeNode";

export type BoardTool = "select" | "hand" | "arrow";

type ToolbarProps = {
  tool: BoardTool;
  placement: PlacementKind | null;
  placingShape: ShapeKind | null;
  onTool: (tool: BoardTool) => void;
  onAddSticky: () => void;
  onAddText: () => void;
  onAddShape: (kind: ShapeKind) => void;
  onAddImage: (file: File) => void;
  onCancelPlacement: () => void;
  onDelete: () => void;
  canDelete: boolean;
};

const iconProps = { size: 20, strokeWidth: 2, "aria-hidden": true as const };

const pressed = "bg-slate-900 text-white shadow-sm";
const idle = "text-slate-800 hover:bg-slate-900/10";
const disabledClass = "pointer-events-none cursor-not-allowed text-slate-300";

const toolButton =
  "flex h-10 w-10 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900";

function Tip({
  label,
  show = true,
  children,
}: {
  label: string;
  show?: boolean;
  children: ReactNode;
}) {
  return (
    <span className="group relative">
      {children}
      {show ? (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg group-hover:opacity-100 group-focus-within:opacity-100"
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}

export default function Toolbar({
  tool,
  placement,
  placingShape,
  onTool,
  onAddSticky,
  onAddText,
  onAddShape,
  onAddImage,
  onCancelPlacement,
  onDelete,
  canDelete,
}: ToolbarProps) {
  const [shapesOpen, setShapesOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const shapesButtonRef = useRef<HTMLButtonElement>(null);
  const { menuRef: shapesMenuRef, box: shapesBox } = useAnchoredBox(shapesOpen, shapesButtonRef, "center", 8);

  useEffect(() => {
    if (!shapesOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-shapes-menu]")) return;
      setShapesOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShapesOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [shapesOpen]);

  return (
    <FloatingPanel
      layer="toolbar"
      role="toolbar"
      ariaLabel="Tools"
      className="board-toolbar rounded-full border border-white/50 bg-white/40 p-1 shadow-lg backdrop-blur-xl"
    >
      <div
        className="flex items-center gap-0.5"
        onPointerDown={(event) => {
          const target = event.target;
          if (target instanceof Element && target.closest("[data-shapes-menu]")) return;
          setShapesOpen(false);
        }}
      >
      <Tip label="Select">
        <button
          type="button"
          aria-label="Select"
          aria-pressed={placement == null && tool === "select"}
          onClick={() => onTool("select")}
          className={`${toolButton} ${placement == null && tool === "select" ? pressed : idle}`}
        >
          <MousePointer2 {...iconProps} />
        </button>
      </Tip>
      <Tip label="Hand">
        <button
          type="button"
          aria-label="Hand"
          aria-pressed={placement == null && tool === "hand"}
          onClick={() => onTool("hand")}
          className={`${toolButton} ${placement == null && tool === "hand" ? pressed : idle}`}
        >
          <Hand {...iconProps} />
        </button>
      </Tip>
      <Tip label="Text">
        <button
          type="button"
          aria-label="Text"
          aria-pressed={placement === "text"}
          onClick={onAddText}
          className={`${toolButton} ${placement === "text" ? pressed : idle}`}
        >
          <TypeOutline {...iconProps} />
        </button>
      </Tip>
      <Tip label="Image">
        <button
          type="button"
          aria-label="Image"
          aria-pressed={placement === "image"}
          onClick={() => {
            if (placement === "image") {
              onCancelPlacement();
              return;
            }
            imageInputRef.current?.click();
          }}
          className={`${toolButton} ${placement === "image" ? pressed : idle}`}
        >
          <Image {...iconProps} />
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          tabIndex={-1}
          aria-hidden
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onAddImage(file);
            event.target.value = "";
          }}
        />
      </Tip>
      <div data-shapes-menu="">
        <Tip label="Shapes" show={!shapesOpen}>
          <button
            ref={shapesButtonRef}
            type="button"
            aria-label="Shapes"
            aria-expanded={shapesOpen}
            aria-haspopup="menu"
            aria-pressed={shapesOpen || placement === "shape"}
            onClick={() => setShapesOpen((open) => !open)}
            className={`${toolButton} ${shapesOpen || placement === "shape" ? pressed : idle}`}
          >
            <Shapes {...iconProps} />
          </button>
        </Tip>
        {shapesOpen ? (
          <FloatingPanel
            layer="dropdown"
            panelRef={shapesMenuRef}
            role="menu"
            ariaLabel="Shapes"
            data-shapes-menu=""
            className="w-52 overflow-hidden rounded-xl border border-white/50 bg-white/40 py-1 shadow-lg backdrop-blur-xl"
            style={{
              position: "absolute",
              top: shapesBox?.top ?? 0,
              left: shapesBox?.left ?? 0,
              visibility: shapesBox ? "visible" : "hidden",
            }}
          >
            {SHAPE_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                role="menuitem"
                aria-pressed={placingShape === kind}
                onClick={() => {
                  setShapesOpen(false);
                  onAddShape(kind);
                }}
                className="flex h-10 w-full items-center gap-2 px-3 text-left text-sm font-medium text-slate-700 hover:bg-emerald-50"
              >
                <ShapeKindIcon kind={kind} />
                {SHAPE_LABELS[kind]}
              </button>
            ))}
          </FloatingPanel>
        ) : null}
      </div>
      <Tip label="Noodle">
        <button
          type="button"
          aria-label="Noodle"
          aria-pressed={placement == null && tool === "arrow"}
          onClick={() => onTool(placement == null && tool === "arrow" ? "select" : "arrow")}
          className={`${toolButton} ${placement == null && tool === "arrow" ? pressed : idle}`}
        >
          <MoveUpRight {...iconProps} />
        </button>
      </Tip>
      <Tip label="Sticky note">
        <button
          type="button"
          aria-label="Sticky note"
          aria-pressed={placement === "sticky"}
          onClick={onAddSticky}
          className={`${toolButton} ${placement === "sticky" ? pressed : idle}`}
        >
          <StickyNote {...iconProps} />
        </button>
      </Tip>
      <Tip label="Delete">
        <button
          type="button"
          aria-label="Delete"
          onClick={onDelete}
          disabled={!canDelete}
          className={`${toolButton} ${canDelete ? "text-rose-700 hover:bg-rose-50" : disabledClass}`}
        >
          <Trash {...iconProps} />
        </button>
      </Tip>
      </div>
    </FloatingPanel>
  );
}

import { useEffect, useRef, useState } from "react";
import { FloatingPanel, useAnchoredBox } from "./FloatingPanel";
import { SHAPE_KINDS, SHAPE_LABELS, type ShapeKind } from "./shapeData";
import { ShapeKindIcon } from "./ShapeNode";

export type BoardTool = "select" | "hand" | "arrow";

type ToolbarProps = {
  tool: BoardTool;
  onTool: (tool: BoardTool) => void;
  onAddSticky: () => void;
  onAddText: () => void;
  onAddShape: (kind: ShapeKind) => void;
  onAddImage: (file: File) => void;
  onDelete: () => void;
  canDelete: boolean;
};

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="shrink-0">
      <path d="M2 8h10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8.5 4.5 12.5 8 8.5 11.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const pressed = "bg-slate-800 text-white";
const idle = "text-slate-700 hover:bg-slate-100";

export default function Toolbar({
  tool,
  onTool,
  onAddSticky,
  onAddText,
  onAddShape,
  onAddImage,
  onDelete,
  canDelete,
}: ToolbarProps) {
  const [shapesOpen, setShapesOpen] = useState(false);
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
    <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-lg backdrop-blur">
      <button
        type="button"
        aria-pressed={tool === "select"}
        onClick={() => onTool("select")}
        className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium ${tool === "select" ? pressed : idle}`}
      >
        Select
      </button>
      <button
        type="button"
        aria-pressed={tool === "hand"}
        onClick={() => onTool("hand")}
        className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium ${tool === "hand" ? pressed : idle}`}
      >
        Hand
      </button>
      <button
        type="button"
        onClick={onAddSticky}
        className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-amber-50"
      >
        Add Sticky Note
      </button>
      <button
        type="button"
        onClick={onAddText}
        className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-violet-50"
      >
        Add Text
      </button>
      <div data-shapes-menu="">
        <button
          ref={shapesButtonRef}
          type="button"
          aria-expanded={shapesOpen}
          aria-haspopup="menu"
          onClick={() => setShapesOpen((open) => !open)}
          className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50"
        >
          Add Shape
        </button>
        {shapesOpen ? (
          <FloatingPanel
            layer="dropdown"
            panelRef={shapesMenuRef}
            role="menu"
            ariaLabel="Shapes"
            data-shapes-menu=""
            className="w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
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
                onClick={() => {
                  setShapesOpen(false);
                  onAddShape(kind);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-emerald-50"
              >
                <ShapeKindIcon kind={kind} />
                {SHAPE_LABELS[kind]}
              </button>
            ))}
          </FloatingPanel>
        ) : null}
      </div>
      <label className="cursor-pointer whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-sky-50">
        Add Image
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onAddImage(file);
            event.target.value = "";
          }}
        />
      </label>
      <button
        type="button"
        aria-pressed={tool === "arrow"}
        onClick={() => onTool(tool === "arrow" ? "select" : "arrow")}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium ${
          tool === "arrow" ? pressed : idle
        }`}
      >
        <ArrowIcon />
        Arrow
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={!canDelete}
        className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
      >
        Delete
      </button>
    </div>
  );
}

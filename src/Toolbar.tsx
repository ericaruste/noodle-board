import { useEffect, useRef, useState } from "react";
import { SHAPE_KINDS, SHAPE_LABELS, type ShapeKind } from "./shapeData";
import { ShapeKindIcon } from "./ShapeNode";

type ToolbarProps = {
  onAddSticky: () => void;
  onAddText: () => void;
  onAddShape: (kind: ShapeKind) => void;
  onAddImage: (file: File) => void;
  onDelete: () => void;
  canDelete: boolean;
};

export default function Toolbar({
  onAddSticky,
  onAddText,
  onAddShape,
  onAddImage,
  onDelete,
  canDelete,
}: ToolbarProps) {
  const [shapesOpen, setShapesOpen] = useState(false);
  const shapesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shapesOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!shapesRef.current?.contains(event.target as Node)) setShapesOpen(false);
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
      <div ref={shapesRef} className="relative">
        <button
          type="button"
          aria-expanded={shapesOpen}
          aria-haspopup="menu"
          onClick={() => setShapesOpen((open) => !open)}
          className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50"
        >
          Add Shape
        </button>
        {shapesOpen ? (
          <div
            role="menu"
            aria-label="Shapes"
            className="absolute left-1/2 top-full z-30 mt-2 w-52 -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
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
          </div>
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
        onClick={onDelete}
        disabled={!canDelete}
        className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
      >
        Delete
      </button>
    </div>
  );
}

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Hand,
  Image,
  MousePointer2,
  Shapes,
  StickyNote,
  Trash,
  Type,
} from "lucide-react";
import { FloatingPanel, useAnchoredBox } from "./FloatingPanel";
import { MainButton } from "./MainButton";
import { NoodleMainIcon } from "./noodleIcons";
import type { PlacementKind } from "./placement";
import type { ShapeKind } from "./shapeData";
import ShapeSwatch from "./ShapeSwatch";

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
    <span className="group/tip relative">
      {children}
      {show ? (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
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
  const { menuRef: shapesMenuRef, box: shapesBox } = useAnchoredBox(shapesOpen, shapesButtonRef, "center");
  const idle = placement == null;

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
      className="board-toolbar rounded-alias-border-radius-xl border border-alias-border-width-xsm border-mapped-border-default bg-mapped-surface-default p-brand-scale-4 shadow-lg backdrop-blur-xl" // TODO token mismatch: Figma padding 3px
    >
      <div
        className="flex items-center gap-brand-scale-2"
        onPointerDown={(event) => {
          const target = event.target;
          if (target instanceof Element && target.closest("[data-shapes-menu]")) return;
          setShapesOpen(false);
        }}
      >
      <Tip label="Select">
        <MainButton
          showLabel={false}
          showRightIcon={false}
          leftIcon={MousePointer2}
          ariaLabel="Select"
          selected={idle && tool === "select"}
          onClick={() => onTool("select")}
        />
      </Tip>
      <Tip label="Hand">
        <MainButton
          showLabel={false}
          showRightIcon={false}
          leftIcon={Hand}
          ariaLabel="Hand"
          selected={idle && tool === "hand"}
          onClick={() => onTool("hand")}
        />
      </Tip>
      <Tip label="Sticky note">
        <MainButton
          showLabel={false}
          showRightIcon={false}
          leftIcon={StickyNote}
          ariaLabel="Sticky note"
          selected={placement === "sticky"}
          onClick={onAddSticky}
        />
      </Tip>
      <Tip label="Text">
        <MainButton
          showLabel={false}
          showRightIcon={false}
          leftIcon={Type}
          ariaLabel="Text"
          selected={placement === "text"}
          onClick={onAddText}
        />
      </Tip>
      <Tip label="Image">
        <MainButton
          showLabel={false}
          showRightIcon={false}
          leftIcon={Image}
          ariaLabel="Image"
          selected={placement === "image"}
          onClick={() => {
            if (placement === "image") {
              onCancelPlacement();
              return;
            }
            imageInputRef.current?.click();
          }}
        />
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
          <MainButton
            ref={shapesButtonRef}
            showLabel={false}
            showRightIcon={false}
            leftIcon={Shapes}
            ariaLabel="Shapes"
            ariaExpanded={shapesOpen}
            ariaHasPopup="menu"
            selected={shapesOpen || placement === "shape"}
            onClick={() => setShapesOpen((open) => !open)}
          />
        </Tip>
        {shapesOpen ? (
          <FloatingPanel
            layer="dropdown"
            panelRef={shapesMenuRef}
            ariaLabel="Shapes"
            data-shapes-menu=""
            style={{
              position: "absolute",
              top: shapesBox?.top ?? 0,
              left: shapesBox?.left ?? 0,
              visibility: shapesBox ? "visible" : "hidden",
            }}
          >
            <ShapeSwatch
              kind={placingShape}
              onKind={(kind) => {
                setShapesOpen(false);
                onAddShape(kind);
              }}
            />
          </FloatingPanel>
        ) : null}
      </div>
      <Tip label="Noodle">
        <MainButton
          showLabel={false}
          showRightIcon={false}
          leftIcon={NoodleMainIcon}
          ariaLabel="Noodle"
          selected={idle && tool === "arrow"}
          onClick={() => onTool(idle && tool === "arrow" ? "select" : "arrow")}
        />
      </Tip>
      <Tip label="Delete">
        <MainButton
          type="destructive"
          showLabel={false}
          showRightIcon={false}
          leftIcon={Trash}
          ariaLabel="Delete"
          disabled={!canDelete}
          onClick={onDelete}
        />
      </Tip>
      </div>
    </FloatingPanel>
  );
}

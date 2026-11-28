import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { FloatingPanel, useAnchoredBox } from "./FloatingPanel";
import { ProjectMenu } from "./ProjectMenu";
import { ProjectToolbar, type ProjectToolbarSize } from "./ProjectToolbar";
import type { RecentProject } from "./recents";

const specimenProjects = [
  "Project name #1",
  "Project name #2",
  "Project name #3",
  "Project name #4",
  "Project name #5",
  "Project name #6",
];

const caption =
  "font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight text-mapped-text-caption";

type ProjectManagementToolbarProps = {
  /** Passed to the toolbar and the menu. Unset is `lg`: 40px parts and 220px panels. `md` is 32px parts and 180px panels. */
  size?: ProjectToolbarSize;
  documentName?: string;
  saving?: boolean;
  recents?: RecentProject[];
  selectedRecentId?: string | null;
  /** The trial shows New's `Ctrl+N` caption. The board turns it off. */
  showNewCaption?: boolean;
  /** Board placement. The trial stays in the page flow. */
  placed?: boolean;
  onNew?: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onOpenRecent?: (id: string) => void;
  onRename?: (name: string) => void;
  onSavePulseIteration?: () => void;
};

export function ProjectManagementToolbar({
  size = "lg",
  documentName,
  saving = false,
  recents,
  selectedRecentId = null,
  showNewCaption = true,
  placed = false,
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onOpenRecent,
  onRename,
  onSavePulseIteration,
}: ProjectManagementToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const { menuRef, box } = useAnchoredBox(placed && menuOpen, barRef, "start");

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current?.contains(target)) return;
      const logo = barRef.current?.querySelector("[data-project-toolbar] button");
      if (logo?.contains(target)) return;
      setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const target = event.target;
      if (target instanceof Element && target.closest("[data-title-input]")) return;
      event.preventDefault();
      event.stopPropagation();
      setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen, menuRef]);

  function onToolbarPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!menuOpen) return;
    const logo = event.currentTarget.querySelector("[data-project-toolbar] button");
    if (event.target instanceof Node && logo?.contains(event.target)) return;
    setMenuOpen(false);
  }

  function run(action: (() => void) | undefined) {
    if (!action) return undefined;
    return () => {
      setMenuOpen(false);
      action();
    };
  }

  const toolbar = (
    <div onPointerDown={onToolbarPointerDown}>
      <ProjectToolbar
        size={size}
        title={documentName}
        defaultTitle="Project Title"
        saving={saving}
        onTitleCommit={onRename}
        onSavePulseIteration={onSavePulseIteration}
        onLogoClick={() => setMenuOpen((open) => !open)}
        logoSelected={menuOpen}
      />
    </div>
  );

  const menu = (
    <ProjectMenu
      size={size}
      projects={specimenProjects}
      recents={recents?.map((recent) => ({ id: recent.id, name: recent.name }))}
      selectedRecentId={selectedRecentId}
      showNewCaption={showNewCaption}
      onNew={run(onNew)}
      onOpen={run(onOpen)}
      onSave={run(onSave)}
      onSaveAs={run(onSaveAs)}
      onOpenRecent={
        onOpenRecent
          ? (id) => {
              setMenuOpen(false);
              onOpenRecent(id);
            }
          : undefined
      }
    />
  );

  if (placed) {
    return (
      <>
        <FloatingPanel
          layer="toolbar"
          panelRef={barRef}
          data-canvas-chrome=""
          className="inline-flex"
          style={{
            position: "absolute",
            top: "var(--brand-scale-16)",
            left: "var(--brand-scale-16)",
          }}
        >
          {toolbar}
        </FloatingPanel>
        {menuOpen ? (
          <FloatingPanel
            layer="dropdown"
            panelRef={menuRef}
            className="inline-flex"
            style={{
              position: "absolute",
              top: box?.top ?? 0,
              left: box?.left ?? 0,
              visibility: box ? "visible" : "hidden",
              pointerEvents: "none",
            }}
          >
            {menu}
          </FloatingPanel>
        ) : null}
      </>
    );
  }

  return (
    <div
      ref={barRef}
      data-project-management-toolbar
      className="inline-flex flex-col items-start gap-brand-scale-4"
    >
      {toolbar}
      {menuOpen ? (
        <div ref={menuRef} className="contents">
          {menu}
        </div>
      ) : null}
    </div>
  );
}

export function ProjectManagementToolbarPreview() {
  return (
    <main className="flex min-h-screen flex-col items-start gap-brand-scale-24 bg-mapped-surface-page p-brand-scale-24">
      <p className={caption}>Project management toolbar</p>
      <section className="flex flex-col items-start gap-brand-scale-8">
        <p className={caption}>lg</p>
        <ProjectManagementToolbar />
      </section>
      <section className="flex flex-col items-start gap-brand-scale-8">
        <p className={caption}>md</p>
        <ProjectManagementToolbar size="md" />
      </section>
    </main>
  );
}

import { useEffect, useRef, useState } from "react";
import { ProjectMenu } from "./ProjectMenu";
import { ProjectToolbar } from "./ProjectToolbar";

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

export function ProjectManagementToolbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current?.contains(target)) return;
      const logo = rootRef.current?.querySelector("[data-project-toolbar] button");
      if (logo?.contains(target)) return;
      setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  return (
    <div
      ref={rootRef}
      data-project-management-toolbar
      className="inline-flex flex-col items-start gap-brand-scale-4"
    >
      <ProjectToolbar
        defaultTitle="Project Title"
        onLogoClick={() => setMenuOpen((open) => !open)}
        logoSelected={menuOpen}
      />
      {menuOpen ? (
        <div ref={menuRef} className="contents">
          <ProjectMenu projects={specimenProjects} />
        </div>
      ) : null}
    </div>
  );
}

export function ProjectManagementToolbarPreview() {
  return (
    <main className="flex min-h-screen flex-col items-start gap-brand-scale-24 bg-mapped-surface-page p-brand-scale-24">
      <p className={caption}>Project management toolbar</p>
      <ProjectManagementToolbar />
    </main>
  );
}

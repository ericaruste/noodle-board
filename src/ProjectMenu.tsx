import { createLucideIcon } from "lucide-react";
import { MenuItem } from "./MenuItem";

/** Lucide `bowl-chopsticks`. The installed lucide-react package does not export it. */
export const BowlChopsticks = createLucideIcon("bowl-chopsticks", [
  ["path", { d: "m14 12 4-9" }],
  ["path", { d: "m22 5-4 7" }],
  ["path", { d: "M4 12a1 1 0 00-.99 1.133A9 9 0 0012 21a9 9 0 008.99-7.867A1 1 0 0020 12z" }],
  ["path", { d: "M5 11.95a3.5 3.5 0 115 0" }],
  ["path", { d: "M7 21h10" }],
]);

const panelClass =
  "grid w-max rounded-alias-border-radius-lg border border-alias-border-width-xsm border-mapped-border-default bg-mapped-surface-default p-brand-scale-4 shadow-lg backdrop-blur-xl";

type ProjectMenuProps = {
  /** Every recent project. The main menu shows the first three. The recent panel shows all of them. */
  projects: string[];
  /** View all's selected state. The recent panel is open only while this is set. */
  viewAllSelected?: boolean;
  /** Recent-panel row to paint selected. The copy in the main menu stays unselected. */
  selectedProject?: string;
};

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

function CommandRow({ label, caption: shortcut }: { label: string; caption: string }) {
  return (
    <MenuItem label={label} caption={shortcut} size="md" showLeftIcon={false} showChevron={false} />
  );
}

function ProjectRow({ label, selected = false }: { label: string; selected?: boolean }) {
  return (
    <MenuItem
      label={label}
      size="md"
      leftIcon={BowlChopsticks}
      showCaption={false}
      showChevron={false}
      selected={selected}
    />
  );
}

export function ProjectMenu({ projects, viewAllSelected = false, selectedProject }: ProjectMenuProps) {
  const preview = projects.slice(0, 3);

  return (
    <div className="inline-flex items-start gap-brand-scale-4">
      <div data-project-menu role="menu" aria-label="Project" className={panelClass}>
        <CommandRow label="New" caption="Ctrl+N" />
        <CommandRow label="Open" caption="Ctrl+O" />
        <div className="flex h-brand-scale-32 items-center whitespace-nowrap px-brand-scale-8 font-alias-font-family-body text-[12px] leading-[1em] text-mapped-text-action">
          Recent
        </div>
        <MenuItem
          label="View all"
          size="md"
          showLeftIcon={false}
          showCaption={false}
          showChevron={false}
          selected={viewAllSelected}
        />
        {preview.map((name) => (
          <ProjectRow key={name} label={name} />
        ))}
        <div className="h-brand-scale-8" aria-hidden />
        <CommandRow label="Save" caption="Ctrl+S" />
        <CommandRow label="Save as" caption="Ctrl+Shift+S" />
      </div>
      {viewAllSelected ? (
        <div data-project-menu-recent role="menu" aria-label="Recent projects" className={panelClass}>
          {projects.map((name) => (
            <ProjectRow key={name} label={name} selected={name === selectedProject} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ProjectMenuPreview() {
  return (
    <main className="flex min-h-screen flex-col items-start gap-brand-scale-24 bg-mapped-surface-page p-brand-scale-24">
      <p className={caption}>Project menu</p>
      <section className="flex flex-col items-start gap-brand-scale-8">
        <p className={caption}>View all selected</p>
        <ProjectMenu projects={specimenProjects} viewAllSelected selectedProject={specimenProjects[0]} />
      </section>
      <section className="flex flex-col items-start gap-brand-scale-8">
        <p className={caption}>View all not selected</p>
        <ProjectMenu projects={specimenProjects} />
      </section>
    </main>
  );
}

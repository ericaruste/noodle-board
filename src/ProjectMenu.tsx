import { useState } from "react";
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

// 220px is the menu width. No spacing token is 220px. TODO token mismatch: 220px
const panelClass =
  "pointer-events-auto grid w-[220px] rounded-alias-border-radius-lg border border-alias-border-width-xsm border-mapped-border-default bg-mapped-surface-default p-brand-scale-4 shadow-lg backdrop-blur-xl";

type RecentEntry = {
  id: string;
  name: string;
};

type ProjectMenuProps = {
  /** Specimen names. Used when `recents` is unset. The main menu shows the first three. */
  projects: string[];
  /** Board recents. An empty array shows no names. Unset keeps `projects`. */
  recents?: RecentEntry[];
  /** View all's selected state. The recent panel is open only while this is set. */
  viewAllSelected?: boolean;
  /** Recent-panel row to paint selected by name. The trial uses this. The copy in the main menu stays unselected. */
  selectedProject?: string;
  /** Recent-panel row to paint selected by id. The copies under View all stay unselected. */
  selectedRecentId?: string | null;
  /** New's shortcut. The trial shows `Ctrl+N`. The board turns it off. */
  showNewCaption?: boolean;
  onNew?: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onOpenRecent?: (id: string) => void;
};

const longProjectName =
  "Noodle Board project title that is long enough to pass the three hundred twenty pixel cap";

const specimenProjects = [
  longProjectName,
  "Project name #2",
  "Project name #3",
  "Project name #4",
  "Project name #5",
  "Project name #6",
];

const caption =
  "font-alias-font-family-body text-responsive-desktop-body-sm-size leading-responsive-desktop-body-sm-line-height-tight text-mapped-text-caption";

const recentLabelClass =
  "flex h-brand-scale-32 items-center whitespace-nowrap px-brand-scale-8 font-alias-font-family-body text-[12px] leading-[1em] text-mapped-text-action";

function CommandRow({
  label,
  caption: shortcut,
  showCaption = true,
  onClick,
}: {
  label: string;
  caption: string;
  showCaption?: boolean;
  onClick?: () => void;
}) {
  return (
    <MenuItem
      label={label}
      caption={shortcut}
      showCaption={showCaption}
      size="md"
      showLeftIcon={false}
      showChevron={false}
      onClick={onClick}
    />
  );
}

function ProjectRow({
  label,
  selected = false,
  indent = false,
  onClick,
}: {
  label: string;
  selected?: boolean;
  indent?: boolean;
  onClick?: () => void;
}) {
  return (
    <MenuItem
      label={label}
      size="md"
      leftIcon={BowlChopsticks}
      showCaption={false}
      showChevron={false}
      indent={indent}
      truncateLabel
      selected={selected}
      onClick={onClick}
    />
  );
}

export function ProjectMenu({
  projects,
  recents,
  viewAllSelected = false,
  selectedProject,
  selectedRecentId = null,
  showNewCaption = true,
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onOpenRecent,
}: ProjectMenuProps) {
  const [recentOpen, setRecentOpen] = useState(viewAllSelected);
  const usingRecents = recents !== undefined;
  const rows: RecentEntry[] = usingRecents
    ? recents
    : projects.map((name, index) => ({ id: `${name}-${index}`, name }));
  const preview = rows.slice(0, 3);
  const openRecent = usingRecents && onOpenRecent ? (id: string) => onOpenRecent(id) : undefined;

  return (
    <div className="pointer-events-none inline-flex items-start gap-brand-scale-4">
      <div data-project-menu role="menu" aria-label="Project" className={panelClass}>
        <CommandRow label="New" caption="Ctrl+N" showCaption={showNewCaption} onClick={onNew} />
        <CommandRow label="Open" caption="Ctrl+O" onClick={onOpen} />
        <MenuItem label="Recent" size="md" showLeftIcon={false} showCaption={false} showChevron={false} disabled />
        <div className="h-brand-scale-1 bg-mapped-border-default" role="separator" />
        <div className="mt-brand-scale-4 mb-brand-scale-4 min-w-0">
          <MenuItem
            label="View all"
            size="md"
            showLeftIcon={false}
            showCaption={false}
            showChevron={false}
            indent
            selected={recentOpen}
            onClick={() => setRecentOpen((open) => !open)}
          />
          {preview.map((row) => (
            <ProjectRow
              key={row.id}
              label={row.name}
              indent
              onClick={openRecent ? () => openRecent(row.id) : undefined}
            />
          ))}
        </div>
        <CommandRow label="Save" caption="Ctrl+S" onClick={onSave} />
        <CommandRow label="Save as" caption="Ctrl+Shift+S" onClick={onSaveAs} />
      </div>
      {recentOpen ? (
        <div data-project-menu-recent role="menu" aria-label="Recent projects" className={panelClass}>
          {rows.length === 0 ? (
            <p className={recentLabelClass}>No recent boards yet.</p>
          ) : (
            rows.map((row) => (
              <ProjectRow
                key={row.id}
                label={row.name}
                selected={usingRecents ? row.id === selectedRecentId : row.name === selectedProject}
                onClick={openRecent ? () => openRecent(row.id) : undefined}
              />
            ))
          )}
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

import { useEffect, useRef, useState } from "react";
import RecentMenu from "./RecentMenu";
import type { RecentProject } from "./recents";

type SaveToolbarProps = {
  documentName: string;
  saving: boolean;
  recents: RecentProject[];
  onNew: () => void;
  onOpen: () => void;
  onOpenRecent: (id: string) => void;
  onRename: (name: string) => void;
  onSave: () => void;
  onSaveAs: () => void;
  onSavePulseIteration: () => void;
};

export default function SaveToolbar({
  documentName,
  saving,
  recents,
  onNew,
  onOpen,
  onOpenRecent,
  onRename,
  onSave,
  onSaveAs,
  onSavePulseIteration,
}: SaveToolbarProps) {
  return (
    <div className="pointer-events-auto flex min-w-0 max-w-full items-center gap-1 rounded-2xl border border-white/50 bg-white/40 p-1.5 shadow-lg backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-1.5 pl-1.5">
        <span
          className={saving ? "save-dot save-dot-active" : "save-dot"}
          data-saving={saving ? "true" : "false"}
          title={saving ? "Saving" : "Saved"}
          aria-hidden="true"
          onAnimationIteration={onSavePulseIteration}
        />
        <ProjectName name={documentName} onRename={onRename} />
      </div>
      <RecentMenu recents={recents} onOpenRecent={onOpenRecent} />
      <button
        type="button"
        onClick={onNew}
        title="New project"
        className="shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        New
      </button>
      <button
        type="button"
        onClick={onOpen}
        title="Open or import a .noodle.json (Ctrl+O)"
        className="shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        Open
      </button>
      <button
        type="button"
        onClick={onSave}
        title="Save (Ctrl+S)"
        className="shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onSaveAs}
        title="Save As (Ctrl+Shift+S)"
        className="shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        Save As
      </button>
    </div>
  );
}

function ProjectName({ name, onRename }: { name: string; onRename: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const skipCommit = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  if (!editing) {
    return (
      <button
        type="button"
        className="min-w-0 max-w-[14rem] truncate rounded-lg px-1.5 py-1 text-left text-sm font-medium text-slate-500 hover:bg-white/50"
        title={name}
        onClick={() => {
          setDraft(name);
          setEditing(true);
        }}
      >
        {name}
      </button>
    );
  }

  const commit = () => {
    if (skipCommit.current) {
      skipCommit.current = false;
      setEditing(false);
      return;
    }
    setEditing(false);
    onRename(draft);
  };

  return (
    <input
      ref={inputRef}
      value={draft}
      aria-label="Project name"
      className="w-36 max-w-full rounded-lg bg-white/80 px-1.5 py-1 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-300"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        } else if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          skipCommit.current = true;
          setDraft(name);
          event.currentTarget.blur();
        }
      }}
    />
  );
}

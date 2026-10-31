type SaveToolbarProps = {
  documentName: string;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
};

export default function SaveToolbar({ documentName, onOpen, onSave, onSaveAs }: SaveToolbarProps) {
  return (
    <div className="pointer-events-auto flex min-w-0 max-w-full items-center gap-1 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-lg backdrop-blur">
      <span
        className="min-w-0 truncate px-2 text-sm font-medium text-slate-500"
        title={documentName}
      >
        {documentName}
      </span>
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

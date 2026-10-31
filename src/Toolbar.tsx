type ToolbarProps = {
  onAddSticky: () => void;
  onAddImage: (file: File) => void;
  onDelete: () => void;
  canDelete: boolean;
  onSave: () => void;
  onSaveAs: () => void;
  documentName: string;
};

export default function Toolbar({
  onAddSticky,
  onAddImage,
  onDelete,
  canDelete,
  onSave,
  onSaveAs,
  documentName,
}: ToolbarProps) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-16 z-20 w-[calc(100%-2rem)] max-w-max -translate-x-1/2 sm:top-4">
      <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={onAddSticky}
          className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-amber-50"
        >
          Add Sticky Note
        </button>
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
        <span className="flex items-center gap-1">
          <span className="mx-0.5 h-6 w-px shrink-0 bg-slate-200" aria-hidden="true" />
          <span className="max-w-[9rem] shrink-0 truncate px-2 text-sm font-medium text-slate-500" title={documentName}>
            {documentName}
          </span>
          <button
            type="button"
            onClick={onSave}
            title="Save (Ctrl+S)"
            className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onSaveAs}
            title="Save As (Ctrl+Shift+S)"
            className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Save As
          </button>
        </span>
      </div>
    </div>
  );
}

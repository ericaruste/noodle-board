type ToolbarProps = {
  onAddSticky: () => void;
  onAddImage: (file: File) => void;
  onDelete: () => void;
  canDelete: boolean;
};

export default function Toolbar({
  onAddSticky,
  onAddImage,
  onDelete,
  canDelete,
}: ToolbarProps) {
  return (
    <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-lg backdrop-blur">
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
    </div>
  );
}

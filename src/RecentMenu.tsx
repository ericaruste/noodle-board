import { useEffect, useRef, useState } from "react";
import { formatRecentTime, type RecentProject } from "./recents";

type RecentMenuProps = {
  recents: RecentProject[];
  onOpenRecent: (id: string) => void;
};

export default function RecentMenu({ recents, onOpenRecent }: RecentMenuProps) {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        title="Recent boards"
        onClick={() => setOpen((current) => !current)}
        className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        Recent
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Recent boards"
          className="absolute left-0 top-full z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {recents.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-500">No recent boards yet.</p>
          ) : (
            recents.map((recent) => {
              const when = recent.unavailable ? "File unavailable" : formatRecentTime(recent.lastOpened, now);
              const title = recent.fileHandle
                ? `Reopen ${recent.name}`
                : `Choose a file to reopen ${recent.name}`;
              return (
                <button
                  key={recent.id}
                  type="button"
                  role="menuitem"
                  title={title}
                  onClick={() => {
                    setOpen(false);
                    onOpenRecent(recent.id);
                  }}
                  className="flex w-full min-w-0 items-baseline justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50"
                >
                  <span
                    className={`min-w-0 truncate text-sm font-medium ${recent.unavailable ? "text-slate-400" : "text-slate-800"}`}
                  >
                    {recent.name}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">{when}</span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

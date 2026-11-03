import { useEffect, useRef, useState } from "react";
import { FloatingPanel, useAnchoredBox } from "./FloatingPanel";
import { formatRecentTime, type RecentProject } from "./recents";

type RecentMenuProps = {
  recents: RecentProject[];
  onOpenRecent: (id: string) => void;
};

export default function RecentMenu({ recents, onOpenRecent }: RecentMenuProps) {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { menuRef, box } = useAnchoredBox(open, buttonRef, "start", 8);

  useEffect(() => {
    if (!open) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-recent-menu]")) return;
      setOpen(false);
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
    <div data-recent-menu="" className="shrink-0">
      <button
        ref={buttonRef}
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
        <FloatingPanel
          layer="dropdown"
          panelRef={menuRef}
          role="menu"
          ariaLabel="Recent boards"
          data-recent-menu=""
          className="w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          style={{
            position: "absolute",
            top: box?.top ?? 0,
            left: box?.left ?? 0,
            visibility: box ? "visible" : "hidden",
          }}
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
        </FloatingPanel>
      ) : null}
    </div>
  );
}

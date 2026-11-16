import type { ShapeKind } from "./shapeData";

export function ShapeKindIcon({ kind, className }: { kind: ShapeKind; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className ?? "size-4 shrink-0"} aria-hidden>
      {kind === "rect" ? (
        <rect x="3" y="5" width="14" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" />
      ) : null}
      {kind === "round-rect" ? (
        <rect x="3" y="5" width="14" height="10" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      ) : null}
      {kind === "ellipse" ? (
        <ellipse cx="10" cy="10" rx="7" ry="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      ) : null}
      {kind === "triangle" ? (
        <polygon points="10,3 17,16 3,16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      ) : null}
      {kind === "diamond" ? (
        <polygon points="10,2 18,10 10,18 2,10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      ) : null}
    </svg>
  );
}

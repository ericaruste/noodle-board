import shapeCircle from "./assets/icons/shape-circle.svg?raw";
import shapeDiamond from "./assets/icons/shape-diamond.svg?raw";
import shapeRoundRectangle from "./assets/icons/shape-round-rectangle.svg?raw";
import shapeSquare from "./assets/icons/shape-square.svg?raw";
import shapeTriangle from "./assets/icons/shape-triangle.svg?raw";
import type { ShapeKind } from "./shapeData";

const SHAPE_ICON_ASSETS: Record<ShapeKind, string> = {
  rect: shapeSquare,
  ellipse: shapeCircle,
  "round-rect": shapeRoundRectangle,
  triangle: shapeTriangle,
  diamond: shapeDiamond,
};

function shapeGlyph(raw: string, className: string) {
  const safeClass = className.replace(/"/g, "");
  return raw
    .replace(/\s(?:width|height)="[^"]*"/g, "")
    .replace(/#303132/g, "currentColor")
    .replace(
      "<svg",
      `<svg class="${safeClass}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"`,
    );
}

export function ShapeKindIcon({ kind, className }: { kind: ShapeKind; className?: string }) {
  const svg = shapeGlyph(SHAPE_ICON_ASSETS[kind], className ?? "size-brand-scale-16 shrink-0");
  return <span className="contents" dangerouslySetInnerHTML={{ __html: svg }} />;
}

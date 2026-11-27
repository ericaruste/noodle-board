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

/** Cropped to the stroked path plus the Lucide margin, so a 16px slot matches a Lucide icon. */
const SHAPE_ICON_VIEW_BOX: Record<ShapeKind, string> = {
  rect: "5.9 5.9 16.2 16.2",
  ellipse: "5.9 5.9 16.2 16.2",
  "round-rect": "5.6 5.9 19.8 16.2",
  triangle: "5.59 5.77 17.82 16.35",
  diamond: "5.82 5.82 16.37 16.37",
};

function shapeGlyph(raw: string, viewBox: string, className: string) {
  const safeClass = className.replace(/"/g, "");
  const svg = raw
    .replace(/\s(?:width|height)="[^"]*"/g, "")
    .replace(/#303132/g, "currentColor")
    .replace(/viewBox="[^"]*"/, `viewBox="${viewBox}"`)
    .replace(
      "<svg",
      `<svg class="${safeClass}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"`,
    );
  return svg;
}

export function ShapeKindIcon({ kind, className }: { kind: ShapeKind; className?: string }) {
  const svg = shapeGlyph(SHAPE_ICON_ASSETS[kind], SHAPE_ICON_VIEW_BOX[kind], className ?? "size-brand-scale-16 shrink-0");
  return <span className="contents" dangerouslySetInnerHTML={{ __html: svg }} />;
}

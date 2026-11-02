export const SHAPE_KINDS = ["rect", "ellipse", "round-rect", "triangle", "diamond"] as const;

export type ShapeKind = (typeof SHAPE_KINDS)[number];

export const SHAPE_LABELS: Record<ShapeKind, string> = {
  rect: "Rectangle",
  ellipse: "Ellipse",
  "round-rect": "Rounded rectangle",
  triangle: "Triangle",
  diamond: "Diamond",
};

export const SHAPE_DEFAULT_WIDTH = 180;
export const SHAPE_DEFAULT_HEIGHT = 140;
export const SHAPE_MIN_SIZE = 48;

/** Visible against the stone canvas, with a dark outline. */
export const DEFAULT_SHAPE_FILL = "#bfdbfe";
export const DEFAULT_SHAPE_STROKE = "#334155";

export const STROKE_WIDTH = 2;

export const FILL_SWATCHES = [
  { name: "White", value: "#ffffff" },
  { name: "Slate", value: "#e2e8f0" },
  { name: "Blue", value: "#bfdbfe" },
  { name: "Yellow", value: "#fef08a" },
  { name: "Green", value: "#bbf7d0" },
  { name: "Pink", value: "#fbcfe8" },
] as const;

export const STROKE_SWATCHES = [
  { name: "Slate", value: "#334155" },
  { name: "Blue", value: "#1d4ed8" },
  { name: "Green", value: "#15803d" },
  { name: "Rose", value: "#be123c" },
  { name: "Amber", value: "#b45309" },
] as const;

export type ShapeData = {
  kind: ShapeKind;
  fill: string | null;
  stroke: string | null;
};

export function isShapeKind(value: unknown): value is ShapeKind {
  return typeof value === "string" && (SHAPE_KINDS as readonly string[]).includes(value);
}

/** A CSS color, or null when that paint is cleared. */
export function isShapeColor(value: unknown): value is string | null {
  return value === null || (typeof value === "string" && value.trim().length > 0);
}

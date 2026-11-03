import type { TextParagraph } from "./textBody";

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

/** Corner radius of a rounded rectangle, matching the painted geometry. */
export function roundRectRadius(width: number, height: number) {
  const inset = STROKE_WIDTH / 2;
  const innerWidth = Math.max(0, width - inset * 2);
  const innerHeight = Math.max(0, height - inset * 2);
  return Math.min(28, innerWidth / 2, innerHeight / 2, width * 0.22, height * 0.22);
}

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
  /** Same paragraph model as text objects. Omitted on shapes saved before text. */
  paragraphs?: TextParagraph[];
  /**
   * Height left by the resize handles. Text can grow the shape past this,
   * and will not shrink it below this. Omitted until the user resizes.
   */
  manualHeight?: number;
};

export type ShapeTextFrame = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Safe band for a label, as fractions of the shape box. The band stays inside the geometry. */
const TEXT_BAND: Partial<Record<ShapeKind, { x: number; y: number; w: number; h: number }>> = {
  ellipse: { x: 0.18, y: 0.18, w: 0.64, h: 0.64 },
  diamond: { x: 0.28, y: 0.28, w: 0.44, h: 0.44 },
  triangle: { x: 0.3, y: 0.46, w: 0.4, h: 0.42 },
};

const TEXT_PAD: Record<"rect" | "round-rect", number> = {
  rect: 14,
  "round-rect": 22,
};

function boxPad(kind: ShapeKind, width: number) {
  const preferred = TEXT_PAD[kind === "round-rect" ? "round-rect" : "rect"];
  return Math.min(preferred, Math.max(8, width * 0.12));
}

export function shapeTextFrame(kind: ShapeKind, width: number, height: number): ShapeTextFrame {
  const band = TEXT_BAND[kind];
  if (band) {
    return {
      left: width * band.x,
      top: height * band.y,
      width: Math.max(1, width * band.w),
      height: Math.max(1, height * band.h),
    };
  }
  const pad = boxPad(kind, width);
  return {
    left: pad,
    top: pad,
    width: Math.max(1, width - pad * 2),
    height: Math.max(1, height - pad * 2),
  };
}

/** Shape height whose safe band matches `textHeight`. */
export function shapeHeightForText(kind: ShapeKind, width: number, textHeight: number): number {
  const content = Math.max(textHeight, 1);
  const band = TEXT_BAND[kind];
  if (band) return content / band.h;
  const pad = boxPad(kind, width);
  return content + pad * 2;
}

export function isShapeKind(value: unknown): value is ShapeKind {
  return typeof value === "string" && (SHAPE_KINDS as readonly string[]).includes(value);
}

/** A CSS color, or null when that paint is cleared. */
export function isShapeColor(value: unknown): value is string | null {
  return value === null || (typeof value === "string" && value.trim().length > 0);
}

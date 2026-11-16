import { swatchHex } from "./ColorSwatch";
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

/** A new shape starts on `alias.swatch.purple.200`. */
export const DEFAULT_SHAPE_FILL = `#${swatchHex("purple", 200)}`;
/** A new shape starts on `alias.swatch.purple.500`. */
export const DEFAULT_SHAPE_STROKE = `#${swatchHex("purple", 500)}`;

export const STROKE_WIDTH = 2;

export const SHAPE_THICKNESS = ["thin", "medium", "thick"] as const;
export type ShapeThickness = (typeof SHAPE_THICKNESS)[number];

export const SHAPE_LINE_STYLES = ["solid", "dashed"] as const;
export type ShapeLineStyle = (typeof SHAPE_LINE_STYLES)[number];

/** Same steps as the noodle stroke. Medium is the 2px stroke shapes already paint. */
const THICKNESS_PX: Record<ShapeThickness, number> = {
  thin: 1.25,
  medium: 2,
  thick: 3.5,
};

export function shapeThicknessPx(thickness: ShapeThickness) {
  return THICKNESS_PX[thickness];
}

export function shapeThickness(data: { thickness?: unknown }): ShapeThickness {
  return data.thickness === "thin" || data.thickness === "thick" ? data.thickness : "medium";
}

export function shapeLineStyle(data: { lineStyle?: unknown }): ShapeLineStyle {
  return data.lineStyle === "dashed" ? "dashed" : "solid";
}

/** 0 to 100. Missing means opaque, so shapes saved before the slider stay solid. */
export function shapeFillOpacity(data: { fillOpacity?: unknown }) {
  if (typeof data.fillOpacity !== "number" || !Number.isFinite(data.fillOpacity)) return 100;
  return Math.min(100, Math.max(0, Math.round(data.fillOpacity)));
}

/** Corner radius of a rounded rectangle, matching the painted geometry. */
export function roundRectRadius(width: number, height: number, strokeWidth = STROKE_WIDTH) {
  const inset = strokeWidth / 2;
  const innerWidth = Math.max(0, width - inset * 2);
  const innerHeight = Math.max(0, height - inset * 2);
  return Math.min(28, innerWidth / 2, innerHeight / 2, width * 0.22, height * 0.22);
}

export type ShapeData = {
  kind: ShapeKind;
  fill: string | null;
  stroke: string | null;
  /** 0 to 100. Omitted on shapes saved before the fill slider. Those stay opaque. */
  fillOpacity?: number;
  /** Omitted until a weight is chosen. Missing means medium, the 2px stroke. */
  thickness?: ShapeThickness;
  /** Omitted until a line type is chosen. Missing means solid. */
  lineStyle?: ShapeLineStyle;
  /** Same paragraph model as text objects. Omitted on shapes saved before text. */
  paragraphs?: TextParagraph[];
  /**
   * Height left by a height drag. Text can grow the shape past this, and will
   * not shrink it below this. Omitted until that drag. Without it, the base
   * height is SHAPE_DEFAULT_HEIGHT. A width-only drag does not set this.
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

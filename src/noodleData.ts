import type { CSSProperties } from "react";
import type { Edge } from "@xyflow/react";

export const NOODLE_SHAPES = ["straight", "elbow", "curve"] as const;
export const NOODLE_LINE_STYLES = ["solid", "dashed"] as const;
export const NOODLE_THICKNESS = ["thin", "medium", "thick"] as const;
export const NOODLE_ARROWS = ["none", "arrow", "open", "triangle", "circle", "diamond"] as const;

export type NoodleShape = (typeof NOODLE_SHAPES)[number];
export type NoodleLineStyle = (typeof NOODLE_LINE_STYLES)[number];
export type NoodleThickness = (typeof NOODLE_THICKNESS)[number];
export type NoodleArrow = (typeof NOODLE_ARROWS)[number];

export type NoodlePoint = { x: number; y: number };

/** Style stored on `edge.data` so a reload draws the same noodle. */
export type NoodleData = {
  color: string;
  lineStyle: NoodleLineStyle;
  thickness: NoodleThickness;
  shape: NoodleShape;
  label: string;
  markerStart: NoodleArrow;
  markerEnd: NoodleArrow;
  /** Interior corners. Empty means the shape's automatic route. */
  bends: NoodlePoint[];
  /** Perpendicular push of a curve's midpoint, in flow units. */
  curveOffset: number;
};

export const NOODLE_COLORS = [
  { name: "Slate", value: "#334155" },
  { name: "Ink", value: "#0f172a" },
  { name: "Blue", value: "#1d4ed8" },
  { name: "Green", value: "#15803d" },
  { name: "Rose", value: "#be123c" },
  { name: "Amber", value: "#b45309" },
  { name: "Violet", value: "#6d28d9" },
] as const;

export const NOODLE_ARROW_LABELS: Record<NoodleArrow, string> = {
  none: "None",
  arrow: "Arrow",
  open: "Open arrow",
  triangle: "Triangle",
  circle: "Circle",
  diamond: "Diamond",
};

const THICKNESS_PX: Record<NoodleThickness, number> = {
  thin: 1.25,
  medium: 2,
  thick: 3.5,
};

const SHAPE_SET = new Set<string>(NOODLE_SHAPES);
const STYLE_SET = new Set<string>(NOODLE_LINE_STYLES);
const THICKNESS_SET = new Set<string>(NOODLE_THICKNESS);
const ARROW_SET = new Set<string>(NOODLE_ARROWS);

export const NOODLE_EDGE_EVENT = "noodle-update-edge";

export function defaultNoodleData(): NoodleData {
  return {
    color: "#334155",
    lineStyle: "solid",
    thickness: "medium",
    shape: "elbow",
    label: "",
    markerStart: "none",
    markerEnd: "arrow",
    bends: [],
    curveOffset: 0,
  };
}

export function thicknessPx(thickness: NoodleThickness) {
  return THICKNESS_PX[thickness];
}

export function noodleStrokeStyle(data: NoodleData): CSSProperties {
  return {
    stroke: data.color,
    strokeWidth: thicknessPx(data.thickness),
    strokeDasharray: data.lineStyle === "dashed" ? "8 6" : undefined,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function oneOf<T extends string>(value: unknown, allowed: Set<string>, fallback: T): T {
  return typeof value === "string" && allowed.has(value) ? (value as T) : fallback;
}

function readBends(value: unknown): NoodlePoint[] {
  if (!Array.isArray(value)) return [];
  const points: NoodlePoint[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    if (typeof item.x !== "number" || typeof item.y !== "number") continue;
    if (!Number.isFinite(item.x) || !Number.isFinite(item.y)) continue;
    points.push({ x: item.x, y: item.y });
    if (points.length >= 32) break;
  }
  return points;
}

export function readNoodle(data: unknown): NoodleData {
  const record = isRecord(data) ? data : {};
  const color = typeof record.color === "string" && /^#[0-9a-fA-F]{6}$/.test(record.color) ? record.color : "#334155";
  const curveOffset =
    typeof record.curveOffset === "number" && Number.isFinite(record.curveOffset) ? record.curveOffset : 0;
  const label = typeof record.label === "string" ? record.label.slice(0, 160) : "";
  return {
    color,
    lineStyle: oneOf(record.lineStyle, STYLE_SET, "solid"),
    thickness: oneOf(record.thickness, THICKNESS_SET, "medium"),
    shape: oneOf(record.shape, SHAPE_SET, "elbow"),
    label,
    markerStart: oneOf(record.markerStart, ARROW_SET, "none"),
    markerEnd: oneOf(record.markerEnd, ARROW_SET, "arrow"),
    bends: readBends(record.bends),
    curveOffset,
  };
}

export function sameNoodle(a: NoodleData, b: NoodleData) {
  if (
    a.color !== b.color ||
    a.lineStyle !== b.lineStyle ||
    a.thickness !== b.thickness ||
    a.shape !== b.shape ||
    a.label !== b.label ||
    a.markerStart !== b.markerStart ||
    a.markerEnd !== b.markerEnd ||
    a.curveOffset !== b.curveOffset ||
    a.bends.length !== b.bends.length
  ) {
    return false;
  }
  return a.bends.every((point, index) => point.x === b.bends[index].x && point.y === b.bends[index].y);
}

export function applyNoodleData(edge: Edge, data: NoodleData): Edge {
  const next: Edge = {
    ...edge,
    data,
    style: { ...edge.style, ...noodleStrokeStyle(data) },
    label: data.label.trim() ? data.label : undefined,
  };
  delete next.markerStart;
  delete next.markerEnd;
  return next;
}

export function publishNoodle(id: string, data: NoodleData) {
  window.dispatchEvent(new CustomEvent(NOODLE_EDGE_EVENT, { detail: { id, data } }));
}

export function snapshotBoard() {
  window.dispatchEvent(new Event("noodle-snapshot"));
}

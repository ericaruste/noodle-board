import type { ShapeKind } from "./shapeData";
import { SHAPE_DEFAULT_HEIGHT, SHAPE_DEFAULT_WIDTH } from "./shapeData";
import type { StickyColor } from "./StickyNode";

export const STICKY_PLACE_WIDTH = 180;
export const STICKY_PLACE_HEIGHT = 180;
export const TEXT_PLACE_WIDTH = 220;
/** Empty text body: 1.5rem min height of the text frame. */
export const TEXT_PLACE_HEIGHT = 24;

export type Placement =
  | { kind: "sticky"; color: StickyColor }
  | { kind: "text" }
  | { kind: "shape"; shape: ShapeKind }
  | { kind: "image"; src: string; width: number; height: number };

export type PlacementKind = Placement["kind"];

export function placementSize(placement: Placement): { width: number; height: number } {
  switch (placement.kind) {
    case "sticky":
      return { width: STICKY_PLACE_WIDTH, height: STICKY_PLACE_HEIGHT };
    case "text":
      return { width: TEXT_PLACE_WIDTH, height: TEXT_PLACE_HEIGHT };
    case "shape":
      return { width: SHAPE_DEFAULT_WIDTH, height: SHAPE_DEFAULT_HEIGHT };
    case "image":
      return { width: placement.width, height: placement.height };
  }
}

/** Same rounding a dragged node uses for `snapGrid`. */
export function snapFlowPoint(
  point: { x: number; y: number },
  snapToGrid: boolean,
  snapGrid: readonly [number, number] | undefined,
) {
  if (!snapToGrid || !snapGrid) return point;
  const [gx, gy] = snapGrid;
  if (!(gx > 0) || !(gy > 0)) return point;
  return {
    x: gx * Math.round(point.x / gx),
    y: gy * Math.round(point.y / gy),
  };
}

const CHROME =
  "[data-floating-panel], [data-canvas-chrome], [data-shapes-menu], .react-flow__minimap, .react-flow__controls, .react-flow__panel, [role='alert']";

/** Pane and board objects. Toolbars, menus, the title, and the minimap are not a placement surface. */
export function isCanvasPlacementTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  if (target.closest(CHROME)) return false;
  return Boolean(target.closest(".react-flow"));
}

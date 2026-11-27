# Shape text layout

How board shapes are drawn, and how the label sits inside each one. Code names: `rect` (Rectangle; a square only when width equals height), `ellipse` (Ellipse; a circle only when width equals height), `round-rect`, `triangle`, and `diamond`.

Paint lives in `ShapeGeometry` in `src/ShapeNode.tsx`. The label frame is `shapeTextFrame` in `src/shapeData.ts`. Toolbar icons in `src/shapeKindIcon.tsx` are the files in `src/assets/icons` and are not the board shapes.

## How each shape is drawn

Every kind is an SVG element. The stroke is inset by half its width so it stays inside the node box. There is no `border-radius`, no rotated div, and no CSS clip on the paint.

| Kind | Element | Geometry |
| --- | --- | --- |
| `rect` | SVG `<rect>` | `rx` / `ry` = 8 |
| `round-rect` | SVG `<rect>` | `rx` / `ry` from `roundRectRadius` |
| `ellipse` | SVG `<ellipse>` | Radii are half the box minus the stroke inset |
| `triangle` | SVG `<path>` | Apex at top center, base along the bottom, pulled inward by the same inset, then an 8px fillet on each vertex |
| `diamond` | SVG `<path>` | Vertices at the midpoints of the four sides, pulled inward the same way, then an 8px fillet on each vertex |

The inset scales every vertex toward the box center by `(size - strokeWidth) / size`. The diamond and triangle then round those vertices by 8px. Their hit clips stay the sharp polygons.

The rounded-rectangle radius is capped in pixels and by half the inner box:

```ts
export function roundRectRadius(width: number, height: number, strokeWidth = STROKE_WIDTH) {
  const inset = strokeWidth / 2;
  const innerWidth = Math.max(0, width - inset * 2);
  const innerHeight = Math.max(0, height - inset * 2);
  return Math.min(56, innerWidth / 2, innerHeight / 2);
}
```

A `clip-path` exists only on the hit target, `.noodle-shape-hit`. That element is a sibling of the SVG and of the text. It does not clip the paint or the label. `rect` uses `none`.

| Kind | Hit clip |
| --- | --- |
| `rect` | `none` |
| `ellipse` | `ellipse(50% 50% at 50% 50%)` |
| `round-rect` | `inset(0 round ${radius}px)` |
| `triangle` | `polygon(50% 0%, 100% 100%, 0% 100%)` |
| `diamond` | `polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)` |

## Where the text lives

The text is not a child of the SVG, and it is not inside the clipped hit div. Under the node root:

1. `<svg>` with `ShapeGeometry` (paint)
2. `.noodle-shape-hit` with the `clipPath` (pointer target only)
3. `.noodle-shape-text` (the label), absolutely positioned from `shapeTextFrame`
4. `.noodle-shape-text-measure` wrapping `RichText`

`.noodle-shape-text` has `overflow: hidden`, so the label clips to its own rectangle, not to the shape outline.

## Padding, inset, and alignment

There is no CSS padding on the text. The inset is the frame’s `left`, `top`, `width`, and `height`.

```ts
const TEXT_BAND = {
  ellipse: { x: 0.18, y: 0.18, w: 0.64, h: 0.64 },
  diamond: { x: 0.28, y: 0.28, w: 0.44, h: 0.44 },
  triangle: { x: 0.3, y: 0.46, w: 0.4, h: 0.42 },
};

const TEXT_PAD = {
  rect: 12,
  "round-rect": 24,
};

function boxPad(kind, width, height) {
  const preferred = TEXT_PAD[kind === "round-rect" ? "round-rect" : "rect"];
  return Math.min(preferred, Math.max(8, Math.min(width, height) * 0.2));
}
```

For `ellipse`, `diamond`, and `triangle`, the frame is a fraction of the box (`left = width * x`, `top = height * y`, and the same for width and height). There is no extra pixel padding inside those bands. For `rect` and `round-rect`, `boxPad` runs and the same pixel value is used on every side: `left` and `top` are `pad`, and the frame size is `box - 2 * pad`.

That pad is `min(preferred, max(8, min(width, height) * 0.2))`. Preferred is 12px for `rect` and 24px for `round-rect`. The 8px floor wins on a short box. The 12px or 24px cap wins once 20% of the shorter side exceeds that cap. At the default 140×140 rectangle, 20% of the shorter side is 28px, so the pad is 12px. At the default 180×140 rounded rectangle, 20% of 140 is 28px, so the pad is 24px.

Vertical alignment is the same for every kind: `.noodle-shape-text` is `display: flex; align-items: center`, so the measured block sits in the vertical middle of the frame. Horizontal alignment is the paragraph’s own `text-align` (default left via `noodle-align-left`). No shape forces center.

| Kind | Inset |
| --- | --- |
| `ellipse` | 18% on every side; the frame is 64% by 64% |
| `diamond` | 28% on every side; the frame is 44% by 44% |
| `triangle` | 30% left, 46% top, 30% right (`1 - 0.3 - 0.4`), 12% bottom (`1 - 0.46 - 0.42`); the frame is 40% by 42% |
| `rect` | `pad` px on every side, preferred 12 |
| `round-rect` | `pad` px on every side, preferred 24 |

## Pixels versus percentages

Percentages (fractions of the node box):

- Ellipse, diamond, and triangle text frames: `0.18`, `0.28`, `0.30`, `0.46`, `0.64`, `0.44`, `0.40`, `0.42`
- Rectangle and rounded-rectangle pad scale term: `min(width, height) * 0.2`
- Rounded-rectangle radius: half the inner box, capped at 56px
- Hit clips for ellipse, triangle, and diamond: `50%` / `100%` polygons and `ellipse(50% 50%)`

Hardcoded pixels:

- Text pad preferred: 12 (`rect`), 24 (`round-rect`)
- Text pad floor: 8
- Rectangle, diamond, and triangle corner radius: 8
- Rounded-rectangle corner-radius cap: 56
- Default stroke: 2; thickness steps 1.25 / 2 / 3.5 in `src/shapeData.ts`
- Stroke inset is half of that thickness, in px
- Round-rect hit clip radius is that computed px value (`inset(0 round ${radius}px)`)
- Dashed stroke pattern `"8 6"` in `ShapeNode`

## Summary

| Shape | Drawing method | Text padding | Inconsistencies |
| --- | --- | --- | --- |
| Rectangle (`rect`) | SVG `<rect>`, 8px corners, stroke inset by half the stroke width. Default 140×140 | `pad` px on all four sides. `pad = min(12, max(8, min(width, height) × 0.2))`. No CSS padding on the band. Vertically centered in that frame; horizontal align follows the paragraph (default left) | Pixel pad from the shorter side, then copied onto every side. The ellipse, diamond, and triangle use a fraction of both axes |
| Rounded rectangle (`round-rect`) | SVG `<rect>` with `rx` / `ry` = `min(56, half the inner box)`. Default 180×140 | Same formula with a 24px cap instead of 12 | At the default 180×140 the radius is 56px and the pad is 24px |
| Circle (`ellipse`) | SVG `<ellipse>`. A circle only when width equals height. Default 140×140 | 18% inset on every side (frame is 64% × 64%). No extra pixel padding | Fixed fraction of the box, not a rectangle inscribed in the ellipse. Hit clip is the full ellipse; the painted ellipse is smaller by the stroke inset. Text is not clipped to either |
| Diamond (`diamond`) | SVG path from the four mid-side vertices, scaled toward center, with an 8px fillet. Default 140×140. Not a rotated div | 28% inset on every side (frame is 44% × 44%). No extra pixel padding | Symmetric band, unlike the triangle. Hit clip stays the sharp diamond; paint is inset and rounded; text is a separate rectangle and is not clipped to the polygon |
| Triangle (`triangle`) | SVG path, apex top center, base on the bottom edge, scaled toward center, with an 8px fillet. Default 160×140. Not rotated | 30% left, 46% top, 30% right, 12% bottom (frame is 40% × 42%). No extra pixel padding | The only asymmetric band: top inset is much larger than the bottom. Horizontally centered, vertically biased toward the base. Hit clip stays the sharp triangle |

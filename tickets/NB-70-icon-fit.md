---
id: NB-70
title: Icon fit
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id: ERI-86
linear_url: https://linear.app/ericar/issue/ERI-86/icon-fit
---

## Context

[`ShapeKindIcon`](../src/shapeKindIcon.tsx) loads the five files in `src/assets/icons`. The button slot is 16px, `brand.scale.16`. Each file’s path sits in the middle of a larger view box, so the drawn shape is about 7px. A Lucide icon in that same slot is about 12–13px, because Lucide draws in the inner 20 of a 24 box.

[`line-weight-menu.svg`](../src/assets/icons/line-weight-menu.svg) is 20 by 20. The bars run from 4.5 to 15.5 and from 5.1 to 14.9. The file sets no stroke width, so the stroke stays at 1. The shape files use a stroke of 1.5. The same number on the smaller line-weight box would paint heavier.

The shape swatch, the shape toolbar, and the noodle toolbar are the places those glyphs appear. The live callers keep the file view boxes.

## Problem

The shape glyphs and the line-weight glyph look small next to Lucide, and the line-weight stroke does not match the shape stroke. The comparison belongs on a trial, on the toolbars those icons already use.

## Repro

1. Open `?trial=icon-fit`.
2. Compare the Lucide row, the shape icons as drawn, the cropped shape icons, and the line-weight row.
3. Scroll to the toolbars and open the shape-swap menu.

## Acceptance criteria

- [x] The trial is `?trial=icon-fit` and `#icon-fit`
- [x] The five shape icons show as drawn and cropped to the Lucide box
- [x] The line-weight stroke paints at the same weight as the shape stroke: 1.07 in the 20 box and 1.33 in the cropped box
- [x] Those glyphs show on the shape swatch, the shape toolbar, and the noodle toolbar
- [x] The live board icons stay unchanged

## Technical notes

The trial is [`src/IconFitPreview.tsx`](../src/IconFitPreview.tsx). It imports each file with `?raw`, drops the root width and height, and replaces `#303132` with `currentColor`. The cropped view box pads the stroked ink by the Lucide margin, 2 units for every 20 units of artwork. Wider files stay wider. `preserveAspectRatio` stays `xMidYMid meet`.

The shape stroke is 1.5. On the line-weight icon that painted weight is 1.07 in the original 20 box and 1.33 in the cropped box.

[`ShapeSwatch`](../src/ShapeSwatch.tsx) takes an optional `icons` render. [`ShapeToolbar`](../src/ShapeToolbar.tsx) takes optional `kindIcons` and `lineWeightIcon`. [`NoodleToolbar`](../src/NoodleToolbar.tsx) takes an optional `lineWeightIcon`. The board omits them. The trial passes the as-drawn set and the cropped set, each on the swatch, the shape toolbar, and the noodle toolbar. The trial page includes `FloatingLayer`, so an open menu uses the dropdown slot.

The shape swatch, the shape toolbar, and the noodle toolbar sections in [`docs/design-system-notes.md`](../docs/design-system-notes.md) name those optional icons. Applying the crop to the live icons stays in Still to update.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

## Out of scope

Replacing the live icons. Editing the SVG files. The Lucide `Shapes` glyph on the main toolbar. The type-thin, type-medium, and type-thick icons. Kind order. Swatch layout and tokens. Shadows, frosted glass, and the dot grid.

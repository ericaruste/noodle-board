---
id: NB-71
title: Live icon fit
status: In Progress
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id: ERI-87
linear_url: https://linear.app/ericar/issue/ERI-87/live-icon-fit
---

## Context

[`ShapeKindIcon`](../src/shapeKindIcon.tsx) loads the five files in `src/assets/icons`. The button slot is 16px, `brand.scale.16`. Each path sits in the middle of a larger view box, so the drawn shape is about 7px. A Lucide icon in that same slot is about 12–13px, because Lucide draws in the inner 20 of a 24 box.

[`LineWeightMenuIcon`](../src/noodleIcons.tsx) loads `src/assets/icons/line-weight-menu.svg`. The file is 20 by 20 and sets no stroke width. The shape files use a stroke of 1.5.

[NB-70](NB-70-icon-fit.md) crops those files on the trial at `?trial=icon-fit` and scales the line-weight stroke so it paints like the shape stroke. The shape swatch, the shape toolbar, and the noodle toolbar take optional icon props. The board omits them, so the live glyphs are the defaults in `ShapeKindIcon` and `LineWeightMenuIcon`. Those defaults still use the file view boxes.

## Problem

The shape swatch, the shape toolbar, and the noodle toolbar still draw the small glyphs. The trial crop never reached the icons the board actually uses.

## Repro

1. Open the board.
2. Open the Shapes menu on the bottom toolbar.
3. Select a shape and look at the shape-swap icon and the line-weight icon.

## Acceptance criteria

- [x] `ShapeKindIcon` crops each kind to the Lucide-margin view box, and wider files stay wider
- [x] `LineWeightMenuIcon` uses that crop and a stroke of 1.33, so it paints like the shape stroke of 1.5
- [x] The shape swatch, the shape toolbar, and the noodle toolbar draw those defaults
- [x] The icon-fit trial still shows the uncropped files beside the cropped ones

## Technical notes

The crop pads the stroked ink by the Lucide margin, 2 units for every 20 units of artwork. `preserveAspectRatio` stays `xMidYMid meet`.

View boxes:

- Rectangle and ellipse: `5.9 5.9 16.2 16.2`
- Rounded rectangle: `5.6 5.9 19.8 16.2`
- Triangle: `5.59 5.77 17.82 16.35`
- Diamond: `5.82 5.82 16.37 16.37`
- Line weight: `2.8 3.52 14.4 12.96`, with `stroke-width` 1.33

`assetIcon` takes an optional view box and stroke width. The other noodle icons pass neither. The SVG files stay as they are.

The shape swatch, the shape toolbar, and the noodle toolbar sections in [`docs/design-system-notes.md`](../docs/design-system-notes.md) describe the crop. The decision sits under Decisions already made. The trial comment in [`src/IconFitPreview.tsx`](../src/IconFitPreview.tsx) says the live icons use the same boxes.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

## Out of scope

Editing the SVG files. The Lucide `Shapes` glyph on the main toolbar. The type-thin, type-medium, and type-thick icons. Kind order. Swatch layout and tokens. Shadows, frosted glass, and the dot grid. Changing the trial comparison from NB-70.

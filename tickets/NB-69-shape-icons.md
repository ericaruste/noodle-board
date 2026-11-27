---
id: NB-69
title: Shape icons
status: In Progress
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id: ERI-85
linear_url: https://linear.app/ericar/issue/ERI-85/shape-icons
---

## Context

The five shape kinds are [`SHAPE_KINDS`](../src/shapeData.ts): rectangle, ellipse, rounded rectangle, triangle, and diamond.

[`ShapeKindIcon`](../src/shapeKindIcon.tsx) draws each kind as its own path in a 20 by 20 view box. [`ShapeSwatch`](../src/ShapeSwatch.tsx) uses that icon for every button in the row. [`ShapeToolbar`](../src/ShapeToolbar.tsx) uses it on the shape-swap button, and shows a diamond when the selection is mixed. [`ShapeNode`](../src/ShapeNode.tsx) re-exports the same component.

The glyphs to use are:

- `rect` — [`src/assets/icons/shape-square.svg`](../src/assets/icons/shape-square.svg), view box 28 by 28
- `ellipse` — [`src/assets/icons/shape-circle.svg`](../src/assets/icons/shape-circle.svg), view box 28 by 28
- `round-rect` — [`src/assets/icons/shape-round-rectangle.svg`](../src/assets/icons/shape-round-rectangle.svg), view box 31 by 28
- `triangle` — [`src/assets/icons/shape-triangle.svg`](../src/assets/icons/shape-triangle.svg), view box 29 by 28
- `diamond` — [`src/assets/icons/shape-diamond.svg`](../src/assets/icons/shape-diamond.svg), view box 28 by 28

Each file is a stroked path. The stroke is `#303132` at 1.5. The contextual button paints its icon at 16px (`brand.scale.16`) and sets the color with `mapped.icon.action`, `mapped.icon.action-hover`, and `mapped.icon.action-selected`.

## Problem

The shape swatch and the shape-swap button draw their own icons. They should use the five shape assets.

## Repro

1. Select a shape and open its shape-swap menu, or open Shapes on the bottom toolbar.
2. The five icons are the paths in `ShapeKindIcon`, not the files in `src/assets/icons`.

## Acceptance criteria

- [x] Rectangle uses `src/assets/icons/shape-square.svg`
- [x] Ellipse uses `src/assets/icons/shape-circle.svg`
- [x] Rounded rectangle uses `src/assets/icons/shape-round-rectangle.svg`
- [x] Triangle uses `src/assets/icons/shape-triangle.svg`
- [x] Diamond uses `src/assets/icons/shape-diamond.svg`
- [x] Those glyphs show in the shape swatch and on the shape toolbar’s shape-swap button
- [x] The stroke follows the button icon color for default, hover, and selected

## Technical notes

Keep `ShapeKindIcon` and its props. Stop drawing the 20 by 20 paths. Load each asset the way [`src/noodleIcons.tsx`](../src/noodleIcons.tsx) loads a noodle icon: import the file with `?raw`, drop the root `width` and `height`, and replace `#303132` with `currentColor`. The button already passes `size-brand-scale-16` and the icon color class.

Square, circle, and diamond are square. Triangle is 29 by 28 and the rounded rectangle is 31 by 28. Keep each file’s view box. Fit the glyph in the 16px slot so the wider assets are not squashed into a square.

`ShapeSwatch` and `ShapeToolbar` already call `ShapeKindIcon`. They do not need a new menu. The re-export on `ShapeNode` can keep pointing at the same function. A mixed selection still shows a diamond on the closed shape-swap button.

Update the Shape swatch section in [`docs/design-system-notes.md`](../docs/design-system-notes.md) so it names these five files. The token table stays. The icon colors are already `mapped.icon.*`.

The shape swatch and the shape toolbar menu already use FloatingPanel. This ticket adds no panel.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

## Out of scope

The Lucide `Shapes` glyph on the main toolbar. The painted geometry in `ShapeNode`. Kind order. Swatch layout and tokens. Stroke, fill, and opacity. Shadows, frosted glass, and the dot grid.

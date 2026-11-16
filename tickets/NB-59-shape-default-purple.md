---
id: NB-59
title: Start new shapes on purple
status: Done
priority: 3
labels: [Feature, UX, Canvas]
parent: NB-E6
blockedBy: [NB-56]
estimate: 2
linear_id: ERI-74
linear_url: https://linear.app/ericar/issue/ERI-74/start-new-shapes-on-purple
---

## Context

A new shape takes its paint from [`DEFAULT_SHAPE_FILL`](../src/shapeData.ts) and [`DEFAULT_SHAPE_STROKE`](../src/shapeData.ts). Those are the MVP colors: fill `#bfdbfe`, stroke `#334155`. [`src/App.tsx`](../src/App.tsx) writes them when a shape is placed. [`ShapePreview`](../src/ShapeNode.tsx) uses the same pair, so the placement ghost does too.

The shape toolbar paints fill and stroke from one step-200 grid in [`src/ShapeToolbar.tsx`](../src/ShapeToolbar.tsx). Fill stays on that step. Stroke is `alias.swatch` step 500, the same step a noodle uses. A new sticky already starts on `alias.swatch.purple.200` (`#EBCFFF`). `alias.swatch.purple.500` is `#BF66FF`.

## Problem

A new shape still arrives in the MVP blue, with a dark stroke. The fill should start on purple 200, and the stroke on purple 500.

## Repro

1. Choose Rectangle, Ellipse, Rounded rectangle, Triangle, or Diamond, and click the canvas.
2. The ghost and the new shape are light blue with a dark stroke.
3. Select the shape. Fill and Stroke do not show the purple disc selected.

## Acceptance criteria

- [x] A new shape’s fill is `alias.swatch.purple.200` (`#EBCFFF`)
- [x] A new shape’s stroke is `alias.swatch.purple.500` (`#BF66FF`)
- [x] The placement ghost uses that fill and stroke for all five kinds
- [x] Fill opens the step-200 grid. Choosing purple there writes `#EBCFFF` and selects the purple disc
- [x] Stroke opens the step-500 grid. Choosing purple there writes `#BF66FF` and selects the purple disc
- [x] A shape already saved keeps its fill and stroke, including `#bfdbfe` and `#334155`
- [x] Clearing fill or stroke still clears only that paint
- [x] The shape toolbar section in [`docs/design-system-notes.md`](../docs/design-system-notes.md) records the purple 200 fill, the purple 500 stroke, and the two grids

## Technical notes

Prefer the `alias.swatch` tokens over `brand.purple`. Fill is `alias.swatch.purple.200`. Stroke is `alias.swatch.purple.500`.

[`ShapeColorMenu`](../src/ShapeToolbar.tsx) takes one `SHAPE_SWATCH_SCALE` of 200 for both paints. Fill keeps 200. Stroke needs its own scale of 500, the way [`NOODLE_SWATCH_SCALE`](../src/NoodleToolbar.tsx) does, so a purple 500 stroke selects the purple disc instead of custom.

`DEFAULT_SHAPE_FILL` and `DEFAULT_SHAPE_STROKE` are the defaults for a new shape. Placement and `ShapePreview` already read them. Do not rewrite paint on shapes loaded from a file.

This ticket adds no toolbar, dropdown, or popover. The stroke menu is the color picker that already opens from the shape toolbar.

## Out of scope

Noodle color. Sticky color. The fill grid stays step 200. A second default for shapes saved before this ticket.

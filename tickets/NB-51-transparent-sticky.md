---
id: NB-51
title: Transparent sticky
status: In Progress
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 3
linear_id: ERI-66
linear_url: https://linear.app/ericar/issue/ERI-66/transparent-sticky
---

## Context

A selected sticky uses [`ColorPickerToolbar`](../src/ColorPickerToolbar.tsx) at step 200. The first disc is the none swatch. Choosing it stores `paint: { kind: "none" }` and [`stickyFill`](../src/StickyNode.tsx) returns `transparent`.

A new sticky picks a random legacy color (`yellow`, `pink`, `blue`, or `green`) in [`beginSticky`](../src/App.tsx) and stores that as a step-200 swatch through `legacyStickyPaint`.

`alias.swatch.neutral.200` is `alias.warm-neutral.100` (`#FDFBF7`) at 60%. `alias.swatch.purple.200` is `#EBCFFF`.

## Problem

The sticky swatch still offers none. The transparent note should be the neutral 200 swatch with the frost blur, and a new sticky should start on purple.

## Repro

1. Add a sticky. Its fill is one of the four legacy colors, not purple.
2. Select it and open the color toolbar. The first disc is none.
3. Choose none. The note turns clear, with no frost.

## Acceptance criteria

- [x] The sticky toolbar does not offer the none swatch. That disc is `alias.swatch.neutral.200` (`#FDFBF7` at 60%)
- [x] Choosing that disc paints a transparent sticky: the 60% fill plus the existing 24px frost blur. Blur is `not a token`
- [x] A new sticky starts on purple, `alias.swatch.purple.200` (`#EBCFFF`). The purple disc is selected
- [x] A note saved with another swatch, a custom color, or none keeps that paint when the file opens
- [x] The toolbar and the picker stay above a selected note and a note that is mid-drag

## Technical notes

The leading disc is chosen by the caller. Sticky passes neutral at step 200. The color picker trial can keep none until a caller replaces it. Noodle stroke color is NB-52 and uses step 500.

The frost is the same 24px blur already on the toolbars. Do not add a blur token. The fill is the generated `color-mix` for `alias.swatch.neutral.200`: `alias.warm-neutral.100` (`#FDFBF7`) at 60%. `alias.swatch.neutral` does not use `brand.neutral`. `brand.neutral.200` and `brand.neutral.500` are both `#5B4BDB`, and no alias swatch references them.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

## Out of scope

Noodle color, shape fill, and shape stroke. Changing `brand.neutral`. A new blur token.

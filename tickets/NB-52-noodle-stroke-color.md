---
id: NB-52
title: Noodle stroke color
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 3
linear_id: ERI-67
linear_url: https://linear.app/ericar/issue/ERI-67/noodle-stroke-color
---

## Context

The noodle toolbar color control in [`NoodleToolbar`](../src/NoodleToolbar.tsx) opens eight `alias.swatch` step-500 discs. It does not open [`ColorPickerToolbar`](../src/ColorPickerToolbar.tsx). A noodle that is not one of those swatches keeps its color on the disc until a swatch is chosen.

[`defaultNoodleData`](../src/noodleData.ts) sets the stroke to `#334155`. The connect preview uses that same hex.

`alias.swatch.neutral.500` is `alias.cool-neutral.900` (`#303132`).

## Problem

Noodle color cannot be a custom color, and the default stroke is not neutral 500. The control should be the color picker toolbar, the same way a sticky picks its fill.

## Repro

1. Draw a noodle. The stroke is `#334155`.
2. Select it and open the color control. The menu is eight discs. There is no custom swatch and no picker.
3. There is no neutral 500 disc.

## Acceptance criteria

- [x] The noodle color control is the color picker toolbar at step 500, with the same custom, hex, copy, and pipette behavior as the sticky toolbar
- [x] The toolbar does not offer the none swatch. That disc is `alias.swatch.neutral.500` (`#303132`)
- [x] A new noodle starts on that neutral 500 color, including the connect preview
- [x] Choosing custom opens the picker beside the toolbar and does not move the toolbar
- [x] A noodle saved with another color keeps that color when the file opens
- [x] The toolbar and the picker stay above a selected noodle and a noodle that is mid-drag

## Technical notes

Fill and sticky notes use step 200. Stroke and noodles use step 500. The leading disc is chosen by the caller. This toolbar passes neutral at step 500. NB-51 passes neutral at step 200 for the sticky. The color picker trial can keep none until a caller replaces it.

The default hex is `alias.swatch.neutral.500`, which is `alias.cool-neutral.900` (`#303132`). `alias.swatch.neutral` does not use `brand.neutral`. `brand.neutral.200` and `brand.neutral.500` are both `#5B4BDB`, and no alias swatch references them.

The picker is its own panel, `brand.scale.100` (4px) from the toolbar’s outer edge, top aligned. It sits on the right when that side fits, and on the left when the toolbar is against the right edge. Both panels use FloatingPanel through the selection chrome. This control adds no z-index of its own.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

## Out of scope

Shape fill and shape stroke. The transparent sticky in NB-51. Changing `brand.neutral`.

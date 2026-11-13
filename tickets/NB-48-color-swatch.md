---
id: NB-48
title: Color swatch
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id: ERI-63
linear_url: https://linear.app/ericar/issue/ERI-63/color-swatch
---

## Context

Building block for a color choice. Figma component `color-swatch`, on the spec frame titled `color-swatch`, node `193:3525`.

The disc is 28px. Types are none, color, and custom. States are default, hover, and selected. Hover and selected draw an action ring outside the disc.

[`src/ColorSwatch.tsx`](../src/ColorSwatch.tsx) is the component. `?trial=color-swatch` shows the states and a live row without changing the board.

## Problem

Fill, stroke, and sticky-note color will be chosen from a color toolbar later. That toolbar needs a swatch first. The custom type is the preview for a color picker that is not built yet.

## Repro

1. Open `?trial=color-swatch`.
2. Compare none, color, and custom, in default, hover, and selected, with Figma component `color-swatch`.
3. Click a fill swatch, a stroke swatch, and the custom swatch. Each selection stays on its own row. The disc border does not change width.

## Acceptance criteria

- [x] The disc uses semantic tokens for fill, stroke, spacing, and the action ring color
- [x] The disc is 28px
- [x] None draws a slash. Color fills the disc. Custom draws a gradient with the chosen color on top
- [x] Hover and selected draw the action ring as a stroke outside the disc
- [x] The disc border stays the same width when the ring is on
- [x] The live board is unchanged when the trial page is absent

## Technical notes

Figma draws the action ring as a drop shadow. A second stroke in that file changes the disc border, so the ring could not be a stroke there. CSS outline is a stroke outside the border box and does not change the disc border. The disc border is an inset stroke, `mapped.border.control` at `alias.border-width.xsm`.

The ring color is `mapped.border.action-ring` on hover and `mapped.border.action-ring-focus` when selected. The frame measures 3px. Hover and selected use 4px, `alias.border-width.md`.

The custom wheel is the Figma angular gradient. It is not a token. Stops: 0% `#F43F5E`, 14% `#F59E0B`, 29% `#EAB308`, 43% `#22C55E`, 57% `#06B6D4`, 71% `#6366F1`, 86% `#D946EF`, 100% `#F43F5E`. 0% sits at the left. The white gap and the preview circle use spacing tokens. The Figma specimen paints purple on both the color type and the custom preview. Those are not linked.

Color type reads `alias.swatch`. Fill and sticky notes use step 200. Stroke and noodles use step 500. Custom can be selected on its own. Its color will come from react-colorful. The picker is not part of this ticket.

The spec sheet around the component (state names, the red size notes, the dashed frame, the title, and the description) is documentation. It is not part of the component.

This swatch is not a toolbar or popover. The color toolbar that places it later uses FloatingPanel and the z-index tokens in `src/layers.ts`.

## Out of scope

The color toolbar, the color picker, and the eyedropper. Wiring the swatch into fill, stroke, sticky, or noodle chrome. Shadows, frosted glass, and the dot grid. A disabled state: the frame does not paint one.

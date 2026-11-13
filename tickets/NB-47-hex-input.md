---
id: NB-47
title: Hex input
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id: ERI-62
linear_url: https://linear.app/ericar/issue/ERI-62/hex-input
---

## Context

Building block for a hex color field. Figma component `input/hex`, on the spec frame titled `input`.

The field is 108 by 28. It has two labels. `#` stays put. The hex label is what the user pastes or edits. States are default, hover, and focus.

[`src/HexInput.tsx`](../src/HexInput.tsx) is the component. `?trial=hex-input` shows the states and a live field without changing the board.

## Problem

Fill, stroke, and sticky-note color will be chosen from a color toolbar later. That toolbar needs a hex field first.

## Repro

1. Open `?trial=hex-input`.
2. Compare default, hover, and focus with Figma component `input/hex`.
3. Type and paste a hex code in the live field. The `#` stays. The code updates.

## Acceptance criteria

- [x] The field uses semantic tokens for fill, text, stroke, spacing, and corner radius
- [x] The box is 108 by 28, with 8px padding, a 4px gap, and an 8px corner
- [x] `#` does not change
- [x] The hex label accepts typing and paste, and keeps only hex digits
- [x] Default, hover, and focus match the painted variants
- [x] The live board is unchanged when the trial page is absent

## Technical notes

Both labels use the Figma text style `body/md/tight` (12px, line height 12px). That is `responsive.desktop.body.md.size` and `responsive.desktop.body.md.line-height-tight`. Paragraph spacing is not in the export.

The width is fixed at 108px. No spacing token is 108px. Height hugs to 28px, `brand.scale.700`. Padding is 8px, `brand.scale.200`. The gap between `#` and the code is 4px, `brand.scale.100`. The corner is 8px, `alias.border-radius.lg`.

Default has no fill and no stroke. Hover fills with `mapped.surface.action-hover`. Focus fills with `mapped.surface.default` and draws a 2px outside stroke, `mapped.border.action-ring-focus` at `alias.border-width.sm`. The text stays `mapped.text.default` in every state.

The spec sheet around the component (state names, the red size notes, the dashed frame, the title, and the description) is documentation. It is not part of the component.

This field is not a toolbar or popover. The color toolbar that places it later uses FloatingPanel and the z-index tokens in `src/layers.ts`.

## Out of scope

The color toolbar, the color popover, swatches, and the eyedropper. Sticky-note fill. Shadows, frosted glass, and the dot grid. A disabled state: the frame does not paint one.

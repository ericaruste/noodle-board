---
id: NB-67
title: Logo button
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id: ERI-83
linear_url: https://linear.app/ericar/issue/ERI-83/logo-button
---

## Context

Brand mark for Noodle Board. Figma frame `logo` node `391:3136`, under the temporary brand icon. The left state is the default. Hover and selected use the same expanded red.

The mark is the uploaded asset [`src/assets/icons/noodle-logo.svg`](../src/assets/icons/noodle-logo.svg). The red plate in that file is not drawn. [`src/LogoButton.tsx`](../src/LogoButton.tsx) paints the red, and `?trial=logo-button` shows the states without changing the board.

This is a brand control. It is not a design-system component.

## Problem

The board has no logo button. The brand mark needs a circle at rest, and the red has to grow into a rounded square on hover and when selected, uncovering the chopstick that the circle hides.

## Repro

1. Open `?trial=logo-button`.
2. Compare the default circle with the hover and selected squares.
3. Hover and click the live button.

## Acceptance criteria

- [x] The glyph comes from `src/assets/icons/noodle-logo.svg`
- [x] Default is a 40px circle, and the chopstick extension is clipped
- [x] Hover and selected expand the red into a rounded square and reveal the chopstick extension
- [x] The shape change eases over 700ms
- [x] The red is the brand color `#B11F24` and is not a design token
- [x] The live board is unchanged when the trial page is absent

## Technical notes

The button is 40px by 40px. Its fill is `#B11F24`. The circle radius is `brand.scale.20`. The expanded corner uses `alias.border-radius.lg` (8px). The frame’s expanded corner is 6.2px, so that 8px value is the nearest token (`/* TODO token mismatch: Figma 6.2px */`).

`overflow: hidden` clips the asset to the button’s radius. The chopstick in the asset runs past the circle into the top-right corner. The circle hides that tip. As the radius eases to the rounded square, the tip comes into view. The red circle path in the SVG is removed so the button’s fill is the only red.

The trial route is `?trial=logo-button` and `#logo-button`.

This button is not a toolbar or popover. It does not use FloatingPanel.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

## Out of scope

A section in `docs/design-system-notes.md`. Placing the button on the board. A design token for the brand red. A disabled state. A focus ring. Shadows, frosted glass, and the dot grid.

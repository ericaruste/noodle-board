---
id: NB-38
title: Contextual button
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id:
linear_url:
---

## Context

Trial component for Phase 2. The Figma spec is the section “contextual button” (`button/contextual`) in the noodle-board file, node `193:3525`.

The painted control is a 32px-tall toolbar button with a label, two case-sensitive icons, and a dropdown chevron. Variants: default, hover, selected, disabled. Properties: Label, Show Label, Show left icon, Show right icon, Show dropdown icon.

[`src/ContextualButton.tsx`](../src/ContextualButton.tsx) is the component. `?trial=contextual-button` shows the four states without changing the board.

## Problem

Phase 2 needs one real component built from a Figma spec with design tokens, so later components can follow the same path.

## Repro

1. Open `?trial=contextual-button`.
2. Compare the four buttons with the Figma component set `button/contextual`.

## Acceptance criteria

- [x] The button uses semantic tokens for fill, text, icons, spacing, and corner radius
- [x] Default, hover, selected, and disabled match the painted variants
- [x] Label and each icon can be hidden the way the Figma properties do
- [x] The live board is unchanged when the trial page is absent

## Technical notes

Type size stays at the Figma text style `body/md/tight` (12px, line height 1em, SF Pro body). Responsive type tokens are still 0, so that size is not a mismatch.

The spec sheet around the button (state names, the red “32px” note, the purple dashed frame, the title, and the description) is documentation. It is not part of the component.

This button is not a toolbar or popover. When a later ticket places it in a toolbar, that toolbar uses FloatingPanel and the z-index tokens in `src/layers.ts`.

## Out of scope

Replacing the current text or selection toolbars. Shadows, frosted glass, the dot grid, and responsive type. A focus ring: the description names focus, and the frame does not paint one.

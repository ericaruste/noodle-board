---
id: NB-41
title: Menu item
status: In Progress
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id: ERI-57
linear_url: https://linear.app/ericar/issue/ERI-57/menu-item
---

## Context

Building block for dropdown menus. Figma component `menu-item`, component set node `206:3727`, on the spec frame `menu item` node `193:3525`.

The row has a label, an optional caption, and an optional chevron for a submenu. Sizes are `sm` (28px) and `md` (32px). States are default, hover, selected, and disabled.

[`src/MenuItem.tsx`](../src/MenuItem.tsx) is the component. `?trial=menu-item` shows the sizes and states without changing the board.

## Problem

Dropdowns still use the Phase 1 menu rows. Phase 2 needs the shared row first, so later menus can be built from it.

## Repro

1. Open `?trial=menu-item`.
2. Compare the medium and small rows with Figma component set `menu-item`.

## Acceptance criteria

- [x] The row uses semantic tokens for fill, label, caption, spacing, and corner radius
- [x] Medium is 32px and small is 28px
- [x] Default, hover, selected, and disabled match the painted variants
- [x] The label, caption, and chevron can be hidden
- [x] The live board is unchanged when the trial page is absent

## Technical notes

The label uses the Figma text style `body/md/tight` (12px, line height 1em). The caption is drawn smaller, at 10px and line height 1em. Responsive type tokens are still 0, so those sizes are not mismatches. Body and caption use Geist.

Small is 28px. No spacing token is 28px. The code keeps 28px and marks the mismatch.

The spec sheet around the component (state names, the red height notes, the purple dashed frame, the title, and the description) is documentation. It is not part of the component.

This ticket is the row, not a menu panel. A later dropdown that places these rows uses FloatingPanel and the z-index tokens in `src/layers.ts`.

## Out of scope

Replacing the font, size, weight, or recent menus. The dropdown panel itself. Shadows, frosted glass, and the dot grid. A focus ring: the frame does not paint one.

---
id: NB-41
title: Menu item
status: Done
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

The row has an optional left icon, a label, an optional caption, and an optional chevron for a submenu. Sizes are `sm` (28px) and `md` (32px). States are default, hover, selected, and disabled. The left icon is on unless a caller turns it off.

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
- [x] The row can show a left icon, and that icon can be turned off
- [x] The default left icon uses `mapped.icon.action-light`, and hover, selected, and disabled use the same color as the label
- [x] The typeface, weight, and font size menus keep the left icon off
- [x] The live board is unchanged when the trial page is absent

## Technical notes

The label uses the Figma text style `body/md/tight` (12px, line height 1em). The caption is drawn smaller, at 10px and line height 1em. Responsive type tokens are still 0, so those sizes are not mismatches. Body and caption use Geist.

Small is 28px, `brand.scale.28`. Medium is 32px, `brand.scale.32`.

The spec sheet around the component (state names, the red height notes, the purple dashed frame, the title, and the description) is documentation. It is not part of the component.

This ticket is the row, not a menu panel. A later dropdown that places these rows uses FloatingPanel and the z-index tokens in `src/layers.ts`.

The left icon is 16px, `brand.scale.16`, and the default glyph is Lucide `chevron-right`. A caller can pass another icon. `showLeftIcon` defaults to on. The default color is `mapped.icon.action-light`. Hover uses `mapped.icon.action-hover`, selected uses `mapped.icon.action-selected`, and disabled uses `mapped.icon.disabled`. Those three match the label color for the same state. A real hover on the default row follows the label into the hover color. The typeface, weight, and font size menus pass `showLeftIcon={false}`.

## Out of scope

Replacing the font, size, weight, or recent menus. The dropdown panel itself. Shadows, frosted glass, and the dot grid. A focus ring: the frame does not paint one.

---
id: NB-44
title: Font size menu
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id: ERI-59
linear_url: https://linear.app/ericar/issue/ERI-59/font-size-menu
---

## Context

Figma frame node `212:4004`, on the contextual toolbar sheet beside the typeface menu. It opens from the size control on the text toolbar in [`src/TextToolbar.tsx`](../src/TextToolbar.tsx).

The frame is 44 by 344 hug. Inside are twelve [`MenuItem`](../src/MenuItem.tsx) rows, small, with the caption and the chevron turned off: 10, 12, 14, 16, 18, 24, 32, 36, 40, 48, 64, and 72. Each row is `brand.scale.900` (36px).

## Problem

The font size menu still uses the Phase 1 rows. The Figma menu is the shared menu item, stacked in the same frosted panel as the text toolbar. A row that hugged its label would change the menu width between 10 and 72.

## Repro

1. Select a text object, sticky, or shape that shows the text toolbar.
2. Open the font size control with a single click.
3. Compare the menu with Figma node `212:4004`.

## Acceptance criteria

- [x] The menu is twelve small menu items, caption and chevron hidden, in the order 10, 12, 14, 16, 18, 24, 32, 36, 40, 48, 64, 72
- [x] Each row is a fixed 36px, `brand.scale.900`, so every row is the same width
- [x] The current size is the selected row
- [x] The panel uses the spacing, radius, and border measured from the frame, and the same frost as the text toolbar
- [x] Choosing a size still applies it and closes the menu
- [x] A single click still opens the menu, and a double click still edits the number
- [x] The menu stays above a selected element and above an element while it is dragged

## Technical notes

The frame measures 44 by 344. That is padding 4, twelve 28px rows, and no gap. Each row is 36px, so the hug width is 44px (`brand.scale.1100`): 4px padding, the row, and 4px padding. The row size is `sm`. The corner radius is 8px. The stroke is `mapped.border.default` at 1px. The fill matches the text toolbar frost, `mapped.surface.default` at 80%. Figma blur and shadow are not a token.

The list adds 40 between 36 and 48. The Phase 1 list did not have 40. The frame height is twelve rows.

The menu opens in a FloatingPanel on the dropdown layer. The row width is `w-brand-scale-900` instead of a full-width hug.

## Out of scope

The typeface menu, the weight menu, and the alignment menu. Changing the menu item row states, and changing the size button itself.

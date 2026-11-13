---
id: NB-43
title: Typeface menu
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id: ERI-56
linear_url: https://linear.app/ericar/issue/ERI-56/typeface-menu
---

## Context

Figma frame node `168:3116`, on the contextual toolbar sheet beside `toolbar/contextual/text`. It opens from the typeface control on the text toolbar in [`src/TextToolbar.tsx`](../src/TextToolbar.tsx).

The frame is 128 by 148. Inside are five [`MenuItem`](../src/MenuItem.tsx) rows, small, with the caption and the chevron turned off: Geist Mono, Open Sans, Coming Soon, Noto Serif, and Montserrat. Each label is that family's `alias.typeface` token.

## Problem

The typeface menu still uses the Phase 1 menu rows, and the labels are not the alias typeface tokens. The Figma menu is the shared menu item, stacked in the same frosted panel as the text toolbar.

## Repro

1. Select a text object, sticky, or shape that shows the text toolbar.
2. Open the typeface control.
3. Compare the menu with Figma node `168:3116`.

## Acceptance criteria

- [x] The menu is five small menu items, caption and chevron hidden, in the order Geist Mono, Open Sans, Coming Soon, Noto Serif, Montserrat
- [x] Each label uses its `alias.typeface` token
- [x] The current family is the selected row
- [x] The panel uses the spacing, radius, and border measured from the frame, and the same frost as the text toolbar
- [x] Choosing a family still applies it and closes the menu
- [x] The menu stays above a selected element and above an element while it is dragged

## Technical notes

The frame measures 128 by 148. That is padding 4, five 28px rows, and no gap. The row size is `sm`. The corner radius measured from the frame is 8px. The stroke is `mapped.border.default` at 1px. The fill matches the text toolbar frost, `mapped.surface.default` at 80%. Figma blur and shadow are not a token.

The file request was rate limited, so the padding, radius, and stroke were read from the canvas. The layer name above the frame was cut off. It starts with `toolbar/contextual`.

The first row is painted with the hover fill. The live menu marks the current family with the selected fill.

The menu opens in a FloatingPanel on the dropdown layer. The label font comes from `alias.typeface` instead of the menu item's body font.

## Out of scope

The font size menu and the alignment menu. Changing the menu item row states, the weight menu, and the typeface button itself.

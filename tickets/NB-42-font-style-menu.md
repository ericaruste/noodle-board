---
id: NB-42
title: Font style menu
status: In Progress
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id: ERI-58
linear_url: https://linear.app/ericar/issue/ERI-58/font-style-menu
---

## Context

Figma frame node `165:2949`, on the contextual toolbar sheet beside `toolbar/contextual/text`. It opens from the weight control on the text toolbar in [`src/TextToolbar.tsx`](../src/TextToolbar.tsx).

The frame is 104 by 120. Inside are four [`MenuItem`](../src/MenuItem.tsx) rows, small, with the caption and the chevron turned off: Regular, Bold, Italic, and Bold Italic.

## Problem

The weight menu still uses the Phase 1 menu rows. The Figma menu is the shared menu item, stacked in the same frosted panel as the text toolbar.

## Repro

1. Select a text object, sticky, or shape that shows the text toolbar.
2. Open the weight control.
3. Compare the menu with Figma node `165:2949`.

## Acceptance criteria

- [x] The menu is four small menu items, caption and chevron hidden, in the order Regular, Bold, Italic, Bold Italic
- [x] The current weight is the selected row
- [x] The panel uses the spacing, radius, and border measured from the frame, and the same frost as the text toolbar
- [x] Choosing a weight still applies it and closes the menu
- [x] The menu stays above a selected element and above an element while it is dragged

## Technical notes

The frame measures 104 by 120. That is padding 4, four 28px rows, and no gap. The row size is `sm`. The corner radius measured from the frame is 8px. The stroke is `mapped.border.default` at 1px. The fill matches the text toolbar frost, `mapped.surface.default` at 80%. Figma blur and shadow are not a token.

The file request was rate limited, so the padding, radius, and stroke were read from the canvas. The layer name above the frame was cut off.

The menu opens in a FloatingPanel on the dropdown layer. The weight button keeps the width of Bold Italic.

## Out of scope

The typeface menu, the font size menu, and the alignment menu. Changing the menu item row itself.

---
id: NB-40
title: Text align popover
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

Figma component `toolbar/contextual/text/pop-over/text-align`, node `165:2948`. It opens from the alignment control on the text toolbar in [`src/TextToolbar.tsx`](../src/TextToolbar.tsx).

The frame is 142 by 40. Inside are four [`ContextualButton`](../src/ContextualButton.tsx)s in a row: left, center, right, and justify. Each button shows only the alignment icon.

## Problem

The alignment menu still uses the Phase 1 menu rows. The Figma popover is four contextual buttons on the same surface as the text toolbar.

## Repro

1. Select a text object, sticky, or shape that shows the text toolbar.
2. Open the alignment control.
3. Compare the popover with Figma node `165:2948`.

## Acceptance criteria

- [x] The popover is four contextual buttons, one for each alignment, with only the icon showing
- [x] The open alignment is the selected button
- [x] The popover uses the surface, border, spacing, and radius tokens from the frame
- [x] Choosing an alignment still applies it and closes the popover
- [x] The popover stays above a selected element and above an element while it is dragged

## Technical notes

The frame measures 142 by 40. That is padding 4, four 32px buttons, and 2px gaps. The stroke, radius, and fill match the text toolbar: `mapped.border.default`, radius xl, and the same 40% frost. Figma blur, the Figma shadow, and the token's 30% opacity are not applied.

The popover opens in a FloatingPanel on the dropdown layer.

## Out of scope

The font, size, and weight menus. Underline and strikethrough.

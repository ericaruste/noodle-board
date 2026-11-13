---
id: NB-45
title: Menu gap
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 1
linear_id: ERI-60
linear_url: https://linear.app/ericar/issue/ERI-60/menu-gap
---

## Context

Popovers and dropdowns open from the floating toolbars through [`useAnchoredBox`](../src/FloatingPanel.tsx). The text toolbar, the align popover, the font style menu, the typeface menu, the font size menu, the noodle menus, the shapes menu, and the recent menu all use that placement.

## Problem

The gap was measured from the button inside the toolbar. The toolbar’s own padding used up that space, so the menu sat against the toolbar.

## Repro

1. Select a text object so the text toolbar appears.
2. Open the font size menu, the weight menu, or the alignment popover.
3. Open the shapes menu from the bottom toolbar, and Recent from the file bar.

## Acceptance criteria

- [x] Every popover and dropdown sits `brand.scale.100` (4px) away from the toolbar that opened it
- [x] The gap is measured from the toolbar’s outer edge
- [x] A menu that opens below clears the bottom by 4px, and a menu that opens above clears the top by 4px
- [x] The font size menu, the alignment popover, the shapes menu, and the recent menu each measure 4px

## Technical notes

The distance is the CSS variable `--brand-scale-100`. When the control sits in a floating toolbar, the menu clears that panel. The recent menu clears the file bar. Horizontal alignment still follows the button.

## Out of scope

The contents of the menus. The 8px inset that keeps a menu inside the screen.

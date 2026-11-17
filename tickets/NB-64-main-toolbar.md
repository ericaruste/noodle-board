---
id: NB-64
title: Main toolbar
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 3
linear_id: ERI-80
linear_url: https://linear.app/ericar/issue/ERI-80/main-toolbar
---

## Context

Figma component `toolbar/main`, node `186:3425`. It replaces the bottom tool pill in [`src/Toolbar.tsx`](../src/Toolbar.tsx). Every control is a [`MainButton`](../src/MainButton.tsx) with the label and the right icon turned off.

The row is select, hand, sticky note, text, image, shapes, noodle, and delete. Delete is the destructive type. Shapes still opens the shared shape swatch.

## Problem

The bottom bar still draws its own round controls. The frame is the main button, repeated, on the shared surface.

## Repro

1. Open the board.
2. Compare the bottom bar with Figma node `186:3425`.

## Acceptance criteria

- [x] Select, hand, sticky note, text, image, shapes, noodle, and delete are main buttons with the label and the right icon hidden
- [x] Delete is the destructive type and stays disabled when nothing is selected
- [x] The active tool uses the main button selected state
- [x] The bar uses the surface, border, spacing, and radius tokens from the frame
- [x] Choosing a tool, placing a sticky, text, image, or shape, and deleting a selection still work
- [x] The shapes menu is the shared shape swatch
- [x] The bar stays above a selected element and an element that is mid-drag

## Technical notes

The frame is 342 by 48, hugging its contents. Eight 40px buttons and 2px gaps fit that width when the padding inside the 1px stroke is 3px. No spacing token is 3px. The bar uses 4px, `brand.scale.100`, and marks the mismatch.

The noodle glyph is `src/assets/icons/noodle-main.svg`. The other glyphs are Lucide. Text is `type`.

The fill is `mapped.surface.default` (`#F6F9FD` at 60%). Blur is the existing `backdrop-blur-xl`. The existing shadow stays. Blur and shadow stay out of the token file.

The bar already lives in FloatingPanel on the toolbar layer. The shapes menu stays on the dropdown layer, `brand.scale.100` (4px) from the bar.

The Figma file request was rate limited, and the property panel was behind the sign-up wall. The row was read from the painted frame.

## Out of scope

A new tooltip. The frame does not paint one. A focus ring. Rebuilding the shape swatch. Shadows, frosted glass, and the dot grid. Paragraph spacing is not in the token export.

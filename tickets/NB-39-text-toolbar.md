---
id: NB-39
title: Text toolbar
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 3
linear_id: ERI-54
linear_url: https://linear.app/ericar/issue/ERI-54/text-toolbar
---

## Context

Figma component `toolbar/contextual/text`, node `165:2947`. It sits on the selection chrome in [`src/TextToolbar.tsx`](../src/TextToolbar.tsx). Every control is a [`ContextualButton`](../src/ContextualButton.tsx) with the unused slots turned off.

The first group is font, size, weight, and alignment, with a divider on its right. The second group is bulleted list, numbered list, and link.

## Problem

The text toolbar still used the Phase 1 colors and its own icon drawings. The Figma toolbar is the contextual button, repeated, with a token surface.

## Repro

1. Select a text object, sticky, or shape that shows the text toolbar.
2. Compare the bar with Figma node `165:2947`.

## Acceptance criteria

- [x] Font, size, weight, and alignment are contextual buttons with the unused slots hidden
- [x] Bulleted list, numbered list, and link are contextual buttons with only the icon showing
- [x] The bar uses the surface, border, spacing, and radius tokens from the frame
- [x] Underline and strikethrough are not on the bar
- [x] Choosing a font, size, weight, alignment, list, or link still works
- [x] The weight control stays the width of Bold Italic when the style changes
- [x] A single click anywhere on the size button opens the presets, and a double click edits the number
- [x] Label type uses `responsive.desktop.body.md.size` and `responsive.desktop.body.md.line-height-tight`

## Technical notes

Underline and strikethrough are drawn in the Figma group and left out on purpose. They wait for the text feature that will add them.

The fill is `mapped.surface.default` (`#F0F5FB` at 40%). Blur is the existing `backdrop-blur-xl`. Figma’s 2.6px blur is ignored. The existing shadow stays. Blur and shadow stay out of the token file.

The size control keeps the number in the label slot. A single click anywhere on the size button opens the presets. A double click edits the number.

Label type uses `responsive.desktop.body.md.size` and `responsive.desktop.body.md.line-height-tight` (12px / 12px, text style `body/md/tight`). Paragraph spacing is not in the export.

The weight label is held to the width of Bold Italic, so Regular, Bold, Italic, and Bold Italic do not resize the bar.

This toolbar already lives in the selection chrome FloatingPanel. Its menus still use FloatingPanel on the dropdown layer.

## Out of scope

Underline and strikethrough. Rebuilding the open menus. The shape-kind control that some toolbars pass in as an extra.

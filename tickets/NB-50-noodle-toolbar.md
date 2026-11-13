---
id: NB-50
title: Noodle toolbar
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 3
linear_id: ERI-65
linear_url: https://linear.app/ericar/issue/ERI-65/noodle-toolbar
---

## Context

Figma component `toolbar/contextual/noodle`. It sits on the selection chrome in [`src/NoodleToolbar.tsx`](../src/NoodleToolbar.tsx). Every control is a [`ContextualButton`](../src/ContextualButton.tsx) with the unused slots turned off.

The first group is text, color, line weight, and noodle type, with a divider on its right. The second group is the start arrow and the end arrow.

Line weight, solid and dashed, and the three noodle types use the icons in `src/assets/icons`. The arrows keep the current arrow glyph. Text keeps the current T glyph.

## Problem

The noodle toolbar still used the Phase 1 colors and its own icon drawings. The Figma toolbar is the contextual button, repeated, with a token surface.

## Repro

1. Select a noodle.
2. Compare the bar with Figma `toolbar/contextual/noodle`.

## Acceptance criteria

- [x] Text, color, line weight, noodle type, and both arrows are contextual buttons with the unused slots hidden
- [x] Line weight, line type, and noodle type use the icons in `src/assets/icons`
- [x] The arrows use the current arrow glyph
- [x] The bar uses the surface, border, spacing, and radius tokens from the frame
- [x] Choosing a color, weight, line style, shape, arrow, or the text control still edits the selected noodle
- [x] The menus use FloatingPanel on the dropdown layer, and the bar stays on the toolbar layer
- [x] Each menu opens 4px under the painted pill
- [x] The bar stays on the nearest side of the stroke that keeps the 16px screen gap

## Technical notes

The fill is `mapped.surface.default` (`#F0F5FB` at 80%). Blur is the existing `backdrop-blur-xl`. Figma’s blur is ignored. The existing shadow stays. Blur and shadow stay out of the token file.

The color disc in the button is 16px, the contextual button icon slot. The open color menu uses the 24px color swatch at `alias.swatch` step 500. The frame does not paint that open menu.

This toolbar already lives in the selection chrome FloatingPanel. Its menus use FloatingPanel on the dropdown layer. The portal host is a zero-size box, so the 4px menu gap is measured from the painted pill.

The bar stays on the nearest side of the stroke that keeps the 16px screen gap. It slides to the pane edge only when the near spot would leave the board or cover the bottom toolbar.

## Out of scope

The color picker on a noodle. `noodle-main` on the bottom tool button.

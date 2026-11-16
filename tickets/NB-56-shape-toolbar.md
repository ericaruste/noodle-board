---
id: NB-56
title: Shape toolbar
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: [NB-49, NB-55]
estimate: 3
linear_id: ERI-71
linear_url: https://linear.app/ericar/issue/ERI-71/shape-toolbar
---

## Context

Figma component `toolbar/contextual/shape-color`, on the spec frame titled `shape toolbar`, node `193:3525`. The frame is 622 by 548, including the callouts.

The bar replaces the Phase 1 fill and stroke swatches in [`src/ShapeNode.tsx`](../src/ShapeNode.tsx). [`src/ShapeToolbar.tsx`](../src/ShapeToolbar.tsx) is the component. It sits in the selection chrome, under the shape, on the toolbar layer.

The first group is shape swap, with a divider on its right. The second group is stroke and line weight, with a divider on its right. The third group is fill and the fill opacity slider.

Shape swap opens `toolbar/contextual/shape/pop-over/shape-swatch`. Line weight opens `toolbar/contextual/shape/pop-over/stroke-property`. Fill and stroke open the color picker toolbar with none.

## Problem

A selected shape still uses the Phase 1 fill and stroke rows. The Figma bar is the contextual button, the color picker, and the fill opacity slider.

## Repro

1. Select a shape.
2. Compare the bar with Figma `toolbar/contextual/shape-color`.
3. Change the kind, the stroke, the weight, the line type, the fill, and the opacity.

## Acceptance criteria

- [x] Shape swap, stroke, line weight, and fill are contextual buttons with the unused slots hidden
- [x] Stroke and fill open the color picker toolbar with none, at step 200
- [x] Line weight and line type use the icons in `src/assets/icons`
- [x] The fill opacity slider sits in the bar and sets the shape’s fill opacity
- [x] The bar uses the surface, border, spacing, and radius tokens from the frame
- [x] Choosing a kind, color, weight, line type, or opacity still edits the selected shape
- [x] The menus use FloatingPanel on the dropdown layer, and the bar stays on the toolbar layer
- [x] Each menu opens 4px under the painted pill
- [x] A group of shapes uses the same bar

## Technical notes

The fill is `mapped.surface.default` (`#F0F5FB` at 80%). Blur is the existing `backdrop-blur-xl`. Figma’s blur is ignored. The existing shadow stays. Blur and shadow stay out of the token file.

The color disc in the button is 16px, the contextual button icon slot. It paints the color swatch’s default look, type none or color. The 24px swatch is a button, so it does not sit inside this button. The open color menu uses the color picker toolbar at step 200, with none. The frame paints that picker with none selected.

A new shape, and a shape saved before this bar, stays at 100% opacity. The specimen on the frame reads 50%. Medium weight is the 2px stroke the shape already paints. Dashed uses the same `8 6` dash as a noodle.

The shape-swap popover paints four icons: ellipse, diamond, rectangle, triangle. The app keeps the five kinds, including rounded rectangle, in the existing order.

The bar uses the small fill opacity slider: an 8px track and a 12px thumb. The percent is left-aligned in a slot the width of `100%`, with tabular figures, so the bar does not change width between 0% and 100%.

This toolbar lives in the selection chrome FloatingPanel. Its menus use FloatingPanel on the dropdown layer. The portal host is a zero-size box, so the 4px menu gap is measured from the painted pill.

## Out of scope

The bottom tool’s shape popover. Changing the default fill and stroke of a new shape. Shadows, frosted glass, and the dot grid.

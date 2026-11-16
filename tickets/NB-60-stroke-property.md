---
id: NB-60
title: Stroke property
status: Todo
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id: ERI-75
linear_url: https://linear.app/ericar/issue/ERI-75/stroke-property
---

## Context

The line weight and line type row is built twice.

[`src/ShapeToolbar.tsx`](../src/ShapeToolbar.tsx) draws it inline for a selected shape. [`src/NoodleToolbar.tsx`](../src/NoodleToolbar.tsx) draws the same row inline for a selected noodle. A noodle stores `thickness` and `lineStyle` in [`src/noodleData.ts`](../src/noodleData.ts). A shape stores the same two fields in [`src/shapeData.ts`](../src/shapeData.ts). Both use thin, medium, and thick, and solid and dashed. The icons are `type-thin`, `type-medium`, `type-thick`, `type-straight`, and `type-dashed` in `src/assets/icons`.

## Problem

A change to the row has to be made in both toolbars. The row is one component.

## Repro

1. Select a noodle and open Line weight and line type.
2. Select a shape and open Line weight and line type.
3. The two menus match, and each is its own markup.

## Acceptance criteria

- [ ] One stroke-property component draws the row for a noodle and for a shape
- [ ] The row is thin, medium, and thick, a divider, then solid and dashed, using the icons in `src/assets/icons`
- [ ] The current weight and the current line style are the selected buttons. A mixed value leaves that group unselected
- [ ] Choosing a weight or a line style updates the selected noodle or shape and leaves the menu open
- [ ] The popover keeps the surface, border, spacing, and radius the two menus already use
- [ ] The menu uses FloatingPanel on the dropdown layer and opens 4px from the painted pill
- [ ] The menu stays above a selected element and above an element while it is dragged

## Technical notes

The shared row replaces the inline menus in [`src/ShapeToolbar.tsx`](../src/ShapeToolbar.tsx) and [`src/NoodleToolbar.tsx`](../src/NoodleToolbar.tsx). Each toolbar still owns the open state and writes its own data. Noodle thickness and shape thickness stay the pixel sizes they already paint. Dashed stays `8 6`.

The row is padding 4, 32px buttons, a 2px gap inside each group, and a 4px gap around the divider. The height is 40px, `brand.scale.1000`. The stroke is `mapped.border.default` with `alias.border-width.xsm`. The radius is `alias.border-radius.xl`. The fill is `mapped.surface.default`. Blur is the existing 24px blur. The existing shadow stays.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

## Out of scope

Figma. Stroke color, the color picker, noodle type, and the arrow menus. Shadows, frosted glass, and the dot grid.

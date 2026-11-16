---
id: NB-61
title: Shape swatch
status: Todo
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id: ERI-76
linear_url: https://linear.app/ericar/issue/ERI-76/shape-swatch
---

## Context

The shape kinds are built twice.

The shape toolbar in [`src/ShapeToolbar.tsx`](../src/ShapeToolbar.tsx) draws the kind row inline. The bottom Shapes tool in [`src/Toolbar.tsx`](../src/Toolbar.tsx) opens a separate text list of the same kinds. [`NB-56`](NB-56-shape-toolbar.md) left that bottom menu out of scope.

The kinds are [`SHAPE_KINDS`](../src/shapeData.ts): rectangle, ellipse, rounded rectangle, triangle, and diamond, in that order. The icons are [`ShapeKindIcon`](../src/shapeKindIcon.tsx).

## Problem

Shape swap and the bottom Shapes tool are two menus. They are one shape-swatch component.

## Repro

1. Open Shapes on the bottom toolbar.
2. Select a shape and open its shape-swap control.
3. The bottom tool is a text list. The shape toolbar is an icon row. Each is its own markup.

## Acceptance criteria

- [ ] One shape-swatch component opens from the shape toolbar and from the bottom Shapes tool
- [ ] The row is the five kinds, in the existing order, using the shape kind icons
- [ ] On a selected shape, the current kind is the selected button. A mixed kind leaves every button unselected
- [ ] Choosing a kind on a selected shape changes that shape and closes the menu
- [ ] Choosing a kind on the bottom tool places that kind and closes the menu
- [ ] The popover keeps the surface, border, spacing, and radius the shape toolbar’s kind row already uses
- [ ] Each menu uses FloatingPanel on the dropdown layer and opens 4px from the control that opened it
- [ ] The shape-toolbar menu stays above a selected shape and above a shape while it is dragged

## Technical notes

The shared row replaces the inline kind menu in [`src/ShapeToolbar.tsx`](../src/ShapeToolbar.tsx) and the text list in [`src/Toolbar.tsx`](../src/Toolbar.tsx). The bottom tool still calls `onAddShape`. The shape toolbar still calls `onKind`.

The row is padding 4 and a 2px gap between the icon buttons. The height is 40px, `brand.scale.1000`. The stroke is `mapped.border.default` with `alias.border-width.xsm`. The radius is `alias.border-radius.xl`. The fill is `mapped.surface.default`. Blur is the existing 24px blur. The existing shadow stays. The row has no divider.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

## Out of scope

Figma. Stroke, fill, and the fill opacity slider. Shadows, frosted glass, and the dot grid.

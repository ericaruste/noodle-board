---
id: NB-21
title: Add shape swap on the shape's floating toolbar
status: In Progress
priority: 3
labels: [Feature, Canvas, Toolbar]
parent: NB-E3
blockedBy: []
estimate: 2
linear_id: ERI-32
linear_url: https://linear.app/ericar/issue/ERI-32/add-shape-swap-on-the-shapes-floating-toolbar
---

## Context

Add Shape in [`src/Toolbar.tsx`](../src/Toolbar.tsx) opens a menu of the five kinds in [`SHAPE_KINDS`](../src/shapeData.ts): rectangle, ellipse, rounded rectangle, triangle, and diamond. Picking one calls [`addShape`](../src/App.tsx), which always inserts a new node at the viewport center with the default size, fill, and stroke.

A selected shape’s floating toolbar is the fill and stroke panel in [`src/ShapeNode.tsx`](../src/ShapeNode.tsx) (`data-shape-colors`), portaled by [`SelectionChrome`](../src/SelectionChrome.tsx). [`commitPaint`](../src/ShapeNode.tsx) is the only edit it can make. [`paintedShape`](../src/ShapeNode.tsx) already accepts a new `kind`, and the node draws whichever kind is stored: geometry, hit clip, accessible name, and text band all read `data.kind`. Nothing on the toolbar writes that field.

Noodles attach to the node box by id and side, not to the painted kind. [`isShapeData`](../src/noodleFile.ts) already keeps `kind` in localStorage and `.noodle.json`.

## Problem

The kind is chosen once, when the shape is created. Turning a rectangle into an ellipse means adding a second shape and deleting the first, which drops the text and the noodles. The toolbar that is already open on the selected shape cannot change the kind.

## Repro

1. Add a rectangle and type in it. Connect a noodle to one side. Select the rectangle.
2. The floating toolbar shows Fill and Stroke only. There is no control for rectangle, ellipse, rounded rectangle, triangle, or diamond.
3. Open Add Shape and pick Ellipse. A new ellipse appears at the center of the view. The rectangle, its text, and its noodle are unchanged.

## Acceptance criteria

- [x] The selected shape’s floating toolbar shows the five kinds — Rectangle, Ellipse, Rounded rectangle, Triangle, Diamond — in that order, with the same icons as Add Shape
- [x] The kind the shape already has is pressed
- [x] Choosing a different kind changes that shape in place. It keeps the same id, position, width, fill, stroke, text, and attached noodles
- [x] Choosing the kind that is already pressed does not change the shape and does not add an undo step
- [x] The label moves into the new kind’s text band. Height stays, unless the existing text-fit grows it so the label still fits. That growth belongs to the same edit
- [x] One undo restores the previous kind together with the size, fill, stroke, and text from before the swap. One redo applies the swap again
- [x] Reload, and a round-trip through `.noodle.json`, keep the new kind
- [x] The hit target and the shape’s accessible name follow the new kind
- [x] The shape stays selected and the toolbar stays open
- [x] A click on a kind button does not start text editing, drag the shape, or pan the board
- [x] Add Shape still creates a new shape and does not change the selected one

## Technical notes

Add the kind buttons on the existing `data-shape-colors` panel, ahead of Fill and Stroke. Use [`SHAPE_KINDS`](../src/shapeData.ts), [`SHAPE_LABELS`](../src/shapeData.ts), and [`ShapeKindIcon`](../src/ShapeNode.tsx). The current kind uses `aria-pressed`.

Write the kind the same way as paint: `paintedShape` with only `kind` changed, then `noodle-snapshot`, then `noodle-update-node`. Leave `fill`, `stroke`, `paragraphs`, and `manualHeight` on the node. Do not publish a new width or a new position. Skip the snapshot when the pressed kind is chosen again.

[`shapeTextFrame`](../src/shapeData.ts) and the hit clip already follow `kind`. The layout effect that calls [`shapeHeightForText`](../src/shapeData.ts) may publish a taller height after the swap. That height publish does not take its own snapshot today, so it stays inside the undo step recorded before the kind update.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

This ticket adds no new panel. The kind buttons sit in the shape toolbar [`SelectionChrome`](../src/SelectionChrome.tsx) already portals on the toolbar layer. They stay above the selected shape and above that shape while it is mid-drag. Pointer and wheel events on them do not pan the board or move the shape, same as the fill and stroke swatches (`nodrag nopan nowheel`).

## Out of scope

New kinds (stars, polygons, arrows-as-shapes). Swapping a sticky, text object, or image into a shape. Changing fill, stroke, or text as part of the swap. The Add Shape menu. Applying one kind to a multi-selection (the group toolbar is NB-23). Hiding this toolbar while a noodle is connecting (NB-22).

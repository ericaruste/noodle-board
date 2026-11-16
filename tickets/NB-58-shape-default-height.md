---
id: NB-58
title: Keep a shape at its default height until the text overflows
status: In Progress
priority: 2
labels: [Bug, Canvas]
parent: NB-E6
blockedBy: [NB-21]
estimate: 2
linear_id: ERI-73
linear_url: https://linear.app/ericar/issue/ERI-73/keep-a-shape-at-its-default-height-until-the-text-overflows
---

## Context

A new shape is `SHAPE_DEFAULT_WIDTH` by `SHAPE_DEFAULT_HEIGHT` in [`src/shapeData.ts`](../src/shapeData.ts): 180 by 140. [`src/ShapeNode.tsx`](../src/ShapeNode.tsx) measures the label and publishes a height from [`shapeHeightForText`](../src/shapeData.ts).

When the shape has no `manualHeight`, that publish uses the text height as soon as the label has characters. A short word, or a smaller font size, shrinks the shape to the text. An empty shape stays at 140. After a height drag, `data.manualHeight` keeps that height: the text can grow the shape past it, and cannot shrink it below it. A width-only drag does not set `manualHeight`.

NB-21 holds the height while text editing is open, because the empty hint leaves the flow. Leaving the edit sizes the shape from the text again, so a short word snaps the height down after the editor closes.

[`docs/noodle-json.md`](../docs/noodle-json.md) says that until a resize, typing grows or shrinks the shape so the label stays inside the geometry.

## Problem

The default size should stay. Typing less text, or a smaller font size, must not snap the shape height to the text. The height changes when the user drags it. The one exception is text that no longer fits: the shape grows so the label stays inside the geometry, and it returns to the default, or to the dragged height, when that text fits again.

A new rectangle checked on the board started at 180 by 140. The letter `a` left it at 180 by 52. A sentence that wrapped grew it to 166.

## Repro

1. Add a rectangle. It is 180 by 140.
2. Double-click it, type `a`, and click the canvas. The height drops to the text, about 52. The width stays 180.
3. Type a sentence that wraps past the default height. The shape grows.
4. Delete that sentence back to `a`. The height stays small instead of returning to 140.
5. Drag the bottom handle taller, then delete the text. The dragged height stays. Drag only the side handle. The height is still free to follow the text.

## Acceptance criteria

- [x] A new shape is 180 by 140. A short word, or a font size the text already fits at, leaves the height at 140. The width stays 180
- [x] Text that no longer fits the default height grows the shape so the label stays inside the geometry. Deleting that text, or lowering the font size until it fits, returns the height to 140
- [x] Dragging a height handle sets that height. A shorter word, a smaller font size, or deleting the text does not shrink below it. Text that no longer fits still grows the shape past it
- [x] Dragging only the width does not lock the height. Narrowing the shape grows it when the wrapped text no longer fits. Widening it back returns the height to 140, or to the dragged height if one was set
- [x] Double-clicking to edit does not shrink the shape. Leaving the edit with short text keeps 140, or the dragged height
- [x] Changing the kind does not shrink the shape. The new kind can still grow it so the label fits
- [x] The resize handles still cannot crop the label
- [x] Undo restores the height from before the text edit or the drag, and redo applies it again
- [x] A shape already saved opens at the size in the file. [`docs/noodle-json.md`](../docs/noodle-json.md) describes this height rule

## Technical notes

In the layout effect in [`src/ShapeNode.tsx`](../src/ShapeNode.tsx), the unresized target is `hasText ? floor : Math.max(SHAPE_DEFAULT_HEIGHT, fitted)`. The base height is `SHAPE_DEFAULT_HEIGHT` until a height drag writes `manualHeight`. The published height is the base or the text floor, whichever is taller. `manualHeight` stays the base after a height drag, and a width-only drag still does not write it.

The edit hold and the kind hold stay. They stop a shrink while the hint leaves the flow or the kind changes. They must not keep a short label from returning to the base once the edit or the kind change has settled.

This ticket adds no toolbar, dropdown, or popover.

## Out of scope

Text objects and the handle hug from NB-37. Sticky notes. Changing the default 180 by 140. Snapping the width to the text. A height field in the toolbar.

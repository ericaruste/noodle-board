---
id: NB-37
title: Hug a text frame from its resize handles
status: Done
priority: 3
labels: [Feature, Canvas]
parent: NB-E3
blockedBy: []
estimate: 2
linear_id: ERI-47
linear_url: https://linear.app/ericar/issue/ERI-47/hug-a-text-frame-from-its-resize-handles
---

## Context

A selected text object draws its box in [`NoodleResizer`](../src/NoodleResizer.tsx): eight handles, corners and edges, portaled into the viewport. Dragging a handle resizes through [`resizeNodeBox`](../src/resizeMath.ts). Ending that drag goes through [`finishResize`](../src/alignSnap.ts), which keeps the size snapped during the drag when the pointer is within `ALIGN_SNAP` (5). Text is created at `TEXT_PLACE_WIDTH` (220) and grows in height with the content until a resize writes both width and height.

Double-click on empty canvas zooms. d3-zoom listens for that double-click on `.react-flow__renderer`. The hug runs on the second pointer down, which can move the handle before the button is released, so the browser finishes the click on whatever is now under the pointer.

[NB-07](NB-07-text-objects.md) added the text object and its resize. This ticket is the Illustrator-style fit on that box only.

## Problem

Double-clicking a text bounding-box handle should fit the frame to the glyphs, the way Adobe Illustrator hugs a text frame. That gesture must not zoom the board. Stickies, shapes, images, and groups keep the resize they have today.

## Repro

1. Select a text object whose frame is larger than its glyphs. Double-click a corner or edge handle.
2. The frame snaps to the text. The canvas zoom stays put, and the text stays selected.
3. Double-click empty canvas. The board zooms.
4. Double-click a handle on a sticky, shape, or image. That object does not hug.

## Acceptance criteria

- [x] Double-clicking any resize handle on a selected text object hugs the frame to the glyphs. Width becomes the longest rendered line. Height becomes the block. The glyphs stay where they were
- [x] The same double-click on a sticky, shape, image, or group handle does not change that object's size
- [x] Undo restores the frame from before the hug, and redo applies the hug again
- [x] That double-click does not zoom the canvas, including when the hug moves the handle and the pointer is released on empty canvas. The text object stays selected
- [x] Double-clicking empty canvas still zooms the board
- [x] A hug that changes width or height by more than the alignment snap distance (5) is kept. Ending a normal resize still uses the snapped size when the pointer is within that distance
- [x] After a hug, dragging a handle does not force the frame back to a 120 by 32 minimum. The text resize minimum is 8 by 8

## Technical notes

Only a text node passes `onHandleDoubleClick`. The second pointer down on the same handle within 500ms fits and does not start a drag. Measure glyph runs (`[data-style]` and `[data-marker]`), not the editor's block box, and convert screen pixels with the current zoom. Frame padding is already in layout pixels. Skip the change when every delta is under 1px.

Arm a short block on that second pointer down. The following click and double-click are swallowed even when they land on the pane, because the handle has already moved. A double-click that is still on the handle is swallowed too. Nothing else cancels canvas zoom.

`finishResize` keeps the snapped size only when the released size is within `ALIGN_SNAP` of it. A jump farther than that, which is what a hug does, replaces the stored size.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

## Out of scope

Hugging a sticky, shape, image, or group. The bottom tool pill. Changing double-click zoom on empty canvas, on noodles, or while editing text. Font, alignment, lists, and links.

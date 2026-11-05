---
id: NB-30
title: Marquee-select from an empty-canvas drag
status: In Progress
priority: 3
labels: [Feature, Canvas]
parent: NB-E1
blockedBy: []
estimate: 3
linear_id: ERI-39
linear_url: https://linear.app/ericar/issue/ERI-39/marquee-select-from-an-empty-canvas-drag
---

## Context

The Select tool from NB-23 is the tool the board opens with. In [`src/App.tsx`](../src/App.tsx), Select sets `panOnDrag` to the middle button only and leaves `nodesDraggable` on. A left drag that starts on an element moves the selection. A left drag that starts on empty canvas does not pan, and `selectionOnDrag` is unset, so it does not draw a selection box either. NB-23 left marquee selection out of scope.

Several objects are still selected by Shift-click (`selectionKeyCode` and `multiSelectionKeyCode` are both Shift). Two or more selected objects mount one group box and one toolbar in [`GroupSelection`](../src/GroupSelection.tsx). Drag, copy, Alt-drag, Ctrl/Cmd+D, and Delete already apply to that set (NB-23, NB-16).

Escape in [`src/App.tsx`](../src/App.tsx) cancels cursor placement or a noodle drag, or leaves the Arrow tool. It does not cancel a selection drag, and there is no marquee to cancel.

## Problem

With the Select tool, dragging from empty canvas should draw a marquee and select the elements it covers, so they can be dragged, copied, duplicated, and deleted together. There is no such marquee. Escape should cancel it, and a click with the Select tool on the marquee should cancel it too.

## Repro

1. Choose the Select tool. Left-drag on empty canvas across two stickies, a shape, and the noodle between them. No rectangle appears, and nothing new is selected.
2. Shift-click those same objects. Drag, Alt-drag, Ctrl/Cmd+D, and Delete apply to the set. The empty-canvas drag never produces that set.
3. Press Escape during the empty-canvas drag. There is nothing to cancel.

## Acceptance criteria

- [x] With the Select tool, a left drag that starts on empty canvas draws a marquee rectangle that follows the pointer
- [x] Releasing that drag selects every element and every noodle the rectangle overlaps, including one only partly inside, as one selection
- [x] That selection drags, copies, duplicates, and deletes the same way as a Shift multi-selection: one group box, one toolbar, and one undo step for each gesture
- [x] Pressing Escape while the marquee is being drawn cancels it. The rectangle disappears, nothing it covered becomes selected, and the selection stays as it was when the drag started. Releasing the pointer after Escape does not select
- [x] A click with the Select tool on the marquee rectangle cancels it the same way. The rectangle disappears and the marquee does not leave a selection
- [x] A drag that starts on an element, a noodle, a port, or a handle still moves or edits that object and does not draw a marquee
- [x] The Hand tool, the Arrow tool, Space+left-drag, and the mouse-wheel drag do not draw a marquee
- [x] Holding Shift while drawing the marquee adds what it covers to the current selection. Without Shift, the marquee replaces the selection
- [x] A marquee that covers nothing selects nothing. With Shift held, that empty marquee leaves the current selection as it is
- [x] An `endpoint` node is not selected as its own object. A loose noodle is selected when its stroke overlaps the marquee

## Technical notes

Turn on selection-by-drag for the Select tool only, while the left button is not panning. The marquee uses partial overlap: an element or noodle the rectangle touches is selected. React Flow’s node box does not hit-test noodle strokes, so a noodle whose path crosses the rectangle has to be added even when neither end node is inside it.

The pointer-up that ends the drag commits the selection. Escape during the drag aborts that commit, including the pointer-up that follows the key. A Select-tool click on the marquee rectangle is the other cancel: the rectangle goes away and the selection does not change. A click event fired by the committing pointer-up is not that cancel. A later click on the group box the marquee leaves behind clears the selection the marquee made. A click on an element inside the rectangle still selects that element. A click on empty canvas outside it still clears the selection, as NB-23 already does.

The marquee is drag feedback. It reads its layer from the selection token in [`src/layers.ts`](../src/layers.ts) and adds no z-index number of its own. It stays under the group toolbar.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

No new panel. The group toolbar from NB-23 is the toolbar for the marquee’s selection.

## Out of scope

A marquee from the Hand tool or the Arrow tool. Changing how a Shift-click, drag, copy, duplicate, or delete works once the selection exists (NB-16, NB-23). Resizing or rotating a multi-selection as one object. Lasso selection. Selecting an `endpoint` node on its own.

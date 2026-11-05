---
id: NB-33
title: Keep a gap between the noodle toolbar and the arrow
status: Done
priority: 2
labels: [Bug, Canvas, Toolbar]
parent: NB-E1
blockedBy: []
estimate: 2
linear_id: ERI-43
linear_url: https://linear.app/ericar/issue/ERI-43/keep-a-gap-between-the-noodle-toolbar-and-the-arrow
---

## Context

Selecting a noodle opens [`NoodleToolbar`](../src/NoodleToolbar.tsx) from [`NoodleEdge`](../src/NoodleEdge.tsx). `ScreenEdgeToolbar` places that pill at the label point, `labelY - 28 / zoom`, then `ClampedToolbar` shifts it with `-translate-y-full` so the bottom center sits on that point. The label point itself is the route midpoint from `labelOn` in [`src/noodleRoute.ts`](../src/noodleRoute.ts), moved by a fixed `lift` of 18 board units (`labelShift`). That lift is not divided by zoom.

The same selection draws segment anchors (`SegmentAnchor`, `data-noodle-anchor`) on the path and end knobs (`EndKnob`) at the attachments. Both are the handles used to bend a segment or drag an end. The toolbar is a wide screen-sized pill on the toolbar layer (`FloatingPanel`, `layer="toolbar"`). `ClampedToolbar` also slides it to stay inside the pane and clear of `.board-toolbar`.

## Problem

In some layouts the toolbar opens on top of the arrow. A short noodle, an elbow or curve that rises through the area above the midpoint, or a clamp that pulls the pill down from the top of the pane puts the toolbar over the stroke and over one or more anchor points. The covered anchor cannot be selected or dragged. The overlap happens at every zoom, including minimum (0.15), 100%, and maximum (3), because the offset is tied to the label point rather than to a screen gap between the toolbar box and the path.

## Repro

1. Connect two stickies that sit close together. Select the noodle. The toolbar covers the stroke and at least one segment anchor. Pressing that anchor hits the toolbar, so the segment does not drag.
2. Repeat with an elbow and with a curve whose path passes through the area above the midpoint. Select each one. The toolbar again covers part of the arrow and an anchor.
3. Zoom to 0.15, to 100%, and to 3. In each view, a layout from step 1 or 2 still puts the toolbar on the arrow.
4. Pan that noodle near the top of the pane so the toolbar would leave the screen. The clamp pulls it down onto the arrow.
5. Select a long noodle with clear space above its midpoint. The toolbar appears, and an anchor that is not under the pill can still be dragged.

## Acceptance criteria

- [x] Selecting a noodle places its toolbar with a visible gap between the toolbar and the arrow. The toolbar does not cover the stroke, a segment anchor, or an end knob
- [x] That gap is a fixed screen distance. It stays the same at minimum zoom (0.15), at 100%, and at maximum zoom (3), and it stays the same while the board pans
- [x] A segment anchor and an end knob that sit beside the toolbar can be pressed and dragged. The press does not land on the toolbar
- [x] The gap holds for a short noodle, a straight noodle, an elbow, and a curve, including when the path rises through the area above the midpoint
- [x] Near the top of the pane, or where the toolbar would meet the bottom board toolbar, the pill moves so it stays on screen and still keeps the gap over the arrow
- [x] Color, line style, thickness, shape, the Text button, and the arrowhead menus still edit the selected noodle. Pointer and wheel events on the toolbar do not pan the board or drag the noodle
- [x] The label on the line stays at its current point. Opening the toolbar does not move the resting label or the on-line text field

## Technical notes

Measure the gap in screen pixels between the toolbar’s box and the noodle path, including the segment anchors and the end knobs. `labelY - 28 / zoom` is only a preferred point above the label. When that point lays the pill on the path, or when `ClampedToolbar` would push it onto the path to stay inside the pane, place the toolbar on another side of the noodle that keeps the same screen gap. The gap must not be a board-unit offset, because a board-unit offset changes size with zoom.

Keep the toolbar in `FloatingPanel` on the toolbar token. Do not add a z-index number of its own. Segment anchors and end knobs stay on the selection token and add no z-index numbers of their own. A ticket is not done until the toolbar has been checked against the selected noodle and against a mid-drag anchor and a mid-drag end.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

No new panel. This is the existing noodle toolbar, moved so it clears the arrow.

## Out of scope

Toolbar contents, menus, and the Text button (NB-24). Where the on-line label sits. How a segment anchor or an end knob drags, and the path that drag writes. Sticky, text, shape, and group toolbars. The bottom board toolbar.

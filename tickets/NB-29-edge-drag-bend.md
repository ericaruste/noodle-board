---
id: NB-29
title: Keep noodles on their path instead of bending them into the screen edge
status: In Progress
priority: 2
labels: [Bug, Canvas]
parent: NB-E1
blockedBy: []
estimate: 3
linear_id: ERI-38
linear_url: https://linear.app/ericar/issue/ERI-38/hide-noodles-with-both-ends-off-screen-and-bend-a-drag-back-inside-the
---

## Context

Zooming in piles settled noodles along the screen edges. [`layoutNoodle`](../src/noodleRoute.ts) runs [`fitElbowToView`](../src/noodleRoute.ts) for every elbow, including settled noodles in [`NoodleEdge`](../src/NoodleEdge.tsx). That step clamps intermediate waypoints into the pane inset (`VIEW_MARGIN`, 16 screen pixels, and below the top chrome) and leaves the real ends pinned. When both elements a noodle connects sit outside the pane, the clamped stroke runs along the edge. Many of those noodles stack on the same inset.

A separate drag preview still crosses the edge. [`NoodleConnectionLine`](../src/connectionLine.tsx) draws a new noodle and an existing end while it is dragged. [`ConnectPreview`](../src/ConnectMode.tsx) draws the line before that drag starts. Both call `layoutNoodle` as an elbow with no stored bends, and both pass the visible frame from [`routeFrame`](../src/NoodleEdge.tsx). The approach stub sits `ELBOW_OFFSET` (24 flow units) outside the landing side. When the element under the pointer is close to the screen, or part of it is off-screen, that stub and the last segment leave the pane. Clamping a waypoint onto the boundary lays the stroke along the edge. It does not turn the route back into the visible area.

## Problem

Two draw-only behaviors.

When both elements a noodle connects are outside the visible pane, that noodle is hidden, so zooming in no longer stacks strokes on the screen edges. The noodle still draws if either element meets the pane, if the noodle is selected, or if it is linked to the element under the pointer. Hiding removes the stroke for that view only. The stored path is the same one the noodle has today, and zooming or panning back so an element is visible shows it again.

Dragging an end does not hide the arrow. While that end is in the air, the preview stays visible even when the other end's element is outside the pane.

In Figma, dragging a connector onto an object that sits against or past the screen edge folds the line back into the visible area. The fold has rounded corners and a small margin, so the stroke does not cross the edge. That fold applies only while a noodle end is dragged onto an element near or past the screen edge. A settled noodle never takes it and keeps the path it has now. The moment the drag ends, the noodle that was in the air uses that same settled path.

## Edge bend removed

The edge bend is not part of the board.

Panning was pulling settled noodles into the pane, so a route that belonged at the top of the canvas ran across the middle. Hiding a noodle once both elements left the pane made those lines disappear while the elements were still drawn. The drag fold only redrew the line while an end was in the air, and the noodle you released did not keep it.

Settled noodles stay on the path between their elements. They scroll off the screen with those elements, and they stay drawn when both ends leave the pane. A noodle end that is still in the air uses that same elbow. The preview does not fold back inside the screen edge.

Dragging a noodle until the pointer reaches the screen edge still pans the canvas. That pan is separate from the bend. It is what brings an element past the edge into view.

`NoodleEdge`, `NoodleConnectionLine`, and `ConnectPreview` call `layoutNoodle` without a viewport frame, so `fitElbowToView` does not run for them. Stored bends, attachment side, and target fraction are unchanged.

## Repro

1. Connect two elements and pan until they meet or pass the top of the screen. The noodle stays on the path between them and scrolls off with them. It is not pulled down into the pane, and it does not disappear.
2. With the Noodle tool, drag from one element toward another that sits past a screen edge. The preview is the normal elbow. It does not fold back inside the edge. The canvas still pans when the pointer reaches the edge.
3. Release. The attached noodle uses the settled path. Stored bends, origin side, and target fraction are unchanged.

## Acceptance criteria

- [x] Panning does not pull a settled noodle into the pane. The noodle stays on the path between its elements, including when those elements meet or pass a screen edge
- [x] A noodle stays drawn when both of its elements move past the top of the screen. It scrolls off with the elements
- [x] While a noodle end is in the air, the preview is the normal elbow. It does not fold back inside the screen edge
- [x] Releasing the drag stores that same settled path. Origin side, target fraction, and stored bends are unchanged

## Technical notes

The edge bend and the both-ends-off-screen hide are not implemented. See **Edge bend removed**. `fitElbowToView` remains in `noodleRoute.ts` and only runs when a caller passes a frame. The settled edge and both previews do not pass one.

Leave NB-18 attachment data alone. A drop still stores the projected side and fraction.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

No new panel. The landing outline, port fill, and edge marker stay as NB-20 and NB-28 drew them.

## Out of scope

Hiding a noodle because both elements are outside the pane. Folding a drag preview back inside the screen edge. Attachment rules and stored data (NB-18). Landing chrome from NB-20 and NB-28. Editing a bend by hand. Per-noodle style (NB-09). The canvas pan that runs when a noodle drag reaches the screen edge.

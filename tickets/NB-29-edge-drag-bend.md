---
id: NB-29
title: Hide noodles with both ends off-screen and bend a drag back inside the edge
status: Todo
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

## Repro

1. Connect two stickies or shapes, then zoom in until both are outside the pane. The noodle stacks on the screen edge with any others in the same situation. It should disappear. Zoom or pan until one element is in the pane again. The noodle returns on the path it had before.
2. Leave one element in the pane and the other outside it. That noodle stays visible. Repeat for the left, right, top, and bottom edges, including under the top chrome.
3. Select a noodle, then zoom until both of its elements are outside the pane. The selected noodle stays visible. A noodle that is not selected, and whose elements are both outside, stays hidden.
4. Hover an element that a noodle is linked to. That noodle stays visible while the pointer is over the element, including when the other element is outside the pane.
5. Place a sticky or shape against the right edge of the pane, or pan until part of it is off-screen. With the Arrow tool, drag a noodle from another element onto it. Include the side that faces the screen edge, and a point between a corner and the midpoint. The preview bends back into the visible area. Release. The attached noodle uses the settled path it would have today.
6. Drag a noodle onto an element that sits well inside the pane. That preview keeps today's route. Drag an existing noodle end onto the near-edge element. The same inward bend appears, and releasing returns that noodle to its settled path.
7. Pan so one element is outside the pane, then drag the other end of the noodle that joins them. The arrow stays visible for the whole drag. It does not vanish because the anchored end is off-screen. Release, and the hide rule applies again.
8. Other settled noodles do not take the bend. An elbow near the edge, a curve, and a manually bent segment keep the path each has now.

## Acceptance criteria

- [ ] When both elements a noodle connects are outside the visible pane, that noodle is hidden, including after zooming in, so it does not pile up along a screen edge
- [ ] A noodle stays visible when at least one of its elements meets the pane
- [ ] A selected noodle stays visible even when both of its elements are outside the pane
- [ ] A noodle linked to the element under the pointer stays visible while that element is hovered
- [ ] While an arrow end is being dragged, that arrow stays visible even if its other end is off-screen. It does not vanish for the duration of the drag
- [ ] Hiding follows the pane on every edge, including under the top chrome, and updates as the view pans or zooms. Bringing an element back into the pane shows the noodle again
- [ ] While a noodle end is dragged onto an element that is near a screen edge, or past one, the preview bends back into the visible area
- [ ] The bend stays inside the pane with a small margin and rounded corners. The stroke does not cross the screen edge or run along it
- [ ] The same bend applies when the landing side faces the screen edge and the outward stub would leave the pane
- [ ] The bend applies on every edge of the pane: left, right, top, and bottom, including under the top chrome
- [ ] The bend applies to a new noodle from the Arrow tool and to dragging an existing noodle end
- [ ] The preview still meets the landing point from outside the element. The line and arrowhead do not enter the interior, and releasing still attaches at the projected point
- [ ] A drag onto an element that is not near the screen edge keeps the current preview path
- [ ] Settled noodles never take this bend and keep the path they have now, including elbows near the edge, curves, and manually bent segments
- [ ] The moment the drag ends, that noodle uses the settled path it would have today
- [ ] Origin side, target fraction, and stored bends are unchanged by hiding or by the drag bend, including after undo, redo, localStorage, and `.noodle.json`
- [ ] Panning or zooming during the drag recomputes the bend from the visible area at that moment

## Technical notes

Hiding is draw-only, on the settled noodle in `NoodleEdge`. Do not delete the edge or rewrite its data. An element is visible when its box meets the pane. Both ends outside that pane hides the stroke, unless the noodle is selected or either end is the element under the pointer. The hover target is the one [`PortMagnet`](../src/PortMagnet.tsx) already resolves. A loose `endpoint` node counts as a connected element. The path a hidden noodle would draw is unchanged, so showing it again uses the route it has today. `fitElbowToView` still clamps waypoints for noodles that remain drawn. Hiding is what stops the both-off-screen pile-up. It is not a new route.

The in-progress arrow is not part of that hide. `NoodleConnectionLine` and `ConnectPreview` stay drawn for the whole drag, including when the anchored end's element is outside the pane. Releasing the end lets the settled hide rule apply again.

The fold is also draw-only, and only on the in-progress path (`NoodleConnectionLine` and `ConnectPreview`), and only while the element under the pointer is near the viewport or overlaps it. "Near" means the element, or the approach stub outside the landing side, would leave the inset already measured by `routeFrame`.

Do not send settled edges in `NoodleEdge` through that fold. `fitElbowToView` clamping a waypoint onto the view boundary is not this bend: the route has to turn back inward so the stroke stays inset, including when the attachment point itself is on or past the screen edge. The stored ends remain the real attachment points. The preview may approach the visible part of that landing from inside the pane. Rounded corners stay the elbow radius.

Leave NB-18 attachment data alone. A drop still stores the projected side and fraction.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

No new panel. The landing outline, port fill, and edge marker stay as NB-20 and NB-28 drew them.

## Out of scope

Changing the path, stored bends, or attachment points of a settled noodle. Giving the drag bend to any noodle that is not being dragged onto an element near or past the screen edge. Attachment rules and stored data (NB-18). Landing chrome from NB-20 and NB-28. The drag bend on curves. Editing a bend by hand. Per-noodle style (NB-09).

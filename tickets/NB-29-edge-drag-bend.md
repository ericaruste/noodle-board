---
id: NB-29
title: Bend a dragged noodle back inside the screen edge
status: Todo
priority: 2
labels: [Bug, Canvas]
parent: NB-E1
blockedBy: []
estimate: 3
linear_id:
linear_url:
---

## Context

Seen while using the free-target landing from NB-18. The drag that crosses the screen edge showed up after that change.

Two previews draw the noodle while an end is in the air. [`NoodleConnectionLine`](../src/connectionLine.tsx) is the React Flow connection line, used for a new noodle and for dragging an existing end. [`ConnectPreview`](../src/ConnectMode.tsx) is the line before that drag starts. Both call [`layoutNoodle`](../src/noodleRoute.ts) as an elbow with no stored bends, and both pass the visible frame from [`routeFrame`](../src/NoodleEdge.tsx).

`layoutNoodle` runs [`fitElbowToView`](../src/noodleRoute.ts) for every elbow, including settled noodles in [`NoodleEdge`](../src/NoodleEdge.tsx). That step clamps intermediate waypoints into the pane inset (`VIEW_MARGIN`, 16 screen pixels, and below the top chrome). The real ends stay pinned. The approach stub sits `ELBOW_OFFSET` (24 flow units) outside the landing side. When the element under the pointer is close to the screen, or part of it is off-screen, that stub and the last segment still leave the pane. Clamping a waypoint onto the boundary lays the stroke along the edge. It does not turn the route back into the visible area.

A settled noodle uses the same layout. Its path, stored bends, and attachment fractions are the behavior this ticket must leave alone.

## Problem

In Figma, dragging a connector onto an object that sits against or past the screen edge folds the line back into the visible area. The fold has rounded corners and a small margin, so the stroke does not cross the edge.

Here the preview runs over the screen edge and overlaps it. That fold should come back only for this drag. Every noodle that is not in it keeps the path it has now, including after the drop.

## Repro

1. Place a sticky or shape so it sits against the right edge of the pane, or pan until part of it is off-screen. Repeat later for the left, top, and bottom edges.
2. With the Arrow tool, drag a noodle from another element onto that one. Include the side that faces the screen edge, and a point between a corner and the midpoint.
3. The preview runs past the screen edge and overlaps it. In Figma the same drag bends back inward and stays in the visible area.
4. Release. The attached noodle returns to the path a settled noodle has today. Other noodles, including ones already near an edge and ones in the middle of the board, do not move.
5. Drag a noodle onto an element that sits well inside the pane. That preview keeps today's route.
6. Drag an existing noodle end onto the near-edge element. The same overlap appears.

## Acceptance criteria

- [ ] While a noodle end is dragged onto an element that is close to a screen edge, or that overlaps one, the preview bends back into the visible area
- [ ] The bend stays inside the pane with a small margin and rounded corners. The stroke does not cross the screen edge or run along it
- [ ] The same bend applies when the landing side faces the screen edge and the outward stub would leave the pane
- [ ] It applies on every edge of the pane: left, right, top, and bottom, including under the top chrome
- [ ] It applies to a new noodle from the Arrow tool and to dragging an existing noodle end
- [ ] The preview still meets the landing point from outside the element. The line and arrowhead do not enter the interior, and releasing still attaches at the projected point
- [ ] A drag onto an element that is not near the screen edge keeps the current preview path
- [ ] The moment the drag ends, that noodle uses the settled path it would have today. No other noodle changes path, including elbows near the edge, curves, and manually bent segments
- [ ] Origin side, target fraction, and stored bends are unchanged, including after undo, redo, localStorage, and `.noodle.json`
- [ ] Panning or zooming during the drag recomputes the bend from the visible area at that moment

## Technical notes

The fold is draw-only, and only on the in-progress path (`NoodleConnectionLine` and `ConnectPreview`), and only while the element under the pointer is near the viewport or overlaps it. "Near" means the element, or the approach stub outside the landing side, would leave the inset already measured by `routeFrame`.

Do not send settled edges in `NoodleEdge` through a new fold. `fitElbowToView` clamping a waypoint onto the view boundary is not this bend: the route has to turn back inward so the stroke stays inset, including when the attachment point itself is on or past the screen edge. The stored ends remain the real attachment points. The preview may approach the visible part of that landing from inside the pane. Rounded corners stay the elbow radius.

Leave NB-18 attachment data alone. A drop still stores the projected side and fraction.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

No new panel. The landing outline, port fill, and edge marker stay as NB-20 and NB-28 drew them.

## Out of scope

The path of any noodle that is not being dragged onto an element near or over the screen edge. Changing settled routes that already leave the pane. Attachment rules and stored data (NB-18). Landing chrome from NB-20 and NB-28. Curves. Editing a bend by hand. Per-noodle style (NB-09).

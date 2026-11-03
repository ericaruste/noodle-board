---
id: NB-20
title: Smooth noodle drag feedback and edge-following
status: In Progress
priority: 2
labels: [Feature, Canvas]
parent: NB-E1
blockedBy: [NB-18]
estimate: 5
linear_id: ERI-28
linear_url: https://linear.app/ericar/issue/ERI-28/smooth-noodle-drag-feedback-and-edge-following
---

## Context

NB-18 is merged. Origins stay on side midpoints, targets keep the dropped fraction, and nothing re-spaces. This ticket is how the drag looks and where the line is allowed to go. Attachment rules and stored data stay as they are.

[`src/ObjectPorts.tsx`](../src/ObjectPorts.tsx) draws one `Handle` per side. [`useHandlePlacement`](../src/portHot.ts) slides that handle to the hot fraction and marks it `noodle-port-hot`. [`HotMarker`](../src/PortMagnet.tsx) then paints one filled [`noodle-port-marker`](../src/index.css). The hot handle is hidden. The other three handles are the default React Flow dots, shown together whenever any handle on the node is hot. There is no outlined-versus-filled port, and no separate marker for a free edge point.

[`HotPort`](../src/noodleEnds.ts) is `{ nodeId, handleId, fraction }`. [`nearestPort`](../src/PortMagnet.tsx) and [`portAtClient`](../src/PortMagnet.tsx) call [`projectOntoBox`](../src/attachment.ts) for a target end and [`projectOntoSideMidpoint`](../src/attachment.ts) for an origin end. `closestPerimeter` only accepts a hit within `PORT_SCREEN_RADIUS` (48 screen pixels) of the border, so the center of an element is not a landing zone. The preview itself is React Flow’s smooth-step connection line ([`connectionLineType`](../src/App.tsx)), which follows the raw pointer, so the end and arrowhead enter the shape. [`projectOntoBox`](../src/attachment.ts) uses the sharp rectangle. A round-rect in [`src/ShapeNode.tsx`](../src/ShapeNode.tsx) has a corner radius that the projection ignores.

[`onConnectEnd`](../src/App.tsx) resolves the drop with `nearestPort`. A release over the center finds nothing, so no edge is created, and the pointerup reaches the node. Sticky, text, and shape nodes start editing from `onClick` once they are selected ([`src/StickyNode.tsx`](../src/StickyNode.tsx), [`src/TextNode.tsx`](../src/TextNode.tsx), [`src/ShapeNode.tsx`](../src/ShapeNode.tsx)), and all three also edit on double-click.

[`layoutNoodle`](../src/noodleRoute.ts) draws the path from the two attachment points. Elbow waypoints are not clamped to the pane, so a route can leave the visible canvas or run under the sidebar and toolbars. Stored bends are not the same thing as that clamp.

## Problem

Figma shows the element outline as the landing zone, four outlined midpoint dots, and a fill only on the dot under the pointer. Off those dots, a small marker rides the outline at the exact drop point. The line stays outside the shape and meets the edge from the outside. A route that would leave the pane bends back inside it, with rounded corners and a small margin.

Noodle Board draws one filled marker, lets the preview follow the cursor into the element, and treats a release on the body as a click. That click selects the element, opens text editing, and makes no connection. Routes also run off the visible canvas.

## Repro

1. With the Arrow tool, drag from a side midpoint of a sticky toward a shape and move across that shape, including its center. The line and arrowhead enter the interior. One filled dot follows near the border. The four midpoints are not outlined dots, and the one under the pointer is not the only one that fills.
2. Hold the pointer on a midpoint, then slide along the edge between ports, then back onto a midpoint. The filled marker does not swap cleanly with an edge marker, and ports do not return to an outline when the pointer leaves them.
3. Release over the center of an already selected sticky, text object, or shape. No noodle attaches. The release selects the element and opens text editing.
4. Drag the origin end instead. A free point along the edge can still read as the landing marker. Only the hovered midpoint should fill.
5. Draw an elbow noodle between two elements placed near opposite edges of the pane, or pan so the straight route would leave the canvas. The path runs off-screen or under the sidebar and toolbars.
6. Repeat the NB-18 checks: two noodles between the same pair, a target dropped between a corner and a midpoint, delete one, undo, and reload. Those attachments must not move.

## Acceptance criteria

- [x] While a noodle end is dragged over an element, that element’s outline edge shows as the landing zone
- [x] All four side-midpoint ports show as outlined, unfilled dots. Only the port under the pointer fills and enlarges, and the end snaps to that midpoint. The other three stay outlined
- [x] Moving the pointer off a port returns it to an outline. No port is filled while the pointer is on the edge or the body between ports
- [x] Off a port but still over the element, all four ports stay outlined, the outline edge stays visible, and a small marker follows the pointer along the edge at the exact drop point
- [x] Switching between a filled port and the edge marker is immediate and does not flicker. The port snap radius is easy to hit
- [x] During an origin-end drag, only the hovered midpoint fills. The other three stay outlined. No free edge marker appears
- [x] Highlights clear when the pointer leaves the element or the drag ends
- [x] While a target end is dragged over an element, including its center, the end is projected onto the nearest point of the outline and follows the pointer along that edge. The line and arrowhead never enter the interior
- [x] The final segment approaches from outside the side it lands on. Releasing attaches at the projected point
- [x] An origin-end drag follows the same rule using the four midpoints instead of the free edge
- [x] Releasing over the element’s center attaches to the nearest valid point. It does not open text editing and it does not select the element
- [x] A plain single click on an element body, with no drag, still selects it. Editing text still requires a double-click
- [x] When a route would run past the visible canvas edge, it bends back inside the viewport with a small margin and rounded corners. It does not go off-screen or under the sidebar and toolbars
- [x] NB-18 still holds: several noodles between the same two elements, origins on midpoints, target fractions left where they were dropped, same-point rejection, and the same values after undo, redo, localStorage, and `.noodle.json`

## Technical notes

Drive the drag hover from one value, `hoverTarget: { elementId, mode: 'port' | 'edge', side, fraction }`, computed while the drag is active. Test the midpoint hit radius first, then fall back to `projectOntoBox`. The port fill, the outline, the edge marker, the preview endpoint, and the drop all read that value.

Port fill reads `mode: 'port'` plus `side`, so at most one port is filled, and none are filled when `mode` is `'edge'`.

While a noodle drag is active, the whole element body is a landing zone. Connection hit-testing wins, and the element’s pointer, click, and double-click handlers — including text edit in `StickyNode`, `TextNode`, and `ShapeNode` — stay suppressed until the drag ends. The raw pointer is never the endpoint.

Use the corner radius in the projection for rounded shapes, the way the Figma example follows a rounded rectangle. `projectOntoBox` is a sharp box today.

Viewport clamping is draw-only. Clamp elbow waypoints in `layoutNoodle` to the visible bounds minus a margin, recompute them on pan and zoom, and leave stored attachment data and bends unchanged.

Keep the end knobs on a shared midpoint from swallowing the pointer. That is the failure NB-17 fixed.

## Out of scope

Changes to attachment rules or stored data (NB-18). Attachment on the interior of an element. Rotated or non-rectangular outlines. Per-noodle style (NB-09). Floating toolbar and dropdown layering (NB-19).

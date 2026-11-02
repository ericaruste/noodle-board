---
id: NB-17
title: Attach noodles anywhere along a side
status: Done
priority: 2
labels: [Feature, Canvas]
parent: NB-E1
blockedBy: [NB-03, NB-09]
estimate: 5
linear_id: ERI-25
linear_url: https://linear.app/ericar/issue/ERI-25/attach-noodles-anywhere-along-a-side
---

## Context

Every sticky, image, text, and shape exposes four ports, one at the midpoint of each side. [`src/ObjectPorts.tsx`](../src/ObjectPorts.tsx) renders a `Handle` with id `top`, `right`, `bottom`, or `left`. [`src/PortMagnet.tsx`](../src/PortMagnet.tsx) (`nearestPort`, `nearestHandleOnNode`, `portAtClient`, `portGeometry`) and [`src/ConnectMode.tsx`](../src/ConnectMode.tsx) only resolve those four handle bounds. The edge stores that id on `sourceHandle` / `targetHandle`.

`isValidConnection` in [`src/App.tsx`](../src/App.tsx) rejects a connection only when both ends are the same node and the same handle. A second noodle on an already used port still cannot be started: the noodle and its end knob sit on that handle, so the port never receives the pointer. Empty ports on the other sides still work.

Loose ends stay on `endpoint` nodes (`ENDPOINT_TYPE` in [`src/noodleEnds.ts`](../src/noodleEnds.ts)). Moving an attached end is NB-03. Drawing from the Arrow tool is NB-09.

## Problem

A noodle can only dock at a side’s midpoint. Two noodles cannot share a side, because the occupied port cannot be selected to start another noodle. There is no way to attach partway along an edge, and nothing spreads connectors that do share a side.

## Repro

1. Connect a noodle from the right side of a sticky to another shape.
2. With the Arrow tool, hover that same right side and try to start a second noodle. The port does not highlight and the drag does not start. The empty top, bottom, or left port still does.
3. There is no attach point between the corner and the midpoint. Every noodle on a side stacks on the same center dot.

## Acceptance criteria

- [x] A noodle can attach at the point along a sticky, image, text, or shape side where the pointer hits, including between the corner and the midpoint
- [x] A side that already has one or more noodles can still start another. The Arrow tool and handle-drag both highlight that side and create a new noodle from it. Only a side with no noodle is not a requirement
- [x] Each noodle stays its own edge. It can be selected, rewired by dragging its end, and deleted on its own. The others on that element stay
- [x] While one noodle is alone on a side, it stays at the point where it was attached
- [x] When two or more noodles share a side, their attachment points spread evenly along that side, inset from the corners. Adding, deleting, or moving a noodle off that side reflows the ones that remain
- [x] The attachment stays on that side, at the same fraction of the side, when the element is moved or resized
- [x] Noodles saved with only `top` / `right` / `bottom` / `left` still load. Alone, they sit at the midpoint. Sharing a side, they join the even spacing
- [x] The side and the fraction are stored on the edge and survive undo, redo, localStorage, and `.noodle.json`. A copied noodle (NB-16) keeps them
- [x] A loose end on an `endpoint` node is unchanged. Dropping an end on empty canvas still parks it there
- [x] Connecting both ends of one noodle to the same point on the same element is still rejected

## Technical notes

Hit-test the perimeter of the node box, not only the four midpoint handles, in `portAtClient` and `nearestPort`. Store the side plus a 0–1 fraction on `edge.data` (alongside `bends`) and keep `sourceHandle` / `targetHandle` as the side id so older files still parse. Place the handle with a `style` offset (`left` / `top` as a percentage of the node) so `portGeometry`, the path, and the end knob meet the box at that point.

When the set of edges on one side of one node changes, assign fractions `(i + 1) / (n + 1)` in a stable order (existing fraction, then edge id) so they stay off the corners. A single edge keeps the fraction from the drop or reconnect. Recompute on connect, reconnect, and delete.

`ObjectPorts` can keep one handle per side for the hover target, with the visible hot port drawn at the resolved fraction. Do not stack a new React Flow node per noodle. Selection, Delete, and the noodle toolbar stay per edge id.

## Out of scope

Attachment on the interior of an element. Rotated or non-rectangular outlines. A manual offset that overrides even spacing while several noodles share a side. Per-noodle style changes (NB-09). Merging several noodles into one object.

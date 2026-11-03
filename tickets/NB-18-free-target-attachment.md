---
id: NB-18
title: Connect many noodles from a side midpoint to any edge point
status: Done
priority: 2
labels: [Feature, Canvas]
parent: NB-E1
blockedBy: [NB-17]
estimate: 5
linear_id: ERI-26
linear_url: https://linear.app/ericar/issue/ERI-26/connect-many-noodles-from-a-side-midpoint-to-any-edge-point
---

## Context

Noodles are separate edges. [`src/attachment.ts`](../src/attachment.ts) stores a side on `sourceHandle` / `targetHandle` and a 0–1 fraction on `edge.data` (`sourceFraction`, `targetFraction`). [`resolveAttachments`](../src/attachment.ts) keeps a lone end at its fraction and, once two or more ends share a side, rewrites them to `(i + 1) / (n + 1)`. [`reflowAttachments`](../src/attachment.ts) runs on connect, reconnect, delete, duplicate, and load.

[`src/PortMagnet.tsx`](../src/PortMagnet.tsx) hit-tests the whole perimeter (`projectOntoBox`, `portAtClient`, `nearestPort`). [`src/ObjectPorts.tsx`](../src/ObjectPorts.tsx) draws one handle per side and slides it to the hot fraction, so a drag can start from any point on a side, not only the midpoint. The Arrow tool ([`src/ConnectMode.tsx`](../src/ConnectMode.tsx)) and endpoint drag (NB-03) both use that hit test. Sticky, image, text, and shape nodes all mount `ObjectPorts`.

`isValidConnection` in [`src/App.tsx`](../src/App.tsx) rejects a noodle only when both ends land on the same point of the same element. A second edge between two different elements is already a separate edge id.

## Problem

FigJam and Miro let you run any number of connectors between the same two objects. The end you pull away from an object leaves one of that object’s four side midpoints, and several connectors may share that dot. The end you drop can sit anywhere on the other object’s outline and stays at that exact spot. Nothing snaps it to a midpoint, and nothing redistributes the others when a connector is added or removed.

Noodle Board does the opposite. Either end can leave from any point along a side, and sharing a side spreads every attachment evenly, so a point the user chose is overwritten. There is no origin-versus-target distinction: starting a noodle highlights a free point on the perimeter instead of the four midpoints.

## Repro

1. With the Arrow tool, drag from the right side of a sticky toward another shape, starting between the corner and the midpoint. The noodle begins at that free point. Only that one spot highlights, not the four side midpoints.
2. Drop the other end partway along the target’s top edge, then draw a second noodle between the same two elements and drop it on a different point of that top edge. The first drop moves. Both ends spread evenly along the side.
3. Drag the second noodle’s target end to a new spot on a third element. The origin end can leave its port, and any ends that still share a side are spaced again.
4. Select one of the two noodles and press Delete. The remaining noodle jumps to a new fraction instead of staying where it was dropped.

## Acceptance criteria

- [x] Any number of noodles can connect the same two elements. Each is its own edge: it can be selected, rewired, and deleted on its own, and the others stay
- [x] Starting a noodle from a sticky, image, text, or shape — Arrow tool or dragging out of the element — highlights only that element’s four side-midpoint ports. The new origin end is one of those ports
- [x] Several noodles may share one midpoint. They stay on that port. The port can still start another noodle. They are not spread along the side
- [x] The target end can drop anywhere along the target element’s edge, including between a corner and the midpoint. It keeps that exact point. It does not snap to a midpoint, and adding, deleting, or moving other noodles does not move it
- [x] Dragging a noodle’s target end afterward reattaches it to a new point on any element’s edge. During that drag the origin end stays on its port
- [x] Dragging the origin end only moves it to another of the four side midpoints, on this element or another. It cannot be parked partway along a side
- [x] While the target end is dragging, the landing highlight follows the pointer along the edge under it. While the origin end is dragging, only side midpoints highlight
- [x] Moving or resizing an element keeps the origin on the midpoint of its side and the target at the same fraction of its side
- [x] The origin side and the target side plus fraction are stored on the edge and survive undo, redo, localStorage, and `.noodle.json`. A copied noodle (NB-16) keeps them
- [x] A noodle saved with a free point on the origin snaps that end to the side midpoint. A saved target fraction is kept and is not run through even spacing
- [x] A loose end on an `endpoint` node is unchanged. Dropping an end on empty canvas still parks it there
- [x] Connecting both ends of one noodle to the same point on the same element is still rejected

## Technical notes

Split the hit test by which end is moving. For a new connection and for a source-end drag, resolve only the four midpoints (fraction `0.5`) and highlight those ports. For a target-end drag, keep `projectOntoBox` and store that fraction. Do not call even spacing for either end.

Stop rewriting fractions in `resolveAttachments` / `reflowAttachments`. The origin side is the handle id; persist `sourceFraction` as `0.5` or omit it and treat a missing origin fraction as the midpoint. Persist `targetFraction` as the drop. `ObjectPorts` should show the origin handles at the midpoints. The target knob and path still use the stored fraction, the way `NoodleEdge` already does.

A shared midpoint has to remain a hit target. The end knobs of noodles already on that port must not swallow the pointer that starts the next noodle (the failure NB-17 fixed for a whole side).

On load, coerce any origin fraction other than the midpoint back to `0.5` once, and leave target fractions alone. Same-point rejection stays `sameAttachmentPoint`.

## Out of scope

Attachment on the interior of an element. Rotated or non-rectangular outlines. Even spacing, manual spread, or a per-side offset. Per-noodle style (NB-09). Merging several noodles into one object. Changing how a loose `endpoint` node is drawn.

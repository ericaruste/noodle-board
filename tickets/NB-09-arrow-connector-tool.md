---
id: NB-09
title: Add Arrow/connector tool
status: Done
priority: 3
labels: [Feature, Canvas, Toolbar]
parent: NB-E3
blockedBy: [NB-01]
estimate: 3
linear_id: ERI-17
linear_url: https://linear.app/ericar/issue/ERI-17/add-arrowconnector-tool
---

## Context

Noodles already existed as React Flow edges (`type: "smoothstep"`, closed arrow) created only by dragging the small handles on node hover. This ticket adds an Arrow tool and makes a selected noodle editable in the FigJam style: ports while connecting, body anchors, and a floating toolbar whose changes belong to that noodle alone.

The custom edge is [`src/NoodleEdge.tsx`](../src/NoodleEdge.tsx). Style and route live on `edge.data` via [`src/noodleData.ts`](../src/noodleData.ts) and [`src/noodleRoute.ts`](../src/noodleRoute.ts). Connect mode is [`src/ConnectMode.tsx`](../src/ConnectMode.tsx). The toolbar is [`src/NoodleToolbar.tsx`](../src/NoodleToolbar.tsx).

## Problem

Connecting objects was a hidden-handle gesture, and a noodle could not be restyled, labeled, or rerouted after it was drawn.

## Repro

1. Add two stickies.
2. Look for an Arrow / connector tool. None.
3. Hover a node to reveal 8px handles, then drag. That is the only way to noodle.
4. Select a noodle. It has no anchors and no style toolbar.

## Acceptance criteria

- [x] An Arrow tool in the toolbar enters connect mode (crosshair cursor). It stays active until another tool or Escape
- [x] In connect mode, hovering a node reveals a port on every side and highlights the nearest port
- [x] Clicking or dragging from port to port, or from node to node, creates one smoothstep noodle with an arrow marker
- [x] Connect mode does not pan the board on the click or drag that starts a connection (`panOnDrag` is middle/right button only while the tool is active)
- [x] Escape or switching to Add Sticky, Add Text, Add Shape, or Add Image cancels connect mode without a dangling edge
- [x] Handle-drag connect still works when the Arrow tool is off
- [x] A selected noodle shows an anchor at the midpoint of each body segment. Dragging an anchor moves that segment perpendicular to its direction and reroutes the noodle. Both ends stay attached
- [x] Selecting a noodle shows a floating toolbar, and only while it is selected. The toolbar and anchors do not pan the board or drag nodes
- [x] The toolbar edits only the selected noodle: color, line style (solid, dashed), thickness (thin, medium, thick), line shape (straight, elbow, curve), text label, and separate start and end arrowheads (none, arrow, open arrow, triangle, circle, diamond)
- [x] Each toolbar change and each anchor drag is one undo step and one redo step
- [x] Color, dash, thickness, shape, label, both arrowheads, and bends are stored on the edge and survive reload (localStorage and `.noodle.json`)
- [x] New noodles still undo, delete, and persist like other edges

## Technical notes

Arrow mode is `connectMode` in [`src/App.tsx`](../src/App.tsx), not a separate edge type name. New edges are still `type: "smoothstep"` and render through `NoodleEdge`, which owns markers, dashes, thickness, straight / elbow / curve paths, the label, segment anchors, and end knobs. Defaults match the old noodles: `#334155`, solid, medium (2px), elbow, no start marker, arrow end.

`edge.data` holds `color`, `lineStyle`, `thickness`, `shape`, `label`, `markerStart`, `markerEnd`, `bends`, and `curveOffset`. `publishNoodle` updates one edge. `snapshotBoard` runs once per toolbar gesture (including a label typing session and a color-picker session) and once on the first real anchor move, so undo/redo is a single step. `parseNoodleFile` already keeps edge objects, so the extra data round-trips.

Connect mode uses a capture-phase pointer listener so the click that starts a noodle does not select, edit, or pan. A short drag forwards to the existing handle connection. A click arms `connectionClickStartHandle` and a second click on another node completes it. Dropping on a node body (outside the handle radius) completes in `onConnectEnd`.

Elbow bends are absolute interior corners. Dragging a segment translates it on its perpendicular and re-orthogonalizes the route with both ends pinned. A curve’s drag stores `curveOffset` along the chord normal. The curve’s port stubs are capped so a same-side connection does not bow off the board.

## Out of scope

Standalone arrow shapes that are not attached to two nodes. Per-segment colors, and more than the three thicknesses and three line shapes above.

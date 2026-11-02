---
id: NB-15
title: Equal-spacing guides while dragging
status: Todo
priority: 3
labels: [Feature, UX, Canvas]
parent: NB-E4
blockedBy: [NB-12]
estimate: 5
linear_id: ERI-23
linear_url: https://linear.app/ericar/issue/ERI-23/equal-spacing-guides-while-dragging
---

## Context

FigJam-style equal-spacing guides: while dragging, snap a node so the gap to its neighbour matches an existing gap on the same row or column, and draw a bracket in every gap that matches. Edge and center alignment already ships in [`src/alignSnap.ts`](../src/alignSnap.ts) (`alignNodeChanges`, `nodeBox`, `ALIGN_SNAP`) and the viewport overlay in [`src/AlignmentGuides.tsx`](../src/AlignmentGuides.tsx). [`src/App.tsx`](../src/App.tsx) runs that wrapper from `onNodesChange` and clears guides on `onNodeDragStop`.

NB-12 left distribution spacing out of scope. Build on that code. Do not copy any xyflow Pro source (the helper-lines example is Pro-licensed).

## Problem

Nodes can snap to edges and centers, but not to an even gap. Spacing a row or column is still done by eye, and nothing marks the matching gaps.

## Repro

1. Place three stickies in a row with a clear gap between the first and the second.
2. Drag the third along that row until the gap looks the same. It does not snap, and no spacing bracket appears.
3. Drop a fourth sticky between two of them. It does not snap to the centre of the span.

## Acceptance criteria

- [ ] While dragging a node, neighbouring non-dragged nodes on its row (boxes overlap vertically) and column (boxes overlap horizontally) are found, sorted along that axis, and the gaps between neighbours are measured
- [ ] If the dragged node’s gap to its nearest left or right neighbour is within the alignment snap threshold of an existing gap between two other nodes on that row, the node snaps so the gaps are equal. Same for top and bottom on a column
- [ ] If the dragged node sits between two nodes, it also snaps to the centre of that span so both gaps match
- [ ] A purple bracket (a line with a small perpendicular cap at each end) is drawn in every matching gap, in the same viewport-transformed overlay as the alignment lines
- [ ] Brackets clear on drop (`onNodeDragStop`)
- [ ] Mixed sizes use bounding boxes (`nodeBox`), not equal-width assumptions
- [ ] Multi-select drag applies the same offset to the dragged set (best-effort: the primary dragged node)
- [ ] Brackets are overlay marks, not nodes in the graph, and they do not fight pan/zoom
- [ ] Alignment guides and spacing guides can both show. If both want to move the node on the same axis, alignment wins

## Technical notes

Extend `alignNodeChanges` rather than a second `onNodesChange`. Reuse `nodeBox`, `ALIGN_SNAP` (5 flow px; the grab stays in flow space so zooming out does not widen it), and the `ViewportPortal` SVG in `AlignmentGuides`. A bracket is a segment between the facing edges of two boxes plus a short cap at each end, stroke scaled by `1/zoom` like the guide lines.

On a position change for the dragged id, collect other visible boxes that overlap the moving box on the cross axis. Sort by the main axis and take gaps between consecutive neighbours (and the moving box’s gap to its nearest neighbour on each side). Snap when `|gap − existingGap|` is within `ALIGN_SNAP`. When the node has a neighbour on both sides, the equal-gap position is the midpoint of the two inner edges; prefer that when it is within the threshold. Apply the winning delta to the primary node’s position change and the same delta to other nodes in the drag. If an alignment snap already rewrote that axis, skip the spacing snap on it and still draw brackets for gaps that match after the alignment move.

Clear spacing marks in the same `onNodeDragStop` path that clears `guidesRef`.

## Out of scope

Gap guides while resizing. Padding between a parent and its children. Rotated nodes. Pixel distance labels (optional later). Copying xyflow Pro example files.

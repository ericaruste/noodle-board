---
id: NB-12
title: Smart alignment guides while dragging
status: Todo
priority: 3
labels: [UX, Canvas]
parent: NB-E4
estimate: 5
linear_id:
linear_url:
---

## Context

Miro/Figma-style smart guides: while dragging (and ideally resizing), snap to other nodes’ left/center/right and top/middle/bottom and show a line. React Flow has no guides in this app. The current xyflow “Helper Lines” example is **Pro-licensed** — implement a small custom overlay. Do not copy that Pro source.

Dragging already snapshots on `onNodeDragStart` in [`src/App.tsx`](../src/App.tsx). `onNodesChange` applies position updates.

## Problem

Nodes cannot be aligned except by eye. There is no snap and no guide line.

## Repro

1. Place two stickies at different x positions.
2. Drag the second until it “looks” lined up with the first. No guide appears and it does not snap.

## Acceptance criteria

- [ ] While dragging a node, when an edge or center is within a small threshold (~5px in flow coordinates), the node snaps to that alignment
- [ ] A horizontal and/or vertical guide line is drawn through the matching anchors, aligned to the current viewport zoom/pan
- [ ] Guides clear on drop (`onNodeDragStop`)
- [ ] Works for mixed sizes (sticky vs image) using bounding boxes, not equal-width assumptions
- [ ] Multi-select drag: guides relative to other non-dragged nodes (best-effort: at least the primary dragged node)
- [ ] Snap does not fight pan/zoom; lines are overlay, not nodes in the graph
- [ ] Optional but desired: same guides while resizing with NodeResizer

## Technical notes

On `onNodesChange` position changes, compute the dragged node’s box (`position` + `width`/`height`/`style`/`measured`). Compare anchors `{x, x+w/2, x+w}` and `{y, y+h/2, y+h}` against other nodes. If `|delta| < SNAP`, rewrite the change’s position. Render two lines in a viewport-transformed overlay (`getViewport()` or CSS matching React Flow’s transform). Keep SNAP small so it does not feel sticky at low zoom.

## Out of scope

Distribution spacing guides, padding-inside-parent, rotating objects, and copying xyflow Pro example files.

---
id: NB-09
title: Add Arrow/connector tool
status: Todo
priority: 3
labels: [Feature, Canvas, Toolbar]
parent: NB-E3
blockedBy: [NB-01]
estimate: 3
linear_id: ERI-17
linear_url: https://linear.app/ericar/issue/ERI-17/add-arrowconnector-tool
---

## Context

Noodles already exist: `onConnect` + `defaultEdgeOptions` in [`src/App.tsx`](../src/App.tsx) (`type: "smoothstep"`, closed arrow marker). Users create them only by dragging the small handles that appear on node hover ([`src/index.css`](../src/index.css)). There is no Arrow toolbar action. Handles are easy to miss; FigJam exposes a dedicated connector tool.

Blocked by NB-01 so new noodles are not hidden under images.

## Problem

Connecting objects is an advanced gesture on hidden handles, not a first-class action.

## Repro

1. Add two stickies.
2. Look for an Arrow / connector tool. None.
3. Hover a node to reveal 8px handles, then drag. That is the only way to noodle.

## Acceptance criteria

- [ ] An Arrow (connector) tool in the toolbar enters connect mode (cursor change; tool stays active until another tool or Escape)
- [ ] In connect mode, clicking a node (or handle) then clicking another node creates a noodle using the existing smoothstep + arrow style
- [ ] Drag-from-node-to-node in connect mode also creates a noodle
- [ ] Connect mode does not pan the board on the click that starts a connection (use `nopan` / `panOnDrag` rules as needed)
- [ ] Cancel with Escape or by switching tools without creating a dangling edge
- [ ] New noodles still undo, delete, and persist like today’s edges
- [ ] Handle-drag connect remains available so power users are not blocked

## Technical notes

This is a **tool mode**, not a new edge renderer, unless the visual gap requires it. Track `tool: "select" | "connect" | ...` in `App` or toolbar state. `ConnectionMode.Loose` is already set. Pair with NB-03 reconnect if both have landed. If NB-11 landed, use an icon; otherwise a text button is fine.

## Out of scope

Standalone arrow shapes that are not attached to two nodes, line-weight pickers, and elbow vs curve UI. Do not wait on Text/Shapes, but connectors must work on those node types once they exist.

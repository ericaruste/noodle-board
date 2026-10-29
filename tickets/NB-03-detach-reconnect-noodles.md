---
id: NB-03
title: Detach and reconnect noodles by dragging endpoints
status: Todo
priority: 2
labels: [Bug, Canvas]
parent: NB-E1
estimate: 3
linear_id: ERI-11
linear_url: https://linear.app/ericar/issue/ERI-11/detach-and-reconnect-noodles-by-dragging-endpoints
---

## Context

[`src/App.tsx`](../src/App.tsx) has `onConnect` / `addEdge` but no `onReconnect`. React Flow only makes edges reconnectable when `onReconnect` is set (even though `edgesReconnectable` defaults true). Users currently select a noodle and press the top-nav **Delete** control. `deleteKeyCode={["Delete","Backspace"]}` already removes a selected edge, but there is no manual detachment.

## Problem

You cannot pull a noodle off a node and drop it on another handle, or drop it on empty canvas to remove it. The only obvious path is toolbar Delete.

## Repro

1. Connect two stickies.
2. Drag near either end of the noodle, trying to unplug it. Nothing happens.
3. The noodle only goes away if it is selected and Delete is used in the toolbar (or Delete/Backspace if the user discovers the key).

## Acceptance criteria

- [ ] Hovering a noodle endpoint (within a reasonable reconnect radius) shows that the end can be dragged
- [ ] Dragging an end onto another compatible handle rewires the noodle (`reconnectEdge` + `onReconnect`)
- [ ] Releasing the end on empty canvas removes that noodle (`onReconnectEnd` when the reconnect did not land)
- [ ] Rewire and detach both take an undo snapshot
- [ ] Selected noodles can still be removed with Delete/Backspace and the toolbar Delete button
- [ ] Invalid drop (e.g. both ends on the same handle if that is disallowed) does not leave a broken edge

## Technical notes

Wire `onReconnect`, `onReconnectStart`, and `onReconnectEnd` on `<ReactFlow>`. Use `reconnectEdge` from `@xyflow/react`. Optionally raise `reconnectRadius` above the default 10px. Consider `elevateEdgesOnSelect` together with NB-01 so ends are not buried under images.

## Out of scope

A dedicated Arrow toolbar tool (NB-09). Multi-segment waypoints. Changing the default smoothstep look.

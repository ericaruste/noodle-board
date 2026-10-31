---
id: NB-03
title: Detach and reconnect noodles by dragging endpoints
status: In Progress
priority: 2
labels: [Bug, Canvas]
parent: NB-E1
estimate: 3
linear_id: ERI-11
linear_url: https://linear.app/ericar/issue/ERI-11/detach-and-reconnect-noodles-by-dragging-endpoints
---

## Context

[`src/App.tsx`](../src/App.tsx) has `onConnect` / `addEdge` but no `onReconnect`. React Flow only makes edges reconnectable when `onReconnect` is set (even though `edgesReconnectable` defaults true). A noodle is a smoothstep edge between two handles. After it is connected, nothing on the line shows where it can be grabbed, and the end cannot be pulled off.

Miro and Figma both let you grab a connector after it is attached. In Miro, dropping that end on empty canvas is valid: it does not have to land on another object. While the end is dragged near an object, the port you would connect to highlights on its own.

## Problem

You cannot reposition a connected noodle by dragging it. There is no handle on the line, empty canvas is not a valid resting place, and nearby ports do not announce themselves while you drag.

## Repro

1. Connect two stickies.
2. Look at the noodle. No node marks a place you can grab.
3. Try to drag either end onto empty canvas, or toward another sticky or image. The end does not move, and no port highlights.

## Acceptance criteria

- [ ] Each noodle shows a small node at each end so it is obvious where the line can be dragged or repositioned
- [ ] Those nodes stay draggable after the noodle is connected to an element
- [ ] Dragging an end onto empty canvas leaves the noodle there, unattached to any element. It is not deleted and it does not have to connect to something else
- [ ] While an end is dragged near a sticky, image, or other object, the nearest compatible port highlights on its own (Miro-style), before the pointer is on the port
- [ ] Dropping the end on that highlighted port connects the noodle there
- [ ] Moving an end onto empty canvas and rewiring it to a port each take an undo snapshot
- [ ] Selected noodles can still be removed with Delete/Backspace and the toolbar Delete button
- [ ] An invalid drop (both ends on the same handle, if that is disallowed) does not leave a broken edge

## Technical notes

A React Flow edge needs two ends, so a free end should stay attached to a visible endpoint node parked on the canvas, not be removed in `onReconnectEnd`.

Wire `onReconnect`, `onReconnectStart`, and `onReconnectEnd` on `<ReactFlow>`. Use `reconnectEdge` from `@xyflow/react`. The endpoint nodes are the drag handles. While reconnecting, highlight the closest compatible `Handle` within a radius larger than the default `reconnectRadius` of 10px, and clear that highlight when the pointer moves away or the drag ends. `elevateEdgesOnSelect` is already on, so these nodes should stay reachable above images (NB-01).

## Out of scope

A dedicated Arrow toolbar tool (NB-09). Elbows or extra waypoints along the path. Changing the default smoothstep look. Deleting a noodle by dropping it on empty canvas.

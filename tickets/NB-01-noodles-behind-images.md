---
id: NB-01
title: Keep noodles visible above image nodes
status: Todo
priority: 2
labels: [Bug, Canvas]
parent: NB-E1
estimate: 2
linear_id:
linear_url:
---

## Context

React Flow draws the edge SVG under the node layer. Image nodes are large, opaque, and use `overflow-hidden` in [`src/ImageNode.tsx`](../src/ImageNode.tsx). A noodle that crosses an image, or that starts on a sticky sitting on top of an image and goes to a node outside it, is painted behind the image.

Related: [`src/App.tsx`](../src/App.tsx) `defaultEdgeOptions` (smoothstep, `MarkerType.ArrowClosed`). No `elevateEdgesOnSelect` and no custom edge `zIndex`.

This is the same root cause as “image container hides the noodle” and “sticky on image, connect outside, noodle behind image.”

## Problem

Noodles disappear under images, so users cannot see or easily select the connection.

## Repro

1. Add an image. Add a sticky. Connect the sticky to the image. Drag the sticky so the noodle crosses the photo. The stroke is hidden under the image.
2. Place a sticky on top of the image. Connect that sticky to another node outside the image. The noodle runs behind the image.

## Acceptance criteria

- [ ] A noodle whose path crosses an image remains fully visible (stroke + arrowhead)
- [ ] A noodle from a node stacked on an image to a node outside the image remains visible
- [ ] Connection handles on image nodes are not clipped by `overflow-hidden`
- [ ] The in-progress connection line while dragging a noodle is also drawn above images
- [ ] Selecting a noodle that crosses an image still highlights and can be deleted

## Technical notes

Raise edge stacking (`zIndex` on edges, `elevateEdgesOnSelect`, and/or React Flow z-index mode) so the edge layer wins over large nodes. Keep nodes clickable. If handles sit on the node border, drop `overflow-hidden` or add padding so handles are not clipped. Prefer a board-level fix so future shape nodes do not repeat this.

## Out of scope

Reconnect/detach (NB-03), resize (NB-02), new edge types, and toolbar changes.

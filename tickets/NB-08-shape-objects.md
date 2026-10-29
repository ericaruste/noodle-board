---
id: NB-08
title: Add Shape objects
status: Todo
priority: 3
labels: [Feature, Canvas]
parent: NB-E3
estimate: 5
linear_id:
linear_url:
---

## Context

Nodes are only `sticky` and `image`. FigJam-style boards need geometric frames. Toolbar has no shape picker. Resize and handles on stickies/images are the pattern to copy (and should already be improved by NB-02 if that landed).

## Problem

There is no rectangle, ellipse, or rounded rectangle to group or decorate the board.

## Repro

1. Open the MVP.
2. There is no Shapes action.

## Acceptance criteria

- [ ] A Shape action (toolbar button or flyout) can add at least **rectangle**, **ellipse**, and **rounded rectangle**
- [ ] New shapes appear at the canvas center with a default size, fill, and stroke
- [ ] Selected shapes show a small color/stroke control (reuse the sticky color-bar pattern or a minimal equivalent)
- [ ] Shapes move, resize, select, delete, undo, connect via handles, and persist in snapshots / localStorage / `.noodle.json`
- [ ] Ellipse and rounded rect hit-testing should follow the visible shape closely enough that empty corners of an ellipse are not a huge dead zone (best-effort CSS `border-radius` / `ellipse` is acceptable)
- [ ] If NB-11 exists, Shape is an icon with a flyout; otherwise a control on the current toolbar is enough

## Technical notes

`type: "shape"` with `data: { kind: "rect" | "ellipse" | "round-rect", fill, stroke }`. One component switching on `kind` is fine. Connection handles on four sides, same as sticky/image. Default z-order: do not cover noodles (respect NB-01).

## Out of scope

Polygons, stars, arrows-as-shapes (the Arrow tool is NB-09), boolean operations, and a full fill/stroke inspector.

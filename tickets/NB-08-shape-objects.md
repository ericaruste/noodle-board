---
id: NB-08
title: Add Shape objects
status: Todo
priority: 3
labels: [Feature, Canvas]
parent: NB-E3
estimate: 5
linear_id: ERI-16
linear_url: https://linear.app/ericar/issue/ERI-16/add-shape-objects
---

## Context

Nodes are only `sticky` and `image`. FigJam-style boards need geometric frames. Toolbar has no shape picker. Resize and handles on stickies/images are the pattern to copy (and should already be improved by NB-02 if that landed).

## Problem

There is no geometric shape to group or decorate the board, and no way to set a shape’s fill or stroke.

## Repro

1. Open the MVP.
2. There is no Shapes action.

## Acceptance criteria

- [ ] A Shape action (toolbar button or flyout) can add **rectangle**, **ellipse**, **rounded rectangle**, **triangle**, and **diamond**
- [ ] New shapes appear at the canvas center with a default size, a visible fill, and a visible stroke
- [ ] A selected shape can change **fill color**, **stroke color**, **no fill**, and **no stroke** (small control on the shape, same idea as the sticky color bar)
- [ ] No fill leaves the interior transparent. No stroke leaves no outline. Fill and stroke can be cleared independently
- [ ] A shape with no fill and no stroke stays selectable, movable, and resizable
- [ ] Fill, stroke, and “none” persist in snapshots / localStorage / `.noodle.json`
- [ ] Shapes move, resize, select, delete, undo, and connect via handles
- [ ] Hit-testing follows the visible shape closely enough that empty corners (ellipse, rounded rectangle, triangle, diamond) are not a huge dead zone
- [ ] If NB-11 exists, Shape is an icon with a flyout; otherwise a control on the current toolbar is enough

## Technical notes

`type: "shape"` with `data: { kind: "rect" | "ellipse" | "round-rect" | "triangle" | "diamond", fill, stroke }`. Use a color string or `null` for no fill / no stroke. One component switching on `kind` is fine. Connection handles on four sides, same as sticky/image. Default z-order: do not cover noodles (respect NB-01). Keep the control on the selected shape; do not build a separate inspector panel.

## Out of scope

A general polygon tool, stars, arrows-as-shapes (the Arrow tool is NB-09), boolean operations, gradients, opacity, stroke width, and dashed strokes.

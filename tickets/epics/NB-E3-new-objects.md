---
id: NB-E3
title: New canvas objects
status: Todo
priority: 3
labels: [Epic, Canvas, Feature]
estimate: 13
linear_id: ERI-7
linear_url: https://linear.app/ericar/issue/ERI-7/new-canvas-objects
---

## Context

MVP actions are only sticky, image, and delete ([`src/Toolbar.tsx`](../../src/Toolbar.tsx)). Noodles already exist as React Flow edges (`defaultEdgeOptions` in [`src/App.tsx`](../../src/App.tsx): smoothstep + closed arrow). There is no free text, no geometric shape, and no first-class connector tool (users must drag a hidden handle).

Child tickets: [NB-07](../NB-07-text-objects.md), [NB-08](../NB-08-shape-objects.md), [NB-09](../NB-09-arrow-connector-tool.md).

## Goal

Add Text, Shapes, and an Arrow/connector tool so the board matches a FigJam-style object set, reusing existing noodle rendering where possible.

## Child issues

- NB-07 Add Text objects
- NB-08 Add Shape objects
- NB-09 Add Arrow/connector tool

## Success looks like

- [ ] Toolbar (or the bottom icon bar from NB-11) can add text, a small set of shapes, and enter connector mode
- [ ] New objects resize, connect, delete, undo, and persist in the same snapshot as stickies and images
- [ ] Arrows are noodles created via an explicit tool, not a second edge type unless a visual gap requires it

## Out of scope

Stamps, sticky color themes beyond current swatches, freehand drawing, and smart guides (NB-12). Ship after NB-01 so connectors are not hidden under images.

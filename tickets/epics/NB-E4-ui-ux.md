---
id: NB-E4
title: UI/UX chrome
status: Todo
priority: 2
labels: [Epic, UX, Toolbar]
estimate: 8
linear_id:
linear_url:
---

## Context

Chrome today: a top-center text toolbar (`bg-white/95 backdrop-blur` in [`src/Toolbar.tsx`](../../src/Toolbar.tsx)), a solid title chip and MiniMap in [`src/App.tsx`](../../src/App.tsx). No alignment guides. The 10/29 notes ask for Google Stitch–style frosted glass, a FigJam/Wodle bottom icon bar, and Miro/Figma smart guides.

Child tickets: [NB-10](../NB-10-frosted-glass-nav.md), [NB-11](../NB-11-bottom-icon-toolbar.md), [NB-12](../NB-12-smart-alignment-guides.md).

## Goal

Move primary actions to a bottom-center icon pill, frost navigation surfaces, and snap objects to each other while dragging.

## Child issues

- NB-10 Frosted-glass navigation containers
- NB-11 Bottom-center icon toolbar
- NB-12 Smart alignment guides while dragging

## Success looks like

- [ ] Toolbar, title, and minimap read as frosted glass on the dotted canvas
- [ ] Primary tools are icons at the bottom center, with labels as tooltips/`aria-label`
- [ ] Dragging a node shows and snaps to edge/center guides of other nodes

## Out of scope

Implementing Text/Shape/Arrow behavior (E3). NB-11 may show those icons disabled until E3 lands. Do not copy the xyflow Pro helper-lines example source for NB-12.

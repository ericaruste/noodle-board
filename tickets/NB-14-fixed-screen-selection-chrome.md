---
id: NB-14
title: Keep selection chrome a fixed screen size
status: Done
priority: 2
labels: [Bug, UX, Toolbar]
parent: NB-E4
blockedBy: []
estimate: 5
linear_id: ERI-22
linear_url: https://linear.app/ericar/issue/ERI-22/keep-selection-chrome-a-fixed-screen-size
---

## Context

Selected text, stickies, and shapes show chrome inside the React Flow viewport, so it inherits canvas zoom.

- Text toolbar in [`src/TextToolbar.tsx`](../src/TextToolbar.tsx), mounted from [`src/RichText.tsx`](../src/RichText.tsx). It is `position: absolute` above the object and counter-scales with `scale(1/zoom)`. Font-style and alignment menus are portaled to `document.body`, then scaled by `1/zoom` again (`minWidth` is also multiplied by zoom).
- Link URL field in [`src/RichText.tsx`](../src/RichText.tsx) uses the same in-flow `scale(1/zoom)`.
- Shape fill/stroke bar in [`src/ShapeNode.tsx`](../src/ShapeNode.tsx) (`.noodle-shape-colors`) and sticky swatches in [`src/StickyNode.tsx`](../src/StickyNode.tsx) (`.noodle-sticky-colors`) have no counter-scale. Both are placed just below the object in [`src/index.css`](../src/index.css).

The board in [`src/App.tsx`](../src/App.tsx) uses `minZoom={0.15}` and `maxZoom={3}`. There is no `defaultViewport`, so 100% is React Flow’s default zoom of 1.

## Problem

Toolbar, menus, link field, and color controls change screen size with zoom (large when zoomed in, small when zoomed out). Menus that are already in screen space get a second `1/zoom` scale, so they drift off the toolbar’s size. FigJam keeps this chrome a constant screen size, stuck to the selection.

## Repro

1. Select a sticky or shape, open a font or alignment menu, zoom in and out, and pan.
2. Repeat with a shape’s fill/stroke bar and a sticky’s color dots.

## Acceptance criteria

- [x] Chrome renders at the same screen size at every zoom level, verified at the app’s minZoom (0.15), maxZoom (3), and the default zoom of 100%. This covers the toolbar, its menus, the link field, the shape fill/stroke bar, and the sticky color swatches
- [x] Chrome stays readable and on screen when a very small object is selected at minimum zoom
- [x] Toolbar and link field stay anchored just above the selected object; color controls stay just below it. They follow pan, zoom, and moving or resizing the object
- [x] Near a viewport edge, chrome stays on screen (clamp or flip) and returns to the preferred side when there is room
- [x] Pointer and wheel interaction on the chrome does not pan the board, drag the node, or start a selection. `nodrag` / `nopan` / `nowheel` (or an equivalent screen-space overlay) still apply
- [x] Choosing a style, alignment, list, link, fill, stroke, or sticky color still edits the object as it does today

## Technical notes

Prefer one screen-space layer (portal or React Flow `NodeToolbar` / viewport overlay positioned from the node’s screen rect) for the toolbar, menus, link field, and color bars. A single `scale(1/zoom)` is acceptable only on elements that remain inside the viewport transform — do not also scale portaled menus. Position from `getBoundingClientRect` or flow coordinates plus the viewport transform, and update on pan, zoom, and node changes. Keep `stopPropagation` / `preventDefault` on pointer down so React Flow does not treat the chrome as a node drag.

## Out of scope

Resize handles, ports, and noodles (they use the partial compensation in [`src/NoodleResizer.tsx`](../src/NoodleResizer.tsx) on purpose). The app toolbar, title chip, and MiniMap. New formatting or color options.

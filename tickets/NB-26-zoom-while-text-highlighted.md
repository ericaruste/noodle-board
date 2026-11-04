---
id: NB-26
title: Zoom the board while element text is highlighted
status: In Progress
priority: 2
labels: [Bug, Canvas]
parent: NB-E1
blockedBy: []
estimate: 2
linear_id: ERI-35
linear_url: https://linear.app/ericar/issue/ERI-35/zoom-the-board-while-element-text-is-highlighted
---

## Context

Sticky notes, text objects, and shapes edit through [`RichText`](../src/RichText.tsx). Double-click, or a click on an already selected object, sets `editing`. The contenteditable then gets `nodrag nopan nowheel`. The text frame around it is `overflow-auto`.

React Flow skips viewport zoom when the wheel target sits inside `.nowheel`. The board in [`src/App.tsx`](../src/App.tsx) pans on scroll (`panOnScroll`) and zooms on a pinch or on Ctrl/Cmd+wheel, within `minZoom` 0.15 and `maxZoom` 3. A trackpad pinch arrives as a wheel event with `ctrlKey`.

A highlighted range is a non-collapsed selection inside that editor. The format toolbar and the link field are also `nowheel`, on purpose. The noodle label field in [`src/NoodleEdge.tsx`](../src/NoodleEdge.tsx) stops `wheel` itself so a gesture on the field does not pan the board (NB-24).

## Problem

Zooming the board fails while text on an element is highlighted. The pinch or Ctrl/Cmd+wheel lands on the editor, `nowheel` drops it, and the board stays put. The user has to clear the highlight or leave text editing before a zoom works.

## Repro

1. Double-click a sticky, a text object, or a shape so the text caret is in the element.
2. Drag to highlight a word or a line.
3. Pinch the trackpad, or hold Ctrl (Cmd on a Mac) and roll the wheel, with the pointer over that highlight. The board does not zoom in or out.
4. Click empty canvas so the highlight clears and the editor closes. The same gesture zooms the board.

## Acceptance criteria

- [x] With a range highlighted in an editing sticky, text object, or shape, a trackpad pinch zooms the board in and out
- [x] The same highlight still zooms under Ctrl+wheel on Windows and Cmd+wheel on a Mac
- [x] The zoom is anchored at the pointer and stays inside 0.15–3
- [x] The highlighted range and the caret stay where they were. The gesture does not type, delete, close the editor, or scroll the text frame
- [x] A pinch or Ctrl/Cmd+wheel over the editor with only a caret, and no highlighted range, also zooms
- [x] A wheel that is not a zoom gesture may still scroll the text frame when the text overflows. It does not zoom
- [x] The format toolbar and the link field still ignore the wheel. A gesture that starts on either one does not zoom or pan the board

## Technical notes

Let a zoom gesture through the editor only. A zoom gesture is a wheel with `ctrlKey` (trackpad pinch in Chromium, and Ctrl/Cmd+wheel). Call the viewport zoom for that event and `preventDefault` so the browser does not page-zoom and the `overflow-auto` frame does not scroll. Leave plain wheels on the editor alone so overflow text can still scroll.

The `nowheel` class on the editor is what drops the gesture today. Removing it from the whole edit session would also let a two-finger scroll pan the board out from under the caret. Keep scroll and zoom apart: zoom gestures zoom, other wheels do not.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

This ticket adds no panel. The open text toolbar stays above the element it formats, including while that element is mid-drag.

NB-27 changes how readily a pinch zooms. This ticket only makes the existing zoom gesture work while element text is highlighted.

## Out of scope

Noodle label editing. That field keeps stopping `wheel` so the board does not pan (NB-24). Trackpad zoom speed and pinch-versus-pan feel (NB-27). Zoom limits, double-click zoom, and the minimap. Font, list, and link behavior inside the editor.

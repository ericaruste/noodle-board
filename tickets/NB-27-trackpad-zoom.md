---
id: NB-27
title: Make trackpad pinch zoom easier
status: Todo
priority: 3
labels: [UX, Canvas]
parent: NB-E1
blockedBy: []
estimate: 3
linear_id: ERI-36
linear_url: https://linear.app/ericar/issue/ERI-36/make-trackpad-pinch-zoom-easier
---

## Context

The board in [`src/App.tsx`](../src/App.tsx) sets `panOnScroll`, `minZoom` 0.15, and `maxZoom` 3. `zoomOnScroll` and `zoomOnPinch` are left at the React Flow defaults, both on. With `panOnScroll`, a wheel that is not a pinch pans the board. A pinch is a wheel event the browser marks with `ctrlKey`, and that event zooms. Ctrl+wheel (Cmd+wheel on a Mac) zooms the same way. The zoom amount follows the library wheel scale. Nothing in the app changes that scale.

FigJam uses the same split: a pinch zooms toward the cursor, and a two-finger swipe pans. A small pinch there moves the zoom a useful step. On this board the pinch is easier to lose into a pan, and a modest pinch barely changes the zoom.

## Problem

Trackpad zoom takes more effort than it does in FigJam. A pinch that should zoom often pans, and a pinch that does zoom moves too little. Getting from an overview to a readable zoom takes a long gesture.

## Repro

1. Open a board with several elements and rest two fingers on the trackpad.
2. Pinch in a small amount, then a modest amount. Compare the zoom change with the same gesture in FigJam. The board either pans or zooms much less.
3. Swipe two fingers to scroll. The board pans. That part should stay.
4. Hold Ctrl (Cmd on a Mac) and roll a mouse wheel over empty canvas. The board zooms. That path should keep working.

## Acceptance criteria

- [ ] A trackpad pinch zooms in and out toward the pointer, including a small pinch. The same gesture does not pan
- [ ] One modest pinch changes the zoom by a clearly visible step, closer to FigJam than to the current wheel scale, and does not jump from the minimum to the maximum
- [ ] A two-finger scroll still pans and does not zoom
- [ ] Ctrl+wheel on Windows and Cmd+wheel on a Mac still zoom toward the pointer
- [ ] Zoom stays inside 0.15–3
- [ ] The gesture works over empty canvas and over an element that is not being edited, with Select, Hand, or the Arrow tool active
- [ ] A pinch or Ctrl/Cmd+wheel that starts over highlighted element text still zooms, as in NB-26
- [ ] Space+drag, middle-button drag, and the Hand tool still pan. Double-click zoom and the minimap are unchanged

## Technical notes

Keep the split React Flow already has: a pinch and a modifier+wheel zoom, a plain wheel pans. Raise the zoom scale for the pinch / modifier wheel only, and keep the zoom anchored on the pointer (`zoomTo` around the wheel position). Do not require a modifier key for a trackpad pinch. If a pinch is arriving as a wheel without `ctrlKey` and is therefore panned, treat that event as zoom only when it is actually a pinch, and leave a one-axis trackpad swipe as pan.

Match the feel of FigJam. Do not copy FigJam source.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

No new panel. A wheel that starts on the toolbar, the shapes menu, or the text format toolbar still does not zoom or pan.

NB-26 is the case where the wheel target is the open text editor. The new scale applies there once that gesture is allowed through.

## Out of scope

Changing `minZoom` or `maxZoom`. A zoom slider or percentage control. Scroll-to-zoom for a plain mouse wheel that has no modifier. Pinch behavior inside the noodle label field (NB-24).

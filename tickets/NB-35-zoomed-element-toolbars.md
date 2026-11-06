---
id: NB-35
title: Keep text and color toolbars on a zoomed-in element
status: In Progress
priority: 2
labels: [Bug, UX, Toolbar]
parent: NB-E1
blockedBy: []
estimate: 3
linear_id: ERI-45
linear_url: https://linear.app/ericar/issue/ERI-45/keep-text-and-color-toolbars-on-a-zoomed-in-element
---

## Context

A selected sticky, text object, or shape mounts its bars through [`SelectionChrome`](../src/SelectionChrome.tsx). The text toolbar, including a shape’s kind menu, is the `above` slot from [`src/RichText.tsx`](../src/RichText.tsx). Sticky colors in [`src/StickyNode.tsx`](../src/StickyNode.tsx) and shape fill and stroke in [`src/ShapeNode.tsx`](../src/ShapeNode.tsx) are the `below` slot. An open link field is a second `above` slot, farther from the object than the text toolbar. An image has no style toolbar.

[`placeSelectionChrome`](../src/selectionChromeLayout.ts) centers each bar on the element’s full screen rect, then prefers the text bar above the top edge and the color bar below the bottom edge. If one side overflows the pane it can move both bars onto the other side. `shiftIntoView` then slides a bar that sticks out of the pane back inside. `avoidObstacles` treats `.board-toolbar` as a body to dodge, and the first candidate it tries is to the left of that pill. The file strip and the Noodle Board logo sit in `[data-canvas-chrome]` and already raise the top of the safe area. The bars themselves are screen-sized (NB-14): they render in `FloatingPanel` and do not inherit canvas zoom. The board zoom range is `minZoom={0.15}` and `maxZoom={3}`.

FigJam keeps one toolbar outside the element, above or below, and at maximum zoom places it inside the element at the bottom center. This board keeps the two bars.

## Problem

Zooming until an element runs past the pane throws the bars off the element. The color bar lands at the far left, beside the main toolbar, instead of under the element. A bar whose element center is off the pane is also clamped to the left or right edge of the pane.

At that zoom the handles and ports are not useful, so a bar may sit on the element. It has to stay the same screen size, and it has to stay centered on the part of the element that is on screen.

The text and shape toolbar stays the top bar. The color toolbar stays the bottom bar. They do not trade sides because the element is larger than the pane.

If the element’s top edge is on screen, the text toolbar sits above that edge. If the top edge is off screen, the text toolbar pins inside the element at the top center of the visible area, just below the project file bar and the Noodle Board logo. The color toolbar does the same at the bottom: below the element when the bottom edge is on screen, and inside the element at the bottom center of the visible area, just above the main toolbar, when the bottom edge is off screen.

## Repro

1. Select a sticky and zoom until the note fills the pane and its bottom edge is off screen. The color swatches sit at the far left, beside the main toolbar, not under the note.
2. Zoom until the top edge leaves the pane as well. The text toolbar is not pinned at the top center of the visible note, under the file bar and the logo.
3. Pan so the top edge comes back on screen and the bottom edge stays off. The text toolbar should return to just above the note, and the color swatches should stay inside the note, above the main toolbar.
4. Repeat with a shape. Fill and stroke take the color bar’s place. Repeat with a text object, which has only the text toolbar.

## Acceptance criteria

- [x] While a sticky, text object, or shape is selected and its top edge is inside the safe area, the text toolbar sits above that edge, centered on the element. A shape’s kind menu stays in that toolbar
- [x] While the top edge is above the safe area, the text toolbar pins inside the element. It is centered on the part of the element that is on screen, and the top of that above stack sits just below the file bar and the Noodle Board logo
- [x] While the bottom edge is inside the safe area, the color toolbar sits below that edge, centered on the element. A sticky shows its color swatches. A shape shows fill and stroke. A text object has no color toolbar
- [x] While the bottom edge is below the safe area, the color toolbar pins inside the element, centered on the on-screen part, with its bottom just above the main toolbar
- [x] The text toolbar stays the top bar and the color toolbar stays the bottom bar. An element larger than the pane does not move either bar onto the other side, and does not stack them on one side
- [x] Neither bar is placed to the left or the right of the main toolbar. Overlap with that toolbar is resolved by sitting above it
- [x] Horizontal center is the center of the element’s on-screen span. An element that runs off the left or right of the pane does not pin a bar to the pane’s left or right edge
- [x] Both bars keep a constant screen size at minimum zoom (0.15), at 100%, and at maximum zoom (3). They never scale with the canvas or with the element
- [x] The bars follow pan, zoom, and moving the element. Panning or zooming an edge back into the safe area puts that bar back outside the edge. Panning the edge off screen pins it again
- [x] An open link field stays in the above stack, farther from the object than the text toolbar, and pins with that stack
- [x] Font, alignment, list, link, shape kind, fill, stroke, and sticky color still edit the object. A menu opened from a pinned bar stays on screen at the same screen size
- [x] Pointer and wheel events on the bars do not pan the board or drag the element
- [x] A pinned bar may cover the element’s handles and ports. It stays clear of the file bar, the logo, and the main toolbar
- [x] If the safe area is too short for both pinned bars, they do not overlap. The text toolbar keeps the top pin, and the color toolbar sits beneath it, still on screen

## Technical notes

Change the placement in [`placeSelectionChrome`](../src/selectionChromeLayout.ts). Callers already pass the element’s screen rect and the safe area from [`readSafeArea`](../src/SelectionChrome.tsx).

An edge is visible when it lies inside that safe area: below the file strip, above the main toolbar, and inside the left and right of the pane. The on-screen span is the intersection of the element’s screen rect and that area. Center each bar on that span, then clamp it so the bar itself stays inside the pane.

When the preferred edge is visible, keep today’s outside placement and the port clearance from `selectionClearance`. When that edge is off screen, pin inside and do not add the port clearance, since covering handles and ports is acceptable at this zoom. Do not run the sideways obstacle dodge against `.board-toolbar`. That pill is the bottom of the safe area, the same way `[data-canvas-chrome]` is the top. A bar that would cross the minimap stays on the span’s center and above the main toolbar rather than sliding to the side.

The above stack keeps its order. The link field (order 1) stays farther from the object than the text toolbar (order 0). When the stack is pinned, its top is the safe top.

Each bar is already a FloatingPanel on the toolbar token. Do not add a z-index number. Check the bars against the selected element and against a handle mid-drag.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

No new panel. This is the existing text toolbar and the existing color toolbar, placed from the on-screen span.

A same-type group that later mounts these bars through `SelectionChrome` ([NB-34](NB-34-group-scale-and-toolbar.md)) gets this placement against the group box. Do not give that group a second placer.

## Out of scope

Merging the text toolbar and the color toolbar into one pill. The noodle toolbar and its screen gap (NB-33). The combined [`GroupToolbar`](../src/GroupSelection.tsx) that a mixed selection uses today. Where the file bar, the logo, the main toolbar, and the minimap sit. Handle and port size. New colors, fonts, or tools.

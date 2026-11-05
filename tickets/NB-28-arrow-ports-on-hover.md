---
id: NB-28
title: Show Arrow-tool ports only on the hovered element
status: Done
priority: 2
labels: [UX, Canvas]
parent: NB-E1
blockedBy: []
estimate: 2
linear_id: ERI-37
linear_url: https://linear.app/ericar/issue/ERI-37/show-arrow-tool-ports-only-on-the-hovered-element
---

## Context

The Arrow tool sets `connectMode` in [`src/App.tsx`](../src/App.tsx) and adds `noodle-connect` on the board. Sticky, text, shape, and image nodes each render four side handles from [`ObjectPorts`](../src/ObjectPorts.tsx).

Handles are hidden by default (`.react-flow__handle` is `opacity: 0`). Two rules show them: `.noodle-solo .react-flow__node.selected .react-flow__handle` while a single element is selected, and `.noodle-connect .react-flow__handle`, which sets `opacity: 1` and `pointer-events: all` on every handle for the whole time the Arrow tool is on. A node that owns a `.clickconnecting` handle also reveals every handle on that node.

[`PortMagnet`](../src/PortMagnet.tsx) already knows the element under the pointer. While a noodle end is dragged, NB-20 draws that element’s outline, four outlined midpoint ports, and a fill on the port under the pointer. The comment in `placeAt` says a port stays hidden until the element is selected or the Arrow tool is on.

NB-09 asked for ports on hover. The connect-mode CSS shows every element’s ports at once instead.

## Problem

Turning on the Arrow tool covers the board with every element’s four ports. The ports that matter are the ones on the element under the pointer.

## Repro

1. Place several stickies, shapes, text objects, and an image, spaced apart.
2. Press the Arrow tool. Every element shows four ports immediately, including elements the pointer is not over.
3. Move the pointer onto one element, then off it onto empty canvas, then onto a different element. The first element’s ports stay visible the whole time.
4. Drag a noodle off one element and across empty canvas. The element you left still shows its ports.

## Acceptance criteria

- [x] With the Arrow tool on and the pointer over empty canvas, no element shows its ports
- [x] Hovering an element shows that element’s four side ports only. Every other element stays bare
- [x] Moving onto a different element hides the previous ports and shows the new element’s four
- [x] Leaving an element, or entering the toolbar or the minimap, hides its ports
- [x] A selected element does not keep its ports visible under the Arrow tool unless the pointer is over it
- [x] While a noodle end is dragged, only the element under the pointer shows the NB-20 landing: outline, four outlined ports, fill on the port under the pointer. The element the drag started on hides its other ports once the pointer has left it
- [x] Clicking or dragging from a hovered element still starts one noodle, and dropping on a hovered element still attaches it
- [x] With the Arrow tool off, a single selected element still shows its ports as it does today. Hand and Select are otherwise unchanged

## Technical notes

Drop the blanket `.noodle-connect .react-flow__handle { opacity: 1 }` rule, and the rule that reveals every handle on a node just because one handle is `.clickconnecting`. Show the four handles for the element under the pointer only.

CSS `:hover` is not enough while a connection line is in progress, because the preview can sit above the node. Drive visibility from the hover target [`PortMagnet`](../src/PortMagnet.tsx) already resolves, including mid-drag, and clear it when that target is null. The origin port of an in-progress noodle may stay marked. The other three ports on the element that was left do not.

NB-20’s outlined-versus-filled ports and the edge marker stay as they are. They apply to the hovered element, not to the rest of the board.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

Port dots, the landing outline, and the edge marker stay on the selection token while a noodle or an element is mid-drag, and they stay under the toolbar.

## Out of scope

Where a noodle attaches, how many noodles a side can hold, and the landing geometry from NB-17, NB-18, NB-20, and NB-22. Port appearance on a selected element while the Arrow tool is off. Endpoint dots on a free noodle end. Hiding ports during Select or Hand.

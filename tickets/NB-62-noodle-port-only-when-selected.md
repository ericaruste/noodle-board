---
id: NB-62
title: Start a noodle only from a selected element's port
status: In Progress
priority: 2
labels: [Bug, Canvas, UX]
parent: NB-E1
blockedBy: []
estimate: 3
linear_id: ERI-78
linear_url: https://linear.app/ericar/issue/ERI-78/start-a-noodle-only-from-a-selected-elements-port
---

## Context

Two gestures start a noodle today, and neither one waits for a selected port.

With the Arrow tool off, [`PortMagnet`](../src/PortMagnet.tsx) listens for `pointerdown` on the board and calls [`portOnBand`](../src/PortMagnet.tsx). That hit is a band of `BAND_SCREEN_PX` (28 screen pixels) outside a side, plus 6 pixels inside the border. A hit calls `forwardEndDrag` immediately. The listener does not check that the element is selected, that the pointer is on the visible port, or that the active tool is Select. [`ignoredBandTarget`](../src/PortMagnet.tsx) skips handles, end dots, resize controls, the minimap, panels, the noodle toolbar, and endpoint nodes. It does not skip `.react-flow__edge`, so a press on a noodle stroke can still fall inside the band.

[`portAtClient`](../src/PortMagnet.tsx) is the Arrow-tool hit. Inside an element it returns that element's nearest side, including a press in the middle. Outside every element it falls through to [`closestPerimeter`](../src/PortMagnet.tsx) at the same 28px band, so a gap between elements still resolves a port. Both searches pick the closest side, then the higher z-index only as a tie break, so a press on the element on top can still match the side of the element underneath.

React Flow is given `connectionRadius={PORT_SCREEN_RADIUS}` in [`src/App.tsx`](../src/App.tsx). That radius is 48 screen pixels ([`src/noodleEnds.ts`](../src/noodleEnds.ts)), so a press near a handle starts a connection even when the visible port was not the target.

Handles themselves stay inert unless a rule turns them on ([`src/index.css`](../src/index.css)). On Select, `.noodle-solo .react-flow__node.selected .react-flow__handle` shows the four ports of the selected element. On the Arrow tool, `.noodle-ports-show` shows the ports of the element under the pointer (NB-28). The band listener does not wait for either rule.

NB-22 kept a click on a noodle stroke, away from a port, as the way to select that noodle and open its toolbar. NB-23 made Select the default tool: a click selects, and a drag from empty canvas is the marquee from NB-30. NB-03 still reconnects an existing end from its knob.

## Problem

A noodle drag starts from presses that are not a port.

Dragging or selecting an element that sits on top of another element grabs the noodle port of the element underneath. Clicking the gap between elements starts a noodle drag too, with the Select tool on and nothing selected. Clicking a noodle to open its toolbar goes straight into a noodle drag and grabs another element's port.

A noodle starts only when the Select tool or the Arrow tool is on, an element is selected, the pointer is over that element's port, and the user presses that port.

## Repro

1. Place two stickies, shapes, or other elements so one overlaps the other. Select the element on top, or drag it. The element underneath arms a noodle port and a noodle drag starts from that port.
2. Leave a gap between two elements. Turn on the Select tool and select nothing. Click in the gap. A noodle drag starts from a nearby port.
3. Draw a noodle between two elements. With the Select tool on, click the noodle stroke to open its toolbar. The gesture becomes a noodle drag and grabs another element's port. The noodle toolbar does not open.
4. Repeat 2 and 3 with the Arrow tool off and the Hand tool off. The same presses still start a noodle.

## Acceptance criteria

- [x] A noodle drag starts only when the Select tool or the Arrow tool is on, an element is selected, the pointer is over that element's port, and the user presses that port
- [x] With the Select tool on and nothing selected, a click in the gap between elements does not start a noodle and does not grab a port. A drag that starts on empty canvas still draws the marquee (NB-30)
- [ ] Dragging or selecting an element that overlaps another does not start a noodle from the element underneath, and does not select that underneath port. The element on top is the one that moves or becomes selected
- [x] A click on a noodle stroke, away from a port, selects that noodle and opens the noodle toolbar. It does not enter a noodle drag and does not grab another element's port
- [x] Hovering a port, or the area beside an element, does not arm a noodle when that element is not selected. This holds for Select and for Arrow
- [x] Ports stay hidden until that element is selected. Hovering an unselected element does not show its ports
- [x] The Hand tool never starts a noodle from a port, a gap, an overlap, or a click on a noodle
- [ ] Pressing the visible port of a selected element, with Select or Arrow on, still starts one noodle. Releasing it over an element still attaches (NB-22). Dropping an existing end on empty canvas still parks it (NB-03)
- [ ] Clicking or dragging a selected element's body, away from its ports, still selects and moves that element and does not start a noodle
- [ ] Dragging the visible end knob of an already selected noodle still reconnects that end (NB-03)
- [x] With the Arrow tool on, a click on an element body, or on an element that is not selected, does not start a noodle

## Technical notes

Gate the start of a noodle on the four conditions in the acceptance list. `portOnBand` must not call `forwardEndDrag` for a gap, for an unselected element, for the element underneath an overlap, or for a press whose target is the noodle stroke. `portAtClient` must not treat the element body, or the 28px band in a gap, as a port press.

The 48px `connectionRadius` has to follow the same gate. A press near a handle is not a port press unless that handle belongs to the selected element and the pointer is on the port.

`closestPerimeter` and `portOnBand` choose by distance first. A press on the element on top has to stay on that element. The element underneath is not a candidate while the pointer is inside the element on top.

This replaces the start gesture from NB-28 and the manual side-band start from NB-22. Those tickets stay as they are for landing, for the noodle toolbar on a real stroke click, and for reconnecting an end knob. NB-28's "hover shows ports, and a click on the hovered element starts a noodle" no longer holds: the element is selected first, then the port is the hit.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

This ticket adds no panel. The port fill, the landing outline, and the edge marker stay on the selection token while a noodle that was started from a real port press is mid-drag.

## Out of scope

Where a noodle attaches, and the stored fraction (NB-17, NB-18). Landing once a drag was started from a selected port (NB-22). The drag-preview drawing (NB-20, NB-29). Noodle toolbar contents and the gap above the arrow (NB-33, NB-50). Hand-tool panning. Port size, color, and tokens.

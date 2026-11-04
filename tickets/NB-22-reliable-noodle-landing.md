---
id: NB-22
title: Land noodles reliably and stay in connect mode
status: In Progress
priority: 2
labels: [Bug, Canvas, UX]
parent: NB-E1
blockedBy: []
estimate: 3
linear_id: ERI-30
linear_url: https://linear.app/ericar/issue/ERI-30/land-noodles-reliably-and-stay-in-connect-mode
---

## Context

NB-20 is merged. Releasing a dragged noodle end over an element, including its center, is supposed to attach at the projected point and must not select the element or open text editing. A plain click with no connection in progress still selects.

Two gestures create or move a noodle:

- **Arrow tool.** [`connectMode`](../src/App.tsx) stays on until another tool or Escape. [`ConnectMode`](../src/ConnectMode.tsx) click-to-connect arms `connectionClickStartHandle` on the first element and completes on the second. A drag calls `forwardEndDrag` and finishes through React Flow. `connectOnClick` is also on while the tool is active.
- **Manual.** With the Arrow tool off, a drag from a side band ([`portOnBand`](../src/PortMagnet.tsx) in [`PortMagnet`](../src/PortMagnet.tsx)) or from an existing end knob ([`onReconnect`](../src/App.tsx)) finishes in [`onConnectEnd`](../src/App.tsx) / [`onReconnectEnd`](../src/App.tsx).

Selection chrome renders whenever the node is `selected`: the text toolbar in [`RichText`](../src/RichText.tsx), sticky colors in [`StickyNode`](../src/StickyNode.tsx), and fill/stroke in [`ShapeNode`](../src/ShapeNode.tsx). Nothing in connect mode or an in-progress drag hides that chrome. [`armClickSwallow`](../src/portHot.ts) only blocks click and double-click for 400ms after a drag release. It does not clear selection.

[`ConnectMode`](../src/ConnectMode.tsx) cancels a pending click-connection when `pointerdown` misses [`portAtClient`](../src/PortMagnet.tsx). Its blocked list includes `[data-noodle-toolbar]` and does not include `[data-text-toolbar]`, `[data-selection-chrome]`, `[data-sticky-colors]`, or `[data-shape-colors]`. Those panels are portaled by [`FloatingPanel`](../src/FloatingPanel.tsx), so a click on them is not a click on the node.

The drop itself is split. If React Flow reports `isValid` and `toHandle`, [`onConnectEnd`](../src/App.tsx) only realigns an edge [`onConnect`](../src/App.tsx) already created and then returns. Otherwise it uses the hover target, then `portAtClient` only while the Arrow tool is on, then [`nearestPort`](../src/PortMagnet.tsx) inside `PORT_SCREEN_RADIUS` (48 screen pixels of the outline). [`onConnect`](../src/App.tsx) also returns immediately while `gestureEdgeRef` is set, and that ref is cleared on a microtask. A capture-phase `mouseup` in `PortMagnet` calls `placeAt`, which clears the hover target once `connection.inProgress` is already false.

## Problem

Choosing the element a noodle should land on leaves noodle-connecting and opens that element’s toolbar.

While the Arrow tool is connecting, or while a noodle end is being dragged, the landing click or release selects the sticky, text, shape, or image. The text toolbar and the color or paint chips appear on top of the board. The session is no longer only a noodle connection: the element is selected, and its chrome can sit under the next click.

The same landing is unreliable for both the Arrow tool and a manual drag. Sometimes the noodle attaches. Sometimes the release or the second click does nothing, including when the pointer is over the element the user aimed at. A click that hits the toolbar that just opened is one way the Arrow tool drops the pending connection: that click is outside the node, `portAtClient` misses, and `ConnectMode` clears `connectionClickStartHandle`. The drag path can also miss when the hover target has already been cleared and the pointer is farther than 48 screen pixels from the outline, which is the center of a large element. Manual drags do not use the whole-element `portAtClient` fallback that the Arrow tool uses.

A port that already has a noodle has a second problem. Noodles use `zIndex: layers.canvas`, so the edge interaction path is painted above the element and covers the port. The press still starts a connect, because the port is found from geometry. The click that follows `pointerup` then hits the noodle. React Flow selects that edge, and the noodle toolbar opens. The session is no longer only a drag or a click-to-connect. On the Arrow tool this click is easy to miss: `pointerup` records the origin, and `portAtClient` then skips that origin, so the click is not treated as part of the connect.

## Repro

1. Turn on the Arrow tool. Click a sticky to start a noodle, then click a second sticky, text object, or shape to land it. The target becomes selected and its text toolbar (and sticky colors or shape fill/stroke) appears. Repeat the landing click. Sometimes a noodle appears, sometimes the pending connection disappears and no noodle is created.
2. With the Arrow tool still on, drag from one element onto the center of another and release. Sometimes the noodle attaches. Sometimes it does not, and the target shows its selection toolbar.
3. Turn the Arrow tool off. Drag from a side of one element onto another, including the center, and release. Sometimes the noodle attaches. Sometimes the line disappears and the target is selected with its toolbar open.
4. Drag an existing noodle end onto another element and release. Same split: some drops attach, some do not, and the landing element shows its toolbar.
5. Click an element while no noodle is being connected and the Arrow tool is off. It still selects and shows its toolbar.
6. With a noodle already on a port, turn on the Arrow tool and click that port. The noodle toolbar opens (color, line style, label, arrowheads). Turn the Arrow tool off and click the same port to start a manual drag. The toolbar opens again.
7. Click a noodle away from any port, with the Arrow tool off and no drag in progress. The noodle toolbar opens. That one stays.
8. Drag a new noodle from a port, or drag an existing end, and press Escape before release. The drag keeps going and the release still attaches or parks the end. Escape only leaves the Arrow tool when that tool is on and nothing is being dragged.

## Acceptance criteria

- [x] While the Arrow tool is armed or a noodle end is being dragged, the element chosen as the landing target is not selected
- [x] That landing does not show the text toolbar, sticky color chips, or shape fill/stroke panel, and it does not open text editing
- [x] The Arrow tool stays in connect mode after the noodle lands. Escape or another tool is still what leaves connect mode
- [x] A manual drag (Arrow tool off) stays a noodle drag through the release. The landing element does not become selected because of that drop
- [x] Arrow-tool click-to-connect attaches a noodle every time the second click is on an element, including its center
- [ ] Arrow-tool drag, manual side drag, and dragging an existing end attach every time the pointer is released over an element, including its center
- [ ] Repeating those four gestures on stickies, text, shapes, and images does not alternate between a landed noodle and a missed one
- [x] A click or release on empty canvas does not invent an attachment. An existing end dropped on empty canvas still parks there (NB-03)
- [x] With the Arrow tool off and no noodle drag in progress, a click still selects the element and shows its toolbar
- [x] With the Arrow tool on, clicking a port that already has a noodle does not select that noodle and does not open the noodle toolbar. The click still starts or completes the connection
- [x] With the Arrow tool off, a drag started by clicking a port that already has a noodle does not select that noodle and does not open the noodle toolbar. The gesture stays a noodle drag until release
- [x] While that connect is in progress, the noodle toolbar stays closed
- [x] Clicking a noodle away from a port, with the Arrow tool off and no drag in progress, still selects it and shows the noodle toolbar
- [x] While a noodle is being dragged — an Arrow-tool drag, a manual drag from a port, or an existing end — Escape cancels that drag. No noodle is created, and an existing end stays where it was. The Arrow tool stays on when it was already on
- [x] With no drag in progress, Escape still leaves the Arrow tool
- [ ] NB-18 and NB-20 still hold: origin on a side midpoint, target at the drop, several noodles between the same pair, and the same values after undo, redo, localStorage, and `.noodle.json`

## Technical notes

Treat “noodle connecting” as one session: Arrow tool with a pending origin (`connectionClickStartHandle`), a React Flow connection drag (`connection.inProgress`), or a reconnect. For that whole session, selection changes from the landing element are suppressed, and selection chrome stays unmounted. `armClickSwallow` is too short and too late to do this; the node is already `selected` by the time the click is swallowed.

The landing hit test has to be the same for the Arrow tool and for a manual drag. Both should read one hover value captured at pointerup, and the element body, including its center, has to count. Do not let the capture-phase `mouseup` in `PortMagnet` clear that hover before `onConnectEnd` / `onReconnectEnd` read it. Do not take the `isValid && toHandle` branch when `onConnect` did not actually add an edge. Clear `gestureEdgeRef` before the next gesture can be ignored.

`ConnectMode` must not treat a click on selection chrome as “missed the board, cancel the connection.” Hiding that chrome for the session removes the overlap. The pending connection is cancelled only by empty canvas, Escape, or switching tools.

The click after a port press belongs to the connect. `beginPortGesture` marks that press, and the click is swallowed when its target is the edge. Clear edge selection on the press so a noodle toolbar that was already open closes. Do not decide that click with `portAtClient`: once `pointerup` stores the origin, an outside-the-border hit skips it. `NoodleToolbar` stays unmounted while `connection.inProgress` or `connectionClickStartHandle` is set.

Escape during `connection.inProgress` or a reconnect cancels that drag and leaves the Arrow tool as it was. `suppressConnectRef` makes `onConnect`, `onConnectEnd`, and `onReconnectEnd` drop the result. `cancelConnection` plus a `mouseup` releases React Flow's drag listeners before the real pointer comes up. Escape with no drag in progress still leaves connect mode.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

This ticket adds no panel. The existing text toolbar and color chips must stay absent for the whole connecting session, including while the end is mid-drag over the target, and a selected element’s chrome must not cover the landing zone.

## Out of scope

Attachment rules and stored fractions (NB-18). Landing-edge drawing and route clamping (NB-20). Per-noodle style (NB-09). A new toolbar or a change to how selection chrome looks when the user is not connecting a noodle.

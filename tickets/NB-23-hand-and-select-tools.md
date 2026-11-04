---
id: NB-23
title: Split pan and select into Hand and Select tools
status: Done
priority: 2
labels: [Feature, Canvas, Toolbar]
parent: NB-E1
blockedBy: []
estimate: 5
linear_id: ERI-31
linear_url: https://linear.app/ericar/issue/ERI-31/split-pan-and-select-into-hand-and-select-tools
---

## Context

The main toolbar in [`src/Toolbar.tsx`](../src/Toolbar.tsx) is Add Sticky Note, Add Text, Add Shape, Add Image, Arrow, and Delete. Arrow is the only mode button (`aria-pressed` follows [`connectMode`](../src/App.tsx)). There is no Hand tool and no Select tool. NB-11 reserved the Lucide names `hand` and `mouse-pointer-2` and left both tools out of scope.

The board in [`src/App.tsx`](../src/App.tsx) is one set of gestures for both jobs:

- `panOnDrag` is `true` unless the Arrow tool is on, so a left drag on empty canvas pans. `nodesDraggable` is on at the same time, so a left drag that starts on an element moves that element.
- `panActivationKeyCode` is unset (React Flow’s default is Space). A drag that starts on an element still moves the element.
- The mouse wheel pans only while the Arrow tool is on (`panOnDrag={[1, 2]}`). Otherwise the middle button is not a pan.
- `selectionKeyCode` and `multiSelectionKeyCode` are both Shift.

Hover and selection share the same chrome. [`.react-flow__node:hover .react-flow__handle`](../src/index.css) and the selected state both set port opacity to 1. [`NoodleResizer`](../src/NoodleResizer.tsx) draws the bounding box and the edge and corner handles when `selected` is true. Sticky colors ([`StickyNode`](../src/StickyNode.tsx)), the text toolbar ([`RichText`](../src/RichText.tsx)), and shape fill/stroke ([`ShapeNode`](../src/ShapeNode.tsx)) mount when that node is selected. A selected noodle draws its end knobs and [`NoodleToolbar`](../src/NoodleToolbar.tsx) from [`NoodleEdge`](../src/NoodleEdge.tsx). Each selected element brings its own box and its own toolbar. There is no group box and no group toolbar.

Keyboard Delete goes through `deleteKeyCode` into `onNodesChange` and `onEdgesChange`. Each of those calls `takeSnapshot` on a remove, so a mixed selection can become two undo steps. The toolbar’s `deleteSelected` already snapshots once. Copy ([`takeClipboard`](../src/duplicate.ts) / [`duplicateGraph`](../src/duplicate.ts)) only takes selected nodes, and copies a noodle when both of its ends are in that node set. A noodle that is selected on its own is not part of the copy.

## Problem

Panning and selecting are the same left-drag. The board cannot sit in a tool that only pans, or a tool that only selects. Hovering an element already reveals its ports, before anyone has chosen it. A selection of several elements draws one box and one toolbar per element. Deleting that selection with the keyboard, or copying it, does not treat the elements and the noodles as one edit.

## Repro

1. Left-drag on empty canvas. The board pans. Left-drag on a sticky, text object, shape, or image. That element moves. There is no Hand or Select control to choose which of those a left drag does.
2. Hover a sticky or shape without clicking it. The four ports appear. Click it. The bounding box, resize handles, and floating toolbar appear as well.
3. Hold Space and left-drag starting on an element. The element moves instead of the canvas panning. Press the mouse wheel and drag while the Arrow tool is off. The board does not pan.
4. Shift-click two shapes and a noodle between them. Each shape shows its own box and its own fill/stroke toolbar. Press Delete, then undo once. The shapes and the noodle do not all come back together.
5. With those three still selected, copy and then drag one of the shapes. The noodle is not part of the copy, and the drag does not move the whole selection as one edit.

## Acceptance criteria

Hand tool:

- [x] The main toolbar has a Hand tool. It is pressed while it is the active tool, and choosing it leaves the Arrow tool
- [x] A left drag pans the canvas when the pointer starts on empty canvas, an element, a port, or a noodle
- [x] While Hand is active, nothing is selected and nothing hovered shows chrome: no ports, bounding box, corner or edge handles, noodle knobs, or floating toolbars
- [x] Holding Space, then left-dragging, pans the same way from the Select tool, including when the drag starts on an element, a port, or a noodle. Releasing Space returns to Select and does not change which objects were selected
- [x] Pressing H switches to the Hand tool from Select or the Arrow tool. It does nothing while text is being edited
- [x] Pressing the mouse wheel and dragging pans from any tool, including over elements, ports, and noodles, and does not select or show hover chrome

Select tool (default):

- [x] The main toolbar has a Select tool, and it is the active tool when the board opens
- [x] Pressing V switches to the Select tool from Hand or the Arrow tool. It does nothing while text is being edited
- [x] Hovering an element shows nothing: no ports, bounding box, corner handles, or floating toolbar. Ports stay hidden until that element is clicked, or the Arrow tool is on
- [x] A single click on an element selects it and shows its controls together: the four noodle ports, the edge and corner resize handles, the bounding box, and that element’s floating toolbar
- [x] A single click on a noodle selects it and shows its end knobs and the noodle toolbar
- [x] Double-clicking an element still starts text editing
- [x] Clicking empty canvas clears the selection and hides every control
- [x] With Select active, a left drag does not pan the canvas. Panning is the Hand tool, Space+left-drag, and the mouse wheel
- [x] Shift-click still adds elements and noodles to the selection
- [x] Selecting several elements and noodles, then pressing Delete, removes them all. One undo restores them together, including the noodles. One redo removes them again
- [x] Copy and drag-to-move apply to the whole mixed selection. The selected elements and the selected noodles move together, and a copy includes those noodles. Each gesture is one undo step
- [x] A multi-selection shows one group bounding box and one floating toolbar, not one box and one toolbar per element
- [x] Changing fill, stroke, or color on that group toolbar applies to every selected element that already supports that property, in one undo step. A control whose selected values disagree shows a neutral state

## Technical notes

One active mode among Select, Hand, and Arrow. Select is the initial mode. V selects Select and H selects Hand from anywhere except a typing target (`isTypingTarget` in [`src/App.tsx`](../src/App.tsx)), and neither repeats while the key is held. `panOnDrag` is the middle button in every mode, and the left button only while Hand is active or Space is held. Select keeps `nodesDraggable` and Shift multi-select, and does not use the left button to pan. Hand sets `nodesDraggable` and `elementsSelectable` off for the gesture so a drag cannot select or move. Space uses `panActivationKeyCode` only for the duration of the key; it must win over node drag when the pointer is down on an element, a port, or a noodle.

Hide ports from hover. They stay hidden until the element is clicked or the Arrow tool is on. The opacity rule in [`src/index.css`](../src/index.css) should follow selection or the Arrow tool, not `:hover`. Per-element chrome ([`NoodleResizer`](../src/NoodleResizer.tsx), [`SelectionChrome`](../src/SelectionChrome.tsx), [`NoodleToolbar`](../src/NoodleToolbar.tsx)) mounts only for a single selected object of that kind. Two or more selected objects mount one box around their union and one toolbar.

The group toolbar reuses the existing properties: shape `fill` and `stroke` ([`ShapeNode`](../src/ShapeNode.tsx)), sticky `color` ([`StickyNode`](../src/StickyNode.tsx)), and noodle `color` ([`noodleData.ts`](../src/noodleData.ts)). A control is omitted when nothing in the selection supports it. Neutral means the control does not present one of the disagreeing values as the current choice. Apply the change through one `takeSnapshot` before the node and edge updates.

Keyboard Delete of a mixed selection has to snapshot once. `onNodesChange` and `onEdgesChange` each snapshot today, so the key path cannot record both removes as two history entries. Copy goes through [`duplicateGraph`](../src/duplicate.ts): selected nodes stay as they are, and a noodle that is itself selected is included even when NB-16 would have skipped it for not having both ends in the node set. Noodles that are not selected still follow NB-16.

The two buttons sit at the start of the current toolbar, Select then Hand, with the same pressed treatment as Arrow. NB-11 can later swap them for `mouse-pointer-2` and `hand`. This ticket does not wait for that icon bar.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

The group toolbar is a new panel. It has to stay above the group box and above a mid-drag selection, and a pointer or wheel event on it must not pan the board or move the selection.

## Out of scope

Arrow-tool connecting and landing (NB-09, NB-22). The bottom icon-pill restyle (NB-11), other than these two buttons existing on the toolbar it will restyle. Marquee selection. Resizing or rotating a multi-selection as one object. New fill, stroke, or color values. Changing when an unselected noodle is copied (NB-16).

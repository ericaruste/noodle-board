---
id: NB-34
title: Hide the leftover marquee and scale a group from its box
status: In Progress
priority: 2
labels: [Bug, Canvas, Toolbar]
parent: NB-E1
blockedBy: []
estimate: 5
linear_id: ERI-44
linear_url: https://linear.app/ericar/issue/ERI-44/hide-the-leftover-marquee-and-scale-a-group-from-its-box
---

## Context

Observed from the marquee in [NB-30](NB-30-marquee-select.md).

[`src/Marquee.tsx`](../src/Marquee.tsx) draws the Select-tool drag rectangle on the selection layer. Pointer-up commits the selection and leaves that rectangle up (`phase` `"committed"`, `visual.hit`). The fill drops out, and a dashed stroke stays, with a transparent hit stroke so a later click on it restores the selection from before the drag. NB-30 asked for that click. The rectangle is the drag’s own area. It is not the group box.

Two or more selected objects mount one dashed box in [`src/GroupSelection.tsx`](../src/GroupSelection.tsx) (`noodle-selection-stroke`) and one [`GroupToolbar`](../src/GroupSelection.tsx). The box is a stroke only. It has no edge or corner handles. [`NoodleResizer`](../src/NoodleResizer.tsx) draws those handles for a single selected node, and NB-23 hides them once the selection holds more than one object.

`GroupToolbar` turns on every property present in the selection at once: shape fill and stroke, sticky color, and noodle color. A sticky plus a shape shows both color groups. A control whose values disagree stays neutral (NB-23). Per-element toolbars mount only when `soloSelection` is true: sticky colors and the text toolbar in [`src/StickyNode.tsx`](../src/StickyNode.tsx) and [`src/RichText.tsx`](../src/RichText.tsx), shape fill, stroke, and kind in [`src/ShapeNode.tsx`](../src/ShapeNode.tsx), the text toolbar in [`src/TextNode.tsx`](../src/TextNode.tsx), and [`NoodleToolbar`](../src/NoodleToolbar.tsx) from [`src/NoodleEdge.tsx`](../src/NoodleEdge.tsx). An image has no style toolbar ([`src/ImageNode.tsx`](../src/ImageNode.tsx)).

A sticky, text object, or shape resizes freely. `keepAspectRatio` is set only on the image resizer, so an image stays proportional on every drag (NB-02). Holding Shift while dragging a handle does not lock the other types. Shift during a marquee still adds to the selection (NB-30).

## Problem

Releasing a marquee leaves the drag rectangle on the canvas after the objects are selected. That area should disappear.

A group box is only an edge. There is no handle to scale the selected objects together.

A mixed selection shows the group toolbar. A same-type group should show the toolbars one object of that type already has. A group of stickies shows the same pair as one sticky: the text toolbar above the box and the color toolbar below it. A group of shapes shows the same pair as one shape: the text toolbar above and the fill and stroke toolbar below. A group of noodles shows the noodle toolbar. A mix shows no toolbar.

Holding Shift while dragging a handle should scale proportionally, for one element and for a group.

## Repro

1. With the Select tool, drag from empty canvas across two stickies and release. The stickies stay selected, and the dashed drag rectangle stays on the canvas, covering the area that was dragged.
2. Drag across a sticky and a shape. The group toolbar shows sticky colors and shape fill and stroke together.
3. Drag across two stickies. The group box is a dashed edge. It has no corner or edge handles, so the pair cannot be scaled together.
4. Select one sticky and drag a corner while holding Shift. Width and height change independently. Select one image and drag a corner: it stays proportional with or without Shift.
5. Select two stickies. The text toolbar that sits above one sticky is absent. A color bar is all that appears.
6. Select two shapes. The text toolbar that sits above one shape is absent. Fill and stroke appear in the shared group bar.
7. Select two noodles. The noodle toolbar is absent. Only noodle color swatches appear.

## Acceptance criteria

- [x] When a marquee drag is released, its rectangle is hidden. No fill and no stroke from that drag remain. The objects it covered stay selected
- [x] While the marquee is still being drawn, the rectangle follows the pointer. Escape during that drag still cancels it, and releasing after Escape still selects nothing new
- [x] A selection of two or more objects shows one bounding box around their union, with edge and corner handles. The handles use the same visible size and resize cursors as a single element’s handles
- [x] Dragging a group handle scales the whole selection about the opposite edge or corner. Each selected element’s position and size change together, and each selected noodle’s bends and ends take the same scale. One undo restores the group. One redo applies the scale again
- [x] A group handle drag does not drop a member below that member’s existing minimum size
- [x] Per-element resize handles stay hidden while the group box is showing. A single selected object still shows its own box and handles
- [x] Holding Shift while dragging a handle on a sticky, a text object, or a shape keeps that element’s aspect ratio from the start of the drag. Without Shift, that drag still resizes freely
- [ ] An image keeps its aspect ratio on every resize, with or without Shift
- [x] Holding Shift while dragging a group handle keeps the group box’s aspect ratio from the start of the drag, including a drag that starts on an edge handle. Without Shift, the box’s width and height scale independently
- [x] Shift during a handle drag does not add or remove objects from the selection. Shift during a marquee still adds to the selection
- [x] A group of stickies shows the same toolbars as one sticky, once for the group. The text toolbar sits above the group box. The color toolbar sits below it. A control applies to every selected sticky, in one undo step. Values that disagree show the neutral state
- [x] A group of shapes shows the same toolbars as one shape, once for the group. The text toolbar, including the shape kind menu, sits above the group box. The fill and stroke toolbar sits below it. A control applies to every selected shape, in one undo step. Values that disagree show the neutral state
- [x] A group of noodles shows the same noodle toolbar as one noodle, once for the group. A control on it applies to every selected noodle, in one undo step. Values that disagree show the neutral state
- [x] A group of text objects shows the text toolbar once, above the group box. A control applies to every selected text object, in one undo step
- [x] A selection that mixes types shows no toolbar above or below the box. The group box and its handles still show, and drag, copy, duplicate, and delete still apply to the whole selection as one edit
- [x] A group of only images shows the box and handles and no toolbar
- [x] One selected object still shows its own toolbars, text above and colors below where that object has them
- [x] The text toolbar prefers the side above the group box, and the color toolbar prefers the side below it, matching one sticky or one shape. Near the pane edge each one stays on screen and returns to its preferred side when there is room. The noodle toolbar keeps the screen gap it has for one noodle. Pointer and wheel events on these toolbars do not pan the board or scale the selection, and they stay above the box and above a handle that is being dragged

## Technical notes

Clear the marquee visual on the pointer-up that commits. The in-drag rectangle stays drag feedback on the selection token and adds no z-index number of its own. NB-30’s click on the committed rectangle goes away with that rectangle. A click on empty canvas still clears the selection, as NB-23 does.

The group box is not a React Flow node, so `NodeResizer` cannot own it. Draw the edge and corner handles on the box in [`src/GroupSelection.tsx`](../src/GroupSelection.tsx), with the `noodle-resize-handle` look and the cursors from [`src/index.css`](../src/index.css). They read their layer from the selection token and add no z-index number of their own. On pointer-down, take one snapshot. Scale each selected node’s position and size about the anchor opposite the handle. Apply that same scale to each selected noodle’s bends and attachment points. A noodle that is not selected still follows its nodes when those nodes move or change size. Stop the scale when a member would pass its minimum size.

Read Shift from the pointer event during the drag. For a single sticky, text object, or shape, set proportional scaling only while Shift is held. Leave the image resizer on `keepAspectRatio`. For the group, Shift locks the box to the width/height ratio captured at pointer-down, and an edge handle then changes both axes. The handle target must consume the gesture so React Flow does not treat Shift as `multiSelectionKeyCode`.

Show the single-object toolbars once, anchored to the group box, when every selected object is the same type. Types are `sticky`, `text`, `shape`, `image`, and a selected noodle. Shape kind (rect, ellipse, and the rest) is still the shape type. `endpoint` nodes do not count. A mixed set renders nothing. Do not mount one toolbar per element, and do not keep the combined [`GroupToolbar`](../src/GroupSelection.tsx) for a same-type group.

For stickies, mount the text toolbar through [`SelectionChrome`](../src/SelectionChrome.tsx) on the above side and the sticky color bar on the below side, the same split [`src/RichText.tsx`](../src/RichText.tsx) and [`src/StickyNode.tsx`](../src/StickyNode.tsx) use for one sticky. For shapes, mount the text toolbar above, with the shape kind menu in its `extra` slot, and the fill and stroke bar below, as [`src/ShapeNode.tsx`](../src/ShapeNode.tsx) does. For noodles, mount [`NoodleToolbar`](../src/NoodleToolbar.tsx) once. For text objects, mount the text toolbar above. A style change reuses the existing apply path so one snapshot covers every member. Double-click still edits the one object under the pointer.

Each of these is a FloatingPanel on the toolbar token. Check them against the group box and against a handle mid-drag.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

No new panel. This is the existing group box, the toolbars one object of that type already uses, and the marquee rectangle.

## Out of scope

Rotation. Changing which objects a marquee selects. Lasso selection. Typing a new body into several objects at once. Double-click still edits the one object under the pointer. New colors, fonts, or tools. Letting an image resize freely. Per-element handles on a multi-selection.

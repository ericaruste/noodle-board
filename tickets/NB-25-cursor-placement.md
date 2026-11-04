---
id: NB-25
title: Place sticky, text, shape, and image from the cursor
status: Done
priority: 2
labels: [Feature, Canvas, Toolbar]
parent: NB-E4
blockedBy: []
estimate: 5
linear_id: ERI-34
linear_url: https://linear.app/ericar/issue/ERI-34/place-sticky-text-shape-and-image-from-the-cursor
---

## Context

Sticky, text, shape, and image are created the moment their toolbar control runs. In [`src/App.tsx`](../src/App.tsx), `addSticky`, `addText`, and `addShape` call `chooseTool("select")`, snapshot, and append a node at the viewport center (`canvasCenter` offsets a fixed 90px, which only centers a 180×180 sticky). `addImageAt` does the same after reading the file, unless a drop already passed a position, and that position is the cursor as the node’s top-left rather than its center. Sizes are sticky 180×180, text width 220, shape `SHAPE_DEFAULT_WIDTH` × `SHAPE_DEFAULT_HEIGHT` (180×140) from [`src/shapeData.ts`](../src/shapeData.ts), and image sides from `imageSize` (long side capped at 320).

[`src/Toolbar.tsx`](../src/Toolbar.tsx) wires those as immediate actions. Text, Shapes, and Sticky note are buttons. Image is a file input. The Shapes menu calls `onAddShape` and closes. Select, Hand, and Noodle are the only pressed tools (`BoardTool`: `"select" | "hand" | "arrow"`). Select is the default.

Nothing follows the cursor before creation. React Flow is not given `snapToGrid` or `snapGrid`. The dotted [`Background`](../src/App.tsx) (gap 22) is visual. Text editing is local state in [`src/TextNode.tsx`](../src/TextNode.tsx), started only on double-click. Paste and file-drop still call `addImageAt` directly.

## Problem

Picking a tool drops an object in the middle of the view. The user cannot aim it, and the click that chose the tool is also the click that creates it. FigJam keeps the tool armed, shows a ghost of the object under the cursor, and creates it on the next canvas click.

## Repro

1. Click Sticky note, Text, or a shape kind. A node appears at the center of the viewport. The tool returns to Select before the pointer has moved.
2. Click Image and choose a file. The image appears at that same center, not under the cursor.
3. Zoom to 25% or 200% and repeat. The new node still appears at the center, at its normal board size. There is no preview that scales with the zoom.
4. There is no Escape, right-click, or second click on the tool that can back out, because the node already exists.

## Acceptance criteria

- [x] Clicking Sticky note, Text, or a shape kind adds nothing. That tool stays pressed (`aria-pressed`) and Select does not. A translucent ghost of the object follows the cursor over the canvas
- [x] Image still opens the file picker. Choosing an image adds nothing yet. The ghost is that image at its `imageSize` box. A file that is not an image does not enter placement
- [x] The ghost hides when the pointer leaves the canvas or is over the toolbar, the shapes menu, or the other board chrome. It returns when the pointer is over the canvas again
- [x] The ghost is drawn in flow coordinates inside the viewport. At 25% and at 200% zoom its board size matches the node that click will create
- [x] The ghost does not receive pointer events. A click passes through it
- [x] One primary click on the canvas creates exactly one element, centered on the cursor (`screenToFlowPosition`). When snap-to-grid is enabled, that center is snapped to the active grid first. The tool returns to Select, the new element is selected, and the ghost is gone
- [x] The placed sticky, shape, or image matches the ghost’s size and look, including the sticky color chosen when placement started and the shape kind. The text tool opens its text field, focused, as soon as the text node is created
- [x] Escape, right-click, or clicking the pressed tool again cancels placement, adds nothing, and returns to Select. Choosing a different shape kind switches the ghost and still adds nothing. Clicking Select, Hand, or Noodle cancels placement and activates that tool
- [x] Panning, zooming, and the toolbar keep working during placement. A left click places; it does not pan. Space+drag, middle-button drag, scroll, and the wheel still pan or zoom
- [x] Clicking any toolbar control, including the control that armed placement and any shapes-menu item, does not create an element. Delete still deletes the current selection and does not drop the ghost’s object

## Technical notes

Placement is a board mode alongside Select, Hand, and Noodle, not a node. Sticky, text, and each shape kind enter it from the toolbar. Image enters it only after the file has been read and sized. Re-clicking the pressed Image control cancels and must not open the file dialog again. The shapes button is pressed for the whole time a shape ghost is up; opening its menu does not create a node.

Center the node on the flow point: `position` is that point minus half the width and height. Sticky color is chosen when placement starts so the ghost and the node use the same swatch. Snapshot once, inside the create path, as `addSticky` does today. Cancel does not snapshot and does not change nodes or edges.

Render the ghost with `ViewportPortal` in flow coordinates (width and height in board units, position at the cursor minus half the size). Give it `pointer-events: none`. Read its layer from `layers.selection` and do not add a z-index number of its own, so it paints above canvas elements and below the toolbar token. Because the ghost is not a hit target, the placement click has to be handled from the board when the event target is the pane or an existing element. Ignore primary clicks that start on the toolbar, shapes menu, save chrome, title, or minimap. While placement is active, do not let that click drag or select the element underneath. Right-click cancels on the pane and on an element, and does not open a menu.

`snapToGrid` is off. Do not add a snap control. If those React Flow props are later turned on, snap the flow center with the active `snapGrid` before applying the half-size offset, using the same grid a dragged node would use.

Text editing lives in `TextNode` and starts on double-click. Placement needs a one-shot signal so only the new text node opens `RichText` and focuses it. Clear that signal so a later reload does not reopen the field. Sticky and shape do not start editing. The create snapshot is the undo step; typing after that keeps the existing one-session history rule.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

The ghost stays under the toolbar and the shapes menu while a selection or a mid-drag element is on the board. A pointer or wheel event on the toolbar must not place an element or pan from that pointer down.

## Out of scope

Placement for the Noodle tool. Changing Hand, Select, or Arrow behavior beyond cancelling placement when those tools are chosen. Paste and drag-drop of an image file; both keep inserting immediately through `addImageAt`. A new grid-snap setting. Stamps, freehand, or drawing a size by dragging. Multi-place (staying in the tool after the click).

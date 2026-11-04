---
id: NB-24
title: Edit noodle text on the line
status: Todo
priority: 2
labels: [Feature, Canvas, Toolbar]
parent: NB-E4
blockedBy: []
estimate: 3
linear_id: ERI-33
linear_url: https://linear.app/ericar/issue/ERI-33/edit-noodle-text-on-the-line
---

## Context

A noodle’s text lives in `data.label` ([`src/noodleData.ts`](../src/noodleData.ts)), capped at 160 characters. [`NoodleEdge`](../src/NoodleEdge.tsx) draws a non-empty label through React Flow’s `EdgeLabelRenderer` as `.noodle-edge-label`. The point is the route midpoint from `labelOn` in [`src/noodleRoute.ts`](../src/noodleRoute.ts), shifted off the stroke by `labelShift` (`labelX` / `labelY`). The pill uses the noodle’s color and ignores pointer events.

Noodles are painted at `layers.canvas` (`1001` in [`src/layers.ts`](../src/layers.ts), set on edges in [`src/App.tsx`](../src/App.tsx)). The label renderer is a separate layer in the viewport and does not use that token, so the stroke paints over the text.

Selecting a noodle opens [`NoodleToolbar`](../src/NoodleToolbar.tsx) above that same point (`labelY - 28 / zoom`) through `ScreenEdgeToolbar` and `FloatingPanel`. The toolbar’s last control before the arrowhead menus is a text field (`aria-label="Text label"`, placeholder “Label”). The first keystroke in a focus session calls `snapshotBoard`; later keystrokes update the label without another snapshot. Escape blurs the field. `isTypingTarget` in [`src/App.tsx`](../src/App.tsx) treats that input as typing, and because it sits inside `[data-noodle-toolbar]`, Delete does not remove the noodle while the field is focused.

There is no text control other than that field, and nothing handles a double-click on a noodle.

## Problem

The label sits under the noodle, so the text is hidden by the stroke. The only way to write it is a field that stays open in the floating toolbar for the whole time the noodle is selected. The text should be edited on the noodle, at the point where the label already sits.

## Repro

1. Connect two elements. Select the noodle and type in the toolbar field labeled “Label”. The text appears on the line and the stroke runs over it.
2. With the noodle selected, the floating toolbar always shows that text field between the shape buttons and the arrowhead menus.
3. Double-click the noodle. No text field opens on the line.

## Acceptance criteria

- [ ] A noodle’s text paints above its stroke, including where the line passes through the label, on a selected noodle and on one that is not selected
- [ ] The floating toolbar for a selected noodle has no text field. In that field’s place is a Text button, pressed while the on-noodle field is open
- [ ] Clicking the Text button opens a text field on the noodle at the current label point. Clicking it again closes the field and keeps what was typed
- [ ] Double-clicking a noodle selects it if needed and opens that same field at the label point. The double-click does not zoom the board
- [ ] The field shows the current label. An empty label still opens the field at that point, with the “Label” placeholder
- [ ] Typing updates the text on the noodle. The field uses the noodle’s color on the same white pill as the resting label. Enter or clicking away closes the field and keeps the text. Clearing it and closing removes the label. Escape closes the field and keeps what was typed
- [ ] While the field is focused, Delete and Backspace edit the text and do not delete the noodle. One typing session is one undo step, and one redo restores it
- [ ] The field stays on the label point while the board pans or zooms, and a pointer or wheel event on it does not pan the board or drag the noodle
- [ ] The floating toolbar stays above the label and above the open field. Color, line style, thickness, shape, and arrowheads still work, and their menus still open above the toolbar

## Technical notes

Raise the resting label and the editor together, above the edge path. Noodles use `layers.canvas`. The label and the editor use the `selection` token so they paint over the stroke and stay under the toolbar token. Do not add a z-index number of their own. The editor is the label becoming editable, at `labelX` / `labelY`, not a second toolbar. `ScreenEdgeToolbar` keeps the noodle toolbar in `FloatingPanel`.

The Text button replaces the `<input aria-label="Text label">` in [`NoodleToolbar`](../src/NoodleToolbar.tsx). Match the other glyphs there: an inline T mark, `aria-label="Text"`, `aria-pressed` while the field is open. Opening the field from the button or from a double-click uses one path. `onEdgeDoubleClick` should select the edge and open the field, and it should not leave React Flow’s pane zoom (`zoomOnDoubleClick`) to run for that click. Ignore the double-click while a connection is in progress; the toolbar already hides then. If the Hand tool from NB-23 is active, a double-click does not open the field.

Keep the current history rule: the first change in a focus session snapshots once (`labelHistory` / `snapshotBoard`), and further keystrokes call `publishNoodle` only. The field is a real `input`, so `isTypingTarget` already skips board shortcuts. It will not be inside `[data-noodle-toolbar]`; Delete and Backspace must still edit the text. Max length stays 160. Empty text on close stores `""`, which already hides the resting label.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

The open field has to stay above the noodle and below the noodle toolbar, including while the noodle or either end is mid-drag. A pointer or wheel event on the field or the toolbar must not pan the board or move the noodle.

## Out of scope

Rich text on a noodle (font style, alignment, lists, links from NB-07). Moving the label off the route midpoint, or more than one label per noodle. Editing a label from the group toolbar in NB-23. Changing noodle color, shape, markers, or routing.

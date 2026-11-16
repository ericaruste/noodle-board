---
id: NB-57
title: Show one toolbar at a time on sticky and shape
status: In Progress
priority: 2
labels: [Feature, UX, Toolbar]
parent: NB-E6
blockedBy: [NB-39, NB-49, NB-56]
estimate: 3
linear_id: ERI-72
linear_url: https://linear.app/ericar/issue/ERI-72/show-one-toolbar-at-a-time-on-sticky-and-shape
---

## Context

A selected sticky mounts two bars at once. [`src/RichText.tsx`](../src/RichText.tsx) puts the text toolbar above the note whenever the note is selected. [`src/StickyNode.tsx`](../src/StickyNode.tsx) puts the color picker below it on that same selection. A selected shape does the same: the text toolbar above, and [`src/ShapeToolbar.tsx`](../src/ShapeToolbar.tsx) below, from [`src/ShapeNode.tsx`](../src/ShapeNode.tsx).

Text editing is already a double-click. `onDoubleClick` on the sticky and on the shape sets `editing`. A single click only selects. The text toolbar does not wait for that edit. It appears as soon as the element is selected, so both bars are on screen together.

The empty hint is the words "Double-click to write". [`src/RichText.tsx`](../src/RichText.tsx) draws it in its own div, with the placeholder type and `mapped.text.placeholder`. Written paragraphs take their alignment from `paragraph.align` through `noodle-align-left`, `noodle-align-center`, `noodle-align-right`, and `noodle-align-justify` in [`src/index.css`](../src/index.css). The hint div does not use those classes. An empty body is still a paragraph, and that paragraph keeps an align. A new element is left.

Sticky, shape, and text objects share this hint. A text object has only the text toolbar, so a single click on it still shows that bar.

## Problem

One sticky or one shape fills the area around the element with two toolbars. The person only needs the object controls after a click, and only needs the text controls after they have chosen to write. One bar at a time keeps the screen clear.

The hint stays on the left after the text alignment is center, right, or justify. The placeholder should sit on the same alignment as the text it stands in for.

## Repro

1. Click a sticky once. The text toolbar is above the note and the color picker is below it. The note is not editing.
2. Double-click that sticky. The caret is in the text, and both bars stay.
3. Click a shape once. The text toolbar is above the shape and the shape toolbar is below it.
4. Double-click that shape. The caret is in the text, and both bars stay.
5. Double-click a sticky, set the alignment to center, delete the text, and leave the edit. "Double-click to write" stays on the left. Repeat for right and justify, and for an empty shape and an empty text object.

## Acceptance criteria

- [x] A single click on a sticky selects it and shows only the color picker. The text toolbar is hidden. The sticky is not editing
- [x] A single click on a shape selects it and shows only the shape toolbar. The text toolbar is hidden. The shape is not editing
- [x] A double-click on a sticky starts text editing and shows only the text toolbar. The color picker is hidden for the whole edit
- [x] A double-click on a shape starts text editing and shows only the text toolbar. The shape toolbar is hidden for the whole edit, including shape swap, stroke, line weight, fill, and fill opacity
- [x] A sticky never shows the text toolbar and the color picker together. A shape never shows the text toolbar and the shape toolbar together
- [x] Ending the edit keeps the element selected and swaps back to its single-click bar. Commit (click outside) and cancel (Escape) both do this. Deselecting hides both bars
- [x] Font, size, weight, alignment, lists, and link still work from the text toolbar while the edit is open. The link field opens with that bar and does not bring the color picker or the shape toolbar back
- [x] Menus that belong to the visible bar stay with it. Opening the color picker menu does not show the text toolbar. Opening a text menu does not show the color picker or the shape toolbar
- [x] A single click on a size control inside the open text toolbar still opens the presets, and a double-click there still edits the number. That double-click does not leave text editing
- [x] A single click on a text object still shows the text toolbar. A double-click on a text object still edits it. A text object has no second bar to hide
- [x] The empty hint on a sticky, a shape, and a text object uses the same alignment as the text: left, center, right, or justify, including `text-align-last` for justify
- [x] Before the edit, the hint uses the first paragraph’s alignment. During an empty edit, the hint uses the alignment of the paragraph that holds the caret. Changing alignment while the hint is visible moves the hint immediately
- [x] The hint keeps its current wording, typeface, size, and color. A new empty element still shows the hint on the left
- [x] Written text keeps the alignment it already has. Undo and redo still restore both the text and the hint alignment
- [x] The bar that is visible stays on the toolbar layer through FloatingPanel. It stays above the selected element and above a handle that is being dragged, and it still pins the way NB-35 pins when that edge is off screen

## Technical notes

[`src/RichText.tsx`](../src/RichText.tsx) mounts `TextToolbar` when `selected` is set. For a sticky and a shape, mount it only while `editing` is set. A text object keeps the bar on selection.

[`src/StickyNode.tsx`](../src/StickyNode.tsx) mounts the color picker when `showChrome` is set. Hide it while `editing` is set. [`src/ShapeNode.tsx`](../src/ShapeNode.tsx) mounts `ShapeToolbar` the same way. Hide it while `editing` is set.

Do not add a new panel. Both bars already use `SelectionChrome` and FloatingPanel on the toolbar token in [`src/layers.ts`](../src/layers.ts). Check the one visible bar against the selected element and against a handle mid-drag. Drag-feedback overlays stay on the selection token and add no z-index number of their own.

The hint is the placeholder div in [`src/RichText.tsx`](../src/RichText.tsx), both the reading hint and the overlay shown during an empty edit. Give that div the same `alignClass` the runs already use. The align value is `paragraph.align` on the body from [`src/textBody.ts`](../src/textBody.ts).

## Out of scope

A group of stickies or shapes. [NB-34](NB-34-group-scale-and-toolbar.md) still shows that group’s text toolbar and its color or shape toolbar together, because the group text toolbar formats every member and a double-click already edits the one member under the pointer.

Noodles. The noodle toolbar stays on selection. The noodle label is an input, not this hint.

The selection box and resize handles. The wording, typeface, size, and color of the hint. List markers on an empty body. The placement ghost. Underline and strikethrough.

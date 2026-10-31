---
id: NB-07
title: Add Text objects
status: Done
priority: 3
labels: [Feature, Canvas]
parent: NB-E3
estimate: 3
linear_id: ERI-15
linear_url: https://linear.app/ericar/issue/ERI-15/add-text-objects
---

## Context

The only text today is inside sticky notes ([`src/StickyNode.tsx`](../src/StickyNode.tsx): double-click to edit, `data.text`). There is no free-floating text node. Toolbar in [`src/Toolbar.tsx`](../src/Toolbar.tsx) has no Text action. Snapshots and localStorage persist `nodes` / `edges` generically, so a new `type: "text"` can ride the existing save path.

## Problem

Users cannot place labels or headings on the board without using a sticky. Plain text is not enough: a text object needs the formatting controls from Figma’s text toolbar.

## Repro

1. Open the MVP.
2. Look for a Text tool. Only Add Sticky Note, Add Image, Delete.

## Acceptance criteria

- [x] A Text action adds a text node at the viewport center (same placement pattern as `addSticky`)
- [x] Text has no sticky chrome (no colored paper). Default is readable dark text on a transparent or near-transparent hit area
- [x] Double-click (or click when selected) edits in place; blur/Escape commits or cancels like stickies
- [x] Empty text still shows a placeholder (“Double-click to write” or similar)
- [x] Text nodes can be moved, selected, deleted, connected with noodles (handles), and resized or have a sensible min width
- [x] Undo/redo and localStorage (and `.noodle.json` once E2 exists) include text nodes
- [x] If the bottom icon toolbar (NB-11) exists, Text is an icon there; otherwise a toolbar control is enough
- [x] A selected text node shows a text toolbar on the object (no inspector panel). Controls, in Figma’s order: **font style**, **alignment**, **bulleted list**, **numbered list**, **link**
- [x] Font style matches Figma’s style menu for one face: Regular, Bold, Italic, and Bold Italic. Default is Regular. While editing, it applies to the text selection. With the node selected and no partial selection, it applies to all of the text. A selection that mixes styles shows a mixed state
- [x] Alignment matches Figma’s horizontal alignment: Left, Center, Right, and Justify. Default is left. Justify keeps the first word on the left edge and the last word on the right edge, with even spacing between words
- [x] Bulleted list and numbered list match Figma’s list controls and apply to the current paragraph. Only one list style is active at a time; choosing the other replaces it, and choosing the active one turns the list off. While editing, Enter continues the list, and Enter on an empty item ends it. `- ` or `* ` then Space starts a bullet; `1.` or `1)` then Space starts a numbered list
- [x] Link matches Figma: select a text range (or the whole node when nothing inside is selected), use the link control, and type a URL in the field above the selection. Enter applies it. Linked text is underlined. Clearing the URL removes the link. When the node is not being edited, activating a linked range opens that URL
- [x] Font style, alignment, lists, and links survive undo/redo, localStorage, and `.noodle.json`
- [x] Do this only after every criterion above works on text nodes. The same text editing and the same options (font style, alignment, bulleted list, numbered list, and link) then apply to sticky notes and to future objects that contain text. Sticky notes keep their colored paper. Existing plain `data.text` still loads. Later objects, including shapes (NB-08), use this text feature instead of a separate plain-text editor

## Technical notes

New `TextNode` + `nodeTypes.text`. One face only; do not add a font-family picker. `fontSize` may stay on the node. Store paragraphs rather than a single string: each paragraph has `align` (`left` | `center` | `right` | `justify`) and `list` (`none` | `bullet` | `numbered`), and runs of `{ text, style, href? }` where `style` is `regular` | `bold` | `italic` | `bold-italic`. Build the editor and toolbar once, and finish them on text nodes before mounting them anywhere else. Then use that same component on sticky notes and export it for later text-bearing nodes. Use `nodrag nopan` on the editor and on the text toolbar. Reuse `noodle-update-node` / snapshot events or lift node data updates into `App.tsx` if you are already touching that path.

## Out of scope

Font-family picker, font size control, line height, letter spacing, vertical alignment, underline and strikethrough as their own controls, letter case, text color, nested list indentation, list spacing, hanging lists, and markdown rendering. Links to other board objects or files. Shapes (NB-08) and the connector tool (NB-09).

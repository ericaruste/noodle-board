---
id: NB-07
title: Add Text objects
status: Todo
priority: 3
labels: [Feature, Canvas]
parent: NB-E3
estimate: 3
linear_id:
linear_url:
---

## Context

The only text today is inside sticky notes ([`src/StickyNode.tsx`](../src/StickyNode.tsx): double-click to edit, `data.text`). There is no free-floating text node. Toolbar in [`src/Toolbar.tsx`](../src/Toolbar.tsx) has no Text action. Snapshots and localStorage persist `nodes` / `edges` generically, so a new `type: "text"` can ride the existing save path.

## Problem

Users cannot place labels or headings on the board without using a sticky.

## Repro

1. Open the MVP.
2. Look for a Text tool. Only Add Sticky Note, Add Image, Delete.

## Acceptance criteria

- [ ] A Text action adds a text node at the viewport center (same placement pattern as `addSticky`)
- [ ] Text has no sticky chrome (no colored paper). Default is readable dark text on a transparent or near-transparent hit area
- [ ] Double-click (or click when selected) edits in place; blur/Escape commits or cancels like stickies
- [ ] Empty text still shows a placeholder (“Double-click to write” or similar)
- [ ] Text nodes can be moved, selected, deleted, connected with noodles (handles), and resized or have a sensible min width
- [ ] Undo/redo and localStorage (and `.noodle.json` once E2 exists) include text nodes
- [ ] If the bottom icon toolbar (NB-11) exists, Text is an icon there; otherwise a toolbar control is enough

## Technical notes

New `TextNode` + `nodeTypes.text`. Store `{ text: string, fontSize?: number }`. Use `nodrag nopan` on the editor. Reuse `noodle-update-node` / snapshot events or lift node data updates into `App.tsx` if you are already touching that path. Keep sticky notes unchanged.

## Out of scope

Rich text (bold/italic/lists), fonts picker, and markdown rendering. Shapes (NB-08) and the connector tool (NB-09).

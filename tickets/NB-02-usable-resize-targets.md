---
id: NB-02
title: Make sticky and image resize targets usable
status: Todo
priority: 2
labels: [Bug, Canvas]
parent: NB-E1
estimate: 2
linear_id: ERI-10
linear_url: https://linear.app/ericar/issue/ERI-10/make-sticky-and-image-resize-targets-usable
---

## Context

Both node types use `<NodeResizer isVisible={selected} />` with `handleClassName="h-2 w-2 ..."`:

- [`src/StickyNode.tsx`](../src/StickyNode.tsx)
- [`src/ImageNode.tsx`](../src/ImageNode.tsx)

Connection `Handle`s sit on Top/Right/Bottom/Left of the same edges. Handles in [`src/index.css`](../src/index.css) are 8×8px and hidden until hover/select. `autoScale` shrinks the resizer when zoomed out. Hovering the edge of an unselected (or even selected) node does not present a clear resize cursor.

## Problem

Resizing stickies and images is difficult. The pointer over the edge does not show a resize icon, and hit targets fight with connection handles.

## Repro

1. Add a sticky or image. Move the cursor along the border without selecting. No resize cursor.
2. Select the node. Hover the edge (not a tiny corner). Cursor often stays default or becomes a connect cursor.
3. Zoom out and try again; corner handles are hard to grab.

## Acceptance criteria

- [ ] After a sticky or image is selected, hovering a resize edge or corner shows the matching cursor (`ew-resize`, `ns-resize`, `nwse-resize` / `nesw-resize`)
- [ ] Resize hit strips are large enough to grab at default zoom and remain usable when zoomed out (do not leave 8px-only corners)
- [ ] Connection handles remain usable but do not steal the entire border
- [ ] Images keep aspect ratio while resizing (current `keepAspectRatio`); stickies can resize freely with existing min size
- [ ] Resize still takes an undo snapshot (`noodle-snapshot` / `onResizeStart`)

## Technical notes

Increase `NodeResizeControl` line/handle size; consider always-visible lines on selection with a wider invisible hit area. Offset or shrink connection handles so they sit outside the resize strip. Showing the resizer only when selected is acceptable; Figma-like hover-on-unselected is optional, not required.

## Out of scope

Rotating nodes, cropping images, and smart-guide snap while resizing (can follow in NB-12).

---
id: NB-19
title: Route floating toolbars and dropdowns through one shared layer
status: In Progress
priority: 2
labels: [Bug, UX, Toolbar]
parent: NB-E4
blockedBy: []
estimate: 5
linear_id: ERI-27
linear_url: https://linear.app/ericar/issue/ERI-27/route-floating-toolbars-and-dropdowns-through-one-shared-layer
---

## Context

Selection chrome and its menus do not share one stacking context, so a selected or dragged element can paint over a toolbar or menu.

- Text format bar and link field in [`src/TextToolbar.tsx`](../src/TextToolbar.tsx) and [`src/RichText.tsx`](../src/RichText.tsx), shape fill/stroke in [`src/ShapeNode.tsx`](../src/ShapeNode.tsx), and sticky colors in [`src/StickyNode.tsx`](../src/StickyNode.tsx) go through [`src/SelectionChrome.tsx`](../src/SelectionChrome.tsx). That portals into `.react-flow__renderer` at `zIndex: 10`.
- Font, alignment, and list menus in `TextToolbar` portal separately to `document.body` at `zIndex: 10001`.
- The noodle style bar is an `EdgeToolbar` inside the edge in [`src/NoodleEdge.tsx`](../src/NoodleEdge.tsx). Its color menu and start/end arrowhead menus in [`src/NoodleToolbar.tsx`](../src/NoodleToolbar.tsx) are `absolute` with `z-10`, still inside that edge.
- Selection handles portal into `.react-flow__viewport` at `RESIZE_LAYER_Z = 10000` in [`src/NoodleResizer.tsx`](../src/NoodleResizer.tsx). Noodles use `NOODLE_Z_INDEX = 1001` in [`src/App.tsx`](../src/App.tsx). End knobs use `ENDPOINT_Z = 2100` in [`src/noodleEnds.ts`](../src/noodleEnds.ts). `elevateEdgesOnSelect` lifts edges with the selection, and a drag lifts the node again.
- The shapes flyout in [`src/Toolbar.tsx`](../src/Toolbar.tsx) and the recent-boards menu in [`src/RecentMenu.tsx`](../src/RecentMenu.tsx) use their own `z-30`. The top chrome in `App.tsx` is `z-20`. Alignment guides in [`src/index.css`](../src/index.css) are `z-index: 4000`.

NB-14 already keeps this chrome a fixed screen size. This ticket is only about which layer it paints on. There is no modal yet.

## Problem

Each floating panel picks its own portal and z-index. A selected node, a node mid-drag, a noodle, an end knob, a port, or a selection handle can cover or cross a toolbar or dropdown. The panel then stops receiving clicks. A later menu can also slip under the top chrome (the save cluster on the left, the tool pill, and the title) or off the canvas edge.

## Repro

1. Select a sticky, text object, or shape that sits under another selected object, or drag a second object across its format bar or fill/stroke picker.
2. Select a noodle and open the color menu and each arrowhead menu while another selected or dragged object, a noodle, an end knob, or a resize handle crosses that bar.
3. Repeat near the save cluster, the tool pill, the title chip, and a canvas edge.
4. Confirm the shapes flyout and the recent-boards menu the same way.

## Acceptance criteria

- [x] One layering module owns the z-index tokens, in this order: canvas, selection, toolbar, dropdown, modal. `FloatingPanel` is the only wrapper for a toolbar, dropdown, or popover, and it renders through one portal above the canvas
- [x] The noodle style bar, text format bar, fill/stroke picker, sticky color bar, and the color, line-style, and arrowhead menus use `FloatingPanel`. The shapes flyout and the recent-boards menu do too. None of them sets its own z-index
- [x] Each panel renders above all nodes, noodles, end knobs, ports, and selection handles, including selected elements and elements mid-drag
- [x] Each panel still follows its element when the canvas is panned or zoomed and while the element is dragged, so moving it into the portal never leaves it behind
- [x] None is covered or crossed, including near the sidebar (the save cluster and the rest of the top chrome) and the canvas edges
- [x] Each stays clickable while it overlaps any of those elements. Choosing a style, color, arrowhead, shape, or recent board still edits or opens what it does today
- [x] The existing port highlight reads its layer from the selection token, not a hardcoded number
- [x] Every panel stays below the modal token. A dialog that uses that token covers the panels
- [x] `.cursor/rules` and [`tickets/_template.md`](_template.md) state that every new toolbar, dropdown, and popover uses `FloatingPanel` and the tokens, and that a ticket is not done until those panels have been checked against selected and mid-drag elements

## Technical notes

Put the tokens in one module (for example `src/layers.ts`) and read them from the noodle, endpoint, resize-layer, alignment-guide, and top-chrome stacks so those layers cannot drift back to magic numbers. `FloatingPanel` should portal once, above the React Flow renderer and below the modal token, and keep `nodrag` / `nopan` / `nowheel` plus the pointer and wheel handling NB-14 already relies on. Position can stay in `SelectionChrome` and `EdgeToolbar`; only the paint layer moves.

Local stacking inside one node (resize strip, port, shape text) does not compete with panels and can stay. Do not invent a modal. Reserve the token so the first dialog has a place to sit.

The rule in `.cursor/rules` should be short enough that [`tickets/_template.md`](_template.md) can carry the same sentence, so a copied ticket already includes the check.

Drag-feedback overlays (port fill, edge outline, edge marker) must read their layer from the selection token in the tokens module and add no z-index numbers of their own (to be followed on NB-20). These overlays don’t exist yet, so this ticket only sets the rule.

## Out of scope

New formatting or color options. Restyling the top bar or moving it (NB-10, NB-11). Resize-handle hit targets (NB-02). Anything that is not a toolbar, dropdown, or popover. Building the drag-feedback overlays (to be followed on NB-20).

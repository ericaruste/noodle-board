---
id: NB-80
title: Project toolbar frosted blur
status: Todo
priority: 3
labels: [Bug, UX, Toolbar]
parent: NB-E6
blockedBy: []
estimate: 1
linear_id: ERI-96
linear_url: https://linear.app/ericar/issue/ERI-96/project-toolbar-frosted-blur
---

## Context

[`src/ProjectToolbar.tsx`](../src/ProjectToolbar.tsx) is the bar from [NB-72](NB-72-project-toolbar.md). Its class list has the border, `bg-mapped-surface-default`, and `shadow-lg`, but no `backdrop-blur-xl`. [NB-78](NB-78-project-management-toolbar-on-the-board.md) placed that bar on the board through [`src/ProjectManagementToolbar.tsx`](../src/ProjectManagementToolbar.tsx), in a FloatingPanel on the toolbar layer.

Every other floating surface on the board uses `backdrop-blur-xl`, the existing 24px frost: the main toolbar in [`src/Toolbar.tsx`](../src/Toolbar.tsx), the text, shape, and noodle toolbars, their popovers, the pill row in [`src/PillRow.tsx`](../src/PillRow.tsx), the color picker, and the project menu panels in [`src/ProjectMenu.tsx`](../src/ProjectMenu.tsx).

`mapped.surface.default` is `#F6F9FD` at 60%, so without the blur the canvas dots show sharp through the bar.

[`docs/design-system-notes.md`](../docs/design-system-notes.md) records the gap as if it were intended. The Project toolbar section's Blur row reads "the trial adds none. The white sheet shows none". The board table in the Project management toolbar section reads "the bar and the menus keep their own", and the bar has none.

## Problem

The project toolbar is the only floating bar on the board with no frost. The dots behind it stay sharp, while the main toolbar and the project menu under it blur them. The notes describe the missing blur as a decision.

## Repro

1. Open the board.
2. Compare the project toolbar in the upper left with the main toolbar at the bottom. The dots behind the main toolbar blur. The dots behind the project toolbar stay sharp.
3. Open the project menu from the logo. The menu blurs the dots. The bar above it does not.

## Acceptance criteria

- [ ] The project toolbar on the board blurs the canvas behind it with the same frost as the main toolbar
- [ ] The project toolbar trial and the project management toolbar trial show the same bar, with the blur
- [ ] The Project toolbar and Project management toolbar sections in `docs/design-system-notes.md` record the blur as the existing 24px blur, `not a token`

## Technical notes

Add `backdrop-blur-xl` to the bar's class list in [`src/ProjectToolbar.tsx`](../src/ProjectToolbar.tsx), after `shadow-lg`, the same order the main toolbar uses. Keep the `TODO token mismatch: Figma 10px` comment.

Backdrop blur only shows what is behind the element's backdrop root. Check in the browser that the FloatingPanel wrapper in `ProjectManagementToolbar` does not set `filter`, `opacity` below 1, `backdrop-filter`, or `will-change` in a way that stops the blur. If it does, the blur goes on the panel instead, and the bar keeps its classes.

In the notes, set the Project toolbar Blur row (currently "the trial adds none. The white sheet shows none") and the Blur row of the Project management toolbar board table (currently "the bar and the menus keep their own") to `not a token | the existing 24px blur`. Leave the trial row "this trial adds none of its own" in the Project management toolbar section only if it still describes the trial's own pieces; the bar inside it now has the blur.

The trials sit on a plain page, where a blur shows no visible change. Check the result on the board, over the dot grid.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

## Out of scope

The bar's fill, stroke, shadow, padding, and radius. The project menu, which already has the blur. The logo, the title input, and the save indicator. Adding a token for blur. Shadows, blur, and the dot grid stay out of the token build.

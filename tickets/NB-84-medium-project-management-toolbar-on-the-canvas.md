---
id: NB-84
title: Medium project management toolbar on the canvas
status: Done
priority: 3
labels: [Feature, UX, Toolbar]
parent: NB-E6
blockedBy: [NB-83]
estimate: 1
linear_id: ERI-100
linear_url: https://linear.app/ericar/issue/ERI-100/medium-project-management-toolbar-on-the-canvas
---

## Context

[`src/App.tsx`](../src/App.tsx) mounts [`src/ProjectManagementToolbar.tsx`](../src/ProjectManagementToolbar.tsx) on the board with `placed` and no `size`. The component defaults to `lg`: 40px logo, title, and save indicator, and 220px menu panels.

[NB-83](NB-83-project-management-toolbar-size.md) added `size`. `md` passes `md` to [`src/ProjectToolbar.tsx`](../src/ProjectToolbar.tsx) and [`src/ProjectMenu.tsx`](../src/ProjectMenu.tsx): 32px parts and 180px panels. Menu rows stay `MenuItem` `md` on both sizes. The trial at `?trial=project-management-toolbar` shows `lg`, then `md`. That ticket left the board on `lg`.

The bar is a FloatingPanel on the toolbar layer, 16px from the top and the left. The open menu is one FloatingPanel on the dropdown layer, 4px under the bar. `data-canvas-chrome` is on the bar. [`src/NoodleEdge.tsx`](../src/NoodleEdge.tsx) `measureFrame` reads that box and sets the visible top to its bottom. The file error banner is `left-4 top-20` on `layers.selection`.

## Problem

The canvas still shows the large project management toolbar. The medium bar exists only on the trial.

## Repro

1. Open the board. The upper-left bar is 40px parts, and the menu panels are 220px.
2. Open `?trial=project-management-toolbar`. The second specimen is the medium bar: 32px parts and 180px panels.
3. The board does not use that specimen.

## Acceptance criteria

- [x] The board shows the project management toolbar at `md`: 32px logo, title, and save indicator, and 180px menu panels
- [x] The logo menu, the file actions, the title rename, and the save pulse still work at that size
- [x] The bar stays a FloatingPanel on the toolbar layer and the menus stay on the dropdown layer, above a selected element and an element that is mid-drag
- [x] The trial pages still show `lg` and `md`. An unset size stays `lg`
- [x] The project toolbar and project management toolbar sections in `docs/design-system-notes.md` record that the board uses `md`

## Technical notes

Pass `size="md"` on the board's `ProjectManagementToolbar` in [`src/App.tsx`](../src/App.tsx). Leave the component default at `lg`. [`ProjectManagementToolbarPreview`](../src/ProjectManagementToolbar.tsx) keeps the unlabeled `lg` specimen and the `size="md"` specimen.

`md` is already wired. The logo, the title input, and the save indicator become 32px. Both menu panels become 180px. Rows stay `MenuItem` `md`. The shell padding (`brand.scale.4`), gap (`brand.scale.8`), corner (`alias.border-radius.xl`), stroke, fill, shadow, and blur stay as they are. The logo press at `md` is already 13.44px with a 0.8px dip.

The bar stays a FloatingPanel on the toolbar layer, 16px from the top and the left. The menus stay one FloatingPanel on the dropdown layer. `data-canvas-chrome` stays on the bar. `measureFrame` reads that box, so the noodle obstacle shrinks with the shorter bar. No change there.

On `md` the bar is 40px inside the stroke and 42px outside. With the 16px inset, the bottom is about 58px. The file error banner at `top-20` (80px) still clears it. Leave the banner.

Update [`docs/design-system-notes.md`](../docs/design-system-notes.md). In the project toolbar section, the board places the bar at `md`. The `lg` table stays the `lg` table. In the project management toolbar section, the board uses `md`: 32px parts and 180px panels. In Decisions already made, the sentence that says the board uses `lg` becomes `md`. The placement, layers, title commit, captions, empty recents, and hit area stay as they are.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

## Out of scope

Changing the unset default. A `sm` toolbar. The trial pages and their registration in [`src/main.tsx`](../src/main.tsx). Padding, gap, corner, and the 200px title minimum on `md`. The file error banner. The save pulse, the menu actions, and the title commit. The 700ms return to the circle from [NB-77](NB-77-motion-list-and-component-animations.md).

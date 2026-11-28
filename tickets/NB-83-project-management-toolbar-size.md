---
id: NB-83
title: Project management toolbar size
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id: ERI-99
linear_url: https://linear.app/ericar/issue/ERI-99/project-management-toolbar-size
---

## Context

[`src/ProjectManagementToolbar.tsx`](../src/ProjectManagementToolbar.tsx) joins [`src/ProjectToolbar.tsx`](../src/ProjectToolbar.tsx) and [`src/ProjectMenu.tsx`](../src/ProjectMenu.tsx). The toolbar is 40px parts: the logo button, the title input, and `<SaveIndicator size="lg">`. Both menu panels are `w-[220px]`. Their rows are `MenuItem` `md` (32px).

The building blocks now have smaller sizes: the title input `md` from [NB-81](NB-81-title-input-size.md), the logo button `md` from [NB-82](NB-82-logo-button-size.md), and `SaveIndicator` `md`. Figma frame 570:3082 shows a medium project management toolbar.

## Problem

The project management toolbar has one size, so a medium version cannot be tried.

## Repro

1. Open `?trial=project-management-toolbar`.
2. Only the 40px toolbar and the 220px menus are shown.

## Acceptance criteria

- [x] `ProjectToolbar` takes `size`: `lg` or `md`. Unset is `lg`. `md` passes `md` to the logo button, the title input, and the save indicator
- [x] `ProjectMenu` takes `size`: `lg` or `md`. Unset is `lg`, 220px. `md` makes both the main panel and the recent panel 180px. Rows stay `MenuItem` `md` on both sizes
- [x] `ProjectManagementToolbar` takes `size` and passes it to the toolbar and the menu
- [x] `?trial=project-management-toolbar` shows `lg` and `md`, each with a working menu and recent panel
- [x] The board stays `lg`
- [x] The project toolbar, project menu, and project management toolbar sections in `docs/design-system-notes.md` record `size`

## Technical notes

| Size | Logo | Title input | Save indicator | Menu panels | Menu rows |
| --- | --- | --- | --- | --- | --- |
| `lg` | `lg` 40px | `lg` 40px | `lg` 40px | 220px | `md` 32px |
| `md` | `md` 32px | `md` 32px | `md` 32px | 180px | `md` 32px |

The toolbar shell keeps its padding (`brand.scale.4`), gap (`brand.scale.8`), and corner (`alias.border-radius.xl`) on both sizes until Figma 570:3082 can be read. No spacing token is 180px: `TODO token mismatch: 180px`, the same as the 220px today.

The parent passes its `size` down. The building blocks keep their own size records. The menu and panels keep their FloatingPanel and `dropdown` layer on the board.

## Out of scope

A `sm` toolbar. Switching the board to `md`. The return-to-circle timing still open from NB-77.

---
id: NB-76
title: Project menu title clip
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: [NB-75]
estimate: 2
linear_id: ERI-92
linear_url: https://linear.app/ericar/issue/ERI-92/project-menu-title-clip
---

## Context

The project menu already lists recent names. A long name does not stay inside the panel.

[`src/ProjectMenu.tsx`](../src/ProjectMenu.tsx) is the menu from [NB-73](NB-73-project-menu.md). [NB-75](NB-75-project-menu-layout.md) is the layout: a divider under Recent, a wrapper around View all and the three names, and indent on those rows. The recent panel lists every name passed in. Both panels are 220px wide, class `panelClass`. The names go through `ProjectRow`, which renders [`src/MenuItem.tsx`](../src/MenuItem.tsx) at `md` with the bowl-chopsticks icon. The three names in the main menu set indent. The recent panel does not. View all is its own row, indented, with no icon.

`MenuItem` draws the label with `whitespace-nowrap` and no ellipsis. The button is `w-full` and `shrink-0`. The wrapper around View all and the names is a grid child without `min-w-0`, so a long label widens that wrapper and the rows paint past the 220px stroke. A recent-panel row is a direct grid child, and it overflows the same way. The panel width stays 220px. The text does not clip.

The full-title hover label already exists on the title field in [`src/TitleInput.tsx`](../src/TitleInput.tsx) and on the main toolbar in [`src/Toolbar.tsx`](../src/Toolbar.tsx). It is the dark label, `rounded-md`, `bg-slate-900`, `px-2 py-1`, `text-xs`, `font-medium`, white, `shadow-lg`, 8px above the control. It is not the browser `title` attribute. On the title field it shows only when the title is clipped, and a long title wraps at 320px.

`?trial=project-menu` and `#project-menu` show the menu with View all selected and the same menu with View all not selected. The specimen names are short, so none of them overflow. `?trial=menu-item` shows the sizes, the states, the slots, and one indented row. The live board still mounts [`src/SaveToolbar.tsx`](../src/SaveToolbar.tsx).

## Problem

A project name longer than the row runs out of the 220px panel. The name under Recent and the same name in the View all panel both do this. There is no ellipsis, and hovering the row does not show the full title.

## Repro

1. Open `?trial=project-menu`.
2. Replace a name under Recent, and the same name in the recent panel, with a title longer than the row.
3. The row grows past the 220px panel. The text stays on one line and paints outside the stroke.
4. Hover the row. No full-title label appears.

## Acceptance criteria

- [x] A project name under Recent clips to its row when the name is longer than that row
- [x] A project name in the View all panel clips to its row
- [x] The clipped row stays inside the 220px panel
- [x] Hover or focus on a clipped name shows the full title in the main toolbar hover label, 8px above the row
- [x] That label wraps at the row and does not grow past 320px
- [x] A name that fits the row shows no hover label
- [x] View all and the command rows are unchanged, and a menu item that does not set `truncateLabel` stays as it is
- [x] The menu item trial paints one truncated row in a 220px column
- [x] The project menu trial's first name is long enough to clip in both panels
- [x] The live board is unchanged when the trial page is absent

## Technical notes

Keep the work in [`src/MenuItem.tsx`](../src/MenuItem.tsx) and [`src/ProjectMenu.tsx`](../src/ProjectMenu.tsx). The trials stay `?trial=menu-item` and `?trial=project-menu`.

On `MenuItem`, add `truncateLabel`, defaulting to false. When it is set, the button is `min-w-0` and `group/tip`, and the label uses `truncate` instead of `whitespace-nowrap`. Measure the label with a `ResizeObserver`. Show the hover label only when `scrollWidth` is more than `clientWidth`. The label is the same one the title field uses: `pointer-events-none`, `bottom-[calc(100%+8px)]`, centered, `rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-lg`, shown on hover and on focus. Its max width is `min(100%, 320px)`, so it stays over the row and still stops at the title field's 320px cap. Do not use the browser `title` attribute. Do not put `overflow-hidden` on the button, or the label is clipped.

`ProjectRow` sets `truncateLabel`. View all does not. `CommandRow` does not. The font menus do not.

The names under Recent sit in a wrapper. That wrapper needs `min-w-0`, or the long label still widens the grid child and the ellipsis never starts. The recent-panel rows are direct grid children. Their `min-w-0` button is enough.

The project menu specimen's first name is long enough to pass 320px, so both panels show the clip. The other names stay short, so those rows show no label. The menu item trial adds one indented truncated row in a 220px column. The size rows and the slot rows stay as they are.

Update the Menu item section and the Project menu section in [`docs/design-system-notes.md`](../docs/design-system-notes.md). Name NB-76 beside the earlier tickets. Record `truncateLabel`, the hover-label table on each section, and that the project rows turn the prop on. The project menu table writes its own values. Do not say that table matches the menu item.

This trial is not on the canvas, so the panels stay out of FloatingPanel. The hover label is the existing toolbar label, not a new panel. The later pass that places the menu uses FloatingPanel on the dropdown layer and checks it against a selected element and an element that is mid-drag.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

## Out of scope

The View all label. Command captions and turning those icons on. The Recent label. The recent panel's width, height, and indent. Menu item fills, type size, and corner radius. The font style menu, the typeface menu, and the font size menu. The title field's own 320px clip. The logo button's press. Placing the menu on the canvas. Replacing `SaveToolbar`. The 220px panel width. Shadows, frosted glass, and the dot grid. Paragraph spacing is not in the token export.

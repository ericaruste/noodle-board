---
id: NB-73
title: Project menu
status: In Progress
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id: ERI-89
linear_url: https://linear.app/ericar/issue/ERI-89/project-menu
---

## Context

Project dropdown for the upper left of the canvas. Figma component `toolbar/project/menu`, on the spec sheet node `543:2624`. The white sheet is 856 by 470 and holds the title, the two notes, and both panels. That sheet is documentation. The menus are the two panels.

The note on the sheet says the dropdown uses menu item `md`, the left icon Lucide `bowl-chopsticks`, and the caption for shortcut keys. The second note says the recent projects panel opens when View all is selected.

The main menu is component node `543:2512`. The selection badge reads 220 by 304 hug. Top to bottom:

- New, caption `Ctrl+N`
- Open, caption `Ctrl+O`
- Recent, a label with no icon and no caption
- View all, selected in the specimen, no icon and no caption
- Project name #1, Project name #2, Project name #3, each with the bowl-chopsticks icon
- Save, caption `Ctrl+S`
- Save as, caption `Ctrl+Shift+S`

The recent panel is component `toolbar/project/menu/recent`, node `543:2511`. The selection badge reads 200 by 200 hug. It is six rows, Project name #1 through Project name #6, each with the bowl-chopsticks icon. In the specimen the first row is selected. No row shows a caption or a chevron.

[`src/MenuItem.tsx`](../src/MenuItem.tsx) is the row. Size `md` is 32px. The left icon, the caption, and the chevron can each be turned off, and `leftIcon` replaces the default chevron. The typeface, weight, and font size menus already stack that row in a frosted panel.

The live board still uses the file bar. [`src/SaveToolbar.tsx`](../src/SaveToolbar.tsx) is the upper-left control in [`src/App.tsx`](../src/App.tsx): a save dot, the project name, Recent, New, Open, Save, and Save As. [`src/RecentMenu.tsx`](../src/RecentMenu.tsx) is the Recent list. New calls `newProject`, Open calls `openProject`, and Save and Save As call `saveProject`. Ctrl/Cmd+S and Ctrl/Cmd+O already do that. There is no Ctrl+N shortcut. None of those actions is a menu item yet.

## Problem

Phase 2 has the menu item and no project menu. The file bar is still a row of text buttons. The Figma menu is those commands, a short recent list, and a View all panel, stacked from the shared row.

## Repro

1. Open the board. The upper left is the file bar: a save dot, the project name, Recent, New, Open, Save, and Save As.
2. Compare that bar with Figma node `543:2624`. The commands sit in one menu. View all opens a second panel of project names. The rows are the medium menu item.

## Acceptance criteria

- [x] The main menu lists New, Open, the Recent label, View all, the first three project names, Save, and Save as, in that order
- [x] New, Open, Save, and Save as are medium menu items with the left icon and the chevron off, and the captions are `Ctrl+N`, `Ctrl+O`, `Ctrl+S`, and `Ctrl+Shift+S`
- [x] Recent is a label, with no icon, no caption, no chevron, and no row fill
- [x] View all is a medium menu item with the left icon, the caption, and the chevron off
- [x] Each project row is a medium menu item with the Lucide bowl-chopsticks icon, and the caption and the chevron off
- [x] The recent panel lists every project name passed in, and the main menu shows only the first three
- [x] The recent panel is open when View all is selected, and closed when View all is not selected
- [x] The open specimen paints View all selected, and paints the first recent row selected
- [ ] The main menu hugs to 220 by 304 with the specimen strings, and the recent panel hugs to 200 by 200
- [x] Both panels use the surface, border, spacing, and radius tokens from the frames
- [x] The trial page shows the menu with View all selected and the recent panel open, and the same menu with View all not selected
- [x] The live board is unchanged when the trial page is absent

## Technical notes

[`src/ProjectMenu.tsx`](../src/ProjectMenu.tsx) is the component. `?trial=project-menu` and `#project-menu` show the two specimens. Register the trial in [`src/main.tsx`](../src/main.tsx) the same way as `?trial=menu-item`.

The trial passes the six specimen names, `Project name #1` through `Project name #6`. The main menu renders the first three. The recent panel renders all six. View all's selected state is what opens the panel. The trial paints that state, and a second menu where View all is not selected so the panel stays closed. On the open specimen, pass the first name as the selected recent row.

Do not draw a new row. Use `MenuItem` with `size="md"`. Command rows pass `showLeftIcon={false}`, `showChevron={false}`, and the shortcut as `caption`. View all passes `showLeftIcon={false}`, `showCaption={false}`, and `showChevron={false}`. Project rows pass `leftIcon` as bowl-chopsticks, `showCaption={false}`, and `showChevron={false}`. Recent is a 32px label in the menu item's default label color. It is not a `MenuItem`, so it does not take a hover or selected fill.

The installed `lucide-react` (`^1.68.0`) has no `BowlChopsticks` export. The frame's layer is `icon/lucide/bowl-chopsticks`. Bring in the Lucide glyph with that name. Do not swap in `Soup` or `Utensils`.

The recent panel's 200px height is six 32px rows and `brand.scale.4` (4px) padding on top and bottom, with no gap. The main menu uses that same padding and no gap between rows. Nine 32px rows plus 8px of padding come to 296. The frame is 304, so one `brand.scale.8` (8px) gap sits between the third project row and Save. The stroke is `mapped.border.default` at `alias.border-width.xsm` (1px). The fill is `mapped.surface.default`. The corner is `alias.border-radius.lg` (8px), the same corner the other menus use. Inspect was behind the sign-up wall, so the corner was not measured on this frame. Shadow and blur are not tokens. Use the same shadow and blur the font menus already use.

The panels hug their content. 220 and 200 are the measured hug with the specimen strings, not fixed widths. No spacing token is 220 or 200. A second bowl-chopsticks layer sits on the right of each recent row in the Figma layer list. The painted row shows only the left icon, so the chevron stays off.

The spec sheet (the title, the two notes, and the 856 by 470 frame) is not part of the component.

Record a Project menu section in [`docs/design-system-notes.md`](../docs/design-system-notes.md): the ticket, the code path, a token table for each panel, the Recent label, and the row slots. Say which states the frame paints. Hover and disabled stay on the menu item section.

This ticket renders the menus on the trial page. It does not mount them over the canvas, so it does not use FloatingPanel yet. The later pass that places the menu, together with the project toolbar, uses FloatingPanel on the dropdown layer and checks it against a selected element and an element that is mid-drag.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

The Figma file request was rate limited. The sizes above are the selection badges on nodes `543:2512` and `543:2511`.

## Out of scope

Placing the menu on the canvas, and which control opens it. Replacing `SaveToolbar` or `RecentMenu`. Calling `newProject`, `openProject`, `saveProject`, or the recent-file list. Adding a Ctrl+N shortcut. The captions stay the Ctrl strings from the frame. Changing the menu item row. The project toolbar. The rename rules in `renameProject`. Shadows, frosted glass, and the dot grid. Paragraph spacing is not in the token export.

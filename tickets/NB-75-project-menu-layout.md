---
id: NB-75
title: Project menu layout
status: Todo
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id: ERI-91
linear_url: https://linear.app/ericar/issue/ERI-91/project-menu-layout
---

## Context

The project menu is already on the trial. This ticket changes the spacing in the main menu and adds an indent to the shared row.

[`src/ProjectMenu.tsx`](../src/ProjectMenu.tsx) is the menu from [NB-73](NB-73-project-menu.md). The request points at the same spec sheet, node `543:2624`. The main menu is `toolbar/project/menu`. The panel is a 220px grid, class `panelClass`: `p-brand-scale-4`, no row gap, a 1px stroke of `mapped.border.default` at `alias.border-width.xsm`, and a fill of `mapped.surface.default`. Top to bottom the children are New, Open, the Recent label, View all, the first three project names, an 8px spacer (`h-brand-scale-8`), Save, and Save as. View all and the three names are direct children of that grid. Nothing sits between Recent and View all. There is no divider.

New, Open, Save, and Save as go through `CommandRow`. That renders `MenuItem` at `md` with the left icon and the chevron off, and the captions `Ctrl+N`, `Ctrl+O`, `Ctrl+S`, and `Ctrl+Shift+S`. View all is its own `MenuItem` at `md` with the left icon, the caption, and the chevron off. `selected` follows whether the recent panel is open. The three names go through `ProjectRow`. `ProjectRow` passes the bowl-chopsticks icon and turns the caption and the chevron off. It takes no indent, and the recent panel uses the same component, so those six rows share the main menu's padding.

The Recent label is a 32px `div`, not a `MenuItem`. Its horizontal padding is `brand.scale.8`, the menu item's padding, so the word lines up with New and Open. It has no hover fill and no selected fill.

[`src/MenuItem.tsx`](../src/MenuItem.tsx) is the row from [NB-41](NB-41-menu-item.md). The button uses one horizontal padding class, `px-brand-scale-8`. It is `w-full` unless `widthClassName` replaces that. The default state's hover fill is `enabled:hover:bg-mapped-surface-action-hover` on the button. The selected fill is `bg-mapped-surface-action-selected` on the same button. Both cover the button, padding included. There is no indent prop. The font style menu, the typeface menu, and the font size menu in [`src/TextToolbar.tsx`](../src/TextToolbar.tsx) use this row. The font size row is the one that sets `widthClassName`, to `w-brand-scale-36`. The others leave the width and the padding alone.

`?trial=project-menu` and `#project-menu` show the menu with View all selected and the same menu with View all not selected. `?trial=menu-item` shows both sizes, the four states, and the slot rows, all at the 8px padding. The live board still mounts [`src/SaveToolbar.tsx`](../src/SaveToolbar.tsx).

The spacing tokens for this change are already in the theme. `brand.scale.1` is 1px, `brand.scale.4` is 4px, `brand.scale.8` is 8px, `brand.scale.24` is 24px, and `brand.scale.32` is 32px. `mapped.border.default` is the border color.

## Problem

The main menu runs from Recent straight into View all, and the only break before Save is an 8px spacer. View all and the project names start at the same left padding as New and Open. The shared row has no way to add padding on the left, so each of those rows would need its own length.

## Repro

1. Open `?trial=project-menu`.
2. On the main menu, Recent sits against View all. There is no line between them.
3. View all and the three project names are separate rows. The space before Save is the 8px spacer, and there is no divider in that space.
4. View all and the project names start at the same left padding as New, Open, Save, and Save as.
5. Open `?trial=menu-item`. Every row uses the 8px horizontal padding.

## Acceptance criteria

- [ ] A 1px divider in `mapped.border.default` sits directly below the Recent label on the main menu
- [ ] The divider spans the full menu width
- [ ] 4px of space sits between that divider and View all
- [ ] View all and the project rows on the main menu sit in one wrapper, with a 4px gap below the wrapper before Save, and no divider there
- [ ] Menu item gains an optional indent prop that adds 24px to the row's left padding
- [ ] View all and the project rows on the main menu use that indent
- [ ] A menu item that does not set indent keeps its current padding, and the existing menu-item trial rows stay that way
- [ ] The hover fill and the selected fill each span the full width of the row
- [ ] The 4px spaces, the 24px indent, and the 1px divider use spacing or border tokens, and View all and the project rows do not each carry their own pixel value
- [ ] The live board is unchanged when the trial page is absent

## Technical notes

Keep the work in [`src/ProjectMenu.tsx`](../src/ProjectMenu.tsx) and [`src/MenuItem.tsx`](../src/MenuItem.tsx). The trials stay `?trial=project-menu` and `?trial=menu-item`.

On `MenuItem`, add `indent`, defaulting to false. Leave the default class as `px-brand-scale-8`. When `indent` is set, the left padding is `brand.scale.32` and the right padding stays `brand.scale.8`. `brand.scale.32` is the current 8px plus `brand.scale.24`. Do not write a raw 24px or 32px length on the button, and do not pass a padding class from `ProjectMenu`. The prop is the only switch.

Add that space as `padding-left` on the button that already paints the fill. Do not indent with margin, and do not change `widthClassName`. The button stays `w-full`, so the hover fill and the selected fill still cover the whole row, including the added padding. The corner stays `alias.border-radius.lg`. The panel's `brand.scale.4` padding still insets the row from the stroke. The highlight fills that row. It does not have to cross the panel padding. The divider is the piece that does.

`CommandRow` does not pass `indent`. `ProjectRow` takes an `indent` flag and passes it through, because the recent panel uses the same component. The three names in the main menu set the flag. The recent panel does not, so those six rows keep the current padding. View all sets `indent` on its own `MenuItem`.

In the main menu, put the divider immediately after the Recent label, then a wrapper around View all and the three names. The divider is a sibling of the wrapper, so the wrapper's top space does not open a gap above the line.

The divider is 1px tall, `h-brand-scale-1`, and its fill is `bg-mapped-border-default`. A normal grid child stops 4px short of the stroke because the panel padding is `p-brand-scale-4`. Cancel that horizontal padding on the divider with the same token, `-mx-brand-scale-4`, so the line meets both inner edges of the stroke. Do not give the divider its own pixel width.

The 4px before View all is the wrapper's top margin, `mt-brand-scale-4`. The 4px before Save is the wrapper's bottom margin, `mb-brand-scale-4`. Remove the `h-brand-scale-8` spacer. Do not put a margin on View all or on each project row. The wrapper has no gap of its own, so View all and the names keep the current 0px row gap. No divider between the wrapper and Save.

The main menu's inside height changes. Nine 32px rows are 288px, and the 8px of panel padding stays. The 8px spacer is gone. The divider and the two spaces add 1 + 4 + 4. The inside height is 305px. The 220px width stays. The recent panel is unchanged: no divider, no wrapper, no extra gap, and no indent.

On the menu item trial, leave the size rows and the slot rows at the default padding. Add one indented row so the prop can be checked. That row is the only new specimen there.

Update the Project menu section and the Menu item section in [`docs/design-system-notes.md`](../docs/design-system-notes.md). Name NB-75 beside NB-73 for the layout this ticket adds. In the main menu table, replace the 8px gap before Save with the divider and the two 4px spaces, and record the 305px inside height. The divider row names `mapped.border.default` and `brand.scale.1`, and says the line spans the menu width by cancelling the panel's horizontal padding. The Recent label still lines up with New, Open, Save, and Save as. In the rows table, View all and the main-menu project names set indent. The recent-panel project row does not. In the Menu item section, add the indent property, default off, and the left padding: `brand.scale.8` when indent is off, `brand.scale.32` when it is on. The right padding stays `brand.scale.8`. Say the hover and selected fills cover the full button. Give the project menu its own table for the divider and the two spaces. Do not say that table matches the menu item, and do not say the menu item matches the project menu.

This trial is not on the canvas, so the panels stay out of FloatingPanel. The later pass that places the menu uses FloatingPanel on the dropdown layer and checks it against a selected element and an element that is mid-drag.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

## Out of scope

The recent panel's rows, width, and height. `CommandRow` captions, and turning its icons on. The Recent label's color, size, and padding. Menu item fills, type size, corner radius, and the left icon slot. The font style menu, the typeface menu, and the font size menu. The project toolbar. Placing the menu on the canvas. Replacing `SaveToolbar`. Calling `newProject`, `openProject`, `saveProject`, or the recent-file list. A Ctrl+N shortcut. The 220px width. Shadows, frosted glass, and the dot grid. Paragraph spacing is not in the token export.

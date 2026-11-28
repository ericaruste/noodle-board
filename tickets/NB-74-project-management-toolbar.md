---
id: NB-74
title: Project management toolbar
status: Done
priority: 3
labels: [Feature, UX, Toolbar]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id: ERI-90
linear_url: https://linear.app/ericar/issue/ERI-90/project-management-toolbar
---

## Context

The project bar and the project menu already exist as separate trials. They are not one control, and the logo does not open the menu.

[`src/ProjectToolbar.tsx`](../src/ProjectToolbar.tsx) is the bar from [NB-72](NB-72-project-toolbar.md). The row is `LogoButton`, `TitleInput`, and `SaveIndicator` at `lg`. `LogoButton` is rendered with no `onClick` and no `selected`. `TitleInput` is uncontrolled: typing updates its own draft through `onChange`, and `onTitleChange` is optional. The title slot on this bar is at least 200px in [`src/index.css`](../src/index.css) (`[data-project-toolbar] [data-title-input]`) and stops at 320px. `?trial=project-toolbar` and `#project-toolbar` show a resting bar, a long title, and a saving bar. None of those specimens opens a menu.

[`src/ProjectMenu.tsx`](../src/ProjectMenu.tsx) is the menu from [NB-73](NB-73-project-menu.md). [NB-75](NB-75-project-menu-layout.md) is the layout change for that menu: a divider under Recent, the space around View all and the project rows, and an indent on those rows. This ticket does not restyle the menu. The main menu lists New, Open, the Recent label, View all, the first three names, Save, and Save as. `viewAllSelected` starts the recent panel open, and a click on View all toggles that panel. The recent panel lists every name passed in. `?trial=project-menu` and `#project-menu` paint the menu with View all selected and the same menu with View all not selected. There is no toolbar on that page.

[`src/LogoButton.tsx`](../src/LogoButton.tsx) is a 40px button. Hover and selected ease the radius from a circle to a rounded square over 700ms. The transition is `transition-[border-radius]` only. Nothing sets `transform`, so a press leaves the button at scale 1. `?trial=logo-button` shows the painted states and one live button that toggles `selected`.

The live board is still the file bar. [`src/App.tsx`](../src/App.tsx) mounts [`src/SaveToolbar.tsx`](../src/SaveToolbar.tsx). `renameProject` trims the entered name, uses `Untitled` when the trim is empty, and updates the document name and the bound recent. The file bar's `ProjectName` is the only control that calls it. The trials do not.

## Problem

A person cannot use the project toolbar to rename the title and open the project menu from the logo. The menu trial is always open, so View all cannot be reached from that logo. Pressing the logo does not scale it to 0.90, and releasing it has nothing to restore.

## Repro

1. Open `?trial=project-toolbar`. Type a new title. The field keeps it. Click the logo. No project menu opens. Press the logo and hold. It stays at full size.
2. Open `?trial=project-menu`. View all opens the recent panel. There is no logo and no title field.
3. Open the board. The upper left is still the file bar: a save dot, the project name, Recent, New, Open, Save, and Save As.

## Acceptance criteria

- [x] The trial uses the project toolbar, and the user can rename the project title on it
- [x] Clicking the logo button opens the project menu
- [x] Clicking View all opens the recent project menu
- [x] Pressing the logo button scales it to 0.90, and releasing it returns the scale to 1
- [x] Clicking anywhere outside the menu closes it
- [x] The live board is unchanged when the trial page is absent

## Technical notes

Add [`src/ProjectManagementToolbar.tsx`](../src/ProjectManagementToolbar.tsx). Register `?trial=project-management-toolbar` and `#project-management-toolbar` in [`src/main.tsx`](../src/main.tsx) the same way as `?trial=project-toolbar`.

The trial renders `ProjectToolbar` and, when the menu is open, `ProjectMenu` under it. Leave `ProjectToolbarPreview` and `ProjectMenuPreview` as they are. Give `ProjectToolbar` optional `onLogoClick` and `logoSelected` props and pass them to `LogoButton`. The existing project-toolbar trial passes neither, so that bar stays a resting logo with no menu.

The title stays the uncontrolled `TitleInput` already on the bar. The trial starts from `Project Title`. Typing replaces that text in the field. Do not pass a controlled `value`, and do not call `renameProject`. An empty field stays empty on this trial. The 200px minimum and the 320px cap stay on the bar.

Menu state starts closed. A click on the logo opens `ProjectMenu`. A second click closes it, which removes the recent panel with it. A pointer down outside the menu closes it the same way. A pointer down inside the main menu or the recent panel leaves the menu open. A pointer down on the logo still switches the menu, so that press is not an outside close. Pass `selected` to the logo while the menu is open so the existing expanded square stays. The press scale is separate from that square.

Pass the six specimen names, `Project name #1` through `Project name #6`. Do not export a new list if the preview can pass those strings. The main menu still shows the first three, and the recent panel still shows all six. Start with View all not selected. The click that opens the recent panel is the one already on View all inside `ProjectMenu`. Do not add a second toggle.

Stack the menu under the bar. The gap is `brand.scale.4` (4px), the offset a menu uses from the toolbar that opened it. Align the menu's left edge with the bar's left edge. `ProjectMenu` already places the recent panel to the right of the main menu.

The press scale lives on `LogoButton`. On pointer down, set `transform: scale(0.9)`. On pointer up and pointer cancel, set `transform: scale(1)`. Capture the pointer on pointer down so the scale stays at 0.9 if the pointer leaves the button before the release. Do not add `transform` to the 700ms border-radius transition. The scale changes when the press starts and when it ends. `0.9` is not a design token. Do not add a token for it, and do not mark it as a mismatch. The painted specimens on the logo trial are the same button, so a press scales them too. Their resting size stays 1 until that press. The live button on `?trial=logo-button` gets the same press scale and still does not open a menu.

While the menu is open, a press scales the expanded square to 0.9 and the release returns that square to 1. The square stays until the menu closes.

Record a Project management toolbar section in [`docs/design-system-notes.md`](../docs/design-system-notes.md). Name NB-74 and `src/ProjectManagementToolbar.tsx`. The bar, the main menu, and the recent panel keep the tables already in the Project toolbar and Project menu sections. This section has its own table for the pieces this trial adds: the gap under the bar, and the logo scale. The gap is `brand.scale.4`. The pressed scale is 0.90 and the released scale is 1. Mark the scale `not a token`. Do not say that this control matches the project toolbar or the project menu. Record the properties: the title text, whether the menu is open, and whether View all has opened the recent panel. Painted states are the bar with the menu closed, the menu open, the menu open with the recent panel, and the logo while it is pressed. Hover, the title fills, and the menu-item states stay on their own sections.

This trial is not on the canvas, so the bar and the menus are not in FloatingPanel. The later pass that places them on the board uses FloatingPanel, the toolbar layer for the bar and the dropdown layer for the menus, and checks both against a selected element and an element that is mid-drag.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

## Out of scope

Replacing `SaveToolbar` on the board. Calling `renameProject`, `newProject`, `openProject`, `saveProject`, or the recent-file list. A Ctrl+N shortcut. Changing the menu rows, the captions, the Recent label, or the panel sizes. The divider, the indent, and the spacing in [NB-75](NB-75-project-menu-layout.md). Changing the title minimum, the 320px cap, or the truncation label. The logo's 700ms radius ease, the brand red, and the hover and selected shape. The save indicator. The upper-right "Noodle Board" wordmark. The trials at `?trial=project-toolbar`, `?trial=project-menu`, and `?trial=logo-button`. Shadows, frosted glass, and the dot grid. Paragraph spacing is not in the token export.

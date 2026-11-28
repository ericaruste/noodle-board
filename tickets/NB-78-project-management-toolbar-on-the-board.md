---
id: NB-78
title: Project management toolbar on the board
status: Todo
priority: 3
labels: [Feature, UX, Toolbar]
parent: NB-E6
blockedBy: [NB-74]
estimate: 3
linear_id: ERI-94
linear_url: https://linear.app/ericar/issue/ERI-94/project-management-toolbar-on-the-board
---

## Context

The board still paints the file bar. [`src/App.tsx`](../src/App.tsx) mounts [`src/SaveToolbar.tsx`](../src/SaveToolbar.tsx) inside `[data-canvas-chrome]`, a full-width row at `top-4` / `left-4` on `layers.selection`. The bar is a save dot, `ProjectName`, Recent, New, Open, Save, and Save As. The upper right of that row is a separate chip whose text is "Noodle Board".

`ProjectName` shows `documentName` until it is clicked. Typing updates a draft only. Enter blurs, blur calls `renameProject`, and Escape restores the previous name and skips the rename. `renameProject` trims the entered name, uses `Untitled` when the trim is empty, and updates the document name and the bound recent. It returns immediately when the name is unchanged.

[`src/RecentMenu.tsx`](../src/RecentMenu.tsx) is the Recent list. It is a `FloatingPanel` on the dropdown layer. The rows are `recents` from [`src/recents.ts`](../src/recents.ts), newest first, capped at `MAX_RECENTS` (8). Each row calls `reopenRecent(id)` and closes the menu. An empty list reads "No recent boards yet." Escape and a press outside close it. `SaveToolbar` is the only importer of `RecentMenu`.

New calls `newProject`. Open calls `openProject`. Save calls `saveProject("save")`. Save As calls `saveProject("save-as")`. The window keydown listener handles Ctrl/Cmd+S, Ctrl/Cmd+Shift+S, and Ctrl/Cmd+O before the typing-target return, so those shortcuts still run while a field is focused. There is no Ctrl+N handler. Browsers reserve Ctrl+N.

The save dot uses `save-dot` at rest and `save-dot-active` while `saving` is true. `onAnimationIteration` calls `onSavePulseIteration`. That counts loops in `savePulseLoopsRef`. `beginSavePulse` starts the hold. `endSavePulse` asks the pulse to stop after the current loops, and a `SAVE_PULSE_FALLBACK_MS` (4000) timeout stops it if an iteration never arrives. The pulse clears once `stopPulseAfterLoopRef` is set, `savePulseLoopsRef` has reached `SAVE_PULSE_MIN_LOOPS` (3), and no save is still running. Reduced motion clears it immediately inside `endSavePulse`. The dot animation is `save-dot-pulse`, 0.9s, on the element itself. The rules live in [`src/index.css`](../src/index.css).

The file error is a `role="alert"` banner at `left-4 top-20` on `layers.selection`, under the chrome row.

[`src/ProjectManagementToolbar.tsx`](../src/ProjectManagementToolbar.tsx) is the trial from [NB-74](NB-74-project-management-toolbar.md). It renders [`src/ProjectToolbar.tsx`](../src/ProjectToolbar.tsx) and, while the menu is open, [`src/ProjectMenu.tsx`](../src/ProjectMenu.tsx). The logo toggles the menu. A pointer down outside the menu closes it. A pointer down on the logo is not an outside close. There is no Escape listener. The title is the uncontrolled `TitleInput` starting at `Project Title`. Typing updates the field through `onValueChange`. Nothing calls `renameProject`. The names are the six specimen strings, `Project name #1` through `Project name #6`. The bar is not a `FloatingPanel`. `?trial=project-management-toolbar` and `#project-management-toolbar` show that specimen.

[`src/ProjectMenu.tsx`](../src/ProjectMenu.tsx) lists New, Open, the Recent label, a divider, View all, the first three names, Save, and Save as. View all toggles the recent panel. The recent panel lists every name passed in. `selectedProject` paints a recent-panel row whose name matches. The copies in the main menu stay unselected. New, Open, Save, Save as, and the project rows have no `onClick`. New's caption is `Ctrl+N`. Open is `Ctrl+O`, Save is `Ctrl+S`, and Save as is `Ctrl+Shift+S`. An empty `projects` list leaves View all with no names under it, and an open recent panel is an empty 220px frame.

[`src/TitleInput.tsx`](../src/TitleInput.tsx) writes `onValueChange` on every keystroke. It has no Enter commit, no blur commit, and no Escape cancel. [`src/SaveIndicator.tsx`](../src/SaveIndicator.tsx) plays `save-indicator-ring` (1.2s, on `::after`) while `saving` is true, and `save-indicator-breathe` (3s, on the disc) while saved. It has no iteration callback. [`src/ProjectToolbar.tsx`](../src/ProjectToolbar.tsx) passes `saving` through and does not pass a pulse callback.

[`src/NoodleEdge.tsx`](../src/NoodleEdge.tsx) `measureFrame` treats `[data-canvas-chrome]` as the top obstacle and sets the visible top to that box's bottom. The open menu must not become that obstacle. A missing chrome box lets noodles route through the bar.

## Problem

The board still uses the file bar and the upper-right wordmark. The project management toolbar exists only as a trial: the logo does not run the board's file actions, the rows are specimen names, the title does not rename the document, and the save indicator is not the board's save pulse.

## Repro

1. Open the board. The upper left is the file bar: a save dot, the project name, Recent, New, Open, Save, and Save As. The upper right reads "Noodle Board".
2. Open `?trial=project-management-toolbar`. The logo opens a menu of specimen names. New, Open, Save, Save as, and the project rows do nothing. The title is `Project Title` and is not the open document.
3. On the board, click the name, type, and press Enter. The document renames. Press Escape while editing and the previous name stays. Clear the name and leave the field. It becomes `Untitled`.
4. Change the board and watch the save dot. It keeps pulsing until three saving cycles have finished, or until the fallback timeout.

## Acceptance criteria

- [ ] The board shows the project management toolbar in place of the file bar
- [ ] The logo opens the project menu. New, Open, Save, Save as, and the recent rows run `newProject`, `openProject`, `saveProject`, and `reopenRecent`. Choosing one of those actions closes the menu
- [ ] Escape closes the menu. A press outside the menu closes it
- [ ] The recent rows are the board's recents list. The open project is marked selected in the recent panel. With no recents, the menu still reads correctly
- [ ] The title shows the document name. Enter or blur applies the rename. Escape cancels. An empty name becomes "Untitled". Typing does not rename on each keystroke
- [ ] The save indicator shows saving on the board, and the save pulse still ends the way the old save dot ends
- [ ] New has no Ctrl+N caption. Open, Save, and Save as keep Ctrl+O, Ctrl+S, and Ctrl+Shift+S, and those shortcuts still work
- [ ] The bar is a FloatingPanel on the toolbar layer and the menus are on the dropdown layer. Both stay above a selected element and an element that is mid-drag. The file error sits clear of the bar
- [ ] The upper-right "Noodle Board" wordmark is gone. The logo carries the brand
- [ ] `SaveToolbar` and `RecentMenu` are deleted once nothing imports them
- [ ] The trial pages stay as they are

## Technical notes

Mount [`src/ProjectManagementToolbar.tsx`](../src/ProjectManagementToolbar.tsx) from [`src/App.tsx`](../src/App.tsx) where `SaveToolbar` is mounted today. Pass the board's `documentName`, `savePulse`, and `recents`, and the existing callbacks: `newProject`, `openProject`, `saveProject("save")`, `saveProject("save-as")`, `reopenRecent`, `renameProject`, and `onSavePulseIteration`. Every prop stays optional. [`src/ProjectManagementToolbarPreview`](../src/ProjectManagementToolbar.tsx) keeps calling the toolbar with no props, so the trial still starts at `Project Title`, still uses `Project name #1` through `Project name #6`, and still does not call the board.

Keep the logo toggle. A click opens the menu. The next click closes it and removes the recent panel with it. A pointer down on the logo is not an outside close, so that click can toggle. A pointer down inside the main menu or the recent panel leaves the menu open. A pointer down anywhere else closes it, including a press on the title or the canvas.

Add Escape on the same open menu. Listen on `document` in the bubble phase, the way [`src/RecentMenu.tsx`](../src/RecentMenu.tsx) does. If the event target is the title field, leave the event alone so the field can cancel its draft. Otherwise close the menu and stop the event, so the board's window listener does not also cancel placement or a noodle drag on that key. An Escape after the menu is closed still reaches the board. The trial uses this same control, so Escape closes its menu too. Do not add board actions or real recents to the trial.

Wire the menu actions in [`src/ProjectMenu.tsx`](../src/ProjectMenu.tsx). New calls `newProject`, Open calls `openProject`, Save calls `saveProject("save")`, and Save as calls `saveProject("save-as")`. The three names under View all and every row in the recent panel call `reopenRecent` with that row's id. After any of those actions, close the menu. View all only toggles the recent panel and leaves the menu open. The trial passes no callbacks, so its rows stay inert.

Pass `recents` through when the prop is set, including an empty array. `recents === undefined` keeps the specimen names for the trial. The list is already newest first. The main menu still shows the first three. The recent panel still shows the whole list. Key the rows by id. Two rows can share a name, so a name key would collide. The open project is the row whose id is `boundRecentIdRef.current`. That ref is assigned before the `setState` that paints the bar. Compare ids, and only on the recent panel. The copies under View all stay unselected. A new Untitled board has no bound id, so no row is selected. Keep `selectedProject` for the trial's name match.

When the list is empty, the main menu still shows New, Open, the Recent label, the divider, View all, Save, and Save as, with no project rows and no specimen names. Opening View all shows the recent panel with the sentence the old Recent menu uses: "No recent boards yet." Style that sentence with the Recent label's type so the panel is not a blank frame. The trial always passes six names, so that sentence does not appear there.

The title shows `documentName` while the field is not focused. New, Open, a recent row, and Save as replace that shown name. While the field is focused, keep a draft. Do not pass `renameProject` as `TitleInput`'s `onValueChange`. Add a commit path on [`src/TitleInput.tsx`](../src/TitleInput.tsx) and thread it through [`src/ProjectToolbar.tsx`](../src/ProjectToolbar.tsx). Enter blurs. Blur calls `renameProject` with the draft. Escape restores `documentName`, skips `renameProject`, and stops the event so the menu does not close on that key. `renameProject` already trims and uses `Untitled` when the trim is empty. The trial does not pass the commit callback. Its field still updates as you type, and an empty field stays empty.

Pass `saving={savePulse}` through to [`src/SaveIndicator.tsx`](../src/SaveIndicator.tsx). Add an iteration callback on the disc and forward `onSavePulseIteration`. Count an iteration only while `saving` is true, and only for the ring on `::after`, so the 3s breath does not increment `savePulseLoopsRef`. Leave `SAVE_PULSE_MIN_LOOPS`, `beginSavePulse`, `endSavePulse`, and `SAVE_PULSE_FALLBACK_MS` as they are. The ring stays 1.2s. The pulse still clears after three saving iterations once the save has asked it to stop, or on the existing fallback if the iteration never arrives. Reduced motion still clears immediately inside `endSavePulse`. Confirm the `::after` animation fires `animationiteration` on the disc. If it does not, count the ring cycles in a way that still uses that three-loop gate.

New's caption is removed on the board only. [`src/MenuItem.tsx`](../src/MenuItem.tsx) already hides the caption when `showCaption` is false and the chevron is off. Default the New row to `Ctrl+N` so the project-menu trial and the project-management-toolbar trial still show it. The board turns that caption off. Leave Open, Save, and Save as on `Ctrl+O`, `Ctrl+S`, and `Ctrl+Shift+S`. Do not add a Ctrl+N shortcut. The existing window listener already calls `openProject` and `saveProject` for Ctrl/Cmd+O, Ctrl/Cmd+S, and Ctrl/Cmd+Shift+S before the typing-target return. Confirm those three still run with the menu open and with the title focused.

Place the bar in a `FloatingPanel` on the toolbar layer, 16px from the top and the left, the inset `data-canvas-chrome` uses today (`brand.scale.16`). Place the open menu in a `FloatingPanel` on the dropdown layer. Anchor it to the bar with [`useAnchoredBox`](../src/FloatingPanel.tsx), align start, so the menu's left edge lines up with the bar and the gap stays `brand.scale.4`. One dropdown panel wraps both the main menu and the recent panel. Put `data-canvas-chrome` on the bar's panel, not on a wrapper that includes the menu. [`src/NoodleEdge.tsx`](../src/NoodleEdge.tsx) `measureFrame` clears that box. The open menu must not grow the obstacle. Clicks on a floating panel are already ignored by placement, the marquee, and the port magnet.

The file error stays on `layers.selection` at `left-4`. The bar paints on the toolbar layer, above that banner. After the bar is placed, confirm the banner's top is below the bar. `top-20` (80px) clears the current file bar. Keep it when the new bar's bottom is above that line. If the bar meets the banner, move the banner down until a gap remains under the bar. The open menu may cover the banner. That is the dropdown layer.

Delete the "Noodle Board" chip in [`src/App.tsx`](../src/App.tsx). The logo is the brand mark.

When `SaveToolbar` and `RecentMenu` have no importers, delete [`src/SaveToolbar.tsx`](../src/SaveToolbar.tsx) and [`src/RecentMenu.tsx`](../src/RecentMenu.tsx). Delete the `.save-dot` rules in [`src/index.css`](../src/index.css) with them. Leave the save-indicator rules. Do not change `?trial=project-management-toolbar`, `?trial=project-toolbar`, `?trial=project-menu`, `?trial=logo-button`, `?trial=title-input`, or `?trial=save-indicator`.

Update the Project management toolbar section in [`docs/design-system-notes.md`](../docs/design-system-notes.md). Name NB-78 and `src/App.tsx` beside NB-74. Record the board bar on the toolbar layer, the menus on the dropdown layer, the 16px inset, and the 4px gap under the bar. Record that the board title commits on Enter or blur, Escape cancels, and an empty name becomes `Untitled`. Record that the board's New row has no caption, and that Open, Save, and Save as keep their captions. Record the empty recent sentence. The trial's own table stays the trial: specimen names, an empty field that stays empty, and New's `Ctrl+N` caption. Do not say the board matches the trial. In the Project menu section, replace the sentence that says the canvas still uses the file bar. Move the board placement from "Still to update" to "Decisions already made" once it is in. Tag any leftover item token app or code.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

## Out of scope

Changing the trial pages, their specimen names, or their registration in [`src/main.tsx`](../src/main.tsx). A Ctrl+N shortcut. The menu layout, the divider, the indent, and the title clip from [NB-75](NB-75-project-menu-layout.md) and [NB-76](NB-76-project-menu-title-clip.md). The logo press, the 700ms corner, and the motion names from [NB-77](NB-77-motion-list-and-component-animations.md). Recent timestamps and the "File unavailable" label from `RecentMenu`. A recent row still calls `reopenRecent`, which already reports a missing file. The three-loop hold, the fallback timeout, and the autosave timing in `App.tsx`. The ring's 1.2s timing and the breath. The main toolbar and the other element toolbars. Shadows, frosted glass, and the dot grid. Paragraph spacing is not in the token export.

---
id: NB-31
title: New project, autosave, and rename
status: Todo
priority: 2
labels: [Feature, Persistence, UX]
parent: NB-E2
blockedBy: []
estimate: 3
linear_id: ERI-40
linear_url: https://linear.app/ericar/issue/ERI-40/new-project-autosave-and-rename
---

## Context

The upper-left file bar in [`src/SaveToolbar.tsx`](../src/SaveToolbar.tsx) shows the project name as plain text, then the Recent menu, Open, Save, and Save As. There is no New action. The name is `documentName` in [`src/App.tsx`](../src/App.tsx), defaulting to `Untitled`.

A board with a bound file debounce-writes that file after 700ms (`AUTOSAVE_MS`, `scheduleAutosave`, `flushAutosave`). An unbound board writes `{ nodes, edges }` to `localStorage` key `noodle-board` on every change. Nothing in the bar shows that a write is happening. Persistence still depends on the user knowing to press Save the first time they want a file, and the Save control remains the labeled way to store the board.

The name is not editable. It changes when a file is saved or opened (`projectNameFromFileName` in [`src/noodleFile.ts`](../src/noodleFile.ts)). [`src/recents.ts`](../src/recents.ts) stores that name on the recent row. The Recent menu in [`src/RecentMenu.tsx`](../src/RecentMenu.tsx) is the other place the name is shown.

## Problem

Starting a fresh board, seeing whether work is stored, and renaming the project all take a trip through Save or the file picker. The user has to press Save for the board to feel saved, the title cannot be edited in place, and there is no New.

## Repro

1. Open a board that already has stickies. Look at the upper-left file actions. There is no New.
2. Add a sticky. The canvas changes with no sign that it is being saved, and Save is still the control for storing the project.
3. Click the project name. It does not become a text field, and the Recent list keeps the old title.

## Acceptance criteria

- [ ] The upper-left file actions include New. It opens a new project on an empty canvas with no nodes and no edges, named Untitled, at the default viewport
- [ ] New flushes a bound file before leaving it, so that project keeps its latest canvas
- [ ] New asks before it replaces an Untitled board that already has nodes or edges. Cancel leaves that board as it is
- [ ] After New, undo returns to the board that was on screen
- [ ] Canvas changes save on their own. The user does not press Save to keep them. A bound file still debounce-writes, and an unbound board still writes the localStorage draft
- [ ] A small green dot sits next to the project name. While a save is in progress it gently grows and shrinks in a soft pulse. When the save finishes it settles at its resting size and stays visible
- [ ] Clicking the project name turns it into a text input showing the current title. Enter or clicking away confirms the title
- [ ] The confirmed title replaces the name in the file bar, in the Recent list when that project is listed, and in the `name` stored with the project
- [ ] A title that is empty or only spaces is stored as Untitled
- [ ] Open, Save As, and the Recent menu still open, write, and reopen projects as they do now

## Technical notes

New belongs on the existing file bar, next to Open. It is a button, not a new panel. Take one undo snapshot before the swap, matching Open, and reset the viewport to the default. Reuse the Untitled replace confirm Open already uses.

Drive the dot from the same save that already runs: show the pulse from the moment a change is waiting through the end of the write (bound file or localStorage draft), including a rename. Leave the dot at rest when nothing is pending. A second change during a write keeps the pulse going until that write finishes too. Honor `prefers-reduced-motion` by showing the resting dot with no scale animation.

The rename field is an inline input in the file bar, not a popover. Commit on Enter and on blur. Escape restores the previous title and does not write it. After a confirmed rename, update `documentName` and the matching recents row (`rememberRecent` with the same id), and let the normal autosave write the new `name` into the bound file. Do not rename the file on disk.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

No new panel. The Recent menu is unchanged.

## Out of scope

Removing Save, Save As, or Open. A keyboard shortcut for New. Renaming the `.noodle.json` file on disk. Cloud sync, folders, and thumbnails.

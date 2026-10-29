---
id: NB-E2
title: Local project files
status: Todo
priority: 2
labels: [Epic, Persistence]
estimate: 8
linear_id:
linear_url:
---

## Context

Today the board silently autosaves one canvas to `localStorage` key `noodle-board` in [`src/App.tsx`](../../src/App.tsx) (`STORAGE_KEY`, `loadCanvas`, and the `useEffect` that `setItem`s `{ nodes, edges }`). Images are embedded as data URLs. There is no named project, no file on disk, and no recents list. Data URLs will hit the ~5MB quota quickly.

Child tickets: [NB-04](../NB-04-export-save-project.md), [NB-05](../NB-05-import-open-project.md), [NB-06](../NB-06-recent-projects.md).

## Goal

Let people save, open, and reopen boards as local `.noodle.json` files, while keeping the current localStorage document as an Untitled draft until they save.

## Child issues

- NB-04 Define `.noodle.json` and export/save project
- NB-05 Import/open a local project file
- NB-06 Recent projects list and reopen

## Success looks like

- [ ] A board can be saved to a file the user chooses and opened later with nodes, edges, and images intact
- [ ] Recent boards can be reopened in Chromium via a persisted file handle (with permission) and in other browsers via a picker or in-memory copy
- [ ] Untitled work still autosaves to localStorage so a refresh does not wipe an unsaved board

## Out of scope

Cloud sync, multi-user, Linear, and extracting image binaries into a sidecar folder (keep data URLs in v1; document the size tradeoff).

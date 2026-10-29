---
id: NB-06
title: Recent projects list and reopen
status: Todo
priority: 3
labels: [Feature, Persistence]
parent: NB-E2
blockedBy: [NB-04]
estimate: 3
linear_id:
linear_url:
---

## Context

No recents UI. localStorage holds one draft only. Chromium can persist `FileSystemFileHandle` in IndexedDB and re-request permission; Firefox cannot, so recents there must reopen via picker or an in-browser copy.

NB-04 produces files; NB-05 opens them. This ticket is the list + bind-to-file autosave.

## Problem

Users cannot see recently opened boards or jump back to a file without hunting in the OS dialog every time.

## Repro

1. Save or open a named `.noodle.json`.
2. Reload the app. There is no “recent” entry.
3. In Chrome, there is no one-click reopen of that handle.

## Acceptance criteria

- [ ] IndexedDB (or equivalent) stores recents: `{ id, name, lastOpened, fileHandle? }`
- [ ] UI lists recent projects (name + relative time). Choosing one reopens it
- [ ] Chrome/Edge: stored `FileSystemFileHandle` is used; if permission is not granted, prompt and then read
- [ ] Firefox/Safari: recents still show names; activating one opens a file picker (or loads an IDB-backed copy if you stored the JSON)
- [ ] Successful Save As / Open from NB-04/NB-05 inserts or updates the recents row
- [ ] Untitled localStorage draft remains the fallback when no file is bound
- [ ] When a file is bound and permission is granted, canvas changes debounce-write to that file
- [ ] Broken handles (file moved/deleted) are removed or marked unavailable without crashing

## Technical notes

File System Access handles are structured-cloneable into IndexedDB. Call `handle.queryPermission` / `requestPermission` with `{ mode: "readwrite" }` before `getFile()` / `createWritable()`. Cap the list (e.g. 8). Do not put recents in `localStorage` if they include handles.

## Out of scope

Cloud recents, thumbnails, folders, and OS “Open with Noodle Board.”

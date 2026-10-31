---
id: NB-04
title: Define .noodle.json and export/save project
status: Done
priority: 2
labels: [Feature, Persistence]
parent: NB-E2
estimate: 3
linear_id: ERI-12
linear_url: https://linear.app/ericar/issue/ERI-12/define-noodlejson-and-exportsave-project
---

## Context

Autosave only: `STORAGE_KEY = "noodle-board"` writes `{ nodes, edges }` to `localStorage` on every change ([`src/App.tsx`](../src/App.tsx)). No filename, viewport, or document name. Images are data URLs inside node `data.src`, so files will be large; that is acceptable for v1.

## Problem

There is no way to save a named board to disk or share a file. Refresh restores the single draft only.

## Repro

1. Add stickies and images.
2. Look for Save / Export. None exists.
3. Close the tab: the draft may still be in localStorage, but it cannot be downloaded or given a name.

## Acceptance criteria

- [x] Documented `.noodle.json` schema: `version` (1), `name`, `updatedAt` (ISO), `viewport` `{ x, y, zoom }`, `nodes`, `edges`
- [x] **Save** / **Save As** writes that JSON. Prefer File System Access API (`showSaveFilePicker` + `createWritable`) in Chromium
- [x] Browsers without File System Access fall back to a download (`<a download>`) of the same JSON
- [x] Saving does not clear the localStorage Untitled draft until a later ticket binds autosave to the file (NB-06 may own bind-on-save; this ticket must at least produce a valid file)
- [x] Export includes current viewport and all nodes/edges (images as data URLs)
- [x] Invalid or huge files: if `JSON.stringify` fails, show a visible error instead of failing silently

## Technical notes

Keep `version: 1` so NB-05 can reject unknown versions. Capture viewport via `getViewport()`. Suggested entry point: a Save control on the toolbar (or a menu). If NB-11 has not landed, a text button is fine. Do not introduce a new cloud backend.

## Out of scope

Open/import (NB-05), recents list (NB-06), extracting images to separate files, and compressing data URLs.

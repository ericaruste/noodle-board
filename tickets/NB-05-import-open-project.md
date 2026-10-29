---
id: NB-05
title: Import/open a local project file
status: Todo
priority: 2
labels: [Feature, Persistence]
parent: NB-E2
blockedBy: [NB-04]
estimate: 2
linear_id:
linear_url:
---

## Context

Depends on the `.noodle.json` format from NB-04. Today `loadCanvas()` only reads `localStorage`. Drop on the canvas already adds an image file ([`src/App.tsx`](../src/App.tsx) `onDrop`); it must not treat `.noodle.json` as an image.

## Problem

A saved board cannot be opened. There is no validation path for project files.

## Repro

1. After NB-04, save a board that has a sticky, an image, and a noodle.
2. Clear the canvas or localStorage (or use another browser profile).
3. There is no Open/Import that restores that file.

## Acceptance criteria

- [ ] **Open** / **Import** reads a `.noodle.json` (File System Access `showOpenFilePicker` and/or `<input type="file" accept=".json,.noodle.json">`)
- [ ] Valid `version: 1` files replace the on-screen nodes, edges, and viewport
- [ ] Restored stickies, images, and noodles match the file (text, colors, data URLs, connections)
- [ ] Invalid JSON, missing `nodes`/`edges`, or unsupported `version` shows an error and leaves the current board unchanged
- [ ] Opening takes a single undo snapshot (undo returns to the previous board)
- [ ] Dropping a `.noodle.json` on the canvas may open it or be ignored; dropping an image still adds an image node

## Technical notes

Share one `parseNoodleFile(unknown): Snapshot` helper with NB-04’s types. Reset React Flow viewport after load (`setViewport`). Confirm before replacing a dirty Untitled draft if it is cheap; if you skip a modal, at least snapshot for undo.

## Out of scope

Recents (NB-06), merge-two-boards, and auto-migrate of unknown future versions (reject with a message instead).

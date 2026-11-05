---
id: NB-32
title: Keep repository files on LF line endings
status: Todo
priority: 2
labels: [Bug]
parent: NB-E5
blockedBy: []
estimate: 1
linear_id: ERI-42
linear_url: https://linear.app/ericar/issue/ERI-42/keep-repository-files-on-lf-line-endings
---

## Context

Ticket markdown in [`tickets/`](../tickets/) is the source of truth, and Cursor rules live in [`.cursor/rules/`](../.cursor/rules/) as always-applied `.mdc` files (`floating-layer.mdc`, `browser-evaluate-timeout.mdc`). The repo has no `.gitattributes`. On this Windows checkout `core.autocrlf` is true, so Git checks LF text out as CRLF. An edit that writes the other ending makes the file look changed.

## Problem

Line endings do not match. Files created or edited here, especially ticket files, mix CRLF and LF. After a ticket is finished, source control still lists it as modified when the words did not change.

## Repro

1. Finish a ticket and commit it.
2. Create or save that file so its line endings flip between CRLF and LF.
3. Run `git status`. The ticket is modified, and the diff is line endings only.

## Acceptance criteria

- [ ] `.cursor/rules` has an always-applied rule that says all files you create or edit, especially ticket files, must use LF line endings, never CRLF
- [ ] The repo root has a `.gitattributes` file with `* text=auto eol=lf`
- [ ] Existing files are renormalized once so Git stores them with LF
- [ ] That renormalization is committed, and the commit diff is line endings plus the new rule and `.gitattributes`
- [ ] After that commit, a finished ticket whose text did not change does not show up as modified in source control

## Technical notes

Add the rule as a new `.mdc` file next to the existing ones, with `alwaysApply: true`. Use the acceptance wording above as the rule body.

Put `.gitattributes` at the repo root. `text=auto` leaves files Git classifies as binary alone. `eol=lf` stores text as LF and checks it out as LF, including on a machine whose `core.autocrlf` is true.

From the repo root, run `git add --renormalize .`, review that content diffs are line endings only, and commit that result with the rule and `.gitattributes`. Leave older commits as they are. Do not change `core.autocrlf` in Git config.

No new toolbar, dropdown, or popover. Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

## Out of scope

Changing Git config on a machine. Rewriting published history. Canvas, toolbar, and project-file behavior.

---
id: NB-E5
title: Workflow
status: Todo
priority: 2
labels: [Epic]
estimate: 1
linear_id: ERI-41
linear_url: https://linear.app/ericar/issue/ERI-41/workflow
---

## Context

Noodle Board tickets and Cursor rules are edited on Windows. Git on this checkout has `core.autocrlf` enabled, and the repo has no `.gitattributes`. Finished ticket files then show up as modified when the only difference is the line ending.

Child tickets: [NB-32](../NB-32-lf-line-endings.md).

## Goal

Keep repository text on LF so a finished ticket stays clean in source control after it is saved again.

## Child issues

- NB-32 Keep repository files on LF line endings

## Success looks like

- [ ] Files created or edited for this repo, especially tickets, stay LF
- [ ] A finished ticket whose text did not change does not show up as modified in source control

## Out of scope

Canvas features, project files, and rewriting published Git history.

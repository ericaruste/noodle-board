---
id: NB-00
title: Short imperative title
status: Todo
priority: 3
labels: [Feature, Canvas]
parent: NB-E1
blockedBy: []
estimate: 2
linear_id:
linear_url:
---

## Context

Which files and current behavior this ticket assumes.

## Problem

What is wrong or missing.

## Repro

1. Step
2. Step

## Acceptance criteria

- [ ] Criterion
- [ ] Criterion

## Technical notes

Implementation hints. Keep out of the acceptance list.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

## Out of scope

What this ticket must not take on.

---
id: NB-E6
title: Phase 2 — UI components and design tokens
status: In Progress
priority: 2
labels: [Epic, UX]
estimate: 5
linear_id: ERI-52
linear_url: https://linear.app/ericar/issue/ERI-52/phase-2-ui-components-and-design-tokens
---

## Context

Phase 1 is the local board on `main`. Phase 2 brings Figma components onto that board using the design tokens in `tokens/tokens.json`. The work happens on the `phase-2` branch. `main` stays the finished Phase 1 board until this phase is ready to land together.

Each component is its own ticket. The ticket title is the component name. Child tickets are added here as those components are chosen.

## Goal

Sync UI components from Figma into Noodle Board, styled with the design tokens, on `phase-2`.

## Child issues

- [NB-38 Contextual button](../NB-38-contextual-button.md)
- [NB-39 Text toolbar](../NB-39-text-toolbar.md)
- [NB-40 Text align popover](../NB-40-text-align-popover.md)
- [NB-41 Menu item](../NB-41-menu-item.md)
- [NB-42 Font style menu](../NB-42-font-style-menu.md)

The next component ticket is the next free id after NB-42, parented to NB-E6, and titled with the component name.

## Success looks like

- [ ] Each component has a ticket titled with the component name
- [ ] Each ticket is committed on its own branch and merged into `phase-2`
- [ ] No Phase 2 ticket is merged into `main` on its own
- [ ] `phase-2` merges into `main` only when the phase is finished

## Out of scope

Merging individual tickets into `main`. Changing Phase 1 canvas behavior except where a component ticket requires it. Shadows, frosted glass, and the dot grid. Paragraph spacing is not in the token export.

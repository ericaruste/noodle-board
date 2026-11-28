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
- [NB-43 Typeface menu](../NB-43-typeface-menu.md)
- [NB-44 Font size menu](../NB-44-font-size-menu.md)
- [NB-45 Menu gap](../NB-45-menu-gap.md)
- [NB-46 Icon button](../NB-46-icon-button.md)
- [NB-47 Hex input](../NB-47-hex-input.md)
- [NB-48 Color swatch](../NB-48-color-swatch.md)
- [NB-49 Color picker toolbar](../NB-49-color-picker-toolbar.md)
- [NB-50 Noodle toolbar](../NB-50-noodle-toolbar.md)
- [NB-51 Transparent sticky](../NB-51-transparent-sticky.md)
- [NB-52 Noodle stroke color](../NB-52-noodle-stroke-color.md)
- [NB-53 Thumb](../NB-53-thumb.md)
- [NB-54 Track](../NB-54-track.md)
- [NB-55 Fill opacity slider](../NB-55-fill-opacity-slider.md)
- [NB-56 Shape toolbar](../NB-56-shape-toolbar.md)
- [NB-57 Show one toolbar at a time on sticky and shape](../NB-57-one-toolbar-at-a-time.md)
- [NB-58 Keep a shape at its default height until the text overflows](../NB-58-shape-default-height.md)
- [NB-59 Start new shapes on purple](../NB-59-shape-default-purple.md)
- [NB-60 Stroke property](../NB-60-stroke-property.md)
- [NB-61 Shape swatch](../NB-61-shape-swatch.md)
- [NB-63 Main button](../NB-63-main-button.md)
- [NB-64 Main toolbar](../NB-64-main-toolbar.md)
- [NB-65 Update shape rendering and text layout](../NB-65-shape-rendering.md)
- [NB-66 Title input](../NB-66-title-input.md)
- [NB-67 Logo button](../NB-67-logo-button.md)
- [NB-68 Save indicator](../NB-68-save-indicator.md)
- [NB-69 Shape icons](../NB-69-shape-icons.md)
- [NB-70 Icon fit](../NB-70-icon-fit.md)
- [NB-71 Live icon fit](../NB-71-live-icon-fit.md)
- [NB-72 Project toolbar](../NB-72-project-toolbar.md)
- [NB-73 Project menu](../NB-73-project-menu.md)
- [NB-74 Project management toolbar](../NB-74-project-management-toolbar.md)
- [NB-75 Project menu layout](../NB-75-project-menu-layout.md)
- [NB-76 Project menu title clip](../NB-76-project-menu-title-clip.md)
- [NB-77 Motion list and component animations](../NB-77-motion-list-and-component-animations.md)
- [NB-79 Sliding pill on contextual toolbars and popovers](../NB-79-sliding-pill-on-contextual-toolbars.md)

NB-57, NB-58, NB-59, and NB-65 are behavior tickets, not components. The next component ticket is the next free id after NB-79, parented to NB-E6, and titled with the component name.

## Success looks like

- [ ] Each component has a ticket titled with the component name
- [ ] Each ticket is committed on its own branch and merged into `phase-2`
- [ ] No Phase 2 ticket is merged into `main` on its own
- [ ] `phase-2` merges into `main` only when the phase is finished

## Out of scope

Merging individual tickets into `main`. Changing Phase 1 canvas behavior except where a component ticket requires it. Shadows, frosted glass, and the dot grid. Paragraph spacing is not in the token export.

---
id: NB-66
title: Title input
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id: ERI-82
linear_url: https://linear.app/ericar/issue/ERI-82/title-input
---

## Context

Building block for the project title. Figma component `input/title`. The spec that was matched is node `381:2845`. Node `509:2477` is the save indicator frame, not this field.

The control is 40px tall. The specimen text is "Title". States are default, hover, and focus. The frame says the maximum length is 320px, the title truncates, and a tooltip shows the entire project title.

The file bar still draws its own name. [`src/SaveToolbar.tsx`](../src/SaveToolbar.tsx) `ProjectName` is a button until it is clicked, then an input. It truncates at `max-w-[14rem]` and puts the full name on the `title` attribute. [`src/App.tsx`](../src/App.tsx) `renameProject` stores the trimmed name, and an empty name becomes "Untitled". [`src/HexInput.tsx`](../src/HexInput.tsx) is the hex field. It is not this control.

## Problem

Phase 2 needs the title field from `input/title`. The board has no shared title input, and the file bar still paints its own name.

## Repro

1. Open `?trial=title-input`.
2. Compare default, hover, and focus with Figma component `input/title`.
3. Type a title wider than 320px in the live field. The visible text truncates. The resting field still offers the full title.

## Acceptance criteria

- [x] The field uses semantic tokens for fill, text, stroke, spacing, and corner radius
- [x] The control is 40px tall
- [x] The width follows the title and stops at 320px
- [x] A title wider than that is truncated
- [x] When the title is truncated, hover or focus shows the full title in the main toolbar hover label
- [x] Default, hover, and focus match the painted variants
- [x] The title can be edited while the field is focused
- [x] The label uses the responsive desktop size and line height that match the Figma text style
- [x] The live board is unchanged when the trial page is absent

## Technical notes

[`src/TitleInput.tsx`](../src/TitleInput.tsx) is the component. `?trial=title-input` shows default, hover, focus, and a live field, including a title long enough to reach 320px. Register the trial in [`src/main.tsx`](../src/main.tsx) the same way as `?trial=hex-input`.

The specimen word is "Title". Default has no fill and no stroke. Hover fills with `mapped.surface.action-hover`. Focus fills with `mapped.surface.default` and draws a blue outside stroke, `mapped.border.action-ring-focus` at `alias.border-width.sm`, the same treatment as the hex input. The text is `mapped.text.default`.

Height is `brand.scale.40` (40px). Horizontal padding is `brand.scale.12` (12px), and the title is centered in that height. The corner is `alias.border-radius.xl` (12px), rounder than the hex field's 8px. The 320px cap is written on the frame. No spacing token is 320px, so the cap is marked `/* TODO token mismatch: Figma 320px */`.

The text style is `body/md/tight`: `responsive.desktop.body.md.size` and `responsive.desktop.body.md.line-height-tight` (14px / 14px). Paragraph spacing is not in the export, so it stays as drawn. That style is recorded in `docs/design-system-notes.md`.

The width hugs the title plus that padding and stops at 320px. Overflow truncates. Hover or focus on a truncated title shows the full title in the same hover label the main toolbar uses, 8px above the field. A long title wraps at 320px so the label stays over the field. It is not the browser `title` attribute, and it is not a new tooltip component.

A click focuses the field. The trial field accepts typing. This ticket does not change how the file bar commits a rename.

The spec sheet around the component (state names, the red 40px note, the dashed frame, the title, and the description) is documentation. It is not part of the component. The 320px cap, the truncation, and the full title on the resting field are the behavior that description states.

This field is not a toolbar or popover. A later ticket that places it in the file bar uses FloatingPanel and the z-index tokens in `src/layers.ts` only if that bar becomes one of those panels.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

## Out of scope

Replacing `ProjectName` in the file bar. The rename rules in `renameProject` (trim, empty becomes "Untitled", updating the recent row). A tooltip component. Disabled, selected, and pressed: the frame does not paint them. Shadows, frosted glass, and the dot grid. Paragraph spacing is not in the token export.

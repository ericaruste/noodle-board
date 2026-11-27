---
id: NB-66
title: Title input
status: Todo
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id: ERI-82
linear_url: https://linear.app/ericar/issue/ERI-82/title-input
---

## Context

Building block for the project title. Figma component `input/title`, on the spec frame `input/title` node `509:2477`.

The control is 40px tall. The specimen text is "Title". States are default, hover, and focus. The frame says the maximum length is 320px, the title truncates, and a tooltip shows the entire project title.

The file bar still draws its own name. [`src/SaveToolbar.tsx`](../src/SaveToolbar.tsx) `ProjectName` is a button until it is clicked, then an input. It truncates at `max-w-[14rem]` and puts the full name on the `title` attribute. [`src/App.tsx`](../src/App.tsx) `renameProject` stores the trimmed name, and an empty name becomes "Untitled". [`src/HexInput.tsx`](../src/HexInput.tsx) is the hex field. It is not this control.

## Problem

Phase 2 needs the title field from `input/title`. The board has no shared title input, and the file bar still paints its own name.

## Repro

1. Open `?trial=title-input`.
2. Compare default, hover, and focus with Figma component `input/title`.
3. Type a title wider than 320px in the live field. The visible text truncates. The resting field still offers the full title.

## Acceptance criteria

- [ ] The field uses semantic tokens for fill, text, stroke, spacing, and corner radius
- [ ] The control is 40px tall
- [ ] The width follows the title and stops at 320px
- [ ] A title wider than that is truncated
- [ ] When the title is truncated, the resting field still offers the full project title
- [ ] Default, hover, and focus match the painted variants
- [ ] The title can be edited while the field is focused
- [ ] The label uses the responsive desktop size and line height that match the Figma text style
- [ ] The live board is unchanged when the trial page is absent

## Technical notes

[`src/TitleInput.tsx`](../src/TitleInput.tsx) is the component. `?trial=title-input` shows default, hover, focus, and a live field, including a title long enough to reach 320px. Register the trial in [`src/main.tsx`](../src/main.tsx) the same way as `?trial=hex-input`.

The specimen word is "Title". Default has no fill and no stroke. Hover fills with the pale action surface, which reads as `mapped.surface.action-hover`. Focus fills with `mapped.surface.default` and draws a blue outside stroke that reads as `mapped.border.action-ring-focus` at `alias.border-width.sm`, the same treatment as the hex input. The text stays `mapped.text.default`. Confirm those colors on the component. Prefer a `mapped.surface` token for a fill, a `mapped.text` token for the title, and a `mapped.border` token for the focus stroke.

Height is the red 40px note, `brand.scale.40`. The 320px cap is written on the frame. No spacing token is 320px. The corner is rounder than the hex field's 8px (`alias.border-radius.lg`). Check `alias.border-radius.xl` (12px) and `alias.border-radius.xxl` (16px) against the frame before choosing. Padding is not annotated. Match it from the component and use a `brand.scale` token.

The text style is not named on the frame. Font size and line height use the responsive desktop token. Paragraph spacing is not in the export, so it stays as drawn. The hex field uses `body/sm/tight` at 12px. This field is taller, so compare `responsive.desktop.body.md` (14px) before using a larger style. Record the text style in `docs/design-system-notes.md`.

The Figma file request was rate limited, and Dev Mode was behind the sign-up wall. Confirm padding, corner radius, stroke width, and the text style against the component before painting. If no value matches exactly, use the nearest token and add `/* TODO token mismatch: Figma <value> */` beside it.

The width hugs the title plus that padding and stops at 320px. Overflow truncates. The frame does not paint a tooltip component. The resting field exposes the full title the way `ProjectName` already does, with the `title` attribute. Do not add a tooltip component.

A click focuses the field. The trial field accepts typing. This ticket does not change how the file bar commits a rename.

The spec sheet around the component (state names, the red 40px note, the dashed frame, the title, and the description) is documentation. It is not part of the component. The 320px cap, the truncation, and the full title on the resting field are the behavior that description states.

This field is not a toolbar or popover. A later ticket that places it in the file bar uses FloatingPanel and the z-index tokens in `src/layers.ts` only if that bar becomes one of those panels.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

## Out of scope

Replacing `ProjectName` in the file bar. The rename rules in `renameProject` (trim, empty becomes "Untitled", updating the recent row). A tooltip component. Disabled, selected, and pressed: the frame does not paint them. Shadows, frosted glass, and the dot grid. Paragraph spacing is not in the token export.

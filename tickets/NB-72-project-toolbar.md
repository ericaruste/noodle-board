---
id: NB-72
title: Project toolbar
status: Done
priority: 3
labels: [Feature, UX, Toolbar]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id: ERI-88
linear_url: https://linear.app/ericar/issue/ERI-88/project-toolbar
---

## Context

Project management bar for the upper left of the canvas. Figma component `toolbar/project`, node `539:2480`. The white sheet around it is 623 by 222 and holds the labels. That sheet is documentation. The bar itself is the pill.

The pill is the logo button, the title input, and the save indicator at `lg`, in that order. The note on the title says the field is at least 200px and at most 320px. The specimen text is "Project Title". The logo is the resting circle. The save disc is the large indicator.

The live board still paints the file bar. [`src/SaveToolbar.tsx`](../src/SaveToolbar.tsx) is the upper-left control in [`src/App.tsx`](../src/App.tsx): a save dot, `ProjectName`, Recent, New, Open, Save, and Save As. [`src/LogoButton.tsx`](../src/LogoButton.tsx), [`src/TitleInput.tsx`](../src/TitleInput.tsx), and [`src/SaveIndicator.tsx`](../src/SaveIndicator.tsx) are the three pieces. None of them is mounted on the board. The title input hugs its text up to 320px and has no 200px minimum. The upper-right wordmark is the "Noodle Board" label beside that file bar.

## Problem

Phase 2 has the three pieces and no project toolbar. The upper-left chrome is still the file bar. The project menu is [NB-73](NB-73-project-menu.md). This bar is built with that menu. This ticket does not put it on the canvas.

## Repro

1. Open the board. The upper left is the file bar: a save dot, the project name, Recent, New, Open, Save, and Save As.
2. Compare that bar with Figma node `539:2480`. The frame is a logo, a title, and a large save indicator. It has no Recent, New, Open, Save, or Save As.

## Acceptance criteria

- [x] The bar is the logo button, the title input, and the save indicator at `lg`, in that order
- [x] The title slot is at least 200px and stops at 320px
- [x] A title wider than 320px truncates, and the resting field still offers the full title
- [x] The logo on the bar is the resting 40px circle
- [x] The save indicator uses size `lg`
- [x] The bar uses the surface, border, spacing, and radius tokens from the frame
- [x] The trial page shows the resting bar, a title long enough to truncate, and the save indicator while saved and while saving
- [x] The live board is unchanged when the trial page is absent

## Technical notes

[`src/ProjectToolbar.tsx`](../src/ProjectToolbar.tsx) is the component. `?trial=project-toolbar` and `#project-toolbar` show the resting bar with "Project Title", a title long enough to pass 320px, a saved success indicator, and a saving success indicator. Register the trial in [`src/main.tsx`](../src/main.tsx) the same way as `?trial=save-indicator`.

The row is `LogoButton`, `TitleInput`, and `SaveIndicator` with `size="lg"`. Do not draw a new logo, a new field, or a new disc. The logo button keeps its own hover and selected expansion. The title input keeps its own hover and focus. The save indicator keeps the breath and the ring from NB-68. The painted frame shows the resting circle, the resting title, and the static disc.

The content box is 304 by 48. A 1px stroke brings the outer size to 306 by 50. Padding is `brand.scale.4` (4px). The gap between the logo and the title, and between the title and the indicator, is `brand.scale.8` (8px). The logo and the indicator slot are 40px. The title slot in the specimen is the 200px minimum.

No spacing token is 200px, so the minimum is marked `/* TODO token mismatch: Figma 200px */`. The 320px cap is the same mismatch already on the title input. Set the minimum on this bar's title slot. Leave `TitleInput` hugging its text everywhere else.

The stroke is `mapped.border.default` (`#D8DCE2`) at `alias.border-width.xsm` (1px). The fill is `mapped.surface.default` (`#F6F9FD` at 60%), the same surface as the main toolbar. On the white sheet the pixels sample near `#F8FAFD`. The corner measures about 10px. No radius token is 10px. The nearest bar radius is `alias.border-radius.xl` (12px), so use that and mark `/* TODO token mismatch: Figma 10px */`.

A faint shadow sits outside the stroke. Shadow is not a token. Blur is not visible on the white sheet. Do not add a blur on the trial. The spec sheet (the labels, the arrows, and the 623 by 222 frame) is not part of the component.

The painted disc samples `#45B46C`. NB-68 already rests the indicator on `mapped.icon.success-light` and breathes it to `mapped.icon.success`. This bar places that component. It does not recolor the disc.

Record a Project toolbar section in [`docs/design-system-notes.md`](../docs/design-system-notes.md): the ticket, the code path, a token table for the bar, the logo, the title, and the indicator, the three slots, and which states the frame paints. The logo, the title, and the indicator keep the states already recorded on their own sections.

This ticket renders the bar on the trial page. It does not mount it over the canvas, so it does not use FloatingPanel yet. The later pass that places it upper left, together with the project menu from NB-73, uses FloatingPanel on the toolbar layer and checks it against a selected element and an element that is mid-drag.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

The Figma file request was rate limited, and inspect is behind the sign-up wall. The sizes above were measured from the painted frame at 200%. The logo bounding box is 40px, which confirms that scale.

## Out of scope

Placing the bar on the canvas. Replacing `SaveToolbar`. The project menu in NB-73, and which control opens it. The frame paints no menu and no chevron. New, Open, Save, Save As, and Recent. The rename rules in `renameProject`. The upper-right "Noodle Board" wordmark. Changing the logo button, the title input, or the save indicator except for the 200px minimum on this bar. Shadows, frosted glass, and the dot grid. Paragraph spacing is not in the token export.

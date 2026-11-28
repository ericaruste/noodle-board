---
id: NB-81
title: Title input size
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 1
linear_id: ERI-97
linear_url: https://linear.app/ericar/issue/ERI-97/title-input-size
---

## Context

[`src/TitleInput.tsx`](../src/TitleInput.tsx) is the title field from [NB-66](NB-66-title-input.md). It has one size: `h-brand-scale-40` (40px), `px-brand-scale-12` (12px), `rounded-alias-border-radius-xl` (12px), and `body/md/tight` text. It paints `default`, `hover`, and `focus`, and the focus ring comes from `.noodle-title-input:focus-within` in [`src/index.css`](../src/index.css). [`src/ProjectToolbar.tsx`](../src/ProjectToolbar.tsx) is the only place that uses it on the board. `?trial=title-input` shows the three states and one live field.

The Figma component now has a `size` property with `lg`, `md`, and `sm`. `lg` is the current 40px field. `md` is 32px. `sm` is 28px; the 32px label beside the `sm` row in Figma is a typo. `md` and `sm` use an 8px corner. The side padding and the text are the same on every size.

## Problem

The title field has no size property, so a smaller project toolbar cannot use a 32px or 28px title.

## Repro

1. Open `?trial=title-input`.
2. Only the 40px field is shown. There is no `md` or `sm`.

## Acceptance criteria

- [x] `TitleInput` takes `size`: `lg`, `md`, or `sm`. Unset is `lg`
- [x] `lg` stays exactly as it is today: 40px high, 12px padding, 12px corner
- [x] `md` is 32px high and `sm` is 28px high. Both use an 8px corner
- [x] Every size keeps 12px side padding, the same text, and the same default, hover, and focus paint
- [x] `?trial=title-input` shows each size in default, hover, and focus, plus the live field
- [x] The project toolbar on the board is unchanged
- [x] The Title input section in `docs/design-system-notes.md` records `size` and each size's height and corner

## Technical notes

| Size | Height | Corner radius | Padding | Text |
| --- | --- | --- | --- | --- |
| `lg` | `brand.scale.40` | `alias.border-radius.xl` (12px) | `brand.scale.12` | `responsive.desktop.body.md` tight |
| `md` | `brand.scale.32` | `alias.border-radius.lg` (8px) | `brand.scale.12` | `responsive.desktop.body.md` tight |
| `sm` | `brand.scale.28` | `alias.border-radius.lg` (8px) | `brand.scale.12` | `responsive.desktop.body.md` tight |

Add `export type TitleInputSize = "lg" | "md" | "sm"`. Keep the height and the corner in one record per size, and leave the padding and the type in the shared class. Put `data-size` on the label, the way `SaveIndicator` does.

The focus ring is an outline, so it follows the size's corner with no change to `src/index.css`. The 320px cap and the full-title hover label stay the same on every size. The project toolbar passes no `size`, so it stays `lg`.

The trial lays the sizes out as rows and the states as columns, the same grid as the Figma component set.

This is a field, not a toolbar, dropdown, or popover, so it adds no FloatingPanel and no layer.

## Out of scope

A medium project toolbar or project management toolbar trial. Changing the project toolbar's size. Text size per size. The 320px cap and the 200px minimum on the project toolbar. Disabled, selected, and pressed states.

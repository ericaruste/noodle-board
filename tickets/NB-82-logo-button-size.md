---
id: NB-82
title: Logo button size
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 1
linear_id: ERI-98
linear_url: https://linear.app/ericar/issue/ERI-98/logo-button-size
---

## Context

[`src/LogoButton.tsx`](../src/LogoButton.tsx) is the brand button from [NB-67](NB-67-logo-button.md), with the shape press and noodle dip from [NB-77](NB-77-motion-list-and-component-animations.md). It has one size: `size-brand-scale-40`. The rest corner is `--brand-scale-20` (a circle). Hover and selected use `--alias-border-radius-lg` (8px). The pressed corner is `16.8px`, 42% of 40px. The mark dips `translateY(1px)`. The mark is [`src/assets/icons/noodle-logo.svg`](../src/assets/icons/noodle-logo.svg), drawn on a 40 by 40 view box and rendered at `size-full`, so it scales with the button. [`src/ProjectToolbar.tsx`](../src/ProjectToolbar.tsx) uses it. `?trial=logo-button` shows the painted states and one live button.

A medium project toolbar needs a 32px logo.

## Problem

The logo button has no size property, so it cannot be 32px.

## Repro

1. Open `?trial=logo-button`.
2. Every button is 40px. There is no 32px logo.

## Acceptance criteria

- [x] `LogoButton` takes `size`: `lg` or `md`. Unset is `lg`
- [x] `lg` stays exactly as it is today
- [x] `md` is 32px. At rest it is a circle. Hover and selected use the 8px corner
- [x] On `md`, the press pulls the corner to 42% of the button and dips the mark by the same share as `lg`, then springs back with the same motion names
- [x] The mark scales to the button on both sizes
- [x] `?trial=logo-button` shows both sizes in default, hover, and selected, and one live button per size
- [x] The Logo button section in `docs/design-system-notes.md` records `size` and each size's values

## Technical notes

| Size | Button | Rest corner | Hover and selected | Pressed corner | Dip |
| --- | --- | --- | --- | --- | --- |
| `lg` | `brand.scale.40` | `brand.scale.20` | `alias.border-radius.lg` (8px) | 16.8px | 1px |
| `md` | `brand.scale.32` | `brand.scale.16` | `alias.border-radius.lg` (8px) | 13.44px | 0.8px |

Keep the per-size values in one record. The pressed corner and the dip stay lengths, not tokens, the same as `lg` today. `md` keeps 42% and scales the 1px dip by 32/40. The 8px corner on `md` is a design choice, not a mismatch.

The press, release, and hover motion, the pointer capture, and the release wait stay as they are on both sizes. `ProjectToolbar` passes no `size`, so the board stays `lg`.

This is a button, not a toolbar, dropdown, or popover, so it adds no FloatingPanel and no layer.

## Out of scope

The medium project toolbar and the project management toolbar size. A `sm` logo. The return-to-circle timing that is still open from NB-77. The brand red and the mark artwork.

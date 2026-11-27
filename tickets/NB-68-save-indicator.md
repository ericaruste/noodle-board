---
id: NB-68
title: Save indicator
status: In Progress
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id: ERI-84
linear_url: https://linear.app/ericar/issue/ERI-84/save-indicator
---

## Context

Building block for the save status dot. Figma frame `save indicator` node `509:2477` (622×733). The component links read `save-indicator` and `save-status`.

The size property is `lg`, `md`, and `sm`. The red notes measure those variants at 40px, 32px, and 24px. Each variant is a square slot with a green or red disc centered in it. The disc is smaller than the slot, and the three discs on the frame look the same size. Types are Success and Error. The note on the frame says the success default state uses success-light.

The file bar still paints its own dot. [`src/SaveToolbar.tsx`](../src/SaveToolbar.tsx) renders a span with `save-dot`, and adds `save-dot-active` while `saving` is true. [`src/index.css`](../src/index.css) draws that dot at `0.5rem` (8px) in `#16a34a`. At rest it scales from 1 to 1.18 over 2s. While saving it scales from 1 to 1.55 over 0.9s. [`src/App.tsx`](../src/App.tsx) holds the larger pulse for at least three cycles (`SAVE_PULSE_MIN_LOOPS`).

The proposed motion is the right-hand column of `d:\ui-design\noodle-board-UI\Save dot comparison.html`. Saved breathes. Saving emits a ring. The HTML file’s greens are Tailwind stand-ins (`#86efac` and `#22c55e`). The caption names those success 300 and success 500.

## Problem

Phase 2 has no save indicator. The file bar uses one green disc and scales that disc. The spec has a size property, a success type on success-light, an error type, and the proposed breath and ring.

## Repro

1. Open `?trial=save-indicator`.
2. Compare success and error at `lg`, `md`, and `sm` with the Save indicator frame.
3. Watch a saved success disc and a saving success disc against the proposed column of the comparison file.

## Acceptance criteria

- [x] The size property is `lg`, `md`, and `sm`
- [x] `lg` is a 40px slot, `md` is 32px, and `sm` is 24px
- [x] The disc is centered in that slot and matches the disc drawn on the frame
- [x] Success rests on `alias.success.400` (`#45B46C`). The caption names success-light. The disc fill is success 400
- [x] While saved, the success disc breathes from `alias.success.400` to `mapped.icon.success`, scaling from 1 to 1.1 over 3s
- [x] While saving, the success disc stays on `alias.success.400` and a `mapped.icon.success` ring expands from scale 1 at half opacity to scale 2.4 at zero opacity over 1.2s
- [x] Error paints its disc at the same three sizes and stays still
- [x] Reduced motion shows a still disc
- [x] The trial page shows both types, all three sizes, and both success motions
- [x] The live board is unchanged when the trial page is absent

## Technical notes

[`src/SaveIndicator.tsx`](../src/SaveIndicator.tsx) is the component. `?trial=save-indicator` and `#save-indicator` show success and error at `lg`, `md`, and `sm`, plus a saved success disc and a saving success disc. Register the trial in [`src/main.tsx`](../src/main.tsx) the same way as `?trial=logo-button`.

The slot uses `brand.scale.40`, `brand.scale.32`, and `brand.scale.24`. The disc does not stretch to the slot. On the frame the three discs look the same size. Measure that diameter on the component. Check it against `brand.scale.16` (16px) and `brand.scale.8` (8px). Use the step that matches the drawn disc. The Figma file request was rate limited, and inspect is behind the sign-up wall, so confirm the diameter there.

The caption says the success default state, or phase 1, uses success-light. The disc fill samples as `#45B46C`, which is `alias.success.400`. There is no mapped token at that value, so the resting disc uses that alias. The breath and the ring use `mapped.icon.success` (`#16A34A`), the same value as `alias.success.500`. Do not copy `#86efac` or `#22c55e` from the comparison file.

Saved animation, on the success disc, `ease-in-out`, 3s, infinite:

- 0% and 100%: scale 1, `alias.success.400`
- 50%: scale 1.1, `mapped.icon.success`

Saving animation keeps the disc at scale 1 on `alias.success.400`. A ring painted in `mapped.icon.success` covers the disc (`inset: 0`, same radius) and runs `ease-out`, 1.2s, infinite:

- 0%: scale 1, opacity 0.5
- 100%: scale 2.4, opacity 0

The ring scales from the disc, so it can paint outside the slot. The indicator does not clip it. `prefers-reduced-motion: reduce` turns both animations off and leaves the resting disc.

The `saving` prop selects the ring. When it is false, success plays the breath. Error ignores `saving`. The error disc uses `mapped.icon.error` when that matches the frame. If the sampled red is another step, use the nearest `alias.error` token and add `/* TODO token mismatch: Figma <value> */` beside it.

The spec sheet around the component (the title, the red size notes, the dashed frames, and the description) is documentation. It is not part of the component. The comparison file’s “Saving” and “Saved” words are labels on that page. This component has no visible text.

Record a Save indicator section in [`docs/design-system-notes.md`](../docs/design-system-notes.md): the ticket, the code path, a token table for the slot, the disc, and both motions, the `size`, `type`, and `saving` properties, and which states are painted. The ring’s opacity is part of the motion. Shadow, blur, and the dot grid are not part of this component.

This indicator is not a toolbar or popover. It does not use FloatingPanel. A later ticket that places it in the file bar uses FloatingPanel and the z-index tokens in `src/layers.ts` only if that bar becomes one of those panels.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

## Out of scope

Replacing the file bar dot in `SaveToolbar`. The three-cycle hold and the autosave timing in `App.tsx`. A visible Saving or Saved label. Hover, disabled, and focus: the frame does not paint them. An error animation. Shadows, frosted glass, and the dot grid.

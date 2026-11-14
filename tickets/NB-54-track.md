---
id: NB-54
title: Track
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id: ERI-69
linear_url: https://linear.app/ericar/issue/ERI-69/track
---

## Context

Building block for a slider. Figma component `slider/track/color-opacity`, on the spec frame titled `slider`, node `288:2302`.

The pill is 120 by 6. A checker sits under a gradient that fades from clear to the current swatch color. The specimen color is `#6579F8`.

[`src/SliderTrack.tsx`](../src/SliderTrack.tsx) is the component. `?trial=slider-track` shows the specimen and a second color without changing the board.

## Problem

The fill opacity slider needs a shared track first. The fade has to follow the swatch color the caller passes in.

## Repro

1. Open `?trial=slider-track`.
2. Compare the pill with Figma component `slider/track/color-opacity`.
3. The second pill uses purple so the fade is not locked to the specimen.

## Acceptance criteria

- [x] The pill is 6px tall and fully round
- [x] The width stays 120px
- [x] A checker shows through the clear end
- [x] The opaque end is the color the caller passes
- [x] The inside stroke uses the control border token
- [x] The live board is unchanged when the trial page is absent

## Technical notes

Height is `brand.scale.150`. The 120px width has no spacing token. Corner radius in the panel is 200, which is a full pill. No radius token is fully round.

The image fill is the checker. It is not a token. The squares are `brand.foundation.white` and `mapped.border.disabled`. The gradient stops are white at 0% opacity and the swatch color at 100%. The specimen `#6579F8` is not a token.

The stroke is `mapped.border.control` at `alias.border-width.xsm`, drawn inside the pill.

The spec sheet around the component (the red height note, the title, and the description) is documentation. It is not part of the component.

This track is not a slider. The fill opacity slider that places it is its own component.

## Out of scope

The thumb, the percent label, and wiring opacity onto a shape. Shadows, frosted glass, and the dot grid.

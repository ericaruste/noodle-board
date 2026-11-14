---
id: NB-53
title: Thumb
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id: ERI-68
linear_url: https://linear.app/ericar/issue/ERI-68/thumb
---

## Context

Building block for a slider. Figma component `slider/thumb`, on the spec frame titled `slider`, node `288:2302`.

The disc is 12px. States are default, hover, pressed, and disabled. The sheet writes “focus” over the pressed disc. The variant property is `pressed`.

[`src/SliderThumb.tsx`](../src/SliderThumb.tsx) is the component. `?trial=slider-thumb` shows the four states without changing the board.

## Problem

The fill opacity slider needs a shared thumb first. Hover and pressed draw a ring outside the disc. Default and disabled keep a stroke inside it.

## Repro

1. Open `?trial=slider-thumb`.
2. Compare default, hover, pressed, and disabled with Figma component `slider/thumb`.

## Acceptance criteria

- [x] The disc uses semantic tokens for fill, stroke, and the ring color
- [x] The disc is 12px
- [x] Default and disabled draw an inside stroke. Hover and pressed hide that stroke
- [x] Hover and pressed draw the ring outside the disc
- [x] The live board is unchanged when the trial page is absent

## Technical notes

The fill is `mapped.surface.action-solid`. Default stroke is `mapped.border.control` at `alias.border-width.xsm`, drawn inside the disc. Disabled stroke is `mapped.border.disabled` at the same width. Hover and pressed hide the stroke.

Figma draws the ring as a drop shadow. Outline is a stroke outside the disc and does not change the 12px size. Hover uses `mapped.border.action-ring`. Pressed uses `mapped.border.action-ring-pressed`. Both are 2px, `alias.border-width.sm`.

The spec sheet around the component (state names, the red size notes, the dashed frame, the title, and the description) is documentation. It is not part of the component.

This thumb is not a slider. The fill opacity slider that places it uses the track and this disc. It is not a toolbar or popover.

## Out of scope

The track, the fill opacity slider, and wiring opacity onto a shape. Shadows as a token. A focus variant: the sheet label says focus, and the property is pressed.

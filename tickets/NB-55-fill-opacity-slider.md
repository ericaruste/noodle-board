---
id: NB-55
title: Fill opacity slider
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: [NB-53, NB-54]
estimate: 2
linear_id: ERI-70
linear_url: https://linear.app/ericar/issue/ERI-70/fill-opacity-slider
---

## Context

The slider that will sit in the shape fill toolbar. Figma component `slider/color-opacity`, on the spec frame titled `slider`, node `288:2302`.

The row hugs its width. The specimen is 154 by 12: the 120px track, an 8px gap, and the `50%` label. Dragging the thumb sets the percent. A double click on the label edits the number, the same gesture as the font size button.

[`src/FillOpacitySlider.tsx`](../src/FillOpacitySlider.tsx) is the component. It uses the thumb and the track. `?trial=fill-opacity` shows a live slider and a fill swatch without changing the board.

## Problem

Shape fill has a color and no opacity control. The slider is the control. It is not in the shape toolbar yet.

## Repro

1. Open `?trial=fill-opacity`.
2. Drag the thumb. The label and the swatch follow.
3. Double-click the percent, type a number, and press Enter. Escape restores the previous number.
4. Compare the resting row with Figma component `slider/color-opacity`.

## Acceptance criteria

- [x] The row is the track, the thumb, and the percent, with an 8px gap
- [x] Dragging the thumb sets a value from 0 to 100
- [x] The thumb uses pressed while dragging and hover while the pointer is over the row
- [x] A double click on the percent edits the number. Enter commits. Escape restores
- [x] The label uses the body small tight style
- [x] The live board is unchanged when the trial page is absent

## Technical notes

The row is 12px tall, `brand.scale.300`, because the thumb is 12px and the track is 6px, centered. Gap is `brand.scale.200`. The label is `body/sm/tight`: `alias.font-family.body`, `responsive.desktop.body.sm.size`, and `responsive.desktop.body.sm.line-height-tight`. The Figma fill is `#334155`. The nearest text token is `mapped.text.default`, `#303132`.

The sheet says the slider shows the current swatch color. The trial uses the specimen `#6579F8`. A caller passes the swatch.

Keyboard focus uses the hover ring. That ring is not a Figma state. Arrow keys step the value. Shift steps by 10.

This slider is not a toolbar or popover. The shape fill toolbar that places it later uses FloatingPanel and the z-index tokens in `src/layers.ts`.

## Out of scope

Replacing the shape fill toolbar. Storing opacity on a shape. Shadows, frosted glass, and the dot grid.

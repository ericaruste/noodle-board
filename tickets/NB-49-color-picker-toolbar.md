---
id: NB-49
title: Color picker toolbar
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 3
linear_id: ERI-64
linear_url: https://linear.app/ericar/issue/ERI-64/color-picker-toolbar
---

## Context

The toolbar that will sit below an element when a fill or stroke color is chosen. Figma paints it twice on the frame titled `color-swatch`, node `193:3525`.

Collapsed is the swatch grid, the hex field, and two icon buttons. Extended adds the color picker under the grid. The picker shows when the custom swatch is clicked.

[`src/ColorPickerToolbar.tsx`](../src/ColorPickerToolbar.tsx) is the component. `?trial=color-picker` shows both states, a live toolbar, and one copy in the floating layer. A selected sticky note uses this toolbar. Shape fill, stroke, and noodles still use the Phase 1 bars.

## Problem

Fill, stroke, and sticky color still use the Phase 1 swatch rows. Phase 2 needs the toolbar those rows will be replaced with: palette swatches, a custom color, a hex field, copy, and an eyedropper.

## Repro

1. Open `?trial=color-picker`.
2. Compare the collapsed frame and the extended frame with the Figma frame `color-swatch`.
3. On the live toolbar, click the custom swatch. The picker opens. Click a palette swatch or none. The picker closes.
4. Type a hex code, copy it, and use the pipette where the browser allows it.
5. Confirm the floating copy paints above the selected box and the dragging box.

## Acceptance criteria

- [x] The panel uses semantic tokens for fill, stroke, spacing, and corner radius
- [x] Collapsed hides the picker. Extended shows it
- [x] The picker appears when the custom swatch is clicked, and hides when a palette swatch or none is clicked
- [x] The picker is react-colorful and has no alpha bar
- [x] The field is the hex input. Copy and the pipette are medium icon buttons
- [x] The floating copy paints above a selected element and a dragging element
- [x] A selected sticky uses the toolbar. The picker mounts collapsed, opens from the custom swatch, and the saturation and hue handles can be dragged
- [x] While a palette swatch or none is selected, the custom disc stays on the default color `EBCFFF`

## Technical notes

The grid is five columns: none, then `alias.swatch` in token-file order, then custom. Fill and sticky notes use step 200. Stroke and noodles use step 500. The specimen on the frame is step 200. Tomato on that frame is `#FF7066`, which is step 500. The component uses one scale for the whole grid.

The swatch grid is 152px. That is five 24px discs and four 8px gaps. The hex row is 172px, so the column stays 172px. No spacing token is 152px or 172px. The saturation field is 108px tall, including the 12px black band. No spacing token is 108px. The gap between the swatch grid, the picker, and the hex row is 16px, `brand.scale.400`. The panel padding is 12px, `brand.scale.300`. The panel corner is 16px, `alias.border-radius.xxl`.

The black band is the bottom border of the saturation field, `brand.foundation.black` at `brand.scale.300`. react-colorful draws it that way. The hue bar sits against that band. `HexColorPicker` has no alpha slider. The stylesheet also hides `.react-colorful__alpha`.

The picker container is one rounded rectangle. The saturation carries the 8px top corners. The hue is square where it meets the black band and carries the 8px bottom corners. The pointer is 20px, `brand.scale.500`, with a 1px white stroke.

The hex field shows the selected swatch. None and custom show the custom color. The frame’s collapsed example selects none and still prints `EBCFFF`, which is the custom color. Editing the field selects custom and does not open the picker. The pipette does the same. Copy writes the hex that the field is showing. A click on the field focuses it and selects the code. A click outside, or on copy or pipette, returns the field to default.

Copy and the pipette are medium icon buttons. The medium glyph is 12px. The none swatch slash is `mapped.icon.disabled`.

Choosing a palette swatch does not change the stored custom color. Choosing custom does not change a palette swatch. The extended frame paints a ring on none and on custom together. The toolbar keeps one selection. Custom is selected while the picker is open.

On a sticky, the open picker is not stored. The toolbar mounts only while the note is selected, so clicking the canvas and then the note again starts collapsed. Opening custom from a selected palette copies that palette into the picker and leaves the note fill unchanged until a drag, a hex edit, or the pipette. The custom disc shows the picker color only while custom is selected. Otherwise it stays on `EBCFFF`. A pointer press on the picker is not canceled, so the saturation and hue handles follow the cursor.

Sticky notes store `data.paint` and `data.customHex`. `data.color` stays `yellow`, `pink`, `blue`, or `green` so older files still open.

The panel fill is `mapped.surface.default` at 80%, with the same 24px blur and the same shadow as the text toolbar. Figma’s blur is ignored.

This toolbar does not wrap itself in FloatingPanel. Selection chrome already does, and the toolbar is the child that will go in that panel. It adds no z-index of its own. The trial mounts one copy in FloatingPanel, over a box at the selection layer and a second box at the selection layer standing in for a drag.

The spec sheet around the frames (the title and the note) is documentation. It is not part of the component.

## Out of scope

Replacing the shape fill, stroke, or noodle color bars. A stroke toolbar on the board. Browsers without the EyeDropper API: the pipette does nothing there. Shadows, frosted glass, and the dot grid.

---
id: NB-79
title: Sliding pill on contextual toolbars and popovers
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 3
linear_id: ERI-95
linear_url: https://linear.app/ericar/issue/ERI-95/sliding-pill-on-contextual-toolbars-and-popovers
---

## Context

[NB-77](NB-77-motion-list-and-component-animations.md) put the sliding pill on the main toolbar only. The hook is [`src/useSlidingPill.ts`](../src/useSlidingPill.ts). It measures with `getBoundingClientRect`, skips a disabled button, hides when the pointer or focus leaves the row, and keeps the current pill while the pointer is in a gap. It only looks for `button` elements. [`src/Toolbar.tsx`](../src/Toolbar.tsx) owns the pill. The fill is `mapped.surface.action-strong-hover`, or `mapped.surface.error-hover` while the active control is Delete. The pill is the first child of a relative row with the class `pill-row`. [`src/index.css`](../src/index.css) clears the hover background on `.pill-row button:not([aria-pressed="true"]):hover`, so the pill shows through a resting button and a pressed button keeps its fill.

[`src/ContextualButton.tsx`](../src/ContextualButton.tsx) is the 32px button. It has no pill. A resting button uses `enabled:hover:bg-mapped-surface-action-hover`. A control with `labelControl` is a `div` with `role="group"` and uses `hover:bg-mapped-surface-action-hover`. The chevron is the only `button` inside that group. The selected fill is `mapped.surface.action-selected`. The button sets `aria-pressed="true"` when `pressed` is true, when `selected` is true, or when `state` is `"selected"`. `pressed="mixed"` sets `aria-pressed="mixed"` and keeps the default fill.

These bars are built from that button. None of them call the hook.

[`src/TextToolbar.tsx`](../src/TextToolbar.tsx) is two groups. The first is typeface, font size, weight, and alignment, with a right border. The second is bulleted list, numbered list, and link. `AlignPopover` in the same file is four icon buttons. The current option passes `pressed={activeAlign === align}`. The alignment control that opens the popover does not pass `pressed` or `selected`. It shows the current alignment icon in the default state. `FontSizeField` passes `labelControl` for the number. Double-click or a keyboard focus sets `editing`. A single click opens the font size menu, which is `MenuItem` rows.

[`src/ShapeToolbar.tsx`](../src/ShapeToolbar.tsx) is three groups: shape swap, then stroke and line weight, then fill and the fill opacity slider. The first two groups have a right border. The slider is `role="slider"` in [`src/FillOpacitySlider.tsx`](../src/FillOpacitySlider.tsx). It is not a button. Shape swap opens [`src/ShapeSwatch.tsx`](../src/ShapeSwatch.tsx). Line weight opens [`src/StrokeProperty.tsx`](../src/StrokeProperty.tsx). Stroke and fill open the color picker.

[`src/ShapeSwatch.tsx`](../src/ShapeSwatch.tsx) is five icon buttons. The current kind passes `pressed`. [`src/Toolbar.tsx`](../src/Toolbar.tsx) opens the same row from the Shapes tool. The menu is a `FloatingPanel` on the dropdown layer, portaled outside the main toolbar row.

[`src/StrokeProperty.tsx`](../src/StrokeProperty.tsx) is thin, medium, and thick, a right border, then solid and dashed. The current weight and the current line style pass `pressed`. A mixed group passes false. [`src/ShapeToolbar.tsx`](../src/ShapeToolbar.tsx) and [`src/NoodleToolbar.tsx`](../src/NoodleToolbar.tsx) both open this row.

[`src/NoodleToolbar.tsx`](../src/NoodleToolbar.tsx) is two groups. The first is text, color, line weight, and noodle type, with a right border. The second is the two arrow controls. The text button passes `pressed` while the label is editing. The noodle type menu is three icon buttons. Each arrow menu is six icon buttons. The current shape and the current arrowhead pass `pressed`. Color opens the color picker.

The text toolbar and the shape toolbar sit in [`src/SelectionChrome.tsx`](../src/SelectionChrome.tsx). The noodle toolbar sits in `NoodleToolbarSlot` in [`src/NoodleEdge.tsx`](../src/NoodleEdge.tsx). Both portal to the toolbar layer and place the bar in screen pixels. The layer is not scaled with the viewport. Their menus portal to the dropdown layer through [`src/FloatingPanel.tsx`](../src/FloatingPanel.tsx), so a menu is not a DOM child of the toolbar row.

[`docs/design-system-notes.md`](../docs/design-system-notes.md) has a section for the contextual button, the text toolbar, the text align popover, the shape toolbar, the shape swatch, the noodle toolbar, the noodle type menu, the arrow menu, the line weight and line type menu, and the stroke property. The main toolbar section is the only one with a pill Motion row. The contextual button section has no Motion row.

## Problem

Hover on these bars is still each button's own fill. There is no shared pill, so every toolbar and popover would repeat the hook, the pill element, and the `pill-row` class. The pill-row rule keeps a fill only for `aria-pressed="true"`. A selected button that does not set that attribute loses `mapped.surface.action-selected` on hover, because the rule paints the background transparent and the pill shows through. The font size control is a group, not one button, so the hook would size a pill to the chevron. These bars follow a selected element, and a popover is a second row on another layer.

## Repro

1. Select a text object. Move across the text toolbar, then into the alignment popover. Double-click the font size and hover the field.
2. Select a shape. Move across the shape toolbar, then into the shape swatch and the line weight menu. Open Shapes on the main toolbar and move into that swatch.
3. Select a noodle. Move across the noodle toolbar, then into the noodle type menu and an arrow menu.
4. Zoom in and out, and drag the element, with the pointer on a button.

## Acceptance criteria

- [x] One shared pill row wraps a row of buttons and adds the pill. The text toolbar, the shape toolbar, and the noodle toolbar use it. The text align popover, the shape swatch, the noodle type menu, the arrow menus, and the line weight and line type menu use it. Each of those does not set up the hook on its own
- [x] `ContextualButton` stays a plain building block. It gains no pill
- [x] The pill fill on these rows is `mapped.surface.action-hover`. It is not the main toolbar's `mapped.surface.action-strong-hover`
- [x] One pill glides across the whole bar, including over the divider between groups
- [x] A selected button keeps `mapped.surface.action-selected` while hovered. A selected contextual button that does not set `aria-pressed="true"` is fixed so that fill is not lost. The current alignment is one to check
- [x] The pill skips a disabled button, as on the main toolbar
- [x] The pill lines up on the button at every zoom, on a toolbar that follows a selected element
- [x] While the font size is being edited as a field, the pill does not cover that field
- [x] A popover has its own pill. Moving from the toolbar into that popover fades the toolbar pill and shows the popover's
- [x] The shape swatch pill also shows in the main toolbar's Shapes dropdown, with `mapped.surface.action-hover`
- [x] The main toolbar can move onto the shared row only when that is a pure swap. Its pill fill stays `mapped.surface.action-strong-hover`, or `mapped.surface.error-hover` while Delete can run
- [x] Each affected section in `docs/design-system-notes.md` has a Motion row: what moves, what triggers it, and which motion name it uses
- [x] Each of these toolbars and popovers has been checked against a selected element and one element that is mid-drag

## Technical notes

Add a pill row component, for example [`src/PillRow.tsx`](../src/PillRow.tsx). It takes the row's children, calls `useSlidingPill`, and renders the pill as the first child of a relative element with the class `pill-row`. The default fill class is `bg-mapped-surface-action-hover`. Radius is `alias.border-radius.lg`. Transform, width, and height use `motion-glide`. Opacity uses `motion-fade`, and the opacity goes to 0 when the hook clears the active control. The pill is `pointer-events-none`. It adds no z-index. DOM order and the existing `pill-row` rule keep it behind the controls.

The text toolbar, the shape toolbar, and the noodle toolbar each get one pill row around the whole bar, groups included. The divider is a right border on a group, not its own control. One row is what lets the glide cross that border. A pill row per group would fade at the group edge. The text align popover, the noodle type menu, and each arrow menu get their own pill row on that menu's button row. `ShapeSwatch` owns the pill row, so the shape toolbar and the main toolbar's Shapes menu both get it. `StrokeProperty` owns the pill row, across the weight group, the divider, and the line-type group, so the shape toolbar and the noodle toolbar both get it.

`ContextualButton` gains no pill prop, no motion class, and no glide. Its hover fill stays for the trial and for any use outside these rows.

The keep-fill rule in [`src/index.css`](../src/index.css) is `.pill-row button:not([aria-pressed="true"]):hover`. Align popover options, shape swatch options, stroke options, noodle type options, arrow options, list, link, and the noodle text button pass `pressed`, and `pressed={true}` already becomes `aria-pressed="true"` plus the selected fill. The alignment control on the text toolbar does not pass `pressed` or `selected`. Check every button that paints `mapped.surface.action-selected`, including the current alignment in the popover. If the fill disappears on hover, that button's attribute is not `aria-pressed="true"`, or another hover rule is winning. Set `pressed` or `selected` so the attribute is `"true"`, or teach the rule to keep the selected fill. Do not leave a selected button transparent. `aria-pressed="mixed"` stays the default fill. That is not the selected fill.

The hook already skips a disabled button and resolves the target from the row's pointer events. Keep that. No control on these bars sets `disabled` today. The rule still applies.

`FontSizeField` is a group with an input, and the chevron is the only button. The hook would size the pill to that chevron. Treat the group as the target while `editing` is false, so the pill matches the whole control. While `editing` is true, that group is not a target. Hide the pill the same way a disabled button hides it, so the pill is not drawn over the field. A marker on the group, read by the hook, is enough. The main toolbar has no such group, so this does not change its targets. A single click that only opens the font size menu is not editing.

These toolbars are portaled onto the floating layer in screen pixels. The layer is not inside the viewport scale. The hook's `getBoundingClientRect` deltas are the right measurement. `offsetLeft` is the wrong one. The pill is a child of the row, so a move of the panel during zoom or drag moves the pill with it. Confirm the pill still sits on the button at more than one zoom, and while the element is dragged. If an ancestor scale shows up, convert the delta into the row's local box.

A menu is portaled to the dropdown layer, so it is not inside the toolbar row. Leaving the toolbar row runs the hook's pointer-leave and the toolbar pill fades. The menu's own pill row shows its pill. The shape swatch in the main toolbar's Shapes dropdown uses the same `mapped.surface.action-hover` pill. It does not use the main toolbar's strong hover.

The fill opacity slider is not a button. It is not a pill target. Do not draw the pill on it.

The main toolbar's pill markup can move into the shared row when the fill can still depend on the active control: `mapped.surface.action-strong-hover`, or `mapped.surface.error-hover` when that control is Delete. The disabled-Delete fade stays. If the swap would change either of those, leave [`src/Toolbar.tsx`](../src/Toolbar.tsx) as it is.

The pill stays inside the panel that already hosts the row. It is not a new `FloatingPanel`. Check each toolbar and each popover against a selected element and an element that is mid-drag. Drag-feedback overlays read their layer from the selection token and add no z-index numbers of their own.

Add a Motion row to each of these sections in [`docs/design-system-notes.md`](../docs/design-system-notes.md): text toolbar, text align popover, shape toolbar, shape swatch, noodle toolbar, noodle type menu, arrow menu, line weight and line type menu, and stroke property. Each row names what moves, what triggers it, and `motion-glide` and `motion-fade`. The fill in that row is `mapped.surface.action-hover`. A popover's row does not say that it matches the toolbar. Write that popover's own sentence. The contextual button section says the button does not move and the pill belongs to the row. If the main toolbar moves onto the shared row, its Motion row can name that row. Its fills stay as they are.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

## Out of scope

Menus built from `MenuItem`: the typeface menu, the font style menu, the font size menu, and the project menu. The color picker. A pill on `ContextualButton` or `MainButton`. Changing the main toolbar's pill fill. The project toolbar. The save-dot and save-indicator animations. `tokens/tokens.json` and the generated token files.

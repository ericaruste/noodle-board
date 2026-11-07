---
id: NB-36
title: Add typeface and font size to the text toolbar
status: Done
priority: 3
labels: [Feature, Canvas, Toolbar]
parent: NB-E3
blockedBy: []
estimate: 3
linear_id: ERI-46
linear_url: https://linear.app/ericar/issue/ERI-46/add-typeface-and-font-size-to-the-text-toolbar
---

## Context

[`TextToolbar`](../src/TextToolbar.tsx) is the text toolbar. It floats above one selected sticky, text object, or shape from [`RichText`](../src/RichText.tsx), and the same bar floats above a same-type group from [`GroupChrome`](../src/GroupChrome.tsx). Those two mounts are the text toolbar this ticket changes. The bottom tool pill in [`Toolbar.tsx`](../src/Toolbar.tsx) stays the tool bar.

The first menu is labeled Font style and lists Regular, Bold, Italic, and Bold Italic ([`FONT_STYLES`](../src/textBody.ts)). That menu is weight. Its button is a text label (`px-2 py-1 text-xs`, `min-w-[4.5rem]`). Alignment is the icon button beside it (`h-10`, Lucide glyph at size 20). Both menus already open in a `FloatingPanel` on the dropdown token.

Text paints at Tailwind `text-sm` (14px) in the inherited sans. [`TextData.fontSize`](../src/TextNode.tsx) is optional and has no toolbar. Runs store `style` and an optional `href`. [NB-07](NB-07-text-objects.md) left a typeface menu and a font size control out of scope.

## Problem

A selected sticky, text object, or shape cannot change typeface or size. The text toolbar needs a typeface menu and, beside it, a font size field with a preset dropdown.

The typeface menu is the font-style list of Google Fonts, in this order: Geist Mono, Open Sans, Montserrat, Coming Soon, and Noto Serif. Coming Soon is the Google Font of that name. The typeface button uses the Lucide `CaseSensitive` icon.

The font size control sits beside the typeface menu. It is one field at the current text-label menu size, the same metrics as the weight menu today. The field shows the current size, and the user types a new size there. A dropdown on that same field lists preset sizes. The default size stays 14.

## Repro

1. Select a sticky, a text object, or a shape. The floating text toolbar has weight, alignment, lists, and link. It has no typeface list and no font size.
2. Select two stickies, or two text objects, or two shapes. The group text toolbar is the same bar and has the same gap.
3. Text on the board is 14px sans until a size is chosen.

## Acceptance criteria

- [x] On a selected sticky, text object, or shape, and on a same-type group, the text toolbar leads with a typeface menu and a font size field beside it. Weight, alignment, bulleted list, numbered list, and link stay after those two, in today’s order
- [x] The typeface button shows the Lucide `CaseSensitive` icon at the alignment button’s size (`h-10`, glyph size 20). Its accessible name is Font style
- [x] The typeface menu lists Geist Mono, Open Sans, Montserrat, Coming Soon, and Noto Serif, in that order. Each item is that Google Font. The active family is checked
- [x] The font size control is a number field at the weight menu’s text-label metrics: no icon and no `h-10`. It shows the current size. Text that has no stored size shows 14 in that field, and that text still paints at 14px
- [x] The field’s dropdown lists 10, 12, 14, 16, 18, 24, 32, 36, 48, 64, and 72, and nothing else. Choosing a preset fills the field and paints that size. Typing a size and pressing Enter, or leaving the field, paints a size from 1 to 400. Escape restores the size the field had when it was focused and closes the dropdown. The typed or chosen size stays in the field
- [x] Choosing a family paints the affected text in that family. Choosing a size paints it at that size. Text with no stored family keeps the current system sans
- [x] While editing, the choice applies to the highlighted range. With the object selected and no range inside it, the choice applies to all of that text. A range that mixes families checks no single family. A range that mixes sizes shows Mixed in the size field, inside the same field metrics
- [x] On a same-type group, the two controls apply to every object in the group. Mixed families and mixed sizes use the same mixed state as a mixed range
- [x] Weight, alignment, lists, and links still apply on text set in any of the five families, including Coming Soon
- [x] Family and size survive undo, redo, reload from localStorage, and `.noodle.json`. A file written before this ticket still opens, and its text keeps the system sans at 14px until a family or size is chosen
- [x] The typeface menu and the font size dropdown open from `FloatingPanel` on the dropdown token, stay on screen, and keep a constant screen size when the text toolbar is pinned inside a zoomed element. Pointer and typing in the field or the menus do not pan the board or drag the element
- [x] The typeface menu and the font size dropdown stay above a selected element and above an element mid-drag

## Technical notes

Load the five families from Google Fonts, including italic and weight 700 where the family publishes them. Coming Soon publishes 400 only. Bold and italic on that face still go through the existing weight menu (`font-weight` and `font-style` on the run).

Store an optional `family` and an optional `size` on the run, beside `style`, so a range can mix. Omit both for the default (system sans, 14). `normalizeRuns` merges adjacent runs only when family and size match as well as style and href. `isTextBody` accepts the new fields and still accepts runs that lack them.

[`TextData.fontSize`](../src/TextNode.tsx) stays valid. When no run in the node has a size, that node-level number is the painted size and the number in the field. A size typed or chosen from the toolbar is written onto the affected runs.

Apply family and size with the same selection rule as `onStyle`: the live range while editing, and `fullRange` when the object is only selected. The group bar maps the same change across each body in [`GroupChrome`](../src/GroupChrome.tsx).

The typeface button is the existing glyph menu. The font size control is an input in the existing text-label menu metrics, with a chevron that opens the preset list in a `FloatingPanel`. The open panel is the preset list only. One open menu at a time, matching the weight and alignment menus. Typing in the field uses the toolbar’s existing exception for `input`, so the pointer can focus it.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

## Out of scope

The bottom tool pill. Noodle labels. Removing or reordering Regular, Bold, Italic, and Bold Italic. Line height, letter spacing, text color, underline, and strikethrough. A typeface outside these five. Changing the default size away from 14px.

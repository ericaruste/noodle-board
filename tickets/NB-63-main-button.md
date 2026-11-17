---
id: NB-63
title: Main button
status: Todo
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id:
linear_url:
---

## Context

Building block for the main toolbar. Figma component `button/main`, on the spec frame `main button` node `288:2302`.

The frame says the main button is to be used for the main toolbar button. The control is 40px tall. With only the icon showing, it is 40px by 40px. The variant grid paints a left icon, the label, and a right icon, so the width follows that content.

Types are `default` and `destructive`. The default type paints default, hover, selected, and disabled. The destructive type paints default, hover, and disabled.

[`src/MainButton.tsx`](../src/MainButton.tsx) is the component. `?trial=main-button` shows the types, states, and the icon-only size without changing the board.

## Problem

The main toolbar still draws its own controls. Phase 2 needs one button for that bar, with the default and destructive types from `button/main`.

## Repro

1. Open `?trial=main-button`.
2. Compare the default and destructive buttons with Figma component `button/main`.

## Acceptance criteria

- [ ] The button uses semantic tokens for fill, text, icon color, spacing, and corner radius
- [ ] The control is 40px tall, and 40px by 40px when only the icon shows
- [ ] Default paints default, hover, selected, and disabled
- [ ] Destructive paints default, hover, and disabled
- [ ] The label, the left icon, and the right icon can each be hidden
- [ ] The label uses the responsive desktop size and line height that match the Figma text style
- [ ] The live board is unchanged when the trial page is absent

## Technical notes

The spec glyph on both icon slots is the case-sensitive icon, and the label reads “Label”. The component takes any Lucide icon in either slot.

Default hover is a pale blue fill with dark text and icons. Default selected is a solid blue fill with light text and icons. Destructive default is red text and icons on a clear fill. Destructive hover keeps that red foreground on a pale red fill. Disabled is gray on a clear fill, on both types.

The Figma file request was rate limited, and the property panel was behind the sign-up wall. State and type names are read from the variant grid and the type diagram. Confirm the slot property names (label, left icon, right icon) against the component before hiding them. Match fills and foregrounds from `@docs/token-lookup.md`. Prefer a `mapped.surface` token for a fill, a `mapped.text` token for the label, and a `mapped.icon` token for an icon. The selected fill is darker than the pale action hover used by the icon button, so check the strong action tokens before reusing the icon button’s selected fill. If no value matches exactly, use the nearest token and add `/* TODO token mismatch: Figma <value> */` beside it.

The label’s font size and line height use the responsive desktop token. Paragraph spacing is not in the export, so it stays as drawn. Record the Figma text style in `docs/design-system-notes.md`.

The spec sheet around the component (state names, the red 40px notes, the purple dashed frame, the title, and the description) is documentation. It is not part of the component.

This button is not a toolbar or popover. When a later ticket places it in the main toolbar, that toolbar uses FloatingPanel and the z-index tokens in `src/layers.ts`.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.

## Out of scope

Replacing the current bottom toolbar. A focus ring: the frame does not paint one. Selected on the destructive type: the frame does not paint it. Shadows, frosted glass, and the dot grid. Paragraph spacing is not in the token export.

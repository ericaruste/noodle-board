---
id: NB-46
title: Icon button
status: Done
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id: ERI-61
linear_url: https://linear.app/ericar/issue/ERI-61/icon-button
---

## Context

Building block for an icon with no label, caption, or chevron. Figma component `button/icon`, on the spec frame `button icon` node `193:3525`.

The control is a square. Sizes are `lg` (32px), `md` (28px), and `sm` (20px). Large and medium use an 8px corner. Small uses a 4px corner. Types are `default` and `destructive`. The default type paints default, hover, selected, and disabled. The destructive type paints default, hover, and disabled.

[`src/IconButton.tsx`](../src/IconButton.tsx) is the component. `?trial=icon-button` shows the sizes, types, and states without changing the board.

## Problem

Toolbars still invent icon-only controls from the contextual button by turning the label off. Phase 2 needs a square button whose only job is the icon, including a destructive type.

## Repro

1. Open `?trial=icon-button`.
2. Compare the default and destructive squares with Figma component `button/icon`.

## Acceptance criteria

- [x] The button uses semantic tokens for fill, icon color, and corner radius
- [x] Large and medium corners are 8px, and the small corner is 4px
- [x] Large is 32px, medium is 28px, and small is 20px
- [x] Default paints default, hover, selected, and disabled
- [x] Destructive paints default, hover, and disabled
- [x] The control shows an icon and no label
- [x] The live board is unchanged when the trial page is absent

## Technical notes

The spec glyph is the case-sensitive icon. The component takes any Lucide icon in that slot. Large draws it at 16px. Medium and small draw it at 12px.

Large is 32px, `brand.scale.800`, with an 8px corner (`alias.border-radius.lg`). Medium is 28px, `brand.scale.700`, with the same 8px corner. Small is 20px, `brand.scale.500`, with a 4px corner (`alias.border-radius.md`). The 8px left around the medium icon is `brand.scale.200`.

The spec sheet around the component (state names, the red size notes, the purple dashed frame, the title, and the description) is documentation. It is not part of the component.

This button is not a toolbar or popover. When a later ticket places it in a toolbar, that toolbar uses FloatingPanel and the z-index tokens in `src/layers.ts`.

## Out of scope

Replacing the text toolbar’s icon controls. A focus ring: the frame does not paint one. Selected on the destructive type: the frame does not paint it. Shadows, frosted glass, and the dot grid.

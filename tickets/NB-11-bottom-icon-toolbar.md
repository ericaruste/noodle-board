---
id: NB-11
title: Bottom-center icon toolbar
status: Todo
priority: 2
labels: [UX, Toolbar]
parent: NB-E4
estimate: 3
linear_id: ERI-19
linear_url: https://linear.app/ericar/issue/ERI-19/bottom-center-icon-toolbar
---

## Context

Inspired by Figma FigJam and Wodle: primary tools as a bottom-center icon pill, not top-center plain text.

[`src/Toolbar.tsx`](../src/Toolbar.tsx) sits in the top-center cluster in [`src/App.tsx`](../src/App.tsx) (`absolute inset-x-4 top-4`) with text labels: Add Sticky Note, Add Text, Add Shape, Add Image, Arrow, Delete. Arrow already uses a small inline SVG; the rest are words. The alignment menu in [`src/TextToolbar.tsx`](../src/TextToolbar.tsx) is also words (Left, Center, Right, Justify). Title chip stays out of the tool bar.

## Problem

The main actions look like a prototype text bar and sit where FigJam-style boards put the document name, not the tools.

## Repro

1. Open the MVP.
2. Tools are labeled in text at the top center.

## Acceptance criteria

- [ ] Toolbar is a single pill **bottom-center**, above the canvas edge (not covering the minimap awkwardly; offset if needed)
- [ ] Actions are **Lucide icons** (see Icons) with `aria-label` and a tooltip on hover
- [ ] Bottom bar, in this order: Text, Image, Shapes (flyout), Noodle, Sticky note, Delete. Text, Shapes, and Noodle stay enabled (NB-07–09 are done)
- [ ] Shapes stays a flyout of the existing shape kinds
- [ ] Image still uses a hidden file input
- [ ] Delete remains disabled when nothing is selected
- [ ] Keyboard and click targets are at least ~40px; tool does not collide with the MiniMap
- [ ] Active/disabled/hover states are obvious on the frosted surface (coordinate with NB-10)
- [ ] The alignment menu on the text format toolbar uses the Lucide alignment icons below

## Icons

From Lucide (`lucide-react`). Names are the kebab-case icon ids.

Bottom bar:

- **Text**: `type-outline`
- **Image**: `image`
- **Shapes** (flyout): `shapes`
- **Noodle** (connector, the Arrow slot): `move-up-right`
- **Sticky note**: `sticky-note`
- **Delete**: `trash`

Open — icon names only, until the tool choice is settled:

- **Hand tool**: `hand`
- **Select**: `mouse-pointer-2`

Text format toolbar (alignment menu):

- **Left**: `text-align-start`
- **Center**: `text-align-center`
- **Right**: `text-align-end`
- **Justify**: `text-align-justify`

## Technical notes

Add `lucide-react`. Import the PascalCase exports (`TypeOutline`, `Image`, `Shapes`, `MoveUpRight`, `StickyNote`, `Trash`, `TextAlignStart`, `TextAlignCenter`, `TextAlignEnd`, `TextAlignJustify`). One stroke size on every icon, inside the ~40px hit target.

Move the pill from the top cluster to `bottom-4` (plus safe padding). If the Shapes flyout is a popover, `pointer-events-auto` on the inner cluster must not block the canvas outside the pill. Keep `pointer-events-none` on the positioning wrapper.

The alignment menu is the Alignment `Menu` in [`src/TextToolbar.tsx`](../src/TextToolbar.tsx). Use the four alignment icons there. Font style, lists, and link stay as they are. Behavior of Text, Shapes, and Noodle stays as built in NB-07–09.

## Out of scope

Hand and Select, until those tools are decided. Smart guides (NB-12). Font style, list, and link glyphs on the text toolbar. Do not remove the title chip; it can stay top-left.

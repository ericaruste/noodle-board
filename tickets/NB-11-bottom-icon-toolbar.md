---
id: NB-11
title: Bottom-center icon toolbar
status: Todo
priority: 2
labels: [UX, Toolbar]
parent: NB-E4
estimate: 3
linear_id:
linear_url:
---

## Context

Inspired by Figma FigJam and Wodle: primary tools as a bottom-center icon pill, not top-center plain text.

[`src/Toolbar.tsx`](../src/Toolbar.tsx) is `absolute left-1/2 top-4` with “Add Sticky Note”, “Add Image”, “Delete”. [`src/App.tsx`](../src/App.tsx) passes `onAddSticky`, `onAddImage`, `onDelete`, `canDelete`. Title chip is also top-left; keep it out of the tool bar.

## Problem

The main actions look like a prototype text bar and sit where FigJam-style boards put the document name, not the tools.

## Repro

1. Open the MVP.
2. Tools are labeled in text at the top center.

## Acceptance criteria

- [ ] Toolbar is a single pill **bottom-center**, above the canvas edge (not covering the minimap awkwardly; offset if needed)
- [ ] Actions are **icons** with `aria-label` and a tooltip on hover: Sticky, Image, Delete at minimum
- [ ] Slots for Text, Shape (flyout), and Arrow exist. If E3 has not landed, those icons are present but **disabled** (or omitted only if you explicitly prefer not to tease them; disabled slots are the default so the bar’s layout stays stable)
- [ ] Image still uses a hidden file input
- [ ] Delete remains disabled when nothing is selected
- [ ] Keyboard and click targets are at least ~40px; tool does not collide with the MiniMap
- [ ] Active/disabled/hover states are obvious on the frosted surface (coordinate with NB-10)

## Technical notes

Change `top-4` to `bottom-4` (plus safe padding). Inline SVG or a tiny icon set; no new UI library required. If Shape flyout is a popover, `pointer-events-auto` on the inner cluster must not block the canvas outside the pill. Keep `pointer-events-none` on the positioning wrapper.

## Out of scope

Implementing Text, Shape, and Arrow behavior (NB-07–09). Smart guides (NB-12). Do not remove the title chip; it can stay top-left.

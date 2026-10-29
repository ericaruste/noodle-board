---
id: NB-10
title: Frosted-glass navigation containers
status: Todo
priority: 3
labels: [UX, Toolbar]
parent: NB-E4
estimate: 2
linear_id: ERI-18
linear_url: https://linear.app/ericar/issue/ERI-18/frosted-glass-navigation-containers
---

## Context

Inspired by Google Stitch: low-transparency blur behind navigation. Current chrome is nearly opaque:

- Toolbar: `bg-white/95 ... backdrop-blur` in [`src/Toolbar.tsx`](../src/Toolbar.tsx)
- Title chip: `bg-white/90` in [`src/App.tsx`](../src/App.tsx)
- MiniMap: `className="!bg-white"` plus [`src/index.css`](../src/index.css) `.react-flow__minimap`

The dotted `Background` in App should show through the bars.

## Problem

Nav surfaces read as solid white cards, not frosted glass.

## Repro

1. Open the board on the dotted canvas.
2. Look at the top toolbar, “Noodle Board” chip, and minimap. They are ~opaque white.

## Acceptance criteria

- [ ] Toolbar container, title chip, and minimap use a low-alpha fill, strong `backdrop-blur` (e.g. `bg-white/40 backdrop-blur-xl`), and a hairline light border
- [ ] Canvas dots remain visible through those surfaces
- [ ] Text and icons on those surfaces stay readable (contrast) in default light theme
- [ ] Hover/disabled button states still work on the frosted toolbar
- [ ] If NB-11 moves the toolbar, frost travels with it (do not leave a solid white clone)

## Technical notes

Tailwind: `bg-white/35`–`/50`, `backdrop-blur-xl`, `border border-white/50`, keep existing `shadow`. MiniMap may need a wrapper plus CSS override of `.react-flow__minimap` background. Avoid `backdrop-filter` on elements that also contain `<canvas>` if it paints incorrectly; wrap instead.

## Out of scope

Dark theme, restyling nodes themselves, and iconography (NB-11).

---
id: NB-E4
title: UI/UX chrome
status: Todo
priority: 2
labels: [Epic, UX, Toolbar]
estimate: 8
linear_id: ERI-8
linear_url: https://linear.app/ericar/issue/ERI-8/uiux-chrome
---

## Context

Chrome today: a top-center text toolbar (`bg-white/95 backdrop-blur` in [`src/Toolbar.tsx`](../../src/Toolbar.tsx)), a solid title chip and MiniMap in [`src/App.tsx`](../../src/App.tsx). No alignment guides. The 10/29 notes ask for Google Stitch–style frosted glass, a FigJam/Wodle bottom icon bar, and Miro/Figma smart guides.

Child tickets: [NB-10](../NB-10-frosted-glass-nav.md), [NB-11](../NB-11-bottom-icon-toolbar.md), [NB-12](../NB-12-smart-alignment-guides.md), [NB-14](../NB-14-fixed-screen-selection-chrome.md), [NB-15](../NB-15-equal-spacing-guides.md), [NB-19](../NB-19-shared-floating-layer.md), [NB-24](../NB-24-noodle-text-on-line.md).

## Goal

Move primary actions to a bottom-center icon pill, frost navigation surfaces, and snap objects to each other while dragging.

## Child issues

- NB-10 Frosted-glass navigation containers
- NB-11 Bottom-center icon toolbar
- NB-12 Smart alignment guides while dragging
- NB-14 Keep selection chrome a fixed screen size
- NB-15 Equal-spacing guides while dragging
- NB-19 Route floating toolbars and dropdowns through one shared layer
- NB-24 Edit noodle text on the line

## Success looks like

- [ ] Toolbar, title, and minimap read as frosted glass on the dotted canvas
- [ ] Primary tools are icons at the bottom center, with labels as tooltips/`aria-label`
- [ ] Dragging a node shows and snaps to edge/center guides of other nodes
- [ ] Dragging a node snaps to an equal gap on its row or column and draws a bracket in each matching gap
- [ ] Every toolbar, dropdown, and popover paints from one shared layer, above selected and mid-drag canvas elements and below modals
- [ ] Noodle text paints above the stroke, and it is edited on the line from a Text button or a double-click, not from a field in the floating toolbar

## Out of scope

Implementing Text/Shape/Arrow behavior (E3). NB-11 may show those icons disabled until E3 lands. Do not copy the xyflow Pro helper-lines example source for NB-12.

---
id: NB-65
title: Update shape rendering and text layout
status: In Progress
priority: 3
labels: [Feature, Canvas]
parent: NB-E6
blockedBy: []
estimate: 2
linear_id:
linear_url:
---

## Context

Board shapes are painted by `ShapeGeometry` in [`src/ShapeNode.tsx`](../src/ShapeNode.tsx). The hit target is the separate `.noodle-shape-hit` element. The label is the separate `.noodle-shape-text` element, positioned by [`shapeTextFrame`](../src/shapeData.ts).

Figma file `noodle-board`, node `454:2580`: https://www.figma.com/design/jCbfxerdp8uyf3aGIAiq8C/noodle-board?node-id=454-2580

A new shape used one size, 180 by 140, from `SHAPE_DEFAULT_WIDTH` and `SHAPE_DEFAULT_HEIGHT`. A rectangle had sharp corners and a 14px text pad. A rounded rectangle capped its radius at 28 and also at 22% of each side, and its text pad was 22. That pad scaled from the width only (`width * 0.12`). A diamond and a triangle were sharp polygons. The empty hint already uses the placeholder size, 14px.

## Problem

Each kind needs its own default size. The rectangle, the rounded rectangle, the diamond, and the triangle need the corner and text-inset values from the frame. The text bands for the ellipse, the diamond, and the triangle stay as they are.

## Repro

1. Place a rectangle, an ellipse, a rounded rectangle, a triangle, and a diamond.
2. Compare each box with the sizes below, and compare the painted corners and the label inset.

## Acceptance criteria

- [x] A new rectangle, ellipse, and diamond are 140 by 140. A new triangle is 160 by 140. A new rounded rectangle is 180 by 140
- [x] A rectangle’s text pad is 12px and its painted corner radius is 8px
- [x] A rounded rectangle’s text pad is 24px. Its radius cap is 56px, still limited by half the inner box, with no 22% of width or height
- [x] Rectangle and rounded-rectangle padding is `min(preferred, max(8, min(width, height) * 0.2))`
- [x] A diamond and a triangle paint 8px rounded corners. Their text frames and hit clips stay the same
- [x] Ellipse, diamond, and triangle text bands stay ellipse 0.18/0.64, diamond 0.28/0.44, and triangle x 0.30, y 0.46, w 0.40, h 0.42, with no extra padding inside the band
- [x] The empty hint “Add text” is 14px
- [x] The stroke stays inset, the hit target stays a separate element, text stays vertically centered, horizontal alignment stays the paragraph’s own `text-align`, and an equal-sided ellipse stays a circle

## Technical notes

`shapeDefaultSize` in [`src/shapeData.ts`](../src/shapeData.ts) is the size a new shape is placed at. [`placementSize`](../src/placement.ts) reads it. A shape that already has a width and height keeps that box.

`SHAPE_CORNER_RADIUS` is 8. The rectangle uses it as `rx` / `ry` on the inset rect. The diamond and the triangle build a rounded path from the same inset vertices the sharp polygon used. The hit clips for those two kinds stay the sharp polygons.

The rounded-rectangle radius is `min(56, innerWidth / 2, innerHeight / 2)`. The text pad for a rectangle and a rounded rectangle uses the shorter side.

The empty hint is the placeholder on `RichText` with `canvasDefault`. That class is `responsive.desktop.placeholder.md.size`, which is already 14px. No font-size change.

## Out of scope

Toolbar icons. Resizing shapes already on the board. The text bands for ellipse, diamond, and triangle. Hit clips. Stroke inset. Merging this ticket into `main`.

---
id: NB-13
title: Import images at their real shape and keep PNG transparency
status: Todo
priority: 2
labels: [Bug, Canvas]
parent: NB-E1
blockedBy: []
estimate: 2
linear_id:
linear_url:
---

## Context

Images are added from the toolbar, paste, and canvas drop in [`src/App.tsx`](../src/App.tsx) `addImageAt`. `imageSize` reads natural pixels, scales so the long side is at most 320, then applies `Math.max(80, …)` to width and height independently. The node `style` is that box.

[`src/ImageNode.tsx`](../src/ImageNode.tsx) paints the file with `object-cover` inside a frame that has `bg-white`, `overflow-hidden`, `rounded-md`, and a rectangular `box-shadow`. Resize still uses `keepAspectRatio` with `minWidth={80}` and `minHeight={80}` ([`src/NoodleResizer.tsx`](../src/NoodleResizer.tsx), NB-02).

## Problem

A narrow tall or short wide image is cropped to the middle. The 80px floor on the short side changes the box away from the file’s aspect ratio, and `object-cover` fills that box by clipping.

A PNG with a transparent background is filled white in the transparent pixels, including holes inside the artwork. The shadow is a box shadow on the rounded rectangle, so it follows the frame instead of the opaque shape.

## Repro

1. Import a tall narrow image (long side much larger than the short side), from the toolbar, paste, or a canvas drop. The node shows only the middle band. The top and bottom are cut off.
2. Import a short wide image. The node shows only the middle strip. The left and right are cut off.
3. Import a PNG with transparent areas (a cutout, or a logo with holes). Those areas render white, and the shadow is a rectangle around the frame.

## Acceptance criteria

- [ ] A narrow tall image is placed with the file’s aspect ratio. The long side is at most 320px. The short side may be under 80px. The full image is visible, including the ends that are cropped today
- [ ] A short wide image behaves the same way (full image, correct aspect, long side at most 320px)
- [ ] Images whose short side stays at or above 80px after that scale keep today’s size
- [ ] A PNG’s transparent pixels show the canvas, including holes inside the artwork. No white fill
- [ ] The drop shadow follows the opaque silhouette (irregular edges and holes included) and does not draw a rectangle behind the image
- [ ] Opaque photos still show the full image and still have a shadow
- [ ] Resizing an image still keeps its aspect ratio. The minimum size must not force the short side back to 80px in a way that crops the picture again

## Technical notes

In `imageSize`, scale both axes by the same factor: `Math.min(1, 320 / max(naturalWidth, naturalHeight))`. Do not floor width and height independently.

In `ImageNode`, stop using `object-cover` to crop. The node box should already match the bitmap, so the image can fill the box without clipping. Remove `bg-white`. Move the shadow to `filter: drop-shadow(...)` on the `<img>` so it follows alpha. `overflow-hidden` on the same element clips that filter; keep the shadow outside any clipping box. `rounded-md` on the frame squares off a transparent cutout — do not clip the bitmap to a rounded rectangle.

`NoodleResizer` `minWidth` / `minHeight` of 80 with `keepAspectRatio` can block a thin image from staying thin and, if the mins are applied independently, can change the aspect ratio. Set those mins so the short side can stay under 80.

## Out of scope

Uncapped natural pixel size (a 4000px photo stays fitted to a 320px long side). A cropping tool, background removal, image compression, and sticky-note shadows.

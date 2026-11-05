---
id: NB-E1
title: Canvas interaction quality
status: Todo
priority: 2
labels: [Epic, Canvas]
estimate: 8
linear_id: ERI-5
linear_url: https://linear.app/ericar/issue/ERI-5/canvas-interaction-quality
---

## Context

The MVP canvas in [`src/App.tsx`](../../src/App.tsx) is a controlled React Flow board with sticky and image nodes. Noodles are smoothstep edges with arrow markers. Selection, keyboard delete, and a top-nav Delete button exist; resize and edge editing are incomplete.

Child tickets: [NB-01](../NB-01-noodles-behind-images.md), [NB-02](../NB-02-usable-resize-targets.md), [NB-03](../NB-03-detach-reconnect-noodles.md), [NB-13](../NB-13-import-image-shape.md), [NB-16](../NB-16-copy-duplicate.md), [NB-17](../NB-17-edge-attachment-points.md), [NB-18](../NB-18-free-target-attachment.md), [NB-20](../NB-20-smooth-noodle-drag.md), [NB-22](../NB-22-reliable-noodle-landing.md), [NB-23](../NB-23-hand-and-select-tools.md), [NB-26](../NB-26-zoom-while-text-highlighted.md), [NB-27](../NB-27-trackpad-zoom.md), [NB-28](../NB-28-arrow-ports-on-hover.md), [NB-29](../NB-29-edge-drag-bend.md), [NB-30](../NB-30-marquee-select.md), [NB-33](../NB-33-noodle-toolbar-gap.md), [NB-34](../NB-34-group-scale-and-toolbar.md), [NB-35](../NB-35-zoomed-element-toolbars.md).

## Goal

Make the existing three object types (sticky, image, noodle) feel trustworthy: noodles stay visible, resize is obvious, and connections can be rewired or dropped by dragging.

## Child issues

- NB-01 Keep noodles visible above image nodes
- NB-02 Make sticky and image resize targets usable
- NB-03 Detach and reconnect noodles by dragging endpoints
- NB-13 Import images at their real shape and keep PNG transparency
- NB-16 Copy and duplicate with Alt-drag and Ctrl+D
- NB-17 Attach noodles anywhere along a side
- NB-18 Connect many noodles from a side midpoint to any edge point
- NB-20 Smooth noodle drag feedback and edge-following
- NB-22 Land noodles reliably and stay in connect mode
- NB-23 Split pan and select into Hand and Select tools
- NB-26 Zoom the board while element text is highlighted
- NB-27 Make trackpad pinch zoom easier
- NB-28 Show Arrow-tool ports only on the hovered element
- NB-29 Hide noodles with both ends off-screen and bend a drag back inside the edge
- NB-30 Marquee-select from an empty-canvas drag
- NB-33 Keep a gap between the noodle toolbar and the arrow
- NB-34 Hide the leftover marquee and scale a group from its box
- NB-35 Keep text and color toolbars on a zoomed-in element

## Success looks like

- [ ] A noodle that crosses or leaves an image is still visible and selectable
- [ ] Selected stickies and images show a Figma-like resize cursor on the edges
- [ ] A noodle end can be dragged onto empty canvas, or reattached when a nearby port highlights
- [ ] Keyboard Delete/Backspace still removes the selected noodle or node
- [ ] Alt-drag leaves a copy behind, and Ctrl+D stamps further copies at the same spacing
- [ ] A noodle can attach anywhere along a side, shared attachments space evenly, and an occupied side can still start another noodle
- [ ] Several noodles can join the same two elements; each origin stays on a side midpoint and each target keeps the exact point where it was dropped
- [ ] Dragging a noodle end shows the landing edge and a single filled port, stays outside the shape, and keeps the route inside the viewport
- [ ] Landing a noodle does not select the target or open its toolbar, and both the Arrow tool and a manual drag attach every time the pointer is over the element
- [ ] Hand pans from anywhere without selecting, and Select is the default tool: hover shows no chrome, a click reveals that object’s controls, and a mixed selection deletes, copies, and moves as one edit under one box and one toolbar
- [ ] A pinch or Ctrl/Cmd+wheel zooms the board while text on a sticky, text object, or shape is highlighted
- [ ] A trackpad pinch zooms toward the pointer as readily as in FigJam, and a two-finger scroll still pans
- [ ] With the Arrow tool on, ports show only on the element under the pointer
- [ ] Zooming until both elements a noodle connects are outside the pane hides that noodle, unless it is selected or linked to the element under the pointer. An arrow stays visible while one of its ends is dragged, even if the other end is off-screen. While a noodle is dragged onto an element near or past the screen edge, the preview bends back inside the pane. Settled noodles keep their current path
- [ ] A Select-tool drag from empty canvas draws a marquee and selects what it overlaps, so the set can be dragged, copied, duplicated, or deleted. Escape, or a Select-tool click on the marquee, cancels it
- [ ] Selecting a noodle places its toolbar with a screen gap over the arrow at every zoom, so segment anchors and end knobs stay easy to grab
- [ ] After a marquee commits, its rectangle is hidden. A group of stickies or shapes shows that type’s text toolbar above the box and its color toolbar below, and a group of noodles shows the noodle toolbar, with scale handles on the box. A mixed group shows the box and handles and no toolbar. Shift-dragging a handle scales one element or the group in proportion
- [ ] When a selected element’s top edge is on screen, its text toolbar sits above that edge. When the top edge is off screen, the text toolbar pins inside the element at the top center of the visible area, under the file bar and the logo. The color toolbar does the same at the bottom, above the main toolbar. Both stay a constant screen size

## Out of scope

New object types (text, shapes, arrow tool), persistence, and toolbar chrome. Those are E2–E4.

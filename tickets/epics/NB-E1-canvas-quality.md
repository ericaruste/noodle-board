---
id: NB-E1
title: Canvas interaction quality
status: Todo
priority: 2
labels: [Epic, Canvas]
estimate: 8
linear_id:
linear_url:
---

## Context

The MVP canvas in [`src/App.tsx`](../../src/App.tsx) is a controlled React Flow board with sticky and image nodes. Noodles are smoothstep edges with arrow markers. Selection, keyboard delete, and a top-nav Delete button exist; resize and edge editing are incomplete.

Child tickets: [NB-01](../NB-01-noodles-behind-images.md), [NB-02](../NB-02-usable-resize-targets.md), [NB-03](../NB-03-detach-reconnect-noodles.md).

## Goal

Make the existing three object types (sticky, image, noodle) feel trustworthy: noodles stay visible, resize is obvious, and connections can be rewired or dropped by dragging.

## Child issues

- NB-01 Keep noodles visible above image nodes
- NB-02 Make sticky and image resize targets usable
- NB-03 Detach and reconnect noodles by dragging endpoints

## Success looks like

- [ ] A noodle that crosses or leaves an image is still visible and selectable
- [ ] Selected stickies and images show a Figma-like resize cursor on the edges
- [ ] A noodle can be reattached to another handle or deleted by dragging an end onto empty canvas
- [ ] Keyboard Delete/Backspace still removes the selected noodle or node

## Out of scope

New object types (text, shapes, arrow tool), persistence, and toolbar chrome. Those are E2–E4.

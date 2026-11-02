---
id: NB-16
title: Copy and duplicate with Alt-drag and Ctrl+D
status: Todo
priority: 3
labels: [Feature, UX, Canvas]
parent: NB-E1
blockedBy: []
estimate: 5
linear_id: ERI-24
linear_url: https://linear.app/ericar/issue/ERI-24/copy-and-duplicate-with-alt-drag-and-ctrld
---

## Context

There is no way to copy a sticky, image, text, shape, or noodle. New objects only come from the toolbar (`addSticky`, `addText`, `addShape`, `addImageAt` in [`src/App.tsx`](../src/App.tsx)). Keyboard handling in that file already covers Ctrl/Cmd+S, Ctrl/Cmd+O, and Ctrl/Cmd+Z, and bails out while typing via `isTypingTarget`. Drags snapshot once in `onNodeDragStart` (`takeSnapshot`, `dragSnapshotTaken`) and move the selected nodes. Undo stores `{ nodes, edges }` in `pastRef`.

Node types are `sticky`, `image`, `text`, `shape`, and `endpoint`. Noodles are edges. A loose end is an `endpoint` node (`ENDPOINT_TYPE` in [`src/noodleEnds.ts`](../src/noodleEnds.ts)). Edge style, label, and route live on `edge.data` (`bends`, `curveOffset` in [`src/noodleData.ts`](../src/noodleData.ts)); bends are absolute flow points.

## Problem

Repeating an object means building it again by hand. Alt-drag does not leave a copy behind, and Ctrl+D does not stamp further copies at the same spacing.

## Repro

1. Select a sticky and drag it while holding Alt. The sticky moves and nothing is left behind.
2. Select a sticky and press Ctrl+D (Cmd+D on macOS). The browser handles the key and no copy appears.
3. Connect two shapes with a noodle, select both shapes, and try either gesture. There is no second pair and no second noodle.

## Acceptance criteria

- [ ] Alt-drag (Option-drag on macOS) on a node leaves a copy of the whole selection at the drag-start positions and moves the selection. Copies are not selected, so they stay put
- [ ] Alt must be held when the drag starts. Pressing or releasing Alt mid-drag does not add or remove a copy
- [ ] Ctrl+D (Cmd+D on macOS) duplicates the current selection, offsets the copies by the repeat step, selects the copies, and deselects the sources
- [ ] The first Ctrl+D in a chain steps copies by a fixed gap (32 flow px to the right). Each later Ctrl+D duplicates the copies from the previous press by that same step, so holding the rhythm stamps a row
- [ ] If those copies are moved before the next Ctrl+D, the step becomes the delta from where that press created them to where they are now. An Alt-drag sets the same step to the drag delta, so the next Ctrl+D continues that spacing
- [ ] A noodle is copied only when both ends are in the duplicated set. Ends that are `endpoint` nodes are included even though those nodes are not selectable. Noodles that leave the set are not copied
- [ ] Copied noodles get new edge ids, remapped source and target, and the same style and label. Bends are shifted by the same delta as the nodes. `curveOffset` is kept
- [ ] Copies are deep clones (`structuredClone` of `data`) with new ids (`crypto.randomUUID()`). Editing a copy does not change the source. This includes sticky text and color, text paragraphs, shape kind and colors, and image `src`
- [ ] Each Alt-drag and each Ctrl+D is one undo step through `takeSnapshot`. Ctrl+Z removes that duplicate and restores the previous selection. Ctrl+Shift+Z brings it back
- [ ] Ctrl+D does nothing while typing (`isTypingTarget`) or while a noodle toolbar field is focused, and it calls `preventDefault` so the browser does not bookmark the page
- [ ] Both gestures no-op when nothing that can be copied is selected. They work for a multi-selection of mixed node types
- [ ] Copies are ordinary nodes and edges, so the existing autosave and project file pick them up with no format change

## Technical notes

One helper should clone a set of nodes and their internal edges, then Alt-drag and Ctrl+D both call it.

Alt-drag: in `onNodeDragStart`, if `event.altKey`, snapshot (the existing `dragSnapshotTaken` guard must still fire only once), insert clones at the current positions of every selected non-endpoint node plus endpoint nodes required by internal edges, and leave those clones unselected. The drag then moves the original ids. Undo already restores the pre-drag snapshot, which drops the clones. Alignment and spacing guides keep working because this is still a normal position drag.

Ctrl+D: handle it on the window `keydown` listener next to save and undo. Require Ctrl or Meta, no Shift, no Alt. Remember the last repeat step and the id set and birth positions of the last clones. When the selection is still that id set, set the step from birth position to current position before cloning. Translate each cloned `position` and each copied `bends` entry by the step.

Skip React Flow internals (`measured`, `dragging`, `selected` on the source) when building the clone. Copy `type`, `position`, `style`, `data`, `width`, `height`, and `zIndex`.

## Out of scope

Ctrl+C / Ctrl+V clipboard between boards or apps. Copy as an image. A toolbar duplicate button. Toggling the copy by pressing Alt mid-drag. Duplicating while resize handles are dragged. Pasting into another project.

---
id: NB-85
title: Group src into folders by role
status: Todo
priority: 3
labels: [Feature]
parent: NB-E6
blockedBy: [NB-84]
estimate: 3
linear_id: ERI-101
linear_url: https://linear.app/ericar/issue/ERI-101/group-src-into-folders-by-role
---

## Context

Every source file sits flat in `src/`: about 80 files of building blocks, toolbars, canvas pieces, one hook, and pure logic. Only `src/assets/` and `src/styles/` are folders. `src/main.tsx` imports every trial preview. `src/App.tsx` is the board.

## Problem

A flat folder makes a file hard to find and hides which files are building blocks, which are composites, and which are logic.

## Repro

1. Open `src/`.
2. `LogoButton.tsx`, `NoodleEdge.tsx`, `alignSnap.ts`, and `useSlidingPill.ts` sit side by side with nothing to say what each one is.

## Acceptance criteria

- [ ] `src/components/`, `src/toolbars/`, `src/canvas/`, `src/hooks/`, and `src/lib/` hold the files in the map below
- [ ] `App.tsx`, `main.tsx`, `index.css`, `vite-env.d.ts`, `svg-raw.d.ts`, `assets/`, and `styles/` stay where they are
- [ ] Files move with `git mv`, so their history follows them. No file changes beyond its import paths
- [ ] `npx tsc -b` shows no new errors, and `npm run build` passes
- [ ] The board and every trial page look and behave the same as before
- [ ] `docs/`, `.cursor/rules/`, `tickets/_template.md`, the epics, and `tickets/README.md` point at the new paths. Older ticket files keep the paths they had

## Technical notes

| Folder | Role | Files |
| --- | --- | --- |
| `components/` | building blocks | `ColorSwatch`, `ContextualButton`, `FillOpacitySlider`, `FloatingPanel`, `HexInput`, `IconButton`, `IconFitPreview`, `LogoButton`, `MainButton`, `MenuItem`, `noodleIcons`, `PillRow`, `SaveIndicator`, `shapeKindIcon`, `ShapeSwatch`, `SliderThumb`, `SliderTrack`, `StrokeProperty`, `TitleInput` |
| `toolbars/` | composites built from the blocks | `ColorPickerToolbar`, `NoodleToolbar`, `noodleToolbarPlace`, `ProjectManagementToolbar`, `ProjectMenu`, `ProjectToolbar`, `ShapeToolbar`, `TextToolbar`, `Toolbar` |
| `canvas/` | what lives on the board | `AlignmentGuides`, `connectionLine`, `ConnectMode`, `EndpointNode`, `GroupChrome`, `GroupSelection`, `ImageNode`, `Marquee`, `NoodleEdge`, `NoodleResizer`, `ObjectPorts`, `PlacementGhost`, `PortMagnet`, `RichText`, `SelectionChrome`, `ShapeNode`, `StickyNode`, `TextNode` |
| `hooks/` | reusable behavior | `useSlidingPill` |
| `lib/` | logic and data with no visuals | `alignSnap`, `attachment`, `drawnNoodle`, `duplicate`, `editorZoom`, `groupScale`, `layers`, `marqueeGeometry`, `noodleData`, `noodleEnds`, `noodleFile`, `noodleLabel`, `noodleRoute`, `placement`, `portHot`, `recents`, `resizeMath`, `selectionChromeLayout`, `selectionMove`, `selectionScope`, `shapeData`, `shiftAspect`, `textBody`, `textDom`, `textEdit`, `textEditSelection` |

A file added after this ticket goes in the matching folder. `src/layers.ts` becomes `src/lib/layers.ts`, so the FloatingPanel rule and the ticket template name the new path.

Start after NB-84 is on `phase-2`, then move everything in one pass so no other branch is open against the old paths. Asset and CSS imports (`./assets/...`, `./styles/...`, `?raw` SVGs) gain a `../`. `scripts/build-tokens.js` writes to `src/styles/` and `scripts/lint-tokens.js` scans `src/**/*.css`, so neither changes.

This ticket adds no toolbar, dropdown, or popover, so it adds no FloatingPanel and no layer. The board's floating panels are checked against a selected element and a mid-drag element after the move.

## Out of scope

Renaming files. Changing code inside a file. One folder per component. Path aliases such as `@/components`. Splitting `App.tsx`.

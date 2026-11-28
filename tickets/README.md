# Noodle Board tickets

Local markdown in this folder is the source of truth for **title, description, labels, priority, parent, and blocked-by**. Sync them to a Linear workspace with the API key workflow below.

This catalog does not implement canvas features. Pick a ticket, build it in `src/`, then mark it done here (and optionally `tickets:push`).

## Current MVP (baseline)

Vite + React + Tailwind on `@xyflow/react` v12. Toolbar actions: **Add Sticky Note**, **Add Image**, **Delete**. Canvas autosaves to `localStorage` key `noodle-board` as `{ nodes, edges }` with images as data URLs.

| Area | File |
| --- | --- |
| Board state, save, delete, undo | [`src/App.tsx`](../src/App.tsx) |
| Top-center text toolbar | [`src/Toolbar.tsx`](../src/Toolbar.tsx) |
| Sticky note + resizer | [`src/StickyNode.tsx`](../src/StickyNode.tsx) |
| Image node + resizer | [`src/ImageNode.tsx`](../src/ImageNode.tsx) |

## How to pick and build

1. Follow **build order** below unless a ticket is blocked.
2. Open the markdown file. Treat **Acceptance criteria** as the definition of done.
3. Keep work inside that ticket’s **Out of scope**.
4. Phase 1 tickets started from an up-to-date `main`. Phase 2 tickets start from an up-to-date `phase-2`. Use a branch named with the ticket id (`NB-08`, `NB-02`). Set `status: In Progress` and, when Linear is connected, push that status.
5. Check an acceptance box (`- [x]`) only after that criterion is verified. Then run `npm run tickets:push-one -- NB-08` so that box shows on the Linear issue. Leave unverified boxes open. Do not set `Done` while any acceptance box is still open.
6. Commit on the ticket branch. Phase 1 pull requests went into `main`. Phase 2 pull requests go into `phase-2` and are squash-merged there. Do not merge a Phase 2 ticket into `main`. Then set `status: Done`.

## Phase 2

UI components and design tokens. Epic [NB-E6](epics/NB-E6-ui-components-and-tokens.md). The integration branch is `phase-2`. `main` stays the finished Phase 1 board until this phase is ready to land together.

Each component is a ticket. The title is the component name, the parent is NB-E6, and the id is the next free `NB-` number. Append that id to `buildOrder` in `linear.config.json`. Commit the ticket on its own branch and merge that branch into `phase-2` only.

`phase-2` merges into `main` once, when every Phase 2 ticket is done.

### Build order

1. **E1 bugs** — NB-01, NB-02, NB-03, NB-13 (noodles, resize, detach, image shape)
2. **Chrome** — NB-11, NB-10 (bottom icon toolbar, frosted glass)
3. **Persistence** — NB-04, then NB-05 and NB-06 (file format, import, recents)
4. **New objects** — NB-07, NB-08, NB-09 (text, shapes, arrows). NB-09 should follow NB-01 so new connectors are not hidden under images.
5. **Guides** — NB-12, then NB-15 (equal spacing, after alignment)
6. **Selection chrome** — NB-14 (fixed screen size for the selection toolbar and color controls)
7. **Duplicate** — NB-16 (Alt-drag copy, Ctrl+D repeat)
8. **Edge attachments** — NB-17 (any point on a side, even spacing, occupied sides stay connectable). Follows NB-03 and NB-09.
9. **Free target** — NB-18 (many noodles between the same elements; origin stays on a side midpoint, target keeps the exact drop). Follows NB-17.
10. **Floating layer** — NB-19 (one portal and z-index scale for every toolbar, dropdown, and popover). High priority. Follows the screen-space chrome from NB-14.
11. **Drag feedback** — NB-20 (landing outline, one filled port, edge-following, routes kept inside the viewport). Follows NB-18. Does not change attachment data.
12. **Shape swap** — NB-21 (change a selected shape’s kind from its floating toolbar, in place). Follows NB-08.
13. **Reliable landing** — NB-22 (stay in connect mode while landing; Arrow tool and manual drops attach every time). Follows NB-20.
14. **Hand and Select** — NB-23 (pan and select are separate tools; hover shows no chrome; a mixed selection is one box, one toolbar, and one undo). Follows the current pan-on-left-drag board.
15. **Noodle text** — NB-24 (label paints above the stroke; the toolbar text field becomes a Text button that edits on the line; double-click does the same). Follows the current noodle toolbar.
16. **Cursor placement** — NB-25 (sticky, text, shape, and image arm a ghost that follows the cursor; one canvas click creates the element, centered, then returns to Select). Follows the current toolbar and Select tool.
17. **Zoom while editing** — NB-26 (a pinch or Ctrl/Cmd+wheel still zooms while text on a sticky, text object, or shape is highlighted). Follows the current text editor.
18. **Trackpad zoom** — NB-27 (a pinch zooms toward the pointer more like FigJam; a two-finger scroll still pans). Follows the current `panOnScroll` board.
19. **Arrow ports on hover** — NB-28 (the Arrow tool shows the four ports of the element under the pointer only). Follows the current connect-mode ports.
20. **Off-screen noodles and edge drag bend** — NB-29 (settled noodles stay on their path and stay drawn when they leave the pane; the drag preview does not fold back inside the screen edge). The canvas still pans when a noodle drag reaches the edge. Follows the current drag preview.
21. **Marquee select** — NB-30 (a Select-tool drag from empty canvas draws a marquee and selects what it overlaps, ready to drag, copy, duplicate, or delete). Escape or a Select-tool click on the marquee cancels it. Follows the Select tool from NB-23.
22. **Project file management** — NB-31 (New starts an empty project, a new canvas change saves immediately with no interval, a green dot pulses beside the name while a save is in progress, and clicking the name renames the project including its Recent row). High priority. Follows the current file bar from NB-04, NB-05, and NB-06.
23. **LF line endings** — NB-32 (an always-applied Cursor rule writes LF, `.gitattributes` sets `* text=auto eol=lf`, and one renormalizing commit stops finished tickets from showing as modified). Follows the current ticket files and Cursor rules.
24. **Noodle toolbar gap** — NB-33 (selecting a noodle keeps a screen gap between its toolbar and the arrow at every zoom, so segment anchors and end knobs stay easy to grab). Follows the current noodle toolbar.
25. **Group scale** — NB-34 (the marquee rectangle hides once the selection commits; a group of stickies or shapes shows that type’s text toolbar above the box and its color toolbar below, and a group of noodles shows the noodle toolbar; a mixed group shows the box and no toolbar; Shift-dragging a handle scales one element or the group in proportion). Follows the marquee from NB-30.
26. **Zoomed element toolbars** — NB-35 (when an element’s top edge is on screen the text toolbar sits above it, and when that edge is off screen the toolbar pins inside at the top center of the visible area, under the file bar and the logo; the color toolbar does the same at the bottom, above the main toolbar; both stay a constant screen size). Follows the screen-space selection chrome from NB-14.
27. **Text typeface and size** — NB-36 (the text toolbar gains a CaseSensitive typeface menu for Geist Mono, Open Sans, Montserrat, Coming Soon, and Noto Serif, and beside it a font size field at the current text-label size that shows 14; a single click anywhere on that button opens the preset list, and a double click edits the number; unset text stays 14px sans). Follows the text toolbar from NB-07.
28. **Text handle hug** — NB-37 (double-clicking any resize handle on a text object fits the frame to the glyphs and does not zoom the canvas, even when the handle moves out from under the pointer; empty canvas still zooms; a hug is kept even when that frame was snapped; the text minimum is 8). Follows the text object from NB-07.
29. **One toolbar** — NB-57 (a single click on a sticky shows only the color picker, and a single click on a shape shows only the shape toolbar; a double-click shows only the text toolbar and hides the other bar; the empty hint uses the text alignment). Follows the text toolbar, the color picker, and the shape toolbar.
30. **Shape height** — NB-58 (a shape stays at its default height when the text is shorter, and the height changes when the user drags it; text that no longer fits still grows the shape, and shrinks back only to that default or dragged height). Follows the shape text from NB-21.
31. **Purple shapes** — NB-59 (a new shape’s fill starts on `alias.swatch.purple.200` and its stroke on `alias.swatch.purple.500`, instead of the MVP blue fill and dark stroke). Follows the shape toolbar from NB-56.
32. **Selected port only** — NB-62 (a noodle drag starts only from a press on the port of a selected element, with the Select or Arrow tool on). A gap, an overlapped element underneath, and a click on a noodle stroke do not grab a port. High priority. Follows the current port hit testing from NB-22 and NB-28.
33. **Shape rendering** — NB-65 (each kind has its own default size; the rectangle, diamond, and triangle paint 8px corners; the rectangle and rounded rectangle use the shorter side for their text pad). Follows the shape text from NB-58.
34. **Title input** — NB-66 (`input/title` is 40px tall, the width stops at 320px, a longer title truncates, and the resting field still offers the full project title). The file bar keeps its own name control.
35. **Logo button** — NB-67 (the brand mark is a 40px circle at rest; hover and selected expand the red into a rounded square and reveal the chopstick the circle clips). The red is not a design token. The live board is unchanged.
36. **Save indicator** — NB-68 (`save-indicator` has sizes `lg` 40px, `md` 32px, and `sm` 24px; success rests on success-light and breathes to success 500, and saving emits a ring). The file bar keeps its own dot.
37. **Shape icons** — NB-69 (the shape swatch and the shape-swap button use the five files in `src/assets/icons` instead of the drawn paths in `ShapeKindIcon`). Follows the shape swatch from NB-61.
38. **Icon fit** — NB-70 (a trial compares the shape icons and the line-weight icon with Lucide, matches the line-weight stroke to the shape stroke, and places both on the shape swatch, the shape toolbar, and the noodle toolbar). The trial leaves the live icons unchanged. Follows the shape icons from NB-69.
39. **Live icon fit** — NB-71 (the shape swatch, the shape toolbar, and the noodle toolbar use the Lucide-margin crop, and the line-weight stroke is 1.33 so it paints like the shape stroke of 1.5). The trial still shows the uncropped files. Follows the icon fit trial from NB-70.
40. **Project toolbar** — NB-72 (`toolbar/project` is the logo button, the title input, and the save indicator at `lg`; the title slot is at least 200px and stops at 320px). The trial leaves the upper-left file bar unchanged. Placing the bar on the canvas waits for the project menu in NB-73.
41. **Project menu** — NB-73 (`toolbar/project/menu` is medium menu items: New, Open, a Recent label, View all, three project names, Save, and Save as; View all opens `toolbar/project/menu/recent`). The trial leaves the upper-left file bar unchanged.
42. **Project management toolbar** — NB-74 (the project toolbar trial where the title can be renamed, the logo opens the project menu, and View all opens the recent panel; a press pulls the logo corner toward the circle and dips the mark, then both spring back). Follows the project toolbar from NB-72 and the project menu from NB-73. The trial leaves the upper-left file bar unchanged.
43. **Project menu layout** — NB-75 (the main menu puts a 1px `mapped.border.default` divider under Recent, then 4px before a group of View all and the project rows, and 4px below that group before Save with no divider; View all and those rows use a menu-item indent that adds 24px of left padding). The default menu item, the recent panel, and the upper-left file bar stay as they are. Follows the project menu from NB-73.
44. **Project menu title clip** — NB-76 (a project name under Recent and a name in the View all panel clip to the row; hover or focus on a clipped name shows the full title in the main toolbar hover label). Follows the project menu layout from NB-75. The live board stays unchanged.
45. **Motion list and component animations** — NB-77 (one hand-written motion list names press, release, hover, highlight, nudge, glide, and fade; the logo button, the menu item, and the main toolbar call those names, and the main button stays free of the sliding pill). Follows the logo button, the menu item, and the main toolbar.
46. **Project management toolbar on the board** — NB-78 (the board replaces the file bar with the project management toolbar: the logo opens the menu, the rows run the board's file actions, the title renames on Enter or blur, and the upper-right wordmark goes away). Follows the project management toolbar from NB-74. The trial pages stay as they are.
47. **Sliding pill on contextual toolbars and popovers** — NB-79 (one shared pill row uses `useSlidingPill` on the text, shape, and noodle toolbars and on their contextual popovers; the fill is the contextual hover, and `ContextualButton` stays free of the pill). Follows the motion list from NB-77.
48. **Project toolbar frosted blur** — NB-80 (the project toolbar gets the same 24px frost as every other floating bar, and the notes stop recording the missing blur as a decision). Follows the project management toolbar on the board from NB-78.
49. **Title input size** — NB-81 (the title field gains `size`: `lg` 40px as today, `md` 32px, and `sm` 28px, with an 8px corner on `md` and `sm`). Follows the title input from NB-66. The project toolbar stays `lg`.
50. **Logo button size** — NB-82 (the logo gains `size`: `lg` 40px as today and `md` 32px, with the same 8px hover corner, a 42% press, and a scaled dip). Follows the logo button from NB-67 and NB-77. The project toolbar stays `lg`.
51. **Project management toolbar size** — NB-83 (the project toolbar, project menu, and their composite gain `size`: `lg` as today and `md` with 32px parts and 180px menu panels, shown on the trial page). Follows NB-81 and NB-82. The board stays `lg`.
52. **Medium project management toolbar on the canvas** — NB-84 (the board uses the `md` project management toolbar: 32px parts and 180px menu panels). Follows the size from NB-83. The trial still shows `lg` and `md`. An unset size stays `lg`.

NB-11 can ship with Sticky / Image / Delete and enable Text / Shape / Arrow as those tickets complete.

## File layout

```
tickets/
  README.md
  linear.config.json      # project name + label palette
  _template.md            # copy this to add a ticket (not synced)
  .sync-state.json        # non-secret Linear UUIDs, written by push
  epics/NB-E*.md
  NB-01-....md
```

Status lives in frontmatter, not in folder names.

## Frontmatter

Copy [`_template.md`](_template.md). Fields:

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Stable local id, `NB-E1` for epics, `NB-01` for issues |
| `title` | yes | Linear issue title |
| `status` | yes | Matched to the team workflow by name (see below) |
| `priority` | yes | Linear: `1` urgent, `2` high, `3` medium, `4` low, `0` none |
| `labels` | yes | Names from `linear.config.json` |
| `parent` | epics omit | Local id of the epic |
| `blockedBy` | no | Local ids this ticket cannot start before |
| `estimate` | no | Team estimate scale (points) |
| `linear_id` | sync | Written back (e.g. `NOO-12`) |
| `linear_url` | sync | Written back |

Body of the file (after the closing `---`) becomes the Linear description. Issue tickets use:

- Context
- Problem
- Repro
- Acceptance criteria
- Technical notes
- Out of scope

Do not put the API key in tickets.

## Linear workspace + API key

Use a **fresh Linear workspace** (or an empty team). Do not paste the key into chat, tickets, or git.

1. Create the workspace and finish onboarding (this creates a team).
2. Open **Settings → Account → Security & access** and create a **Personal API key** with permission to create issues (write).
3. Copy [`.env.example`](../.env.example) to `.env` in the repo root:

```
LINEAR_API_KEY=lin_api_...
# Optional: team key from the Linear URL, e.g. NOO
# LINEAR_TEAM_KEY=NOO
# Optional: defaults to "Noodle Board" from linear.config.json
# LINEAR_PROJECT=Noodle Board
```

4. `.env` is gitignored. If the workspace has multiple teams, set `LINEAR_TEAM_KEY`.

Personal API keys are sent as `Authorization: <key>` with **no** `Bearer` prefix. The sync script uses `@linear/sdk`, which does that for you.

## Sync commands

From the repo root (Node 18+):

```bash
npm run tickets:dry-run      # parse + validate, no API calls
npm run tickets:status       # list every ticket (add -- --json for JSON)
npm run tickets:next         # recommend the next unblocked ticket
npm run tickets:push         # bootstrap project/labels, create or update issues
npm run tickets:push-one -- NB-01   # update one issue description (acceptance checkboxes)
npm run tickets:pull-status  # copy Linear workflow state into local status
npm run tickets:sync         # pull remote statuses if already synced, then push
```

Other CLI (used by `/ticket`):

```bash
node scripts/linear-sync.mjs get NB-01
node scripts/linear-sync.mjs set-status NB-01 "In Progress" --push
node scripts/linear-sync.mjs push-one NB-01
node scripts/linear-sync.mjs status --json
```

**Push** (idempotent):

1. Resolve the team (`LINEAR_TEAM_KEY` or the first team).
2. Find or create project **Noodle Board**.
3. Find or create workspace labels from `linear.config.json`.
4. Create or update epics, then children (`parentId`, `projectId`, `labelIds`, `priority`).
5. Create `blocks` relations from `blockedBy`.
6. Write `linear_id` / `linear_url` into each markdown file and refresh `tickets/.sync-state.json` (UUIDs only, safe to commit).

If `linear_id` is already set, push updates that issue instead of creating a duplicate.

`tickets:push-one` updates only that issue’s description. Use it when an acceptance checkbox changes. The issue must already exist on Linear.

**Source of truth**

| Owned locally | Owned in Linear |
| --- | --- |
| Title, description, labels, priority, parent, blocked-by | Comments, assignee, cycle |
| `status` on push | `status` on `tickets:pull-status` |

`tickets:pull-status` does not overwrite title or description.

### Status names

Push maps `status` to a team workflow state by **case-insensitive name**. Common Linear defaults: `Backlog`, `Todo`, `In Progress`, `Done`, `Canceled`. If a name is missing on the team, push warns and leaves Linear’s current state.

## Adding a ticket

1. Copy `_template.md` to `tickets/NB-13-short-slug.md` (or `tickets/epics/` for an epic).
2. Fill frontmatter. Use a new `id`. Point `parent` at an existing epic.
3. Run `npm run tickets:dry-run`, then `npm run tickets:push`.

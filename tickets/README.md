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
4. Start from an up-to-date `main` and use a branch named with the ticket id (`NB-08`, `NB-02`). Set `status: In Progress` and, when Linear is connected, push that status.
5. Check an acceptance box (`- [x]`) only after that criterion is verified. Then run `npm run tickets:push-one -- NB-08` so that box shows on the Linear issue. Leave unverified boxes open. Do not set `Done` while any acceptance box is still open.
6. Commit on the ticket branch, open a pull request into `main`, review it, and squash-merge. Then set `status: Done`.

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

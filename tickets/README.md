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
5. **Guides** — NB-12

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

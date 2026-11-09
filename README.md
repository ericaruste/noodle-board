# Noodle Board

A local infinite canvas for sticky notes, text, shapes, images, and arrow connectors (“noodles”). Boards stay on this machine as `.noodle.json` files. There is no account and no cloud sync.

Phase 1 is complete. It is the local board: objects, noodles, selection, chrome, and project files. Tickets [NB-01](tickets/NB-01-noodles-behind-images.md) through [NB-37](tickets/NB-37-text-handle-hug.md) and epics E1–E5 are done.

## Run

Requires Node 18+.

```bash
npm install
npm run dev
```

`npm run build` typechecks and writes a production bundle. `npm run preview` serves that bundle.

## Stack

React 18, TypeScript, Vite, Tailwind CSS, and [@xyflow/react](https://reactflow.dev/) v12. Icons are from Lucide.

## Phase 1

### Canvas objects

- Sticky notes, free text, and images.
- Five shapes: rectangle, rounded rectangle, ellipse, triangle, and diamond. A selected shape can change kind in place.
- An Arrow tool draws noodles. Ends can be detached, reattached, and landed on an element body. Several noodles can join the same pair of elements, and an attachment can sit anywhere along a side.
- Noodle labels sit on the line and are edited there.
- Text supports bold, italic, alignment, lists, typeface (Geist Mono, Open Sans, Montserrat, Coming Soon, Noto Serif), and font size. Double-clicking a text resize handle hugs the frame to the glyphs.
- Images import at their real aspect ratio and keep PNG transparency.

### Selection and editing

- Select and Hand are separate tools. Select is the default. `V` selects, `H` pans.
- Marquee select, group move, copy, and delete. A group of the same type shows that type’s toolbar. Shift-drag a handle to scale in proportion.
- Alignment guides and equal-spacing guides while dragging.
- Alt-drag copies. Ctrl/Cmd+D repeats the last copy spacing. Ctrl/Cmd+Z undoes, Ctrl/Cmd+Shift+Z redoes. Delete and Backspace remove the selection.
- Sticky, text, shape, and image placement follows the cursor until the next canvas click.
- Pinch and Ctrl/Cmd+wheel zoom toward the pointer, including while text is highlighted. A two-finger scroll pans.

### Chrome

- Frosted file bar and a bottom-center icon toolbar.
- Selection toolbars stay a constant screen size. When an element’s edge leaves the view, its text and color toolbars pin inside the visible area.
- Toolbars, menus, and popovers share one floating layer so they stay above selected and mid-drag elements.

### Project files

- New, Open, Save, and Save As. The format is version 1 `.noodle.json` (see [docs/noodle-json.md](docs/noodle-json.md)). Images are stored inline as data URLs.
- A bound file saves as soon as the canvas changes. A green dot pulses beside the name while a save is in progress. Click the name to rename the project.
- Recent projects (up to 8) reopen from a stored file handle in Chromium. Other browsers reopen through the file picker.
- An untitled board still autosaves to `localStorage` under the key `noodle-board`.

Keyboard: Ctrl/Cmd+S saves, Ctrl/Cmd+Shift+S is Save As, Ctrl/Cmd+O opens.

## Tickets

Feature work is tracked as markdown in [`tickets/`](tickets/README.md). That folder is the source of truth for title, description, and status, and it can sync to Linear. See [`tickets/README.md`](tickets/README.md) for the catalog and the sync commands.

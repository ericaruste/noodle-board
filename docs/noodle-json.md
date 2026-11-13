# `.noodle.json`

Version 1 project file written by **Save** and **Save As**, and read by **Open**. Types live in [`src/noodleFile.ts`](../src/noodleFile.ts) (`NoodleDocument`, `NoodleSnapshot`, `NOODLE_FILE_VERSION`). `parseNoodleFile` accepts this shape and rejects anything else.

## Schema

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `version` | number | yes | Always `1`. Unknown versions should be rejected. |
| `name` | string | yes | Board name. Not a filesystem path. Empty input is stored as `Untitled`. |
| `updatedAt` | string | yes | ISO-8601 timestamp from when the file was written (`Date.toISOString()`). |
| `viewport` | object | yes | `{ x: number, y: number, zoom: number }` from React Flow `getViewport()`. |
| `nodes` | array | yes | React Flow nodes, including positions, style, and `data`. |
| `edges` | array | yes | React Flow edges. |

Image nodes keep the picture inline as a data URL on `data.src`. Files can be large. v1 does not split images out or compress them.

```json
{
  "version": 1,
  "name": "Untitled",
  "updatedAt": "2026-10-31T00:00:00.000Z",
  "viewport": { "x": 0, "y": 0, "zoom": 1 },
  "nodes": [
    {
      "id": "sticky-1",
      "type": "sticky",
      "position": { "x": 80, "y": 80 },
      "data": { "text": "Hello", "color": "yellow" }
    },
    {
      "id": "image-1",
      "type": "image",
      "position": { "x": 300, "y": 80 },
      "data": { "src": "data:image/png;base64,..." }
    },
    {
      "id": "text-1",
      "type": "text",
      "position": { "x": 80, "y": 300 },
      "data": {
        "paragraphs": [
          {
            "align": "left",
            "list": "none",
            "runs": [{ "text": "Heading", "style": "bold" }]
          }
        ]
      }
    },
    {
      "id": "shape-1",
      "type": "shape",
      "position": { "x": 300, "y": 300 },
      "style": { "width": 180, "height": 140 },
      "data": {
        "kind": "round-rect",
        "fill": "#bfdbfe",
        "stroke": "#334155",
        "paragraphs": [
          { "align": "left", "list": "none", "runs": [{ "text": "Label", "style": "regular" }] }
        ]
      }
    }
  ],
  "edges": []
}
```

## How a file is written

- Chromium (and other browsers with the File System Access API): `showSaveFilePicker`, then `FileSystemFileHandle.createWritable()`. **Save** overwrites the handle chosen earlier in this session. **Save As** always opens the picker. The `name` field is the file name without `.noodle.json`.
- Browsers without that API: the same JSON is downloaded with `<a download>`. **Save As** asks for a name first. The suggested file name is `{name}.noodle.json`.

A successful **Save**, **Save As**, or **Open** records the board in IndexedDB (`noodle-board` / `recents`): `{ id, name, lastOpened, fileHandle? }`. The list is capped at 8. Handles stay in IndexedDB, not `localStorage`. **Recent** shows the name and a relative time. Choosing one reopens the stored handle in Chromium (prompting for readwrite permission when it is not already granted). Browsers that cannot store a handle still list the name; choosing it opens the file picker. A handle whose file was moved or deleted is marked unavailable and does not crash the board.

While a file handle is bound and readwrite permission is already granted, canvas changes debounce-write to that file. The `localStorage` key `noodle-board` stays the Untitled draft and is only updated while no file is bound.

## How a file is opened

**Open** uses `showOpenFilePicker` when the browser has it, and a file input (`accept=".json,.noodle.json"`) otherwise. A valid version-1 file replaces the nodes, edges, and viewport (`setViewport`). The toolbar name comes from the file name, and the file is added to **Recent**. Opening records one undo snapshot first, so undo restores the previous board, its viewport, its name, and its file binding.

Invalid JSON, a missing `nodes` or `edges` array, nodes or edges this board cannot draw (unknown type, a sticky without a known color and without either a text string or paragraphs, a text node without paragraphs, an image without `data.src`, a shape without a known kind or without a fill and stroke that are each a color string or `null`, a shape whose `paragraphs` are present but not a text body, a shape whose `manualHeight` is present but not a positive number, a duplicate id, or an edge whose ends are not nodes in the file), a bad viewport, or a `version` other than `1` shows an error and leaves the current board as it was. Unknown future versions are rejected rather than migrated.

Shape nodes store `data.kind` (`rect`, `ellipse`, `round-rect`, `triangle`, or `diamond`), `data.fill`, and `data.stroke`. Each paint is a CSS color string, or `null` when that paint is cleared. Clearing fill does not clear stroke, and the other way around. A shape with both paints cleared is still a shape node. `data.paragraphs` uses the same text body as a text node. Older shapes without `paragraphs` still open. Until the user resizes a shape, its height follows the text: an empty shape keeps its default height, and typing grows or shrinks the shape so the label stays inside the geometry. After a resize, `data.manualHeight` is that height. The shape keeps it across reload and undo, grows when the text needs more room, and does not shrink below it. The text still sets the minimum, so the handles cannot crop the label.

Text nodes store `data.paragraphs`. Each paragraph has `align` (`left`, `center`, `right`, or `justify`), `list` (`none`, `bullet`, or `numbered`), and `runs` of `{ text, style, href? }`. `style` is `regular`, `bold`, `italic`, or `bold-italic`. Sticky notes keep that same paragraph shape after they are edited. A sticky that only has the older `data.text` string still opens. `data.color` stays one of `yellow`, `pink`, `blue`, or `green` so older files still open. `data.paint` is the color picker choice: `{ "kind": "none" }`, `{ "kind": "swatch", "family": "yellow" }` (purple, sky, lime, orange, yellow, coral, tomato, or pink, drawn at step 200), or `{ "kind": "custom", "hex": "EBCFFF" }`. `data.customHex` keeps the last custom color when a palette swatch is selected. Notes saved before the picker have no `paint`. They still open, and they keep the older yellow, pink, blue, and green fills until a swatch is chosen.

Dropping a `.noodle.json` on the canvas opens it the same way. Dropping an image still adds an image node. If the current board is a non-empty Untitled draft, Open asks before replacing it.

If `JSON.stringify` throws (for example the board is too large to serialize), Save shows an error and does not write a file.

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

Invalid JSON, a missing `nodes` or `edges` array, nodes or edges this board cannot draw (unknown type, a sticky without text and a known color, an image without `data.src`, a duplicate id, or an edge whose ends are not nodes in the file), a bad viewport, or a `version` other than `1` shows an error and leaves the current board as it was. Unknown future versions are rejected rather than migrated.

Dropping a `.noodle.json` on the canvas opens it the same way. Dropping an image still adds an image node. If the current board is a non-empty Untitled draft, Open asks before replacing it.

If `JSON.stringify` throws (for example the board is too large to serialize), Save shows an error and does not write a file.

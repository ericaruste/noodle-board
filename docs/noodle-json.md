# `.noodle.json`

Version 1 project file written by **Save** and **Save As**. Types live in [`src/noodleFile.ts`](../src/noodleFile.ts) (`NoodleDocument`, `NOODLE_FILE_VERSION`).

Open and import are NB-05. This document is the format they should accept.

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

The handle is not stored yet. Autosave of the Untitled draft still writes `{ nodes, edges }` to `localStorage` key `noodle-board` and is not cleared by Save. Binding later edits to the file is NB-06.

If `JSON.stringify` throws (for example the board is too large to serialize), Save shows an error and does not write a file.

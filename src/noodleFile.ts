import type { Edge, Node } from "@xyflow/react";

/** On-disk project format. See docs/noodle-json.md. */
export const NOODLE_FILE_VERSION = 1;

export type NoodleViewport = {
  x: number;
  y: number;
  zoom: number;
};

export type NoodleDocument = {
  version: typeof NOODLE_FILE_VERSION;
  name: string;
  updatedAt: string;
  viewport: NoodleViewport;
  nodes: Node[];
  edges: Edge[];
};

export type NoodleSaveMode = "save" | "save-as";

export type NoodleSaveResult =
  | { ok: true; name: string; handle: FileSystemFileHandle | null }
  | { ok: false; aborted: true }
  | { ok: false; aborted: false; message: string };

type SaveFilePickerOptions = {
  suggestedName?: string;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
};

type PickerWindow = Window & {
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
};

const SERIALIZE_MESSAGE =
  "Could not save this board. The file is too large or contains data that cannot be written as JSON.";

export class NoodleSerializeError extends Error {
  constructor() {
    super(SERIALIZE_MESSAGE);
    this.name = "NoodleSerializeError";
  }
}

export function canUseSaveFilePicker(): boolean {
  return typeof (window as PickerWindow).showSaveFilePicker === "function";
}

export function projectNameFromFileName(fileName: string): string {
  const withoutExt = fileName.replace(/\.noodle\.json$/i, "").replace(/\.json$/i, "").trim();
  return withoutExt || "Untitled";
}

export function suggestedFileName(name: string): string {
  const cleaned = name
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const base = (cleaned || "Untitled").replace(/\.noodle\.json$/i, "").trim() || "Untitled";
  return `${base}.noodle.json`;
}

export function buildNoodleDocument(input: {
  name: string;
  viewport: NoodleViewport;
  nodes: Node[];
  edges: Edge[];
  updatedAt?: string;
}): NoodleDocument {
  return {
    version: NOODLE_FILE_VERSION,
    name: input.name.trim() || "Untitled",
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    viewport: {
      x: input.viewport.x,
      y: input.viewport.y,
      zoom: input.viewport.zoom,
    },
    nodes: input.nodes,
    edges: input.edges,
  };
}

export function stringifyNoodleDocument(document: NoodleDocument): string {
  try {
    return JSON.stringify(document, null, 2);
  } catch {
    throw new NoodleSerializeError();
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function visibleSaveError(error: unknown): string {
  if (error instanceof NoodleSerializeError) return error.message;
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Could not save this board. The browser blocked the save dialog.";
  }
  if (error instanceof Error && error.message) {
    return `Could not save this board. ${error.message}`;
  }
  return "Could not save this board.";
}

async function writeToHandle(handle: FileSystemFileHandle, json: string): Promise<void> {
  const writable = await handle.createWritable();
  try {
    await writable.write(json);
  } catch (error) {
    await writable.abort().catch(() => undefined);
    throw error;
  }
  await writable.close();
}

function downloadNoodleJson(fileName: string, json: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function askDownloadName(currentName: string): string | null {
  const entered = window.prompt("Name this board", currentName);
  if (entered === null) return null;
  return entered.trim() || "Untitled";
}

export async function saveNoodleProject(input: {
  mode: NoodleSaveMode;
  name: string;
  handle: FileSystemFileHandle | null;
  viewport: NoodleViewport;
  nodes: Node[];
  edges: Edge[];
}): Promise<NoodleSaveResult> {
  const jsonFor = (name: string) =>
    stringifyNoodleDocument(
      buildNoodleDocument({
        name,
        viewport: input.viewport,
        nodes: input.nodes,
        edges: input.edges,
      }),
    );

  let json: string;
  try {
    json = jsonFor(input.name);
  } catch (error) {
    return { ok: false, aborted: false, message: visibleSaveError(error) };
  }

  try {
    const picker = canUseSaveFilePicker();
    if (input.mode === "save" && input.handle && picker) {
      await writeToHandle(input.handle, json);
      return { ok: true, name: input.name, handle: input.handle };
    }

    if (picker) {
      const showSaveFilePicker = (window as PickerWindow).showSaveFilePicker;
      if (!showSaveFilePicker) {
        return { ok: false, aborted: false, message: "Could not save this board." };
      }
      const handle = await showSaveFilePicker({
        suggestedName: suggestedFileName(input.name),
        types: [
          {
            description: "Noodle Board project",
            accept: { "application/json": [".noodle.json"] },
          },
        ],
      });
      const name = projectNameFromFileName(handle.name);
      if (name !== input.name) json = jsonFor(name);
      await writeToHandle(handle, json);
      return { ok: true, name, handle };
    }

    let name = input.name;
    if (input.mode === "save-as") {
      const chosen = askDownloadName(input.name);
      if (chosen === null) return { ok: false, aborted: true };
      name = chosen;
      if (name !== input.name) json = jsonFor(name);
    }
    downloadNoodleJson(suggestedFileName(name), json);
    return { ok: true, name, handle: null };
  } catch (error) {
    if (isAbortError(error)) return { ok: false, aborted: true };
    return { ok: false, aborted: false, message: visibleSaveError(error) };
  }
}

import type { Edge, Node } from "@xyflow/react";
import { STICKY_COLORS } from "./StickyNode";
import { isTextBody } from "./textBody";

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
  | { ok: false; aborted: false; message: string; missing?: boolean };

export type NoodleWriteResult =
  | { ok: true }
  | { ok: false; missing: boolean; denied: boolean; message: string };

type HandleWithPermission = FileSystemFileHandle & {
  queryPermission?: (descriptor: { mode: "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (descriptor: { mode: "readwrite" }) => Promise<PermissionState>;
};

type SaveFilePickerOptions = {
  suggestedName?: string;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
};

type OpenFilePickerOptions = {
  multiple?: boolean;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
};

type PickerWindow = Window & {
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
  showOpenFilePicker?: (options?: OpenFilePickerOptions) => Promise<FileSystemFileHandle[]>;
};

const PROJECT_FILE_TYPES = [
  {
    description: "Noodle Board project",
    accept: { "application/json": [".noodle.json", ".json"] },
  },
];

const OPEN_INVALID_JSON = "Could not open this file. It is not valid JSON.";
const OPEN_NOT_PROJECT = "Could not open this file. It is not a Noodle Board project.";
const OPEN_MISSING = "Could not open this file. It is missing nodes or edges.";
const OPEN_INVALID_CONTENTS = "Could not open this file. It has invalid nodes or edges.";
const OPEN_INVALID_VIEWPORT = "Could not open this file. It has an invalid viewport.";
const RENDERABLE_NODE_TYPES = new Set(["sticky", "image", "text", "endpoint"]);

/** Board restored from a version-1 `.noodle.json` file. */
export type NoodleSnapshot = {
  name: string;
  viewport: NoodleViewport;
  nodes: Node[];
  edges: Edge[];
};

export type NoodleOpenPick =
  | { ok: true; file: File; handle: FileSystemFileHandle | null }
  | { ok: false; aborted: true }
  | { ok: false; aborted: false; message: string };

export class NoodleParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoodleParseError";
  }
}

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

export function canUseOpenFilePicker(): boolean {
  return typeof (window as PickerWindow).showOpenFilePicker === "function";
}

export function isNoodleProjectFile(file: File): boolean {
  return /\.noodle\.json$/i.test(file.name);
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function unsupportedVersionMessage(version: number): string {
  return `Could not open this file. Version ${version} is not supported. Only version ${NOODLE_FILE_VERSION} can be opened.`;
}

function isStickyData(data: unknown): boolean {
  if (!isRecord(data)) return false;
  if (typeof data.color !== "string" || !(data.color in STICKY_COLORS)) return false;
  const hasText = typeof data.text === "string";
  const hasParagraphs = data.paragraphs !== undefined;
  if (hasParagraphs && !isTextBody(data.paragraphs)) return false;
  return hasText || hasParagraphs;
}

function isTextNodeData(data: unknown): boolean {
  if (!isRecord(data) || !isTextBody(data.paragraphs)) return false;
  if (data.fontSize === undefined) return true;
  return finiteNumber(data.fontSize) && data.fontSize > 0;
}

function isNodeRecord(value: unknown): value is Node {
  if (!isRecord(value) || typeof value.id !== "string" || value.id.length === 0) return false;
  if (!isRecord(value.position)) return false;
  if (!finiteNumber(value.position.x) || !finiteNumber(value.position.y)) return false;
  if (typeof value.type !== "string" || !RENDERABLE_NODE_TYPES.has(value.type)) return false;
  if (value.type === "sticky" && !isStickyData(value.data)) return false;
  if (value.type === "text" && !isTextNodeData(value.data)) return false;
  if (value.type === "image") {
    if (!isRecord(value.data) || typeof value.data.src !== "string") return false;
  }
  return true;
}

function isEdgeRecord(value: unknown): value is Edge {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.source === "string" &&
    typeof value.target === "string"
  );
}

/** Validate a parsed `.noodle.json` value. Throws `NoodleParseError` when the file cannot be opened. */
export function parseNoodleFile(input: unknown): NoodleSnapshot {
  if (!isRecord(input) || typeof input.version !== "number") {
    throw new NoodleParseError(OPEN_NOT_PROJECT);
  }
  if (input.version !== NOODLE_FILE_VERSION) {
    throw new NoodleParseError(unsupportedVersionMessage(input.version));
  }
  if (!Array.isArray(input.nodes) || !Array.isArray(input.edges)) {
    throw new NoodleParseError(OPEN_MISSING);
  }
  const nodeIds = new Set<string>();
  for (const node of input.nodes) {
    if (!isNodeRecord(node) || nodeIds.has(node.id)) {
      throw new NoodleParseError(OPEN_INVALID_CONTENTS);
    }
    nodeIds.add(node.id);
  }
  const edgeIds = new Set<string>();
  for (const edge of input.edges) {
    if (!isEdgeRecord(edge) || edgeIds.has(edge.id) || !nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new NoodleParseError(OPEN_INVALID_CONTENTS);
    }
    edgeIds.add(edge.id);
  }
  if (!isRecord(input.viewport)) throw new NoodleParseError(OPEN_INVALID_VIEWPORT);
  const { x, y, zoom } = input.viewport;
  if (!finiteNumber(x) || !finiteNumber(y) || !finiteNumber(zoom) || zoom <= 0) {
    throw new NoodleParseError(OPEN_INVALID_VIEWPORT);
  }
  const name = typeof input.name === "string" ? input.name.trim() : "";
  return {
    name: name || "Untitled",
    viewport: { x, y, zoom },
    nodes: input.nodes,
    edges: input.edges,
  };
}

export async function readNoodleProjectFile(file: File): Promise<NoodleSnapshot> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    throw new NoodleParseError("Could not open this file.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new NoodleParseError(OPEN_INVALID_JSON);
  }
  return parseNoodleFile(parsed);
}

export function visibleOpenError(error: unknown): string {
  if (error instanceof NoodleParseError) return error.message;
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Could not open this file. The browser blocked the file dialog.";
  }
  if (error instanceof Error && error.message) return `Could not open this file. ${error.message}`;
  return "Could not open this file.";
}

function pickWithInput(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.noodle.json";
    input.hidden = true;
    document.body.appendChild(input);
    let settled = false;
    const finish = (file: File | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(file);
    };
    input.addEventListener("change", () => finish(input.files?.[0] ?? null));
    input.addEventListener("cancel", () => finish(null));
    window.addEventListener(
      "focus",
      () => {
        window.setTimeout(() => finish(input.files?.[0] ?? null), 400);
      },
      { once: true },
    );
    input.click();
  });
}

export function isMissingFileError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "NotFoundError";
}

/** Read the current readwrite grant. Does not prompt. Missing permission APIs count as granted. */
export async function queryReadWritePermission(handle: FileSystemFileHandle): Promise<PermissionState> {
  const withPermission = handle as HandleWithPermission;
  if (!withPermission.queryPermission) return "granted";
  return withPermission.queryPermission({ mode: "readwrite" });
}

/** Prompt when readwrite is not already granted. Call this from a click, before `getFile` or `createWritable`. */
export async function ensureReadWritePermission(handle: FileSystemFileHandle): Promise<boolean> {
  const withPermission = handle as HandleWithPermission;
  if (!withPermission.requestPermission) return true;
  const current = withPermission.queryPermission
    ? await withPermission.queryPermission({ mode: "readwrite" })
    : "prompt";
  if (current === "granted") return true;
  const next = await withPermission.requestPermission({ mode: "readwrite" });
  return next === "granted";
}

export async function pickNoodleProjectFile(): Promise<NoodleOpenPick> {
  try {
    if (canUseOpenFilePicker()) {
      const showOpenFilePicker = (window as PickerWindow).showOpenFilePicker;
      if (!showOpenFilePicker) {
        return { ok: false, aborted: false, message: "Could not open this file." };
      }
      const [handle] = await showOpenFilePicker({ multiple: false, types: PROJECT_FILE_TYPES });
      if (!handle) return { ok: false, aborted: true };
      const file = await handle.getFile();
      try {
        await ensureReadWritePermission(handle);
      } catch (error) {
        if (isMissingFileError(error)) {
          return { ok: false, aborted: false, message: "Could not open this file. It was moved or deleted." };
        }
      }
      return { ok: true, file, handle };
    }
    const file = await pickWithInput();
    if (!file) return { ok: false, aborted: true };
    return { ok: true, file, handle: null };
  } catch (error) {
    if (isAbortError(error)) return { ok: false, aborted: true };
    if (isMissingFileError(error)) {
      return { ok: false, aborted: false, message: "Could not open this file. It was moved or deleted." };
    }
    return { ok: false, aborted: false, message: visibleOpenError(error) };
  }
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

const FILE_MISSING_MESSAGE = "Could not save this board. The file was moved or deleted.";
const FILE_DENIED_MESSAGE = "Could not save this board. File permission was not granted.";

/** Write the current board to a bound handle when readwrite is already granted. Does not prompt. */
export async function writeBoundNoodleFile(input: {
  handle: FileSystemFileHandle;
  name: string;
  viewport: NoodleViewport;
  nodes: Node[];
  edges: Edge[];
}): Promise<NoodleWriteResult> {
  let json: string;
  try {
    json = stringifyNoodleDocument(
      buildNoodleDocument({
        name: input.name,
        viewport: input.viewport,
        nodes: input.nodes,
        edges: input.edges,
      }),
    );
  } catch (error) {
    return { ok: false, missing: false, denied: false, message: visibleSaveError(error) };
  }
  try {
    const permission = await queryReadWritePermission(input.handle);
    if (permission !== "granted") {
      return { ok: false, missing: false, denied: true, message: FILE_DENIED_MESSAGE };
    }
    await writeToHandle(input.handle, json);
    return { ok: true };
  } catch (error) {
    if (isMissingFileError(error)) {
      return { ok: false, missing: true, denied: false, message: FILE_MISSING_MESSAGE };
    }
    return { ok: false, missing: false, denied: false, message: visibleSaveError(error) };
  }
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
      const allowed = await ensureReadWritePermission(input.handle);
      if (!allowed) {
        return { ok: false, aborted: false, message: FILE_DENIED_MESSAGE };
      }
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
    if (isMissingFileError(error)) {
      return { ok: false, aborted: false, missing: true, message: FILE_MISSING_MESSAGE };
    }
    return { ok: false, aborted: false, message: visibleSaveError(error) };
  }
}

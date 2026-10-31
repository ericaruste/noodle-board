/** Recent boards live in IndexedDB so a `FileSystemFileHandle` can be stored. Never put handles in localStorage. */

const DB_NAME = "noodle-board";
const STORE_NAME = "recents";
const DB_VERSION = 1;

export const MAX_RECENTS = 8;

export type RecentProject = {
  id: string;
  name: string;
  lastOpened: number;
  fileHandle?: FileSystemFileHandle;
  unavailable?: boolean;
};

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available"));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open recents"));
  });
}

async function withDatabase<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
  const db = await openDatabase();
  try {
    return await fn(db);
  } finally {
    db.close();
  }
}

function readAll(db: IDBDatabase): Promise<RecentProject[]> {
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve((request.result as RecentProject[]) ?? []);
    request.onerror = () => reject(request.error ?? new Error("Could not read recents"));
  });
}

function storedRecent(record: RecentProject): RecentProject {
  const stored: RecentProject = {
    id: record.id,
    name: record.name,
    lastOpened: record.lastOpened,
  };
  if (record.fileHandle) stored.fileHandle = record.fileHandle;
  if (record.unavailable) stored.unavailable = true;
  return stored;
}

function replaceAll(db: IDBDatabase, records: RecentProject[]): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(error instanceof Error ? error : new Error("Could not update recents"));
    };
    const succeed = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const clearRequest = store.clear();
    clearRequest.onsuccess = () => {
      for (const record of records) store.put(storedRecent(record));
    };
    clearRequest.onerror = () => fail(clearRequest.error);
    tx.oncomplete = () => succeed();
    tx.onerror = () => fail(tx.error);
    tx.onabort = () => fail(tx.error);
  });
}

export async function listRecents(): Promise<RecentProject[]> {
  const records = await withDatabase(readAll);
  return records.sort((a, b) => b.lastOpened - a.lastOpened);
}

async function sameFile(left: FileSystemFileHandle, right: FileSystemFileHandle): Promise<boolean> {
  try {
    return await left.isSameEntry(right);
  } catch {
    return false;
  }
}

/** Insert or update a recent. Matches an existing row by file identity, then by `id`. Caps the list at {@link MAX_RECENTS}. */
export async function rememberRecent(input: {
  name: string;
  fileHandle: FileSystemFileHandle | null;
  id?: string;
}): Promise<string> {
  const existing = await listRecents();
  let match: RecentProject | undefined;
  if (input.fileHandle) {
    for (const recent of existing) {
      if (recent.fileHandle && (await sameFile(recent.fileHandle, input.fileHandle))) {
        match = recent;
        break;
      }
    }
  }
  if (!match && input.id) match = existing.find((recent) => recent.id === input.id);
  if (!match && !input.fileHandle && !input.id) {
    match = existing.find((recent) => !recent.fileHandle && recent.name === input.name);
  }

  const next: RecentProject = {
    id: match?.id ?? input.id ?? crypto.randomUUID(),
    name: input.name.trim() || "Untitled",
    lastOpened: Date.now(),
  };
  if (input.fileHandle) next.fileHandle = input.fileHandle;
  else if (match?.fileHandle) next.fileHandle = match.fileHandle;

  const drop = new Set<string>();
  if (input.id && input.id !== next.id) drop.add(input.id);
  const rest = existing.filter((recent) => recent.id !== next.id && !drop.has(recent.id));
  const records = [next, ...rest].slice(0, MAX_RECENTS);
  await withDatabase((db) => replaceAll(db, records));
  return next.id;
}

export async function markRecentUnavailable(id: string): Promise<void> {
  const existing = await listRecents();
  if (!existing.some((recent) => recent.id === id)) return;
  const records = existing.map((recent) =>
    recent.id === id ? { ...recent, unavailable: true } : recent,
  );
  await withDatabase((db) => replaceAll(db, records));
}

export function formatRecentTime(lastOpened: number, now = Date.now()): string {
  const delta = Math.max(0, now - lastOpened);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (delta < minute) return "Just now";
  if (delta < hour) {
    const count = Math.floor(delta / minute);
    return count === 1 ? "1 minute ago" : `${count} minutes ago`;
  }
  if (delta < day) {
    const count = Math.floor(delta / hour);
    return count === 1 ? "1 hour ago" : `${count} hours ago`;
  }
  if (delta < 2 * day) return "Yesterday";
  if (delta < 7 * day) {
    const count = Math.floor(delta / day);
    return count === 1 ? "1 day ago" : `${count} days ago`;
  }
  return new Date(lastOpened).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

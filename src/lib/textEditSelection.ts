/** A pane click both commits text and clears the selection. Remember the element so that click can select it again. */
let retainedId: string | null = null;
let retainedUntil = 0;
let cancelEdit: (() => void) | null = null;

export function setTextEditCancel(cancel: (() => void) | null) {
  cancelEdit = cancel;
}

export function cancelTextEdit() {
  cancelEdit?.();
}

export function retainSelectionAfterEdit(id: string) {
  retainedId = id;
  retainedUntil = performance.now() + 400;
}

export function clearRetainedSelection() {
  retainedId = null;
}

export function consumeRetainedSelection(): string | null {
  if (!retainedId || performance.now() > retainedUntil) {
    retainedId = null;
    return null;
  }
  const id = retainedId;
  retainedId = null;
  return id;
}

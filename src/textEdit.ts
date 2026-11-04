/** One new text node should open its field. The id is not stored on the node, so a reload stays closed. */
let pendingId: string | null = null;

export function armTextEdit(id: string) {
  pendingId = id;
}

export function peekTextEdit(id: string) {
  return pendingId === id;
}

export function clearTextEdit(id: string) {
  if (pendingId === id) pendingId = null;
}

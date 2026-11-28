/** Aspect locked for the node currently shift-resized, so alignment snap keeps that ratio. */
let lock: { id: string; aspect: number } | null = null;

export function setShiftAspect(id: string | null, aspect = 1) {
  if (!id || !(aspect > 0)) {
    lock = null;
    return;
  }
  lock = { id, aspect };
}

export function shiftAspectFor(id: string) {
  return lock && lock.id === id ? lock.aspect : null;
}

/** Path the noodle last rendered, in flow units. The marquee uses it when the edge node is not in the document yet. */
const drawn = new Map<string, { d: string; width: number }>();

export function publishDrawnNoodle(id: string, d: string, width: number) {
  const current = drawn.get(id);
  if (current && current.d === d && current.width === width) return;
  drawn.set(id, { d, width });
}

export function drawnNoodle(id: string) {
  return drawn.get(id) ?? null;
}

export function dropDrawnNoodle(id: string) {
  drawn.delete(id);
}

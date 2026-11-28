import {
  normalizeRange,
  type Caret,
  type TextBody,
  type TextRange,
} from "./textBody";

function paragraphElement(root: HTMLElement, node: Node | null): HTMLElement | null {
  const element = node instanceof Element ? node : node?.parentElement;
  const paragraph = element?.closest("[data-paragraph]");
  if (!(paragraph instanceof HTMLElement) || !root.contains(paragraph)) return null;
  return paragraph;
}

function caretFrom(root: HTMLElement, node: Node | null, offset: number): Caret | null {
  const paragraph = paragraphElement(root, node);
  if (!paragraph || !node) return null;
  const index = Number(paragraph.dataset.paragraph);
  if (!Number.isInteger(index)) return null;
  const runs = paragraph.querySelector("[data-runs]");
  if (!(runs instanceof HTMLElement) || !runs.contains(node)) {
    return { paragraph: index, offset: 0 };
  }
  const walker = document.createTreeWalker(runs, NodeFilter.SHOW_TEXT);
  let count = 0;
  let current = walker.nextNode();
  while (current) {
    const raw = current.textContent ?? "";
    if (current === node) {
      const visible = raw.slice(0, offset).replace(/\u200b/g, "");
      return { paragraph: index, offset: count + visible.length };
    }
    count += raw.replace(/\u200b/g, "").length;
    current = walker.nextNode();
  }
  return { paragraph: index, offset: count };
}

export function readRange(root: HTMLElement, body: TextBody): TextRange | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  if (!selection.anchorNode || !selection.focusNode) return null;
  if (!root.contains(selection.anchorNode) || !root.contains(selection.focusNode)) return null;
  const start = caretFrom(root, selection.anchorNode, selection.anchorOffset);
  const end = caretFrom(root, selection.focusNode, selection.focusOffset);
  if (!start || !end) return null;
  return normalizeRange(body, { start, end });
}

function resolveCaret(root: HTMLElement, caret: Caret): { node: Text; offset: number } | null {
  const runs = root.querySelector(`[data-paragraph="${caret.paragraph}"] [data-runs]`);
  if (!(runs instanceof HTMLElement)) return null;
  const walker = document.createTreeWalker(runs, NodeFilter.SHOW_TEXT);
  let remaining = Math.max(0, caret.offset);
  let last: Text | null = null;
  let current = walker.nextNode();
  while (current instanceof Text) {
    last = current;
    const raw = current.textContent ?? "";
    if (raw === "\u200b") {
      if (remaining === 0) return { node: current, offset: 0 };
      current = walker.nextNode();
      continue;
    }
    const visible = raw.replace(/\u200b/g, "");
    if (remaining <= visible.length) return { node: current, offset: remaining };
    remaining -= visible.length;
    current = walker.nextNode();
  }
  if (!last) return null;
  const raw = last.textContent ?? "";
  return { node: last, offset: raw === "\u200b" ? 0 : raw.length };
}

export function placeRange(root: HTMLElement, range: TextRange): void {
  const selection = window.getSelection();
  if (!selection) return;
  const start = resolveCaret(root, range.start);
  const end = resolveCaret(root, range.end);
  if (!start || !end) return;
  const domRange = document.createRange();
  domRange.setStart(start.node, start.offset);
  domRange.setEnd(end.node, end.offset);
  selection.removeAllRanges();
  selection.addRange(domRange);
}

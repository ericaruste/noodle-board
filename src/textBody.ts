export const FONT_STYLES = ["regular", "bold", "italic", "bold-italic"] as const;
export type FontStyle = (typeof FONT_STYLES)[number];

export const TEXT_ALIGNS = ["left", "center", "right", "justify"] as const;
export type TextAlign = (typeof TEXT_ALIGNS)[number];

export const LIST_KINDS = ["none", "bullet", "numbered"] as const;
export type ListKind = (typeof LIST_KINDS)[number];

export type TextRun = {
  text: string;
  style: FontStyle;
  href?: string;
};

export type TextParagraph = {
  align: TextAlign;
  list: ListKind;
  runs: TextRun[];
};

export type TextBody = TextParagraph[];

export type Caret = {
  paragraph: number;
  offset: number;
};

export type TextRange = {
  start: Caret;
  end: Caret;
};

export type TextEdit = {
  body: TextBody;
  caret: Caret;
};

export const FONT_STYLE_LABELS: Record<FontStyle, string> = {
  regular: "Regular",
  bold: "Bold",
  italic: "Italic",
  "bold-italic": "Bold Italic",
};

export const ALIGN_LABELS: Record<TextAlign, string> = {
  left: "Left",
  center: "Center",
  right: "Right",
  justify: "Justify",
};

const FONT_STYLE_SET = new Set<string>(FONT_STYLES);
const ALIGN_SET = new Set<string>(TEXT_ALIGNS);
const LIST_SET = new Set<string>(LIST_KINDS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function emptyParagraph(style: FontStyle = "regular"): TextParagraph {
  return { align: "left", list: "none", runs: [{ text: "", style }] };
}

export function emptyBody(): TextBody {
  return [emptyParagraph()];
}

export function paragraphText(paragraph: TextParagraph): string {
  return paragraph.runs.map((run) => run.text).join("");
}

export function isEmptyBody(body: TextBody): boolean {
  return body.every((paragraph) => paragraphText(paragraph).length === 0);
}

export function bodyFromPlain(text: string): TextBody {
  const lines = text.split(/\r\n|\r|\n/);
  return lines.map((line) => ({
    align: "left",
    list: "none",
    runs: [line.length === 0 ? { text: "", style: "regular" } : { text: line, style: "regular" }],
  }));
}

export function isTextBody(value: unknown): value is TextBody {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every((paragraph) => {
    if (!isRecord(paragraph)) return false;
    if (typeof paragraph.align !== "string" || !ALIGN_SET.has(paragraph.align)) return false;
    if (typeof paragraph.list !== "string" || !LIST_SET.has(paragraph.list)) return false;
    if (!Array.isArray(paragraph.runs) || paragraph.runs.length === 0) return false;
    return paragraph.runs.every((run) => {
      if (!isRecord(run) || typeof run.text !== "string") return false;
      if (typeof run.style !== "string" || !FONT_STYLE_SET.has(run.style)) return false;
      return run.href === undefined || typeof run.href === "string";
    });
  });
}

function copyRun(run: TextRun, text = run.text): TextRun {
  const next: TextRun = { text, style: run.style };
  if (run.href && run.href.trim()) next.href = run.href;
  return next;
}

export function normalizeRuns(runs: TextRun[]): TextRun[] {
  const merged: TextRun[] = [];
  for (const run of runs) {
    const text = run.text.replace(/\u200b/g, "");
    if (text.length === 0) continue;
    const href = run.href?.trim() ? run.href : undefined;
    const prev = merged[merged.length - 1];
    if (prev && prev.style === run.style && prev.href === href) {
      prev.text += text;
      continue;
    }
    const next: TextRun = { text, style: run.style };
    if (href) next.href = href;
    merged.push(next);
  }
  if (merged.length === 0) {
    const style = runs.find((run) => FONT_STYLE_SET.has(run.style))?.style ?? "regular";
    return [{ text: "", style }];
  }
  return merged;
}

export function normalizeBody(body: TextBody): TextBody {
  return body.map((paragraph) => ({
    align: paragraph.align,
    list: paragraph.list,
    runs: normalizeRuns(paragraph.runs),
  }));
}

export function coerceBody(paragraphs: unknown, plain?: unknown): TextBody {
  if (isTextBody(paragraphs)) return normalizeBody(paragraphs);
  if (typeof plain === "string") return bodyFromPlain(plain);
  return emptyBody();
}

export function sameBody(a: TextBody, b: TextBody): boolean {
  return JSON.stringify(normalizeBody(a)) === JSON.stringify(normalizeBody(b));
}

function clampOffset(text: string, offset: number): number {
  if (!Number.isFinite(offset)) return 0;
  return Math.max(0, Math.min(text.length, Math.floor(offset)));
}

export function normalizeRange(body: TextBody, range: TextRange): TextRange {
  const last = Math.max(0, body.length - 1);
  const clampCaret = (caret: Caret): Caret => {
    const paragraph = Math.max(0, Math.min(last, caret.paragraph));
    const text = body[paragraph] ? paragraphText(body[paragraph]) : "";
    return { paragraph, offset: clampOffset(text, caret.offset) };
  };
  const start = clampCaret(range.start);
  const end = clampCaret(range.end);
  if (start.paragraph < end.paragraph || (start.paragraph === end.paragraph && start.offset <= end.offset)) {
    return { start, end };
  }
  return { start: end, end: start };
}

export function isCollapsed(range: TextRange): boolean {
  return range.start.paragraph === range.end.paragraph && range.start.offset === range.end.offset;
}

export function fullRange(body: TextBody): TextRange {
  const safe = body.length > 0 ? body : emptyBody();
  const last = safe.length - 1;
  return {
    start: { paragraph: 0, offset: 0 },
    end: { paragraph: last, offset: paragraphText(safe[last]).length },
  };
}

export function collapsedAt(caret: Caret): TextRange {
  return { start: caret, end: caret };
}

function runBeforeCaret(paragraph: TextParagraph, caret: number): TextRun {
  const runs = paragraph.runs.filter((run) => run.text.length > 0);
  if (runs.length === 0) return paragraph.runs[0] ?? { text: "", style: "regular" };
  const textLength = paragraphText(paragraph).length;
  const probe = caret <= 0 ? 0 : Math.min(caret - 1, textLength - 1);
  let pos = 0;
  for (const run of paragraph.runs) {
    if (run.text.length === 0) continue;
    if (probe < pos + run.text.length) return run;
    pos += run.text.length;
  }
  return runs[runs.length - 1];
}

export function styleAt(paragraph: TextParagraph, offset: number): FontStyle {
  return runBeforeCaret(paragraph, offset).style;
}

export function hrefAt(paragraph: TextParagraph, offset: number): string | undefined {
  return runBeforeCaret(paragraph, offset).href;
}

type RunSpan = { start: number; end: number; run: TextRun };

function runSpans(paragraph: TextParagraph): RunSpan[] {
  const spans: RunSpan[] = [];
  let pos = 0;
  for (const run of paragraph.runs) {
    if (run.text.length === 0) continue;
    spans.push({ start: pos, end: pos + run.text.length, run });
    pos += run.text.length;
  }
  return spans;
}

function paragraphsTouching(body: TextBody, range: TextRange): number[] {
  const norm = normalizeRange(body, range);
  const indexes: number[] = [];
  for (let index = norm.start.paragraph; index <= norm.end.paragraph; index += 1) indexes.push(index);
  return indexes;
}

function spanInParagraph(body: TextBody, range: TextRange, index: number): { from: number; to: number } | null {
  const norm = normalizeRange(body, range);
  if (index < norm.start.paragraph || index > norm.end.paragraph) return null;
  const text = paragraphText(body[index]);
  const from = index === norm.start.paragraph ? norm.start.offset : 0;
  const to = index === norm.end.paragraph ? norm.end.offset : text.length;
  return { from, to };
}

function mapRuns(
  runs: TextRun[],
  from: number,
  to: number,
  map: (run: TextRun) => TextRun,
): TextRun[] {
  if (from >= to) return normalizeRuns(runs);
  const next: TextRun[] = [];
  let pos = 0;
  for (const run of runs) {
    const start = pos;
    const end = pos + run.text.length;
    pos = end;
    if (run.text.length === 0 || end <= from || start >= to) {
      if (run.text.length > 0) next.push(copyRun(run));
      continue;
    }
    const left = Math.max(0, from - start);
    const right = Math.min(run.text.length, to - start);
    if (left > 0) next.push(copyRun(run, run.text.slice(0, left)));
    next.push(map(copyRun(run, run.text.slice(left, right))));
    if (right < run.text.length) next.push(copyRun(run, run.text.slice(right)));
  }
  return normalizeRuns(next);
}

export function applyStyle(body: TextBody, range: TextRange, style: FontStyle): TextBody {
  const norm = normalizeRange(body, range);
  if (isCollapsed(norm)) {
    return body.map((paragraph, index) => {
      if (index !== norm.start.paragraph || paragraphText(paragraph).length > 0) return paragraph;
      return { ...paragraph, runs: [{ text: "", style }] };
    });
  }
  return body.map((paragraph, index) => {
    const span = spanInParagraph(body, norm, index);
    if (!span || span.from === span.to) return paragraph;
    return {
      ...paragraph,
      runs: mapRuns(paragraph.runs, span.from, span.to, (run) => ({ ...run, style })),
    };
  });
}

export function applyAlign(body: TextBody, range: TextRange, align: TextAlign): TextBody {
  const targets = new Set(paragraphsTouching(body, range));
  return body.map((paragraph, index) => (targets.has(index) ? { ...paragraph, align } : paragraph));
}

export function applyList(body: TextBody, range: TextRange, list: "bullet" | "numbered"): TextBody {
  const targets = paragraphsTouching(body, range);
  const turnOff = targets.every((index) => body[index].list === list);
  const nextList: ListKind = turnOff ? "none" : list;
  const targetSet = new Set(targets);
  return body.map((paragraph, index) => (targetSet.has(index) ? { ...paragraph, list: nextList } : paragraph));
}

export function applyHref(body: TextBody, range: TextRange, href: string): TextBody {
  const norm = normalizeRange(body, range);
  const cleaned = href.trim();
  if (isCollapsed(norm)) return body;
  return body.map((paragraph, index) => {
    const span = spanInParagraph(body, norm, index);
    if (!span || span.from === span.to) return paragraph;
    return {
      ...paragraph,
      runs: mapRuns(paragraph.runs, span.from, span.to, (run) => {
        const next: TextRun = { text: run.text, style: run.style };
        if (cleaned) next.href = cleaned;
        return next;
      }),
    };
  });
}

export function stylesInRange(body: TextBody, range: TextRange): FontStyle[] {
  const norm = normalizeRange(body, range);
  if (isCollapsed(norm)) {
    const paragraph = body[norm.start.paragraph] ?? emptyParagraph();
    return [styleAt(paragraph, norm.start.offset)];
  }
  const found: FontStyle[] = [];
  for (const index of paragraphsTouching(body, norm)) {
    const paragraph = body[index];
    const span = spanInParagraph(body, norm, index);
    if (!span) continue;
    if (span.from === span.to) {
      if (paragraphText(paragraph).length === 0) found.push(styleAt(paragraph, 0));
      continue;
    }
    for (const piece of runSpans(paragraph)) {
      if (piece.end > span.from && piece.start < span.to) found.push(piece.run.style);
    }
  }
  return found.length > 0 ? found : ["regular"];
}

export function alignsInRange(body: TextBody, range: TextRange): TextAlign[] {
  return paragraphsTouching(body, range).map((index) => body[index].align);
}

export function listsInRange(body: TextBody, range: TextRange): ListKind[] {
  return paragraphsTouching(body, range).map((index) => body[index].list);
}

export function hrefsInRange(body: TextBody, range: TextRange): Array<string | undefined> {
  const norm = normalizeRange(body, range);
  if (isCollapsed(norm)) {
    const paragraph = body[norm.start.paragraph] ?? emptyParagraph();
    return [hrefAt(paragraph, norm.start.offset)];
  }
  const found: Array<string | undefined> = [];
  for (const index of paragraphsTouching(body, norm)) {
    const paragraph = body[index];
    const span = spanInParagraph(body, norm, index);
    if (!span || span.from === span.to) continue;
    for (const piece of runSpans(paragraph)) {
      if (piece.end > span.from && piece.start < span.to) found.push(piece.run.href);
    }
  }
  return found;
}

export function uniformOf<T extends string>(values: T[]): T | "mixed" {
  const unique = [...new Set(values)];
  if (unique.length === 1) return unique[0];
  return "mixed";
}

export function listMarker(body: TextBody, index: number): string | null {
  const paragraph = body[index];
  if (!paragraph || paragraph.list === "none") return null;
  if (paragraph.list === "bullet") return "•";
  let count = 1;
  for (let cursor = index - 1; cursor >= 0 && body[cursor].list === "numbered"; cursor -= 1) {
    count += 1;
  }
  return `${count}.`;
}

function stepBack(text: string, offset: number): number {
  if (offset <= 1) return 0;
  const code = text.charCodeAt(offset - 1);
  if (code >= 0xdc00 && code <= 0xdfff && offset >= 2) {
    const prev = text.charCodeAt(offset - 2);
    if (prev >= 0xd800 && prev <= 0xdbff) return offset - 2;
  }
  return offset - 1;
}

function stepForward(text: string, offset: number): number {
  if (offset >= text.length) return text.length;
  if (offset >= text.length - 1) return text.length;
  const code = text.charCodeAt(offset);
  if (code >= 0xd800 && code <= 0xdbff) {
    const next = text.charCodeAt(offset + 1);
    if (next >= 0xdc00 && next <= 0xdfff) return offset + 2;
  }
  return offset + 1;
}

function splitRuns(runs: TextRun[], offset: number): { before: TextRun[]; after: TextRun[] } {
  const before: TextRun[] = [];
  const after: TextRun[] = [];
  let pos = 0;
  let style: FontStyle = runs[0]?.style ?? "regular";
  for (const run of runs) {
    const end = pos + run.text.length;
    if (run.text.length === 0) {
      style = run.style;
      continue;
    }
    if (end <= offset) {
      before.push(copyRun(run));
      style = run.style;
    } else if (pos >= offset) {
      after.push(copyRun(run));
    } else {
      const cut = offset - pos;
      before.push(copyRun(run, run.text.slice(0, cut)));
      after.push(copyRun(run, run.text.slice(cut)));
      style = run.style;
    }
    pos = end;
  }
  return {
    before: before.length > 0 ? before : [{ text: "", style }],
    after: after.length > 0 ? after : [{ text: "", style }],
  };
}

export function deleteRange(body: TextBody, range: TextRange): TextEdit {
  const norm = normalizeRange(body, range);
  if (isCollapsed(norm)) return { body, caret: norm.start };
  if (norm.start.paragraph === norm.end.paragraph) {
    const paragraph = body[norm.start.paragraph];
    const nextParagraph: TextParagraph = {
      ...paragraph,
      runs: mapRuns(paragraph.runs, norm.start.offset, norm.end.offset, () => ({ text: "", style: "regular" })),
    };
    const next = body.map((item, index) => (index === norm.start.paragraph ? nextParagraph : item));
    return { body: next, caret: norm.start };
  }
  const first = body[norm.start.paragraph];
  const last = body[norm.end.paragraph];
  const head = splitRuns(first.runs, norm.start.offset).before;
  const tail = splitRuns(last.runs, norm.end.offset).after;
  const merged: TextParagraph = {
    align: first.align,
    list: first.list,
    runs: normalizeRuns([...head, ...tail]),
  };
  return {
    body: [...body.slice(0, norm.start.paragraph), merged, ...body.slice(norm.end.paragraph + 1)],
    caret: norm.start,
  };
}

function insertIntoParagraph(body: TextBody, caret: Caret, text: string, style: FontStyle, href?: string): TextBody {
  if (!text) return body;
  const paragraph = body[caret.paragraph];
  const { before, after } = splitRuns(paragraph.runs, caret.offset);
  const inserted: TextRun = { text, style };
  if (href) inserted.href = href;
  const nextParagraph: TextParagraph = {
    ...paragraph,
    runs: normalizeRuns([...before, inserted, ...after]),
  };
  return body.map((item, index) => (index === caret.paragraph ? nextParagraph : item));
}

function listShortcut(paragraph: TextParagraph, offset: number): "bullet" | "numbered" | null {
  const text = paragraphText(paragraph);
  if (offset !== text.length) return null;
  if (text === "-" || text === "*") return "bullet";
  if (text === "1." || text === "1)") return "numbered";
  return null;
}

export function insertText(
  body: TextBody,
  range: TextRange,
  text: string,
  style: FontStyle,
  href?: string,
): TextEdit {
  const collapsed = isCollapsed(normalizeRange(body, range));
  const cleared = collapsed ? { body, caret: normalizeRange(body, range).start } : deleteRange(body, range);
  let next = cleared.body;
  let caret = cleared.caret;
  if (text === " " && collapsed) {
    const shortcut = listShortcut(next[caret.paragraph], caret.offset);
    if (shortcut) {
      const paragraph = next[caret.paragraph];
      const clearedParagraph: TextParagraph = {
        align: paragraph.align,
        list: shortcut,
        runs: [{ text: "", style: styleAt(paragraph, caret.offset) }],
      };
      return {
        body: next.map((item, index) => (index === caret.paragraph ? clearedParagraph : item)),
        caret: { paragraph: caret.paragraph, offset: 0 },
      };
    }
  }
  const lines = text.split(/\r\n|\r|\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    next = insertIntoParagraph(next, caret, line, style, href);
    caret = { paragraph: caret.paragraph, offset: caret.offset + line.length };
    if (index < lines.length - 1) {
      const split = splitParagraph(next, caret);
      next = split.body;
      caret = split.caret;
    }
  }
  return { body: next, caret };
}

function splitParagraph(body: TextBody, caret: Caret): TextEdit {
  const paragraph = body[caret.paragraph];
  const text = paragraphText(paragraph);
  if (paragraph.list !== "none" && text.length === 0) {
    return {
      body: body.map((item, index) => (index === caret.paragraph ? { ...item, list: "none" } : item)),
      caret,
    };
  }
  const style = styleAt(paragraph, caret.offset);
  const { before, after } = splitRuns(paragraph.runs, caret.offset);
  const current: TextParagraph = { ...paragraph, runs: normalizeRuns(before) };
  if (paragraphText(current).length === 0) current.runs = [{ text: "", style }];
  const created: TextParagraph = {
    align: paragraph.align,
    list: paragraph.list,
    runs: normalizeRuns(after),
  };
  if (paragraphText(created).length === 0) created.runs = [{ text: "", style }];
  return {
    body: [...body.slice(0, caret.paragraph), current, created, ...body.slice(caret.paragraph + 1)],
    caret: { paragraph: caret.paragraph + 1, offset: 0 },
  };
}

export function enterAt(body: TextBody, range: TextRange): TextEdit {
  const norm = normalizeRange(body, range);
  const cleared = isCollapsed(norm) ? { body, caret: norm.start } : deleteRange(body, norm);
  return splitParagraph(cleared.body, cleared.caret);
}

function mergeWithPrevious(body: TextBody, index: number): TextEdit {
  const previous = body[index - 1];
  const current = body[index];
  const offset = paragraphText(previous).length;
  const merged: TextParagraph = {
    align: previous.align,
    list: previous.list,
    runs: normalizeRuns([...previous.runs, ...current.runs]),
  };
  return {
    body: [...body.slice(0, index - 1), merged, ...body.slice(index + 1)],
    caret: { paragraph: index - 1, offset },
  };
}

export function deleteBackward(body: TextBody, range: TextRange): TextEdit {
  const norm = normalizeRange(body, range);
  if (!isCollapsed(norm)) return deleteRange(body, norm);
  const caret = norm.start;
  const paragraph = body[caret.paragraph];
  if (caret.offset === 0) {
    if (paragraph.list !== "none") {
      return {
        body: body.map((item, index) => (index === caret.paragraph ? { ...item, list: "none" } : item)),
        caret,
      };
    }
    if (caret.paragraph === 0) return { body, caret };
    return mergeWithPrevious(body, caret.paragraph);
  }
  const from = stepBack(paragraphText(paragraph), caret.offset);
  return deleteRange(body, {
    start: { paragraph: caret.paragraph, offset: from },
    end: caret,
  });
}

export function deleteForward(body: TextBody, range: TextRange): TextEdit {
  const norm = normalizeRange(body, range);
  if (!isCollapsed(norm)) return deleteRange(body, norm);
  const caret = norm.start;
  const paragraph = body[caret.paragraph];
  const text = paragraphText(paragraph);
  if (caret.offset >= text.length) {
    if (caret.paragraph >= body.length - 1) return { body, caret };
    const next = body[caret.paragraph + 1];
    if (next.list !== "none" && paragraphText(next).length === 0) {
      return {
        body: body.map((item, index) => (index === caret.paragraph + 1 ? { ...item, list: "none" } : item)),
        caret,
      };
    }
    const merged = mergeWithPrevious(body, caret.paragraph + 1);
    return { body: merged.body, caret };
  }
  const to = stepForward(text, caret.offset);
  return deleteRange(body, {
    start: caret,
    end: { paragraph: caret.paragraph, offset: to },
  });
}

export function linkTarget(body: TextBody, range: TextRange, wholeNode: boolean): TextRange {
  if (wholeNode) return fullRange(body);
  const norm = normalizeRange(body, range);
  if (!isCollapsed(norm)) return norm;
  const paragraph = body[norm.start.paragraph] ?? emptyParagraph();
  const text = paragraphText(paragraph);
  const offset = norm.start.offset;
  const spans = runSpans(paragraph);
  const probe = offset <= 0 ? 0 : offset - 1;
  const inside = spans.find((span) => probe >= span.start && probe < span.end && span.run.href);
  if (inside) {
    return {
      start: { paragraph: norm.start.paragraph, offset: inside.start },
      end: { paragraph: norm.start.paragraph, offset: inside.end },
    };
  }
  let from = offset;
  let to = offset;
  while (from > 0 && !/\s/.test(text[from - 1] ?? "")) from -= 1;
  while (to < text.length && !/\s/.test(text[to] ?? "")) to += 1;
  return {
    start: { paragraph: norm.start.paragraph, offset: from },
    end: { paragraph: norm.start.paragraph, offset: to },
  };
}

export function textInRange(body: TextBody, range: TextRange): string {
  const norm = normalizeRange(body, range);
  if (isCollapsed(norm)) return "";
  const parts: string[] = [];
  for (let index = norm.start.paragraph; index <= norm.end.paragraph; index += 1) {
    const text = paragraphText(body[index]);
    if (index === norm.start.paragraph && index === norm.end.paragraph) {
      parts.push(text.slice(norm.start.offset, norm.end.offset));
    } else if (index === norm.start.paragraph) {
      parts.push(text.slice(norm.start.offset));
    } else if (index === norm.end.paragraph) {
      parts.push(text.slice(0, norm.end.offset));
    } else {
      parts.push(text);
    }
  }
  return parts.join("\n");
}

export function openableUrl(href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed || /^\s*javascript:/i.test(trimmed)) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    if (/^https?:/i.test(trimmed) || /^mailto:/i.test(trimmed)) return trimmed;
    return null;
  }
  return `https://${trimmed}`;
}

export function styleForTyping(body: TextBody, range: TextRange, pending: FontStyle | null): FontStyle {
  if (pending) return pending;
  const norm = normalizeRange(body, range);
  const paragraph = body[norm.start.paragraph] ?? emptyParagraph();
  if (!isCollapsed(norm)) return styleAt(paragraph, norm.start.offset + 1);
  return styleAt(paragraph, norm.start.offset);
}

export function hrefForTyping(body: TextBody, range: TextRange): string | undefined {
  const norm = normalizeRange(body, range);
  const paragraph = body[norm.start.paragraph] ?? emptyParagraph();
  if (!isCollapsed(norm)) return hrefAt(paragraph, norm.start.offset + 1);
  return hrefAt(paragraph, norm.start.offset);
}

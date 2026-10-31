import { useStore } from "@xyflow/react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type CSSProperties,
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import TextToolbar from "./TextToolbar";
import { placeRange, readRange } from "./textDom";
import {
  ALIGN_LABELS,
  FONT_STYLE_LABELS,
  emptyParagraph,
  alignsInRange,
  applyAlign,
  applyHref,
  applyList,
  applyStyle,
  collapsedAt,
  deleteBackward,
  deleteForward,
  deleteRange,
  enterAt,
  fullRange,
  hrefAt,
  hrefForTyping,
  paragraphText,
  styleAt,
  hrefsInRange,
  insertText,
  isCollapsed,
  isEmptyBody,
  linkTarget,
  listMarker,
  listsInRange,
  normalizeRange,
  openableUrl,
  sameBody,
  styleForTyping,
  stylesInRange,
  textInRange,
  uniformOf,
  type Caret,
  type FontStyle,
  type ListKind,
  type TextAlign,
  type TextBody,
  type TextParagraph,
  type TextEdit,
  type TextRange,
} from "./textBody";

export type RichTextProps = {
  body: TextBody;
  editing: boolean;
  selected: boolean;
  placeholder?: string;
  fontSize?: number;
  fill?: boolean;
  onCommit: (body: TextBody) => void;
  onCancel: () => void;
  onFormat: (body: TextBody) => void;
};

type HistoryStep = {
  body: TextBody;
  range: TextRange;
};

type Pressed = boolean | "mixed";

function runStyle(style: FontStyle): CSSProperties {
  const bold = style === "bold" || style === "bold-italic";
  const italic = style === "italic" || style === "bold-italic";
  return {
    fontWeight: bold ? 700 : 400,
    fontStyle: italic ? "italic" : "normal",
  };
}

function alignClass(align: TextAlign): string {
  if (align === "center") return "noodle-align-center";
  if (align === "right") return "noodle-align-right";
  if (align === "justify") return "noodle-align-justify";
  return "noodle-align-left";
}

function pressFor(lists: ListKind[], kind: "bullet" | "numbered"): Pressed {
  if (lists.length > 0 && lists.every((list) => list === kind)) return true;
  if (lists.some((list) => list === kind)) return "mixed";
  return false;
}

function paragraphFromDom(paragraph: TextParagraph, text: string): TextParagraph {
  const previous = paragraphText(paragraph).replace(/\u200b/g, "");
  if (previous === text) return paragraph;
  let start = 0;
  const max = Math.min(previous.length, text.length);
  while (start < max && previous[start] === text[start]) start += 1;
  let previousEnd = previous.length;
  let nextEnd = text.length;
  while (previousEnd > start && nextEnd > start && previous[previousEnd - 1] === text[nextEnd - 1]) {
    previousEnd -= 1;
    nextEnd -= 1;
  }
  const edit = insertText(
    [paragraph],
    {
      start: { paragraph: 0, offset: start },
      end: { paragraph: 0, offset: previousEnd },
    },
    text.slice(start, nextEnd),
    styleAt(paragraph, start),
    hrefAt(paragraph, start),
  );
  return edit.body[0] ?? paragraph;
}

function bodyFromEditor(root: HTMLElement, model: TextBody): TextBody {
  const paragraphs = [...root.querySelectorAll<HTMLElement>("[data-paragraph]")];
  if (paragraphs.length === 0) {
    const text = (root.textContent ?? "").replace(/\u200b/g, "");
    const current = model[0] ?? emptyParagraph();
    if (model.length === 1 && paragraphText(current).replace(/\u200b/g, "") === text) return model;
    return [paragraphFromDom(current, text)];
  }
  return paragraphs.map((element, index) => {
    const current = model[index] ?? emptyParagraph();
    const runs = element.querySelector("[data-runs]");
    const text = (runs?.textContent ?? "").replace(/\u200b/g, "");
    return paragraphFromDom(current, text);
  });
}

function sameRange(a: TextRange | null, b: TextRange | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.start.paragraph === b.start.paragraph &&
    a.start.offset === b.start.offset &&
    a.end.paragraph === b.end.paragraph &&
    a.end.offset === b.end.offset
  );
}

export function RichText({
  body,
  editing,
  selected,
  placeholder = "Double-click to write",
  fontSize,
  fill = false,
  onCommit,
  onCancel,
  onFormat,
}: RichTextProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef(body);
  const bodyRef = useRef(body);
  const rangeRef = useRef<TextRange | null>(null);
  const restoreRef = useRef<TextRange | null>(null);
  const undoStack = useRef<HistoryStep[]>([]);
  const redoStack = useRef<HistoryStep[]>([]);
  const pendingRef = useRef<FontStyle | null>(null);
  const pendingCaret = useRef<Caret | null>(null);
  const composing = useRef(false);
  const compositionRange = useRef<TextRange | null>(null);
  const busy = useRef(false);
  const modelEdit = useRef(false);
  const ignoreBlur = useRef(false);
  const blurTimer = useRef<number | null>(null);
  const skipNative = useRef<string | null>(null);
  const linkTargetRef = useRef<TextRange>(fullRange(body));
  const linkUrlRef = useRef("");
  const linkOpenRef = useRef(false);
  const onCommitRef = useRef(onCommit);
  const onCancelRef = useRef(onCancel);
  const onFormatRef = useRef(onFormat);
  const editingRef = useRef(editing);

  const [draft, setDraft] = useState(body);
  const [range, setRange] = useState<TextRange | null>(null);
  const [pendingStyle, setPendingStyle] = useState<FontStyle | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkMixed, setLinkMixed] = useState(false);
  const [linkPos, setLinkPos] = useState({ left: 0, top: -40 });
  const [focusTick, setFocusTick] = useState(0);
  const [structureEpoch, setStructureEpoch] = useState(0);
  const [trackedEditing, setTrackedEditing] = useState(editing);
  const zoom = useStore((state) => state.transform[2]);

  bodyRef.current = body;
  editingRef.current = editing;
  onCommitRef.current = onCommit;
  onCancelRef.current = onCancel;
  onFormatRef.current = onFormat;
  linkOpenRef.current = linkOpen;
  linkUrlRef.current = linkUrl;

  if (editing !== trackedEditing) {
    setTrackedEditing(editing);
    if (editing) {
      const next = structuredClone(body);
      draftRef.current = next;
      setDraft(next);
      undoStack.current = [];
      redoStack.current = [];
      pendingRef.current = null;
      pendingCaret.current = null;
      setPendingStyle(null);
      const all = fullRange(next);
      rangeRef.current = all;
      setRange(all);
      restoreRef.current = all;
      setLinkOpen(false);
    }
  } else if (editing) {
    draftRef.current = draft;
  }

  const shown = editing ? draft : body;

  const armSkip = (type: string) => {
    skipNative.current = type;
    queueMicrotask(() => {
      if (skipNative.current === type) skipNative.current = null;
    });
  };

  const guard = (run: () => void) => {
    if (busy.current) return;
    busy.current = true;
    try {
      run();
    } finally {
      busy.current = false;
    }
  };

  const liveRange = (): TextRange => {
    if (editorRef.current) {
      const fromDom = readRange(editorRef.current, draftRef.current);
      if (fromDom) return fromDom;
    }
    return rangeRef.current ?? collapsedAt({ paragraph: 0, offset: 0 });
  };

  const remember = (nextBody: TextBody, nextRange: TextRange) => {
    modelEdit.current = true;
    queueMicrotask(() => {
      modelEdit.current = false;
    });
    undoStack.current.push({
      body: structuredClone(draftRef.current),
      range: rangeRef.current ?? collapsedAt({ paragraph: 0, offset: 0 }),
    });
    if (undoStack.current.length > 100) undoStack.current.shift();
    redoStack.current = [];
    draftRef.current = nextBody;
    rangeRef.current = nextRange;
    restoreRef.current = nextRange;
    setDraft(nextBody);
    setRange(nextRange);
  };

  const restore = (step: HistoryStep) => {
    draftRef.current = step.body;
    rangeRef.current = step.range;
    restoreRef.current = step.range;
    pendingRef.current = null;
    pendingCaret.current = null;
    setPendingStyle(null);
    setDraft(step.body);
    setRange(step.range);
  };

  const travel = (redo: boolean) => {
    const source = redo ? redoStack.current : undoStack.current;
    const dest = redo ? undoStack.current : redoStack.current;
    const step = source.pop();
    if (!step) return;
    dest.push({
      body: structuredClone(draftRef.current),
      range: rangeRef.current ?? step.range,
    });
    restore(step);
  };

  const applyTyped = (text: string, at?: TextRange) => {
    if (!text) return;
    guard(() => {
    const current = at ?? liveRange();
    const style = styleForTyping(draftRef.current, current, pendingRef.current);
    const href = hrefForTyping(draftRef.current, current);
    const edit: TextEdit = insertText(draftRef.current, current, text, style, href);
    pendingRef.current = null;
    pendingCaret.current = null;
    setPendingStyle(null);
    remember(edit.body, collapsedAt(edit.caret));
    });
  };

  const applyEnter = () => {
    guard(() => {
    const edit = enterAt(draftRef.current, liveRange());
    pendingRef.current = null;
    pendingCaret.current = null;
    setPendingStyle(null);
    remember(edit.body, collapsedAt(edit.caret));
    });
  };

  const applyBackward = () => {
    guard(() => {
    const edit = deleteBackward(draftRef.current, liveRange());
    remember(edit.body, collapsedAt(edit.caret));
    });
  };

  const applyForward = () => {
    guard(() => {
    const edit = deleteForward(draftRef.current, liveRange());
    remember(edit.body, collapsedAt(edit.caret));
    });
  };

  useLayoutEffect(() => {
    if (!editing || !editorRef.current || composing.current) return;
    const root = editorRef.current;
    const paragraphs = root.querySelectorAll<HTMLElement>("[data-paragraph]");
    if (paragraphs.length !== draftRef.current.length) {
      if (structureEpoch > 8) return;
      setStructureEpoch((epoch) => epoch + 1);
      return;
    }
    draftRef.current.forEach((paragraph, index) => {
      const runsRoot = paragraphs[index]?.querySelector("[data-runs]");
      if (!runsRoot) return;
      const spans = runsRoot.querySelectorAll<HTMLElement>(":scope > span");
      paragraph.runs.forEach((run, runIndex) => {
        const span = spans[runIndex];
        const expected = run.text.length > 0 ? run.text : "\u200b";
        if (span && span.textContent !== expected) span.textContent = expected;
      });
    });
    if (linkOpen || !restoreRef.current) return;
    const next = restoreRef.current;
    restoreRef.current = null;
    root.focus();
    placeRange(root, next);
  }, [draft, editing, focusTick, linkOpen, structureEpoch]);

  useEffect(() => {
    if (editing) return;
    ignoreBlur.current = false;
    if (blurTimer.current !== null) {
      window.clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && rootRef.current?.contains(target)) return;
      onCommitRef.current(draftRef.current);
    };
    const onSelection = () => {
      if (!editorRef.current) return;
      const next = readRange(editorRef.current, draftRef.current);
      if (!next) return;
      if (pendingCaret.current) {
        const moved =
          !isCollapsed(next) ||
          next.start.paragraph !== pendingCaret.current.paragraph ||
          next.start.offset !== pendingCaret.current.offset;
        if (moved) {
          pendingRef.current = null;
          pendingCaret.current = null;
          setPendingStyle(null);
        }
      }
      if (sameRange(rangeRef.current, next)) return;
      rangeRef.current = next;
      setRange(next);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("selectionchange", onSelection);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("selectionchange", onSelection);
    };
  }, [editing]);

  useEffect(() => {
    if (!linkOpen) return;
    linkInputRef.current?.focus();
    linkInputRef.current?.select();
  }, [linkOpen]);

  useLayoutEffect(() => {
    if (!linkOpen || !rootRef.current) return;
    const host = rootRef.current.getBoundingClientRect();
    const zoom = rootRef.current.offsetWidth > 0 ? host.width / rootRef.current.offsetWidth : 1;
    const selection = window.getSelection();
    let rect: DOMRect | null = null;
    if (
      editing &&
      editorRef.current &&
      selection &&
      selection.rangeCount > 0 &&
      selection.anchorNode &&
      editorRef.current.contains(selection.anchorNode)
    ) {
      const next = selection.getRangeAt(0).getBoundingClientRect();
      if (next.height > 0 || next.width > 0) rect = next;
    }
    if (!rect) rect = (frameRef.current ?? rootRef.current).getBoundingClientRect();
    const width = 224;
    const maxLeft = Math.max(0, rootRef.current.offsetWidth - width);
    const left = Math.min(Math.max(0, (rect.left - host.left) / zoom), maxLeft);
    const top = (rect.top - host.top) / zoom - 40;
    setLinkPos({ left, top });
  }, [editing, linkOpen]);

  const toolbarRange = editing && range ? range : fullRange(shown);
  const styleValues = stylesInRange(shown, toolbarRange);
  const uniformStyle =
    pendingStyle && editing && range && isCollapsed(normalizeRange(shown, range))
      ? pendingStyle
      : uniformOf(styleValues);
  const alignValues = alignsInRange(shown, toolbarRange);
  const uniformAlign = uniformOf(alignValues);
  const listValues = listsInRange(shown, toolbarRange);
  const linkHrefs = hrefsInRange(shown, toolbarRange);
  const linkedCount = linkHrefs.filter((href) => href).length;
  const linkPressed: Pressed = linkOpen
    ? true
    : linkHrefs.length > 0 && linkedCount === linkHrefs.length
      ? true
      : linkedCount > 0
        ? "mixed"
        : false;

  const changeStyle = (style: FontStyle) => {
    if (!editingRef.current) {
      onFormatRef.current(applyStyle(bodyRef.current, fullRange(bodyRef.current), style));
      return;
    }
    const current = normalizeRange(draftRef.current, liveRange());
    if (isCollapsed(current)) {
      pendingRef.current = style;
      pendingCaret.current = current.start;
      setPendingStyle(style);
      const next = applyStyle(draftRef.current, current, style);
      if (!sameBody(next, draftRef.current)) remember(next, current);
      return;
    }
    pendingRef.current = null;
    pendingCaret.current = null;
    setPendingStyle(null);
    remember(applyStyle(draftRef.current, current, style), current);
  };

  const changeAlign = (align: TextAlign) => {
    if (!editingRef.current) {
      onFormatRef.current(applyAlign(bodyRef.current, fullRange(bodyRef.current), align));
      return;
    }
    const current = normalizeRange(draftRef.current, liveRange());
    remember(applyAlign(draftRef.current, current, align), current);
  };

  const changeList = (list: "bullet" | "numbered") => {
    if (!editingRef.current) {
      onFormatRef.current(applyList(bodyRef.current, fullRange(bodyRef.current), list));
      return;
    }
    const current = normalizeRange(draftRef.current, liveRange());
    remember(applyList(draftRef.current, current, list), current);
  };

  const openLink = () => {
    if (linkOpenRef.current) {
      setLinkOpen(false);
      if (editingRef.current) {
        restoreRef.current = liveRange();
        setFocusTick((tick) => tick + 1);
      }
      return;
    }
    const source = editingRef.current ? draftRef.current : bodyRef.current;
    const whole = !editingRef.current;
    const current = whole ? fullRange(source) : liveRange();
    const target = linkTarget(source, current, whole);
    linkTargetRef.current = target;
    const hrefs = isCollapsed(normalizeRange(source, target)) ? [] : hrefsInRange(source, target);
    const unique = [...new Set(hrefs.map((href) => href ?? ""))];
    setLinkMixed(unique.length > 1);
    setLinkUrl(unique.length === 1 ? unique[0] : "");
    setLinkOpen(true);
  };

  const commitLink = () => {
    const source = editingRef.current ? draftRef.current : bodyRef.current;
    const target = linkTargetRef.current;
    const next = applyHref(source, target, linkUrlRef.current);
    setLinkOpen(false);
    if (!editingRef.current) {
      onFormatRef.current(next);
      return;
    }
    if (!sameBody(next, source)) remember(next, target);
    else {
      restoreRef.current = target;
      setFocusTick((tick) => tick + 1);
    }
  };

  const onBeforeInput = (event: FormEvent<HTMLDivElement>) => {
    const native = event.nativeEvent as InputEvent;
    if (native.isComposing || composing.current || native.inputType === "insertCompositionText") return;
    if (skipNative.current === native.inputType) {
      skipNative.current = null;
      event.preventDefault();
      return;
    }
    const handled = [
      "insertText",
      "insertParagraph",
      "insertLineBreak",
      "deleteContentBackward",
      "deleteContentForward",
      "deleteByCut",
      "deleteContent",
      "insertFromPaste",
      "historyUndo",
      "historyRedo",
    ];
    if (!handled.includes(native.inputType)) return;
    event.preventDefault();
    if (native.inputType === "insertText") applyTyped(native.data ?? "");
    else if (native.inputType === "insertParagraph" || native.inputType === "insertLineBreak") applyEnter();
    else if (native.inputType === "deleteContentBackward") applyBackward();
    else if (native.inputType === "deleteContentForward") applyForward();
    else if (native.inputType === "deleteByCut" || native.inputType === "deleteContent") {
      guard(() => {
        const current = liveRange();
        const edit = deleteRange(draftRef.current, current);
        remember(edit.body, collapsedAt(edit.caret));
      });
    } else if (native.inputType === "insertFromPaste") {
      const text = native.dataTransfer?.getData("text/plain") ?? native.data ?? "";
      if (text) applyTyped(text);
    } else if (native.inputType === "historyUndo") guard(() => travel(false));
    else if (native.inputType === "historyRedo") guard(() => travel(true));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      ignoreBlur.current = true;
      const restored = structuredClone(bodyRef.current);
      draftRef.current = restored;
      setDraft(restored);
      onCancelRef.current();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      armSkip(event.shiftKey ? "historyRedo" : "historyUndo");
      guard(() => travel(event.shiftKey));
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
      event.preventDefault();
      const all = fullRange(draftRef.current);
      rangeRef.current = all;
      setRange(all);
      if (editorRef.current) placeRange(editorRef.current, all);
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      armSkip("insertParagraph");
      applyEnter();
    }
  };

  const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    armSkip("insertFromPaste");
    const text = event.clipboardData.getData("text/plain");
    if (text) applyTyped(text);
  };

  const onCopy = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.clipboardData.setData("text/plain", textInRange(draftRef.current, liveRange()));
  };

  const onCut = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    armSkip("deleteByCut");
    const current = liveRange();
    event.clipboardData.setData("text/plain", textInRange(draftRef.current, current));
    const edit = deleteRange(draftRef.current, current);
    remember(edit.body, collapsedAt(edit.caret));
  };

  const showPlaceholder = isEmptyBody(shown);
  const textStyle = fontSize ? { fontSize } : undefined;

  return (
    <div ref={rootRef} className={fill ? "relative h-full w-full" : "relative w-full"}>
      {selected ? (
        <TextToolbar
          styleLabel={uniformStyle === "mixed" ? "Mixed" : FONT_STYLE_LABELS[uniformStyle]}
          alignLabel={uniformAlign === "mixed" ? "Mixed" : ALIGN_LABELS[uniformAlign]}
          activeStyle={uniformStyle}
          activeAlign={uniformAlign}
          bullet={pressFor(listValues, "bullet")}
          numbered={pressFor(listValues, "numbered")}
          linkActive={linkPressed === true}
          onStyle={changeStyle}
          onAlign={changeAlign}
          onBullet={() => changeList("bullet")}
          onNumbered={() => changeList("numbered")}
          onLink={openLink}
          zoom={zoom}
        />
      ) : null}
      {linkOpen ? (
        <form
          className="nodrag nopan absolute z-30"
          style={{
            left: linkPos.left,
            top: linkPos.top,
            transform: `scale(${1 / zoom})`,
            transformOrigin: "top left",
          }}
          onSubmit={(event) => {
            event.preventDefault();
            commitLink();
          }}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
        >
          <input
            ref={linkInputRef}
            aria-label="Link URL"
            placeholder={linkMixed ? "Multiple links" : "Paste a link"}
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Enter") {
                event.preventDefault();
                commitLink();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                setLinkOpen(false);
                if (editingRef.current) {
                  restoreRef.current = linkTargetRef.current;
                  setFocusTick((tick) => tick + 1);
                }
              }
            }}
            className="w-56 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-800 shadow-lg outline-none focus:border-slate-400"
          />
        </form>
      ) : null}
      <div
        ref={frameRef}
        className={fill ? "h-full min-h-0 overflow-auto p-3" : "min-h-[1.5rem] overflow-auto px-1 py-0.5"}
        style={textStyle}
      >
        {!editing && showPlaceholder ? (
          <div className="text-sm leading-5 text-slate-400">{placeholder}</div>
        ) : (
          <div className="relative">
            {editing && showPlaceholder ? (
              <div className="pointer-events-none absolute inset-0 z-0 text-sm leading-5 text-slate-400" aria-hidden>
                {placeholder}
              </div>
            ) : null}
            <div
              key={`${editing ? "editing" : "reading"}-${structureEpoch}`}
              ref={editorRef}
              className={`noodle-text-editor relative z-[1] text-sm leading-5 text-slate-800 ${
                editing ? "nodrag nopan nowheel min-h-[1.25rem]" : ""
              }`}
              contentEditable={editing}
              suppressContentEditableWarning
              onBlur={
                editing
                  ? (event: FocusEvent<HTMLDivElement>) => {
                      if (ignoreBlur.current) {
                        ignoreBlur.current = false;
                        return;
                      }
                      const next = event.relatedTarget;
                      if (next instanceof Node && rootRef.current?.contains(next)) return;
                      if (blurTimer.current !== null) window.clearTimeout(blurTimer.current);
                      blurTimer.current = window.setTimeout(() => {
                        blurTimer.current = null;
                        if (!editingRef.current) return;
                        const active = document.activeElement;
                        if (active instanceof Node && rootRef.current?.contains(active)) return;
                        onCommitRef.current(draftRef.current);
                      }, 0);
                    }
                  : undefined
              }
              role={editing ? "textbox" : undefined}
              aria-multiline={editing ? true : undefined}
              aria-label={editing ? "Text" : undefined}
              spellCheck={false}
              onInput={
                editing
                  ? () => {
                      if (composing.current || busy.current || modelEdit.current || !editorRef.current) return;
                      const next = bodyFromEditor(editorRef.current, draftRef.current);
                      if (sameBody(next, draftRef.current)) return;
                      const caret = readRange(editorRef.current, next)?.end ?? {
                        paragraph: Math.max(0, next.length - 1),
                        offset: paragraphText(next[Math.max(0, next.length - 1)] ?? emptyParagraph()).length,
                      };
                      remember(next, collapsedAt(caret));
                    }
                  : undefined
              }
              onBeforeInput={editing ? onBeforeInput : undefined}
              onKeyDown={editing ? onKeyDown : undefined}
              onPaste={editing ? onPaste : undefined}
              onCopy={editing ? onCopy : undefined}
              onCut={editing ? onCut : undefined}
              onCompositionStart={
                editing
                  ? () => {
                      composing.current = true;
                      compositionRange.current = liveRange();
                    }
                  : undefined
              }
              onCompositionEnd={
                editing
                  ? (event) => {
                      composing.current = false;
                      const at = compositionRange.current ?? undefined;
                      compositionRange.current = null;
                      if (event.data) applyTyped(event.data, at);
                      else setFocusTick((tick) => tick + 1);
                    }
                  : undefined
              }
            >
              {shown.map((paragraph, index) => {
                const marker = listMarker(shown, index);
                return (
                  <div key={index} data-paragraph={index} className="noodle-text-paragraph">
                    {marker ? (
                      <span data-marker="true" contentEditable={false} className="noodle-text-marker">
                        {marker}
                      </span>
                    ) : null}
                    <span data-runs="true" className={`noodle-text-runs ${alignClass(paragraph.align)}`}>
                      {paragraph.runs.map((run, runIndex) => {
                        const url = run.href ? openableUrl(run.href) : null;
                        if (!editing && run.href) {
                          return (
                            <a
                              key={runIndex}
                              href={url ?? undefined}
                              data-style={run.style}
                              data-href={run.href}
                              className="nodrag nopan underline underline-offset-2"
                              style={runStyle(run.style)}
                              onClick={(event) => {
                                event.preventDefault();
                                if (!selected) return;
                                event.stopPropagation();
                                if (url) window.open(url, "_blank", "noopener,noreferrer");
                              }}
                              onDoubleClick={(event) => {
                                if (!selected) return;
                                event.preventDefault();
                                event.stopPropagation();
                              }}
                              onKeyDown={(event) => {
                                if (event.key !== "Enter") return;
                                event.preventDefault();
                                event.stopPropagation();
                                if (url) window.open(url, "_blank", "noopener,noreferrer");
                              }}
                            >
                              {run.text || "\u200b"}
                            </a>
                          );
                        }
                        return (
                          <span
                            key={runIndex}
                            data-style={run.style}
                            data-href={run.href}
                            className={run.href ? "underline underline-offset-2" : undefined}
                            style={runStyle(run.style)}
                          >
                            {run.text || "\u200b"}
                          </span>
                        );
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RichText;

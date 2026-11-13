/**
 * Reports hardcoded colors, spacing, radius, border thickness, font size, and line height.
 * Shadows, backdrop blur, and the dot grid are not checked. Paragraph spacing is not in the export.
 *
 * The live Tailwind theme still includes Tailwind's defaults, so the current
 * board does not change. This script is the safety net that counts classes
 * and CSS values outside our tokens.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black";
const COLOR_PREFIX =
  "bg|text|border|border-[xytrblse]|ring|ring-offset|fill|stroke|from|to|via|outline|decoration|divide|placeholder|caret|accent";
const COLOR_RE = new RegExp(`^(${COLOR_PREFIX})-(${PALETTE})(-\\d{2,3})?(?:/\\d+)?$`);
const SPACING_PREFIX =
  "p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y|w|h|min-w|min-h|max-w|max-h|size|inset|inset-x|inset-y|top|right|bottom|left|start|end";
const SPACING_RE = new RegExp(`^(${SPACING_PREFIX})-(\\d+(?:\\.\\d+)?|px)$`);
const ARBITRARY_PREFIX =
  "bg|text|border|border-[xytrblse]|ring|fill|stroke|from|to|via|outline|decoration|p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|w|h|min-w|min-h|max-w|max-h|inset|top|right|bottom|left|rounded|border";
const ARBITRARY_RE = new RegExp(`^(${ARBITRARY_PREFIX})-\\[`);
const RADIUS_RE =
  /^rounded(?:-(?:t|r|b|l|tl|tr|br|bl|s|e|ss|se|ee|es))?(?:-(?:none|sm|md|lg|xl|2xl|3xl|full))?$/;
const BORDER_WIDTH_RE = /^border(?:-[xytrblse])?(?:-(?:0|2|4|8))?$/;
const BORDER_STYLE = new Set([
  "border-solid",
  "border-dashed",
  "border-dotted",
  "border-double",
  "border-hidden",
  "border-none",
  "border-collapse",
  "border-separate",
]);

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "styles") continue;
      walk(full, acc);
    } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".jsx")) {
      acc.push(full);
    }
  }
  return acc;
}

function utility(className) {
  const body = className.trim().replace(/^!/, "");
  const parts = body.split(":");
  return parts[parts.length - 1].replace(/^-/, "");
}

function classify(className) {
  const name = utility(className);
  if (!name || name.startsWith("shadow") || name.startsWith("backdrop")) return null;
  if (name.includes("brand-") || name.includes("alias-") || name.includes("mapped-") || name.includes("responsive-")) {
    if (!name.includes("[")) return null;
  }
  if (/^text-\[\d/.test(name) || /^leading-\[/.test(name)) return "type";
  if (ARBITRARY_RE.test(name) || (name.includes("[") && /^(bg|text|border|rounded|p|px|py|m|gap|w|h)-\[/.test(name))) {
    return "arbitrary";
  }
  if (/^font-(sans|serif|mono)$/.test(name)) return "font";
  if (COLOR_RE.test(name)) return "color";
  if (SPACING_RE.test(name)) return "spacing";
  if (BORDER_STYLE.has(name)) return null;
  if (BORDER_WIDTH_RE.test(name)) return "border width";
  if (RADIUS_RE.test(name) && name !== "rounded") return "radius";
  if (name === "rounded") return "radius";
  return null;
}

function classesIn(source) {
  const found = [];
  const attr = /className\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{([\s\S]*?)\})/g;
  let match;
  while ((match = attr.exec(source))) {
    const raw = match[1] ?? match[2] ?? match[3] ?? match[4] ?? "";
    const quoted = [...raw.matchAll(/["'`]([^"'`]*)["'`]/g)].map((item) => item[1]);
    const chunks = quoted.length ? quoted : [raw];
    for (const chunk of chunks) {
      for (const token of chunk.split(/\s+/)) {
        if (token) found.push(token);
      }
    }
  }
  return found;
}

function lintClasses() {
  const findings = [];
  for (const file of walk(SRC)) {
    const source = fs.readFileSync(file, "utf8");
    const rel = path.relative(ROOT, file).replaceAll("\\", "/");
    classesIn(source).forEach((token, index) => {
      const kind = classify(token);
      if (!kind) return;
      findings.push({ file: rel, kind, value: utility(token), index });
    });
  }
  return findings;
}

function lintCss() {
  const bin = path.join(ROOT, "node_modules", "stylelint", "bin", "stylelint.mjs");
  const result = spawnSync(process.execPath, [bin, "src/**/*.css", "--formatter", "json"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  const raw = (result.stdout || result.stderr || "").trim();
  const jsonStart = raw.indexOf("[");
  if (jsonStart === -1) {
    throw new Error(raw || "stylelint produced no output");
  }
  const reports = JSON.parse(raw.slice(jsonStart));
  const findings = [];
  const seen = new Set();
  for (const file of reports) {
    const rel = file.source ? path.relative(ROOT, file.source).replaceAll("\\", "/") : "";
    for (const warning of file.warnings ?? []) {
      const key = `${rel}:${warning.line}:${warning.column}:${warning.text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({ file: rel, line: warning.line, text: warning.text });
    }
  }
  return findings;
}

const css = lintCss();
const classes = lintClasses();
const byKind = {};
for (const item of classes) {
  byKind[item.kind] = (byKind[item.kind] ?? 0) + 1;
}

const total = css.length + classes.length;
console.log(`Hardcoded values: ${total}`);
console.log(`  CSS declarations: ${css.length}`);
console.log(`  Tailwind classes: ${classes.length}`);
for (const [kind, count] of Object.entries(byKind).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${kind}: ${count}`);
}

if (process.argv.includes("--list")) {
  for (const item of css) console.log(`CSS ${item.file}:${item.line} ${item.text}`);
  for (const item of classes) console.log(`TW ${item.file} ${item.value} (${item.kind})`);
}

process.exit(total > 0 ? 1 : 0);

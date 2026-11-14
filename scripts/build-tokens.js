/**
 * Builds CSS variables and a Tailwind theme from tokens/tokens.json.
 * The export changes as UI is built from Figma. Run `npm run tokens` after
 * each new export. Also writes docs/token-lookup.md.
 * Desktop font size and line height are included. Shadows, blur, and the dot grid are left out.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import StyleDictionary from "style-dictionary";
import { convertTokens } from "./convert-tokens.js";
import { writeTokenLookup } from "./token-lookup.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "tokens", "tokens.json");
const OUT_DIR = path.join(ROOT, "src", "styles");

function bucketFor(token) {
  const [group, second] = token.path;
  const last = token.path[token.path.length - 1];
  if (token.$type === "color") return "colors";
  if (group === "brand" && second === "scale") return "spacing";
  if (second === "border-radius") return "borderRadius";
  if (second === "border-width") return "borderWidth";
  if (second === "font-family" || second === "typeface") return "fontFamily";
  if (last === "font-size" || (group === "responsive" && last === "size")) return "fontSize";
  if (last === "line-height" || last === "line-height-tight") return "lineHeight";
  if (last === "paragraph-spacing") return "spacing";
  return null;
}

function nest(root, tokenPath, value) {
  let cursor = root;
  for (let i = 0; i < tokenPath.length - 1; i += 1) {
    const key = tokenPath[i];
    if (cursor[key] === undefined) cursor[key] = {};
    if (typeof cursor[key] !== "object" || cursor[key] === null) {
      throw new Error(`Token path collision at ${tokenPath.slice(0, i + 1).join(".")}`);
    }
    cursor = cursor[key];
  }
  const leaf = tokenPath[tokenPath.length - 1];
  if (cursor[leaf] !== undefined) {
    throw new Error(`Duplicate token path ${tokenPath.join(".")}`);
  }
  cursor[leaf] = value;
}

function formatTheme({ dictionary }) {
  const theme = {
    colors: {},
    spacing: {},
    borderRadius: {},
    borderWidth: {},
    fontFamily: {},
    fontSize: {},
    lineHeight: {},
  };

  const tokens = [...dictionary.allTokens].sort((a, b) => a.path.join(".").localeCompare(b.path.join(".")));
  for (const token of tokens) {
    const bucket = bucketFor(token);
    if (!bucket) {
      throw new Error(`No theme group for ${token.path.join(".")} (${token.$type})`);
    }
    const value = `var(--${token.name})`;
    // Colors stay nested: Tailwind turns colors.mapped.surface.action into bg-mapped-surface-action.
    // Spacing, radius, border width, and fonts do not. A nested object there never becomes a class,
    // so those use one flat key, the same name as the CSS variable.
    if (bucket === "colors") nest(theme[bucket], token.path, value);
    else theme[bucket][token.name] = value;
  }

  for (const key of Object.keys(theme)) {
    if (Object.keys(theme[key]).length === 0) delete theme[key];
  }

  return (
    "/**\n" +
    " * Generated from tokens/tokens.json.\n" +
    " * The token export changes as UI is built from Figma.\n" +
    " * Do not edit by hand. Run npm run tokens after each new export.\n" +
    " * Desktop font size and line height are included. Shadows, blur, and the dot grid are left out.\n" +
    " */\n" +
    `export default ${JSON.stringify(theme, null, 2)};\n`
  );
}

function ensureLf(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  let next = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!next.endsWith("\n")) next += "\n";
  if (next !== text) fs.writeFileSync(filePath, next);
}

const original = fs.readFileSync(SOURCE, "utf8");
const { tokens, flat, skipped, opacity } = convertTokens(JSON.parse(original));

const sd = new StyleDictionary({
  tokens,
  usesDtcg: true,
  hooks: {
    transforms: {
      "size/pxFromNumber": {
        type: "value",
        filter: (token) => token.$type === "number" && typeof token.$value === "number",
        transform: (token) => `${token.$value}px`,
      },
      "font/quotedString": {
        type: "value",
        filter: (token) =>
          token.$type === "string" && typeof token.$value === "string" && !token.$value.includes("{"),
        transform: (token) => `"${token.$value.replaceAll('"', '\\"')}"`,
      },
    },
    formats: {
      "tailwind/theme": formatTheme,
    },
  },
  platforms: {
    css: {
      transforms: ["name/kebab", "size/pxFromNumber", "font/quotedString"],
      buildPath: "src/styles/",
      files: [
        {
          destination: "tokens.css",
          format: "css/variables",
          options: {
            outputReferences: true,
            fileHeader: () => [
              "Generated from tokens/tokens.json.",
              "The token export changes as UI is built from Figma.",
              "Do not edit by hand. Run npm run tokens after each new export.",
              "Desktop font size and line height are included. Shadows, blur, and the dot grid are left out.",
            ],
          },
        },
      ],
    },
    tailwind: {
      transforms: ["name/kebab"],
      buildPath: "src/styles/",
      files: [
        {
          destination: "tailwind-theme.js",
          format: "tailwind/theme",
        },
      ],
    },
  },
});

await sd.hasInitialized;
await sd.buildAllPlatforms();

const after = fs.readFileSync(SOURCE, "utf8");
if (after !== original) {
  throw new Error("tokens/tokens.json was modified. The build must only read it.");
}

ensureLf(path.join(OUT_DIR, "tokens.css"));
ensureLf(path.join(OUT_DIR, "tailwind-theme.js"));

const css = fs.readFileSync(path.join(OUT_DIR, "tokens.css"), "utf8");
const theme = fs.readFileSync(path.join(OUT_DIR, "tailwind-theme.js"), "utf8");

for (const banned of ["box-shadow", "backdrop-filter", "backdrop-blur", "drop-shadow"]) {
  if (css.includes(banned) || theme.includes(banned)) {
    throw new Error(`Generated files include ${banned}, which this setup leaves out.`);
  }
}

const surfaceDefault = "color-mix(in srgb, var(--alias-cool-neutral-400) 80%, transparent)";
if (!css.includes(surfaceDefault)) {
  throw new Error("mapped.surface.default was not written as an 80% color.");
}

const lookupPath = path.join(ROOT, "docs", "token-lookup.md");
const lookup = writeTokenLookup({ tokens, flat, destination: lookupPath });
ensureLf(lookupPath);
const lookupText = fs.readFileSync(lookupPath, "utf8");
if (lookupText.includes("box-shadow") || lookupText.includes("backdrop")) {
  throw new Error("Token lookup includes a group that should be left out.");
}
if (!lookupText.includes("#F0F5FB / 80%") || !lookupText.includes("`mapped.surface.default`")) {
  throw new Error("Token lookup is missing the 80% surface color.");
}
if (
  !css.includes("--brand-scale-150: 6px") ||
  !css.includes("--brand-scale-700: 28px") ||
  !css.includes("--brand-scale-800: 32px") ||
  !css.includes("--brand-scale-900: 36px") ||
  !css.includes("--brand-scale-1000: 40px") ||
  !css.includes("--brand-scale-1100: 44px") ||
  !css.includes("--brand-scale-1200: 48px")
) {
  throw new Error("Scale 150, 700, 800, 900, 1000, 1100, and 1200 were not written.");
}
if (
  !css.includes("--responsive-desktop-body-sm-size: 12px") ||
  !css.includes("--responsive-desktop-body-sm-line-height: 14.4px") ||
  !css.includes("--responsive-desktop-body-sm-line-height-tight: 12px")
) {
  throw new Error("Desktop body sm was not written.");
}
if (
  !css.includes("--responsive-desktop-body-md-size: 14px") ||
  !css.includes("--responsive-desktop-body-md-line-height: 16.8px") ||
  !css.includes("--responsive-desktop-body-md-line-height-tight: 14px")
) {
  throw new Error("Desktop body md was not written.");
}
if (!css.includes("--responsive-desktop-body-lg-size: 16px") || !css.includes("--responsive-desktop-body-lg-line-height: 19.2px")) {
  throw new Error("Desktop body lg was not written.");
}
if (css.includes("--responsive-desktop-body-lg-line-height-tight")) {
  throw new Error("Desktop body lg has a tight line height this export does not define.");
}
if (!css.includes('--alias-font-family-placeholder: "Open Sans"')) {
  throw new Error("Placeholder font was not written.");
}
if (
  !css.includes("--responsive-desktop-placeholder-lg-size: 16px") ||
  !css.includes("--responsive-desktop-placeholder-line-height: 19.2px")
) {
  throw new Error("Placeholder type was not written.");
}
if (!css.includes("--mapped-text-placeholder: var(--alias-cool-neutral-800)")) {
  throw new Error("Placeholder text color was not written.");
}
if (
  !css.includes("--alias-swatch-neutral-200: color-mix(in srgb, var(--alias-warm-neutral-100) 60%, transparent)") ||
  !css.includes("--alias-swatch-neutral-500: var(--alias-cool-neutral-900)")
) {
  throw new Error("Neutral swatches were not written.");
}
if (!lookupText.includes("`responsive.desktop.body.sm.size`") || !lookupText.includes("`text-responsive-desktop-body-sm-size`")) {
  throw new Error("Token lookup is missing desktop body sm.");
}
if (!lookupText.includes("`responsive.desktop.placeholder.lg.size`") || !lookupText.includes("`mapped.text.placeholder`")) {
  throw new Error("Token lookup is missing placeholder type or color.");
}
if (!lookupText.includes("`alias.swatch.neutral.200`") || !lookupText.includes("`alias.swatch.neutral.500`")) {
  throw new Error("Token lookup is missing the neutral swatches.");
}

const declarations = css.split("\n").filter((line) => line.trim().startsWith("--")).length;
console.log(`Tokens written: ${declarations} CSS variables.`);
console.log(`Lookup: ${lookup.rows.length} rows, ${lookup.duplicates.length} shared values.`);
console.log(`Original file left unchanged: ${SOURCE}`);
console.log(`Skipped (shadow, blur, grid): ${skipped.length ? skipped.join(", ") : "none"}`);
console.log("Opacity fields converted:");
for (const item of opacity) {
  console.log(`  ${item.path}: ${item.opacity}`);
}

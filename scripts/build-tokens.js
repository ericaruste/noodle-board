/**
 * Builds CSS variables and a Tailwind theme from tokens/tokens.json.
 * The export changes as UI is built from Figma. Run `npm run tokens` after
 * each new export. Also writes docs/token-lookup.md.
 * Responsive type sizes are left out until they have real values.
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
  if (last === "font-size") return "fontSize";
  if (last === "line-height") return "lineHeight";
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
    " * Responsive type sizes are left out until they have real values.\n" +
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
const { tokens, flat, responsive, skipped, opacity } = convertTokens(JSON.parse(original));

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
              "Responsive type sizes are left out until they have real values.",
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

for (const banned of ["box-shadow", "backdrop-filter", "backdrop-blur", "drop-shadow", "--responsive-", '"responsive"']) {
  if (css.includes(banned) || theme.includes(banned)) {
    throw new Error(`Generated files include ${banned}, which this setup leaves out.`);
  }
}

const surfaceDefault = "color-mix(in srgb, var(--alias-cool-neutral-400) 30%, transparent)";
if (!css.includes(surfaceDefault)) {
  throw new Error("mapped.surface.default was not written as a 30% color.");
}

const lookupPath = path.join(ROOT, "docs", "token-lookup.md");
const lookup = writeTokenLookup({ tokens, flat, destination: lookupPath });
ensureLf(lookupPath);
const lookupText = fs.readFileSync(lookupPath, "utf8");
if (lookupText.includes("responsive.body") || lookupText.includes("box-shadow") || lookupText.includes("backdrop")) {
  throw new Error("Token lookup includes a group that should be left out.");
}
if (!lookupText.includes("#F0F5FB / 30%") || !lookupText.includes("`mapped.surface.default`")) {
  throw new Error("Token lookup is missing the 30% surface color.");
}

const responsiveAllZero = responsive.length > 0 && responsive.every((token) => token.value === 0);
const declarations = css.split("\n").filter((line) => line.trim().startsWith("--")).length;
console.log(`Tokens written: ${declarations} CSS variables.`);
console.log(`Lookup: ${lookup.rows.length} rows, ${lookup.duplicates.length} shared values.`);
console.log(`Original file left unchanged: ${SOURCE}`);
console.log(`Skipped (shadow, blur, grid, responsive): ${skipped.length ? skipped.join(", ") : "none"}`);
console.log("Opacity fields converted:");
for (const item of opacity) {
  console.log(`  ${item.path}: ${item.opacity}`);
}
console.log("Responsive tokens (left out of CSS and Tailwind):");
for (const token of responsive) {
  console.log(`  ${token.path} = ${token.value}`);
}
console.log(
  responsiveAllZero
    ? "Responsive tokens are all still 0, so they were left out."
    : "Responsive tokens are not all 0. They are still left out until that group is turned back on.",
);

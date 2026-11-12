/**
 * Turns the token-app export into the shape Style Dictionary expects.
 * Reads a parsed object and returns a new one. Never writes tokens.json.
 *
 * The export will change while UI is built from Figma. Re-run `npm run tokens`
 * after each new export so the generated CSS and Tailwind theme stay current.
 *
 * The export wraps each group in an extra "value" object, and some colors
 * carry a separate opacity number (0–100). This unwraps those groups and
 * bakes opacity into the color as a transparent CSS color.
 *
 * Left out of the generated files for now: shadows, blur, the dot grid, and
 * the responsive type group (font size, line height, paragraph spacing).
 */

const SKIP_KEYS = new Set([
  "shadow",
  "shadows",
  "blur",
  "backdrop",
  "backdrop-blur",
  "grid",
  "dot-grid",
  "drop-shadow",
  "responsive",
]);

function isToken(node) {
  return !!node && typeof node === "object" && !Array.isArray(node) && "$value" in node;
}

function shouldSkipKey(key) {
  return SKIP_KEYS.has(String(key).toLowerCase());
}

function shouldSkipToken(token) {
  const type = String(token.$type ?? "").toLowerCase();
  return type === "shadow" || type === "blur" || type === "backdrop";
}

function applyOpacity(token, trail, report) {
  const next = { $type: token.$type, $value: token.$value };
  if (token.$description) next.$description = token.$description;

  if (next.$type !== "color" || token.opacity === undefined) return next;

  const opacity = Number(token.opacity);
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 100) {
    throw new Error(`${trail.join(".")} has an opacity of ${token.opacity}. Expected a number from 0 to 100.`);
  }

  report.opacity.push({ path: trail.join("."), opacity });

  if (opacity < 100) {
    next.$value = `color-mix(in srgb, ${token.$value} ${opacity}%, transparent)`;
  }

  return next;
}

function unwrap(node, trail, report) {
  if (isToken(node)) {
    if (shouldSkipToken(node)) {
      report.skipped.push(trail.join("."));
      return undefined;
    }
    return applyOpacity(node, trail, report);
  }

  if (!node || typeof node !== "object" || Array.isArray(node)) return node;

  const keys = Object.keys(node);
  if (
    keys.length === 1 &&
    keys[0] === "value" &&
    node.value &&
    typeof node.value === "object" &&
    !isToken(node.value)
  ) {
    return unwrap(node.value, trail, report);
  }

  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (shouldSkipKey(key)) {
      report.skipped.push([...trail, key].join("."));
      continue;
    }
    const child = unwrap(value, [...trail, key], report);
    if (child !== undefined) out[key] = child;
  }
  return out;
}

function collect(node, trail, acc) {
  if (isToken(node)) {
    acc.push({ path: trail.join("."), type: node.$type, value: node.$value });
    return;
  }
  if (!node || typeof node !== "object") return;
  for (const [key, value] of Object.entries(node)) {
    collect(value, [...trail, key], acc);
  }
}

function collectGroup(node, trail, acc) {
  if (isToken(node)) {
    acc.push({ path: trail.join("."), type: node.$type, value: node.$value });
    return;
  }
  if (!node || typeof node !== "object" || Array.isArray(node)) return;
  const keys = Object.keys(node);
  if (keys.length === 1 && keys[0] === "value" && node.value && typeof node.value === "object" && !isToken(node.value)) {
    collectGroup(node.value, trail, acc);
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    collectGroup(value, [...trail, key], acc);
  }
}

export function convertTokens(raw) {
  const report = { skipped: [], opacity: [] };
  const tokens = unwrap(raw, [], report);
  const flat = [];
  collect(tokens, [], flat);
  const responsive = [];
  if (raw.responsive) collectGroup(raw.responsive, ["responsive"], responsive);
  return { tokens, flat, responsive, skipped: report.skipped, opacity: report.opacity };
}

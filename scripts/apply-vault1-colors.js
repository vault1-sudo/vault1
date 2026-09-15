#!/usr/bin/env node
/**
 * Vault1 COLOR codemod.
 *
 * Sweeps every quoted hex color string this app is known to use
 * (established from converting login.tsx, dashboard.tsx,
 * VaultSurface, VaultMetric, VaultSidebar by hand) and swaps it
 * for the matching COLORS.* token from your shared theme.
 *
 * Matches ANY quoted hex string in the file — StyleSheet values,
 * LinearGradient `colors={[...]}` arrays, everything — not just
 * `color:`/`backgroundColor:` keys. Unknown hex values are left
 * completely untouched and reported at the end so you can review
 * them by hand.
 *
 * SAFETY NOTE: this maps by exact hex value, not by context. If a
 * hex happens to mean two different things in two different files
 * (rare, but possible on pages I haven't seen), one of those spots
 * may end up looking slightly off. Worth a visual pass after running.
 *
 * USAGE:
 *   node scripts/apply-vault1-colors.js ./app/theme/theme.ts ./app
 *   node scripts/apply-vault1-colors.js ./app/theme/theme.ts ./components
 *
 * Run it once per top-level folder you want swept (e.g. once for
 * ./app, once for ./components) so every screen and shared
 * component gets covered.
 */

const fs = require("fs");
const path = require("path");

const THEME_FILE = path.resolve(process.argv[2] || "./app/theme/theme.ts");
const TARGET_DIR = path.resolve(process.argv[3] || "./app");

if (!fs.existsSync(THEME_FILE)) {
  console.error(`Theme file not found at ${THEME_FILE}`);
  console.error(`Pass its real path as the first argument.`);
  process.exit(1);
}

// hex (no #, uppercase) -> replacement JS expression (as text)
// Expressions starting with "COLORS." are inserted bare;
// anything else (a literal like "#0A9A63" or an rgba string)
// is inserted back inside quotes.
const HEX_MAP = {
  // light surfaces / backgrounds
  "FFFFFF": "COLORS.glassBg",
  "FAFAF9": "COLORS.glassBgSoft",
  "F3F3F1": '"rgba(255,255,255,0.06)"',
  "F3F0FB": '"rgba(15,190,122,0.10)"',
  "F0EBFA": '"rgba(15,190,122,0.12)"',

  // borders / dividers
  "E5E5E2": "COLORS.glassBorder",
  "EAEAE7": "COLORS.navyLine",
  "DDD4F2": "COLORS.glassBorder",
  "30224A": "COLORS.glassBorder",
  "2C2144": "COLORS.glassBorder",
  "222222": "COLORS.navyLine",
  "242424": "COLORS.navyLine",
  "252525": "COLORS.navyLine",
  "191919": "COLORS.navyLine",

  // purple/violet brand family -> teal/blue
  "9A6BFF": "COLORS.bull",
  "6C3BE6": '"#0A9A63"',
  "4B22A7": '"#0A9A63"',
  "7550C7": "COLORS.bull",
  "8D5CFF": "COLORS.bull",
  "B49AFF": "COLORS.bull",
  "7047C4": "COLORS.bull",
  "AA8CFF": "COLORS.accentBlue",
  "7050B7": "COLORS.bull",
  "8F69DE": "COLORS.bull",
  "9B70F7": "COLORS.bull",
  "9E7AE8": "COLORS.bull",
  "8D62DD": "COLORS.bull",
  "6D45D8": "COLORS.bull",
  "4E2AA8": "COLORS.ink",
  "5A35B5": "COLORS.bull",
  "21864B": "COLORS.bull",

  // text greys (dark-on-light originally) -> light-on-dark tokens
  "111111": "COLORS.ink",
  "F5F5F5": "COLORS.ink",
  "696969": "COLORS.muted",
  "505050": "COLORS.muted",
  "666666": "COLORS.muted",
  "5E5E5E": "COLORS.muted",
  "EEEEEE": "COLORS.ink",
  "454545": "COLORS.muted",
  "F0F0F0": "COLORS.ink",
  "555555": "COLORS.muted",
  "E8E8E8": "COLORS.ink",
  "DCDCDC": "COLORS.ink",
  "5A5A5A": "COLORS.muted",
  "CFCFCF": "COLORS.ink",
  "3E3E3E": "COLORS.muted",
  "343434": "COLORS.muted",
  "4D4D4D": "COLORS.muted",
  "5F5F5B": "COLORS.muted",
  "858581": "COLORS.muted",
  "A0A09B": "COLORS.muted",
  "C9C9C5": "COLORS.navyLine",
  "D0D0CC": "COLORS.navyLine",
};

// known rgba(...) literals used in gradients — matched as plain substrings
const RGBA_MAP = {
  "rgba(123,72,255,0.18)": "COLORS.glowTeal",
  "rgba(72,34,155,0.06)": "COLORS.glowBlue",
};

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(tsx|ts)$/.test(entry.name) && full !== THEME_FILE) files.push(full);
  }
  return files;
}

function importPathFor(file) {
  let rel = path.relative(path.dirname(file), THEME_FILE).replace(/\.tsx?$/, "");
  if (!rel.startsWith(".")) rel = "./" + rel;
  return rel.split(path.sep).join("/");
}

function ensureColorsImport(src, file) {
  const importPath = importPathFor(file);
  const existing = new RegExp(
    `import\\s*{([^}]*)}\\s*from\\s*["']${importPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'];?`
  );
  const match = src.match(existing);

  if (match) {
    if (/\bCOLORS\b/.test(match[1])) return src; // already imported
    const newNamed = match[1].trim().length
      ? `${match[1].trim()}, COLORS`
      : `COLORS`;
    return src.replace(existing, `import { ${newNamed} } from "${importPath}";`);
  }

  const importLine = `import { COLORS } from "${importPath}";\n`;
  const lastImportMatch = [...src.matchAll(/^import .*;\s*$/gm)].pop();
  if (lastImportMatch) {
    const idx = lastImportMatch.index + lastImportMatch[0].length;
    return src.slice(0, idx) + "\n" + importLine + src.slice(idx);
  }
  return importLine + src;
}

function processFile(file) {
  let src = fs.readFileSync(file, "utf8");
  let changed = false;
  const unmapped = new Set();

  // quoted hex strings, anywhere
  src = src.replace(/(["'])#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\1/g, (match, quote, hex) => {
    const key = hex.toUpperCase();
    const replacement = HEX_MAP[key];
    if (!replacement) {
      unmapped.add("#" + hex);
      return match;
    }
    changed = true;
    return replacement;
  });

  // known rgba(...) literals inside quotes
  for (const [rgba, token] of Object.entries(RGBA_MAP)) {
    const re = new RegExp(`["']${rgba.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`, "g");
    if (re.test(src)) {
      src = src.replace(re, token);
      changed = true;
    }
  }

  if (!changed) {
    if (unmapped.size) {
      console.log(`unmapped only: ${path.relative(process.cwd(), file)} -> ${[...unmapped].join(", ")}`);
    }
    return;
  }

  src = ensureColorsImport(src, file);

  fs.writeFileSync(file, src, "utf8");
  const note = unmapped.size ? `  (unmapped: ${[...unmapped].join(", ")})` : "";
  console.log(`updated: ${path.relative(process.cwd(), file)}${note}`);
}

const files = walk(TARGET_DIR);
files.forEach(processFile);
console.log(`\nDone — scanned ${files.length} files under ${path.relative(process.cwd(), TARGET_DIR) || "."}.`);

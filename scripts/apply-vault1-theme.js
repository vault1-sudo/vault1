#!/usr/bin/env node
/**
 * Vault1 font codemod.
 * Scans every .tsx/.ts file under TARGET_DIR and swaps
 * `fontWeight: "800"` style declarations for the matching
 * `fontFamily: FONT.extraBold` from your shared theme.
 *
 * Safe by design: it only touches style-object syntax
 * (`fontWeight: "NNN"`), never JSX structure, props, imports
 * of anything else, or logic — so no screen's behavior changes.
 *
 * USAGE:
 *   node apply-vault1-theme.js <path-to-theme.ts> <target-dir>
 *
 * EXAMPLE:
 *   node apply-vault1-theme.js ./app/theme/theme.ts ./app
 *
 * Run it from your project root. It computes the correct
 * relative import path for every file automatically, no
 * matter how deep it lives in your folder structure.
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

const WEIGHT_MAP = {
  "100": "thin",
  "200": "extraLight",
  "300": "light",
  "400": "regular",
  "500": "medium",
  "600": "semiBold",
  "700": "bold",
  "800": "extraBold",
  "900": "black",
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

function processFile(file) {
  let src = fs.readFileSync(file, "utf8");
  let changed = false;

  src = src.replace(/fontWeight:\s*["'](\d{3})["'],?/g, (match, weight) => {
    const key = WEIGHT_MAP[weight];
    if (!key) return match; // unrecognized weight — leave it alone
    changed = true;
    return `fontFamily: FONT.${key},`;
  });

  if (!changed) return;

  const alreadyImported = new RegExp(
    `import\\s*{[^}]*\\bFONT\\b[^}]*}\\s*from\\s*["']${importPathFor(file).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`
  ).test(src);

  if (!alreadyImported) {
    const importLine = `import { FONT } from "${importPathFor(file)}";\n`;
    const lastImportMatch = [...src.matchAll(/^import .*;\s*$/gm)].pop();
    if (lastImportMatch) {
      const idx = lastImportMatch.index + lastImportMatch[0].length;
      src = src.slice(0, idx) + "\n" + importLine + src.slice(idx);
    } else {
      src = importLine + src;
    }
  }

  fs.writeFileSync(file, src, "utf8");
  console.log("updated:", path.relative(process.cwd(), file));
}

const files = walk(TARGET_DIR);
files.forEach(processFile);
console.log(`\nDone — scanned ${files.length} files under ${path.relative(process.cwd(), TARGET_DIR) || "."}.`);

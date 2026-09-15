#!/usr/bin/env node
/**
 * Fixes JSX attributes broken by apply-vault1-colors.js.
 *
 * That script correctly turned `color: "#8B5CF6"` into
 * `color: COLORS.bull` inside style objects (valid — no braces
 * needed there). But where a hex was passed directly as a JSX
 * attribute, e.g. `<Icon color="#8B5CF6" />`, the same swap
 * produced `color=COLORS.bull` — invalid, because JSX attributes
 * need `{}` around a JS expression: `color={COLORS.bull}`.
 *
 * This script finds every `=COLORS.xxx` that's missing its
 * braces and wraps it. It does NOT touch anything already
 * correct (`={COLORS.xxx}` has a brace right after `=`, so the
 * pattern below won't match it), and it does not touch style
 * object properties (those use `:` not `=`, so they were never
 * broken and are left alone).
 *
 * USAGE:
 *   node scripts/fix-vault1-jsx-colors.js ./app
 *   node scripts/fix-vault1-jsx-colors.js ./components
 */

const fs = require("fs");
const path = require("path");

const TARGET_DIR = path.resolve(process.argv[2] || "./app");

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(tsx|ts)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function processFile(file) {
  let src = fs.readFileSync(file, "utf8");
  let count = 0;

  // Matches e.g. `color=COLORS.bull` (an identifier char right
  // before `=`, then COLORS.xxx immediately after, no brace or
  // quote) and rewrites it to `color={COLORS.bull}`.
  src = src.replace(
    /([a-zA-Z0-9_-])=(COLORS\.[A-Za-z]+)/g,
    (match, prevChar, expr) => {
      count++;
      return `${prevChar}={${expr}}`;
    }
  );

  if (count === 0) return;

  fs.writeFileSync(file, src, "utf8");
  console.log(`fixed ${count}: ${path.relative(process.cwd(), file)}`);
}

const files = walk(TARGET_DIR);
files.forEach(processFile);
console.log(`\nDone — scanned ${files.length} files under ${path.relative(process.cwd(), TARGET_DIR) || "."}.`);

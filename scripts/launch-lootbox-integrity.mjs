import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const GAMES_DIR = path.join(ROOT, 'games');

const blockers = [];
const warnings = [];

function addBlocker(message) {
  blockers.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, acc);
      continue;
    }
    acc.push(full);
  }
  return acc;
}

function toRel(abs) {
  return path.relative(ROOT, abs).replace(/\\/g, '/');
}

function hasLootboxHook(jsPath) {
  try {
    const src = fs.readFileSync(jsPath, 'utf8');
    return /EonLootbox\./.test(src);
  } catch {
    return false;
  }
}

function resolveGameHtml(jsPath) {
  const dir = path.dirname(jsPath);
  const base = path.basename(jsPath, '.js');

  const indexCandidate = path.join(dir, 'index.html');
  if (fs.existsSync(indexCandidate)) {
    return indexCandidate;
  }

  const siblingCandidate = path.join(dir, `${base}.html`);
  if (fs.existsSync(siblingCandidate)) {
    return siblingCandidate;
  }

  const parentByDirName = path.join(path.dirname(dir), `${path.basename(dir)}.html`);
  if (fs.existsSync(parentByDirName)) {
    return parentByDirName;
  }

  // Walk up toward games root to resolve nested modules like src/eon/integration.js
  let cursor = dir;
  while (cursor.startsWith(GAMES_DIR)) {
    const nestedIndex = path.join(cursor, 'index.html');
    if (fs.existsSync(nestedIndex)) {
      return nestedIndex;
    }

    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }

  return null;
}

function checkGameHtml(htmlPath, sourceJsPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const htmlRel = toRel(htmlPath);
  const jsRel = toRel(sourceJsPath);

  if (!/<script[^>]+src=["']\/assets\/js\/games\/game-shell\.js["']/i.test(html)) {
    addBlocker(`[${htmlRel}] Missing game-shell bootstrap script for lootbox runtime (required by ${jsRel}).`);
  }

  if (!/<body[^>]*data-page-type=["']game["']/i.test(html)) {
    addBlocker(`[${htmlRel}] Missing body data-page-type="game" (required by ${jsRel}).`);
  }

  if (!/<body[^>]*data-game-shell-rewards=["']immediate["']/i.test(html)) {
    addWarning(`[${htmlRel}] Missing data-game-shell-rewards="immediate"; reward scripts may initialize too late for ${jsRel}.`);
  }
}

const allFiles = walk(GAMES_DIR);
const gameJsFiles = allFiles.filter((file) => file.endsWith('.js'));
const lootboxJsFiles = gameJsFiles.filter(hasLootboxHook);

if (lootboxJsFiles.length === 0) {
  addWarning('No game files with EonLootbox hooks detected.');
}

for (const jsFile of lootboxJsFiles) {
  const htmlPath = resolveGameHtml(jsFile);
  if (!htmlPath) {
    addWarning(`[${toRel(jsFile)}] Could not resolve corresponding game HTML shell.`);
    continue;
  }
  checkGameHtml(htmlPath, jsFile);
}

console.log('EONAPP.CH Lootbox Integrity Gate');
console.log('===============================');
console.log(`Lootbox hook files: ${lootboxJsFiles.length}`);
console.log(`Blockers: ${blockers.length}`);
console.log(`Warnings: ${warnings.length}`);

if (blockers.length > 0) {
  console.log('\nBlockers:');
  for (const b of blockers) {
    console.log(`- ${b}`);
  }
}

if (warnings.length > 0) {
  console.log('\nWarnings:');
  for (const w of warnings) {
    console.log(`- ${w}`);
  }
}

if (blockers.length > 0) {
  process.exit(1);
}

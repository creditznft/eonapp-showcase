#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const htmlFiles = [];
for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (entry.isFile() && /\.html$/.test(entry.name)) htmlFiles.push(path.join(root, entry.name));
}
const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.html$/.test(entry.name)) htmlFiles.push(full);
  }
};
for (const dir of ['tools', 'games', 'blog', 'campaigns']) walk(path.join(root, dir));

const keys = new Map();
for (const file of htmlFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/data-i18n-key=["']([^"']+)["']/g)) {
    const key = match[1];
    if (!keys.has(key)) keys.set(key, []);
    keys.get(key).push(path.relative(root, file));
  }
}

const mlPath = path.join(root, 'assets/js/utils/multi-language.js');
const completionPath = path.join(root, 'assets/js/utils/i18n-w102-completion-packs.js');
const ml = fs.readFileSync(mlPath, 'utf8') + '\n' + (fs.existsSync(completionPath) ? fs.readFileSync(completionPath, 'utf8') : '');
const coveredKeys = new Set();
for (const match of ml.matchAll(/["']([^"']+)["']\s*:/g)) coveredKeys.add(match[1]);

const missing = [];
for (const [key, files] of keys.entries()) {
  if (!coveredKeys.has(key)) missing.push({ key, files: [...new Set(files)].slice(0, 5) });
}

const w24Block = ml.match(/const W24_W27_GERMAN_HINDI_COPY\s*=\s*\{([\s\S]*?)\n\};/);
const w24GermanKeys = [];
const w24HindiKeys = [];
if (w24Block) {
  const text = w24Block[1];
  const de = text.match(/de:\s*\{([\s\S]*?)\n\s*\},\s*\n\s*hi:/);
  const hi = text.match(/hi:\s*\{([\s\S]*?)\n\s*\}/);
  for (const match of (de?.[1] || '').matchAll(/["']([^"']+)["']\s*:/g)) w24GermanKeys.push(match[1]);
  for (const match of (hi?.[1] || '').matchAll(/["']([^"']+)["']\s*:/g)) w24HindiKeys.push(match[1]);
}

const result = {
  ok: true,
  htmlFiles: htmlFiles.length,
  uniqueStaticKeys: keys.size,
  coveredByAnyPack: keys.size - missing.length,
  missingCount: missing.length,
  missing: missing.slice(0, 100),
  germanHindiExpansion: {
    present: Boolean(w24Block),
    germanKeys: w24GermanKeys.length,
    hindiKeys: w24HindiKeys.length,
    sample: w24GermanKeys.slice(0, 8)
  },
  note: 'Scanner checks static data-i18n-key coverage and verifies the W24-W27 German/Hindi expansion block. Dynamic AI text can still remain English until translation runtime is connected.'
};

console.log(JSON.stringify(result, null, 2));
if (!result.uniqueStaticKeys || result.missingCount) process.exit(1);

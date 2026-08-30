#!/usr/bin/env node
/**
 * W239 — public output quarantine gate.
 *
 * Historical nested Tools and Games documents are retained as source/audit
 * material only. A production build must not emit them as reachable assets;
 * Cloudflare redirects converge those URLs to the current product surfaces.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const redirects = path.join(root, '_redirects');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

assert(fs.existsSync(dist), 'dist/ is missing; run npm run build before the W239 output gate.');
assert(fs.existsSync(redirects), '_redirects is missing; run npm run routes:sync before the W239 output gate.');

if (fs.existsSync(redirects)) {
  const text = fs.readFileSync(redirects, 'utf8').replace(/\r\n/g, '\n');
  assert(/(^|\n)\/tools\/\*\s+\/workspace\s+301(?:\n|$)/.test(text), 'missing /tools/* -> /workspace 301 retirement redirect.');
  assert(/(^|\n)\/games\/\*\s+\/archive\s+301(?:\n|$)/.test(text), 'missing /games/* -> /archive 301 retirement redirect.');
}

if (fs.existsSync(dist)) {
  for (const relative of ['tools', 'games']) {
    assert(!fs.existsSync(path.join(dist, relative)), `dist/${relative}/ must not be emitted by a current production build.`);
  }

  const forbiddenHtml = [
    'tools/archetype-scan.html',
    'tools/creator-workspace.html',
    'tools/dream-interpreter.html',
    'games/cyber-rogue/index.html',
    'games/realm-wars-lite/index.html'
  ];
  for (const relative of forbiddenHtml) {
    assert(!fs.existsSync(path.join(dist, relative)), `forbidden retired output exists: dist/${relative}`);
  }
}

if (failures.length) {
  console.error('[W239] FAIL: public output quarantine gate');
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log('[W239] PASS: nested legacy Tools and Games are redirect-only and absent from dist/.');

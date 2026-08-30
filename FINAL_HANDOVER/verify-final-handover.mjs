#!/usr/bin/env node
/** Final handover manifest verifier. No dependency install required. */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';

const root = resolve(process.cwd());
const manifest = resolve(root, 'SOURCE_SHA256_MANIFEST_W250_W290_FINAL_CODEX54_2026-06-25.txt');
if (!existsSync(manifest)) {
  console.error(JSON.stringify({ ok: false, error: 'Manifest not found', manifest }, null, 2));
  process.exit(1);
}
const lines = readFileSync(manifest, 'utf8').split(/\r?\n/).filter(Boolean);
const errors = [];
let checked = 0;
for (const line of lines) {
  const match = line.match(/^([a-f0-9]{64})  (.+)$/);
  if (!match) { errors.push(`Malformed manifest line: ${line}`); continue; }
  const [, expected, portable] = match;
  const candidate = resolve(root, ...portable.split('/'));
  const rel = relative(root, candidate);
  if (rel.startsWith('..') || rel.split(sep).includes('..')) { errors.push(`Unsafe path: ${portable}`); continue; }
  if (!existsSync(candidate) || !statSync(candidate).isFile()) { errors.push(`Missing file: ${portable}`); continue; }
  const actual = createHash('sha256').update(readFileSync(candidate)).digest('hex');
  if (actual !== expected) errors.push(`Hash mismatch: ${portable}`);
  checked += 1;
}
console.log(JSON.stringify({
  schema: 'eonapp.final-handover-manifest.v1',
  ok: errors.length === 0,
  root,
  manifest: 'SOURCE_SHA256_MANIFEST_W250_W290_FINAL_CODEX54_2026-06-25.txt',
  checked,
  errors
}, null, 2));
process.exit(errors.length ? 1 : 0);

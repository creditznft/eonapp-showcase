#!/usr/bin/env node
/**
 * W759: a Pages payload is valid only when every local script/module/preload
 * edge resolves inside the emitted directory. This catches a partially copied
 * Vite chunk before the candidate can be uploaded.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.resolve(root, process.argv[2] || 'dist');
const failures = [];
const visited = new Set();
const edges = [];

function localReference(value) {
  const raw = String(value || '').trim();
  if (!raw || raw.startsWith('#') || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(raw)) return null;
  return raw.split(/[?#]/, 1)[0] || null;
}

function resolveOutput(from, reference) {
  const clean = localReference(reference);
  if (!clean) return null;
  const target = clean.startsWith('/')
    ? path.resolve(dist, `.${clean}`)
    : path.resolve(path.dirname(from), clean);
  if (target !== dist && !target.startsWith(`${dist}${path.sep}`)) return { error: 'path-escape', target };
  return { target };
}

function assertOutput(from, reference, kind) {
  if (kind === 'module-import' && !/^(?:\.{1,2}\/|\/)/.test(String(reference || ''))) return;
  const resolved = resolveOutput(from, reference);
  if (!resolved) return;
  if (resolved.error || !fs.existsSync(resolved.target)) {
    failures.push({ from: path.relative(dist, from).replaceAll('\\', '/'), reference, kind, reason: resolved.error || 'missing-output' });
    return;
  }
  edges.push({ from: path.relative(dist, from).replaceAll('\\', '/'), to: path.relative(dist, resolved.target).replaceAll('\\', '/'), kind });
  visit(resolved.target);
}

function visit(file) {
  if (visited.has(file) || !fs.statSync(file).isFile()) return;
  visited.add(file);
  const extension = path.extname(file).toLowerCase();
  if (!['.html', '.js', '.mjs', '.css'].includes(extension)) return;
  const source = fs.readFileSync(file, 'utf8');
  if (extension === '.html') {
    for (const match of source.matchAll(/<(script|link)\b[^>]*\b(?:src|href)=["']([^"']+)["'][^>]*>/gi)) {
      const tag = match[0];
      if (match[1].toLowerCase() === 'script' || /\brel=["']modulepreload["']/i.test(tag)) assertOutput(file, match[2], 'html-module');
    }
  }
  if (extension === '.js' || extension === '.mjs') {
    for (const match of source.matchAll(/\bfrom\s*["']([^"']+)["']|(?:^|[;{}(),=\s])import\s*["']([^"']+)["']|(?:^|[;{}(),=\s])import\s*\(\s*["']([^"']+)["']/gm)) {
      assertOutput(file, match[1] || match[2] || match[3], 'module-import');
    }
  }
  if (extension === '.css') {
    for (const match of source.matchAll(/@import\s+(?:url\()?\s*["']([^"']+)["']/g)) assertOutput(file, match[1], 'css-import');
  }
}

if (!fs.existsSync(dist) || !fs.statSync(dist).isDirectory()) throw new Error(`W759 asset graph requires a dist directory: ${dist}`);
for (const entry of fs.readdirSync(dist, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.html')) visit(path.join(dist, entry.name));
}
const sw = path.join(dist, 'sw.js');
if (fs.existsSync(sw)) {
  const source = fs.readFileSync(sw, 'utf8');
  for (const list of source.matchAll(/\b(?:PRECACHE|CRITICAL_PRECACHE)\b[\s\S]{0,180}?\[([\s\S]*?)\]/g)) {
    for (const match of list[1].matchAll(/['"](\/assets\/[^'"]+)['"]/g)) assertOutput(sw, match[1], 'service-worker-asset');
  }
}
if (failures.length) {
  console.error(JSON.stringify({ ok: false, dist, failures }, null, 2));
  process.exitCode = 1;
} else {
  console.log(`W759 asset graph PASS — ${visited.size} emitted nodes / ${edges.length} verified local edges`);
}

#!/usr/bin/env node
/**
 * W592 operator-only evidence secret audit.
 *
 * Scans a local evidence folder for exact values from .env.local without ever
 * printing values or writing them into the report. This is meant to run after
 * a live AI/gameplay proof and before any evidence leaves the owner machine.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);
const option = (name, fallback = '') => {
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1] && !args[index + 1].startsWith('--')) return args[index + 1];
  const inline = args.find((entry) => entry.startsWith(`${name}=`));
  return inline ? inline.slice(name.length + 1) : fallback;
};
const confirm = process.env.EON_EVIDENCE_SECRET_AUDIT === '1' && args.includes('--confirm-local');
const root = path.resolve(option('--directory', 'reports'));
const envPath = path.resolve(option('--env', '.env.local'));
const maxBytes = Math.max(1_024, Math.min(8 * 1024 * 1024, Number(option('--max-bytes', '1048576')) || 1_048_576));
const ignoredDirs = new Set(['node_modules', '.git', 'dist', 'coverage']);
const safeKey = /^[A-Z][A-Z0-9_]{2,}$/;

function readSecrets() {
  if (!fs.existsSync(envPath)) return [];
  const values = [];
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || !safeKey.test(match[1])) continue;
    let value = String(match[2] || '').trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (value.length >= 8 && !/^(replace_me|your_|optional|test|demo|todo)/i.test(value)) values.push(Object.freeze({ key: match[1], value }));
  }
  return values;
}

function filesWithin(directory) {
  const files = [];
  const walk = (current) => {
    let entries = [];
    try { entries = fs.readdirSync(current, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!ignoredDirs.has(entry.name)) walk(path.join(current, entry.name));
      } else if (entry.isFile()) files.push(path.join(current, entry.name));
    }
  };
  walk(directory);
  return files;
}

function main() {
  if (!confirm) {
    const blocked = Object.freeze({ schema: 'eonapp.w592.evidence-secret-audit.v1', status: 'BLOCKED', reason: 'Set EON_EVIDENCE_SECRET_AUDIT=1 and pass --confirm-local. No file or .env.local value was read.', secretValuesPersisted: false });
    console.log(JSON.stringify(blocked, null, 2));
    return;
  }
  const secrets = readSecrets();
  if (!fs.existsSync(root)) {
    console.log(JSON.stringify({ schema: 'eonapp.w592.evidence-secret-audit.v1', status: 'BLOCKED', reason: 'evidence-directory-not-found', directory: root, keyCount: secrets.length, secretValuesPersisted: false }, null, 2));
    process.exitCode = 1;
    return;
  }
  const matches = [];
  let scanned = 0;
  let skippedLarge = 0;
  for (const filename of filesWithin(root)) {
    let stat;
    try { stat = fs.statSync(filename); } catch { continue; }
    if (stat.size > maxBytes) { skippedLarge += 1; continue; }
    let content;
    try { content = fs.readFileSync(filename, 'utf8'); } catch { continue; }
    scanned += 1;
    const matchedKeys = secrets.filter((secret) => content.includes(secret.value)).map((secret) => secret.key);
    if (matchedKeys.length) matches.push(Object.freeze({ file: path.relative(process.cwd(), filename).replaceAll(path.sep, '/'), matchedKeys }));
  }
  const result = Object.freeze({
    schema: 'eonapp.w592.evidence-secret-audit.v1',
    status: matches.length ? 'FAIL' : 'PASS',
    directory: path.relative(process.cwd(), root).replaceAll(path.sep, '/') || '.',
    keyCount: secrets.length,
    filesScanned: scanned,
    filesSkippedLarge: skippedLarge,
    matches,
    secretValuesPersisted: false,
    note: 'Only file paths and environment variable names are reported. Secret values are never printed or written.'
  });
  console.log(JSON.stringify(result, null, 2));
  if (matches.length) process.exitCode = 1;
}
main();

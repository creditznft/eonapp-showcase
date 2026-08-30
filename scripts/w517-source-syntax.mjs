#!/usr/bin/env node
/** W517 canonical portable-source JavaScript parse gate. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { sourceIdentityFiles } from './w517-source-convergence.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VALID_EXTENSIONS = new Set(['.js', '.mjs', '.cjs']);
const EXCLUDED_PREFIXES = ['node_modules/', 'dist/', 'tmp/', '.git/', 'playwright-report/', 'test-results/'];

function canonicalSourceFiles(root) {
  return sourceIdentityFiles({ root }).map((file) => file.replaceAll('\\', '/'));
}

function parseFile(relative) {
  const source = fs.readFileSync(path.join(ROOT, relative), 'utf8');
  const filename = path.join(ROOT, relative);
  if (path.extname(relative) === '.cjs') {
    new vm.Script(source, { filename });
    return;
  }
  try {
    new vm.SourceTextModule(source, { identifier: filename });
  } catch (moduleError) {
    // Plain classic scripts are valid tracked JavaScript too; only accept this fallback when it parses cleanly.
    try {
      new vm.Script(source, { filename });
    } catch {
      throw moduleError;
    }
  }
}

const files = canonicalSourceFiles(ROOT)
  .filter((file) => VALID_EXTENSIONS.has(path.extname(file)) && !EXCLUDED_PREFIXES.some((prefix) => file.startsWith(prefix)))
  .sort();
const failures = [];
for (const relative of files) {
  try {
    parseFile(relative);
  } catch (error) {
    failures.push({ file: relative, stderr: String(error?.stack || error?.message || error) });
  }
}

if (failures.length) {
  console.error(JSON.stringify({ schema: 'eonapp.w517.source-syntax.v1', ok: false, checkedFiles: files.length, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ schema: 'eonapp.w517.source-syntax.v1', ok: true, checkedFiles: files.length, parser: 'node-vm-source-text-module', nullifier: 'no evaluation', }, null, 2));

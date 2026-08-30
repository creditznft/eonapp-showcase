#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] === 'dist' ? 'dist' : 'source';
const base = mode === 'dist' ? path.join(ROOT, 'dist') : ROOT;

const contracts = [
  {
    id: 'continue-card',
    source: path.join(ROOT, 'assets/js/retention/eon-continue-surface.js'),
    publicPath: '/assets/css/eon-continue.css',
    file: path.join(base, 'assets/css/eon-continue.css'),
    selector: '.eon-continue-card'
  },
  {
    id: 'nexus-living-core',
    source: path.join(ROOT, 'assets/js/nexus/eon-nexus-living-core.js'),
    publicPath: '/assets/css/eon-nexus-living-core.css',
    file: path.join(base, 'assets/css/eon-nexus-living-core.css'),
    selector: '.eon-nexus-living-core'
  }
];

const failures = [];
for (const contract of contracts) {
  if (!fs.existsSync(contract.source)) {
    failures.push(`${contract.id}:source-missing`);
    continue;
  }
  const source = fs.readFileSync(contract.source, 'utf8');
  if (!source.includes(contract.publicPath)) failures.push(`${contract.id}:runtime-reference-missing`);
  if (!fs.existsSync(contract.file)) {
    failures.push(`${contract.id}:${mode}-stylesheet-missing`);
    continue;
  }
  const stylesheet = fs.readFileSync(contract.file, 'utf8');
  if (!stylesheet.trim()) failures.push(`${contract.id}:${mode}-stylesheet-empty`);
  if (!stylesheet.includes(contract.selector)) failures.push(`${contract.id}:${mode}-selector-missing`);
  if (/^\s*<!doctype html/i.test(stylesheet) || /<title>[^<]*404/i.test(stylesheet)) failures.push(`${contract.id}:${mode}-stylesheet-is-html`);
}

if (mode === 'source') {
  const syncScript = fs.readFileSync(path.join(ROOT, 'scripts/sync-public-assets.mjs'), 'utf8');
  for (const contract of contracts) {
    const relative = contract.publicPath.replace(/^\//, '');
    if (!syncScript.includes(`['${relative}', '${relative}']`)) failures.push(`${contract.id}:sync-contract-missing`);
  }
}

const receipt = Object.freeze({
  schema: 'eonapp.w663.production-exposure-gate.v1',
  ok: failures.length === 0,
  mode,
  checked: contracts.map(({ id, publicPath, selector }) => ({ id, publicPath, selector })),
  failures
});

console.log(JSON.stringify(receipt, null, 2));
if (failures.length) process.exit(1);

#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRelative = 'config/w700-source-reconciliation-manifest.json';
const output = path.join(root, outputRelative);
const excluded = new Set([outputRelative]);
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' })
  .split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean)
  .filter((entry) => !excluded.has(entry) && !entry.startsWith('node_modules/') && !entry.startsWith('dist/') && !entry.startsWith('reports/') && !entry.startsWith('test-results/') && !entry.startsWith('playwright-report/'))
  .filter((entry) => fs.existsSync(path.join(root, entry)) && fs.statSync(path.join(root, entry)).isFile())
  .sort();
const aggregate = crypto.createHash('sha256');
let totalBytes = 0;
const records = files.map((relative) => {
  const body = fs.readFileSync(path.join(root, relative));
  const sha256 = crypto.createHash('sha256').update(body).digest('hex');
  totalBytes += body.length;
  aggregate.update(`${relative}\0${body.length}\0${sha256}\n`);
  return Object.freeze({ path: relative, bytes: body.length, sha256 });
});
const manifest = {
  schema: 'eonapp.source-reconciliation.w700.v1',
  currentWave: 'W700',
  generatedAt: new Date().toISOString(),
  sourceFileCount: records.length,
  totalBytes,
  aggregateSha256: aggregate.digest('hex'),
  excludedSelf: outputRelative,
  gitDirectoryIncluded: false,
  nodeModulesIncluded: false,
  generatedBuildIncluded: false,
  files: records
};
fs.writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`[W700] source reconciliation ${manifest.sourceFileCount} files · ${manifest.aggregateSha256}`);

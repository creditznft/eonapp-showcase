#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'config/w694-source-reconciliation-manifest.json');
const excluded = new Set(['config/w694-source-reconciliation-manifest.json']);
const list = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' })
  .split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean)
  .filter((entry) => !excluded.has(entry) && !entry.startsWith('node_modules/') && !entry.startsWith('dist/') && !entry.startsWith('reports/') && !entry.startsWith('test-results/') && !entry.startsWith('playwright-report/'))
  .sort();
const files = [];
for (const relative of list) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) continue;
  const body = fs.readFileSync(absolute);
  files.push({ path: relative.replaceAll('\\', '/'), bytes: body.length, sha256: crypto.createHash('sha256').update(body).digest('hex') });
}
const categories = {};
for (const entry of files) {
  const category = entry.path.includes('/') ? entry.path.split('/')[0] : 'root';
  categories[category] = (categories[category] || 0) + 1;
}
const aggregate = crypto.createHash('sha256');
for (const entry of files) aggregate.update(`${entry.path}\0${entry.bytes}\0${entry.sha256}\n`);
const manifest = {
  schema: 'eonapp.source-reconciliation.w694.v1',
  generatedAt: new Date().toISOString(),
  branch: execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  predecessorCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  currentWave: 'W694',
  sourceFileCount: files.length,
  totalBytes: files.reduce((sum, entry) => sum + entry.bytes, 0),
  aggregateSha256: aggregate.digest('hex'),
  categories,
  excludedSelf: 'config/w694-source-reconciliation-manifest.json',
  includesUntrackedCandidateFiles: true,
  gitDirectoryIncluded: false,
  nodeModulesIncluded: false,
  generatedBuildIncluded: false,
  files
};
fs.writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`[W694] wrote ${path.relative(root, output)} with ${files.length} files`);
console.log(`[W694] aggregate SHA-256 ${manifest.aggregateSha256}`);

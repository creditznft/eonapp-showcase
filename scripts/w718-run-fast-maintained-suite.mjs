#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CURRENT_UNIT_TESTS, parseTapSummary } from './run-current-unit-suite.mjs';
import { W718_BABYLON_REQUIRED_TESTS } from '../config/w718-independent-certification-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'reports/institutional/w718-fast-maintained-suite-receipt.json');
const excluded = new Set(W718_BABYLON_REQUIRED_TESTS);
const deferredExactDependencyFiles = CURRENT_UNIT_TESTS.filter((relative) => excluded.has(relative));
const tests = CURRENT_UNIT_TESTS.filter((relative) => !excluded.has(relative));
const chunkSize = 28;
const chunks = [];
for (let index = 0; index < tests.length; index += chunkSize) chunks.push(tests.slice(index, index + chunkSize));
const rows = [];
let status = 0;
const startedAt = new Date().toISOString();
for (let index = 0; index < chunks.length; index += 1) {
  const files = chunks[index];
  console.log(`[W718-fast] CHUNK ${index + 1}/${chunks.length}: ${files.length} files`);
  const started = Date.now();
  const result = spawnSync(process.execPath, ['--test', '--test-concurrency=1', ...files], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  const summary = parseTapSummary(output);
  if (result.status !== 0) { process.stdout.write(result.stdout || ''); process.stderr.write(result.stderr || ''); }
  else console.log(`[W718-fast] PASS chunk ${index + 1}: ${summary.passed}/${summary.tests}; ${summary.skipped} skips; ${Date.now() - started} ms`);
  rows.push({ chunkIndex: index, testFiles: files, status: Number(result.status ?? 1), durationMs: Date.now() - started, summary });
  if (result.status !== 0) { status = Number(result.status || 1); break; }
}
const totals = rows.reduce((sum, row) => {
  for (const key of ['tests', 'passed', 'failed', 'skipped', 'cancelled', 'todo']) sum[key] += Number(row.summary?.[key] || 0);
  return sum;
}, { tests: 0, passed: 0, failed: 0, skipped: 0, cancelled: 0, todo: 0 });
const receipt = {
  schema: 'eonapp.w718.fast-maintained-suite-receipt.v1', wave: 'W718',
  startedAt, finishedAt: new Date().toISOString(), ok: status === 0 && totals.failed === 0,
  sourceOnly: true, independentCertificationAwarded: false,
  maintainedFileCount: CURRENT_UNIT_TESTS.length, executedFileCount: tests.length,
  deferredExactDependencyFiles,
  exactDependencyContractFileCount: W718_BABYLON_REQUIRED_TESTS.length,
  totals, chunks: rows
};
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[W718-fast] ${receipt.ok ? 'PASS' : 'FAIL'} ${totals.passed}/${totals.tests}; ${totals.skipped} explicit skips; ${tests.length} files; ${deferredExactDependencyFiles.length} maintained exact-dependency files deferred (${W718_BABYLON_REQUIRED_TESTS.length} in the complete exact-dependency contract).`);
if (!receipt.ok) process.exitCode = status || 1;

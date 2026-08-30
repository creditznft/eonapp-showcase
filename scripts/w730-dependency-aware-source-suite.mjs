#!/usr/bin/env node
/**
 * W730 — bounded dependency-aware maintained source suite.
 *
 * Runs every maintained test file independently with a small worker pool. Missing
 * external packages are recorded as blocked, never passed. Any other failure is
 * a genuine source failure and makes this command fail.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CURRENT_UNIT_TESTS, parseTapSummary } from './run-current-unit-suite.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'reports', 'w730-dependency-aware-source-suite', 'receipt.json');
const EXTERNAL_MISSING = /(?:ERR_MODULE_NOT_FOUND[\s\S]{0,500}Cannot find package|Cannot find package ['"]([^'"]+)['"]|MODULE_NOT_FOUND[\s\S]{0,500}node_modules)/i;
const workerCount = Math.min(4, Math.max(1, Number(process.env.EONAPP_SOURCE_SUITE_WORKERS || 4) || 4));

function runOne(relative) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(process.execPath, ['--test', '--test-concurrency=1', relative], { cwd: root, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout?.on('data', (chunk) => { output += String(chunk); });
    child.stderr?.on('data', (chunk) => { output += String(chunk); });
    child.once('error', (error) => resolve({ relative, status: 1, durationMs: Date.now() - started, output: `${output}\n${error?.stack || error}` }));
    child.once('exit', (code) => resolve({ relative, status: Number(code ?? 1), durationMs: Date.now() - started, output }));
  });
}

export async function runW730DependencyAwareSourceSuite() {
  const startedAt = new Date().toISOString();
  const missingFiles = CURRENT_UNIT_TESTS.filter((relative) => !fs.existsSync(path.join(root, relative)));
  if (missingFiles.length) {
    console.error(`[w730-source-suite] FAIL: ${missingFiles.length} maintained test files are absent.`);
    return { ok: false, missingFiles };
  }

  const passed = [];
  const dependencyBlocked = [];
  const failed = [];
  let nextIndex = 0;
  let completed = 0;
  const totals = { tests: 0, passed: 0, failed: 0, skipped: 0, cancelled: 0, todo: 0 };

  const worker = async () => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= CURRENT_UNIT_TESTS.length) return;
      const relative = CURRENT_UNIT_TESTS[index];
      const result = await runOne(relative);
      const summary = parseTapSummary(result.output);
      const row = { file: relative, durationMs: result.durationMs, summary };
      if (result.status === 0) {
        passed.push(row);
        for (const key of Object.keys(totals)) totals[key] += Number(summary[key] || 0);
      } else {
        const externalMatch = result.output.match(EXTERNAL_MISSING);
        if (externalMatch) {
          const packageName = externalMatch[1] || (result.output.match(/Cannot find package ['"]([^'"]+)['"]/) || [])[1] || 'external-package';
          dependencyBlocked.push({ ...row, packageName, reason: 'external-package-unavailable' });
        } else {
          failed.push({ ...row, outputTail: result.output.slice(-6000) });
          console.error(`[w730-source-suite] FAIL ${relative}`);
        }
      }
      completed += 1;
      if (completed % 25 === 0 || completed === CURRENT_UNIT_TESTS.length) console.log(`[w730-source-suite] ${completed}/${CURRENT_UNIT_TESTS.length}; ${passed.length} pass, ${dependencyBlocked.length} dependency-blocked, ${failed.length} fail.`);
    }
  };

  console.log(`[w730-source-suite] Running ${CURRENT_UNIT_TESTS.length} maintained files with ${workerCount} bounded workers.`);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  passed.sort((a, b) => a.file.localeCompare(b.file));
  dependencyBlocked.sort((a, b) => a.file.localeCompare(b.file));
  failed.sort((a, b) => a.file.localeCompare(b.file));
  const receipt = {
    schema: 'eonapp.w730.dependency-aware-source-suite.2026-07-28.v1',
    wave: 'W730',
    startedAt,
    finishedAt: new Date().toISOString(),
    maintainedFileCount: CURRENT_UNIT_TESTS.length,
    passedFileCount: passed.length,
    dependencyBlockedFileCount: dependencyBlocked.length,
    failedFileCount: failed.length,
    totals,
    sourceSuitePassed: failed.length === 0,
    fullDependencySuitePassed: failed.length === 0 && dependencyBlocked.length === 0,
    dependencyRegistryRequired: dependencyBlocked.length > 0,
    previewAuthorized: false,
    productionAuthorized: false,
    dependencyBlocked,
    failed,
    passedFiles: passed.map((row) => row.file)
  };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(receipt, null, 2)}\n`);
  if (failed.length) console.error(`[w730-source-suite] FAIL: ${failed.length} genuine source failure(s); ${dependencyBlocked.length} dependency-blocked.`);
  else console.log(`[w730-source-suite] SOURCE PASS: ${passed.length}/${CURRENT_UNIT_TESTS.length} files passed; ${dependencyBlocked.length} dependency-blocked and not certified.`);
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const receipt = await runW730DependencyAwareSourceSuite();
  if (!receipt?.sourceSuitePassed) process.exitCode = 1;
}

#!/usr/bin/env node
/**
 * W662I — dependency-aware local maintained-suite runner.
 *
 * Runs each maintained current-product unit file in isolation so an unavailable
 * package registry cannot hide unrelated source regressions. A file is marked
 * dependency-blocked only when Node reports a missing external package. Those
 * files are not counted as passed and must be rerun after `npm ci` succeeds.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CURRENT_UNIT_TESTS, parseTapSummary } from './run-current-unit-suite.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'reports', 'w662i-local-source-suite', 'receipt.json');
const EXTERNAL_MISSING = /(?:ERR_MODULE_NOT_FOUND[\s\S]{0,500}Cannot find package|Cannot find package ['"]([^'"]+)['"]|MODULE_NOT_FOUND[\s\S]{0,500}node_modules)/i;

function runOne(relative) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(process.execPath, ['--test', '--test-concurrency=1', relative], {
      cwd: root,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let output = '';
    child.stdout?.on('data', (chunk) => { output += String(chunk); });
    child.stderr?.on('data', (chunk) => { output += String(chunk); });
    child.once('error', (error) => resolve({ relative, status: 1, durationMs: Date.now() - started, output: `${output}\n${error?.stack || error}` }));
    child.once('exit', (code) => resolve({ relative, status: Number(code ?? 1), durationMs: Date.now() - started, output }));
  });
}

export async function runW662iLocalSourceSuite() {
  const startedAt = new Date().toISOString();
  const missingFiles = CURRENT_UNIT_TESTS.filter((relative) => !fs.existsSync(path.join(root, relative)));
  if (missingFiles.length) {
    console.error(`[w662i-source-suite] FAIL: ${missingFiles.length} maintained test files are absent.`);
    process.exitCode = 1;
    return null;
  }

  const passed = [];
  const dependencyBlocked = [];
  const failed = [];
  let totals = { tests: 0, passed: 0, failed: 0, skipped: 0, cancelled: 0, todo: 0 };

  console.log(`[w662i-source-suite] Running ${CURRENT_UNIT_TESTS.length} maintained files individually.`);
  for (let index = 0; index < CURRENT_UNIT_TESTS.length; index += 1) {
    const relative = CURRENT_UNIT_TESTS[index];
    const result = await runOne(relative);
    const summary = parseTapSummary(result.output);
    const row = { file: relative, durationMs: result.durationMs, summary };
    if (result.status === 0) {
      passed.push(row);
      for (const key of Object.keys(totals)) totals[key] += Number(summary[key] || 0);
      if ((index + 1) % 25 === 0 || index + 1 === CURRENT_UNIT_TESTS.length) {
        console.log(`[w662i-source-suite] ${index + 1}/${CURRENT_UNIT_TESTS.length} files checked; ${passed.length} pass, ${dependencyBlocked.length} dependency-blocked, ${failed.length} fail.`);
      }
      continue;
    }

    const externalMatch = result.output.match(EXTERNAL_MISSING);
    if (externalMatch) {
      const packageName = externalMatch[1] || (result.output.match(/Cannot find package ['"]([^'"]+)['"]/) || [])[1] || 'external-package';
      dependencyBlocked.push({ ...row, packageName, reason: 'external-package-unavailable' });
      console.log(`[w662i-source-suite] BLOCKED ${relative}: missing ${packageName}`);
      continue;
    }

    failed.push({ ...row, outputTail: result.output.slice(-6000) });
    console.error(`[w662i-source-suite] FAIL ${relative}`);
  }

  const receipt = {
    schema: 'eonapp.w662i.local-source-suite.2026-07-23.v1',
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
    authenticatedBrowserProofAccepted: false,
    previewAuthorized: false,
    productionAuthorized: false,
    dependencyBlocked,
    failed,
    passedFiles: passed.map((row) => row.file)
  };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(receipt, null, 2)}\n`);

  if (failed.length) {
    console.error(`[w662i-source-suite] FAIL: ${failed.length} genuine maintained-suite file failure(s); ${dependencyBlocked.length} dependency-blocked.`);
    process.exitCode = 1;
  } else {
    console.log(`[w662i-source-suite] SOURCE PASS: ${passed.length}/${CURRENT_UNIT_TESTS.length} files passed; ${dependencyBlocked.length} remain dependency-blocked and are not certified.`);
  }
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await runW662iLocalSourceSuite();
}

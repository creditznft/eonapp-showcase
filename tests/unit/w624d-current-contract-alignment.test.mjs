import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  W624D_ARCHIVED_CONTRACT_ASSERTIONS,
  W624D_REQUIRED_CURRENT_TESTS,
  W624D_REQUIRED_BUILD_DEPENDENT_TESTS,
  W624D_REQUIRED_PREDEPLOY_SCRIPTS
} from '../../config/w624d-current-contract-alignment-contract.mjs';
import { CURRENT_UNIT_TESTS } from '../../scripts/run-current-unit-suite.mjs';
import { inspectW624dCurrentContractAlignment } from '../../scripts/w624d-current-contract-alignment-gate.mjs';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W624D classifies exactly 47 superseded assertions with named maintained replacements', () => {
  assert.equal(W624D_ARCHIVED_CONTRACT_ASSERTIONS.length, 47);
  assert.equal(new Set(W624D_ARCHIVED_CONTRACT_ASSERTIONS.map((entry) => `${entry.file}\u0000${entry.name}`)).size, 47);
  assert.equal(W624D_ARCHIVED_CONTRACT_ASSERTIONS.every((entry) => entry.reason && entry.replacements.length > 0), true);
});

test('W624D current unit runner includes every replacement truth contract', () => {
  const current = new Set(CURRENT_UNIT_TESTS);
  for (const relative of W624D_REQUIRED_CURRENT_TESTS) assert.equal(current.has(relative), true, relative);
});

test('W624D keeps build-dependent certification outside the clean source-only unit runner', () => {
  const current = new Set(CURRENT_UNIT_TESTS);
  for (const relative of W624D_REQUIRED_BUILD_DEPENDENT_TESTS) assert.equal(current.has(relative), false, relative);
});

test('W624D archived assertions remain explicit skips instead of silently weakened expectations', () => {
  for (const entry of W624D_ARCHIVED_CONTRACT_ASSERTIONS) {
    const source = read(entry.file);
    assert.match(source, new RegExp(`W624D archived contract snapshot[\\s\\S]{0,200}test\\.skip\\((['"])${entry.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`), `${entry.file}: ${entry.name}`);
  }
});

test('W624D Codex predeploy command names all required maintained certification scripts', () => {
  const packageJson = JSON.parse(read('package.json'));
  for (const name of W624D_REQUIRED_PREDEPLOY_SCRIPTS) assert.equal(typeof packageJson.scripts[name], 'string', name);
  assert.match(packageJson.scripts['verify:w624d-codex-predeploy'], /run-w624d-codex-predeploy\.mjs/);
  const runner = read('scripts/run-w624d-codex-predeploy.mjs');
  assert.match(runner, /test:unit/);
  assert.match(runner, /qa:w624d-wayfinder-camera/);
  assert.match(runner, /qa:w624d-current-contract-alignment/);
  assert.match(runner, /qa:w624d-test-archive/);
  assert.match(runner, /qa:w625a-real-local-image-tooling/);
  assert.match(runner, /qa:w625h-local-creator-certification/);
  assert.match(runner, /qa:w626a-direct-job-threat-model/);
  assert.match(runner, /qa:w626h-byok-privacy-certification/);
  assert.match(runner, /qa:w629h-referral-red-team-certification/);
  assert.match(runner, /qa:w630-whole-app-ux/);
  assert.match(runner, /qa:w631-project-workspace-forge-automation/);
  assert.match(runner, /qa:w632-account-vault-custody/);
  assert.match(runner, /qa:w638-evidence-convergence/);
  assert.match(runner, /qa:w639-production-rehearsal-freeze/);
  assert.match(runner, /qa:w639-build-rehearsal/);
  assert.match(runner, /openSync\(lockPath, 'wx'\)/);
  assert.match(runner, /computeSourceFingerprint/);
  assert.match(runner, /readCheckpoint\(fingerprint\)/);
  assert.match(runner, /sourceFingerprint/);
  assert.match(runner, /RESUME/);
  assert.match(runner, /script: 'build'[\s\S]*script: 'qa:w639-build-rehearsal'[\s\S]*script: 'qa:w623f-certification-v2'/);
});

test('W624D alignment gate passes without turning historical snapshots into release proof', () => {
  const report = inspectW624dCurrentContractAlignment();
  assert.equal(report.ok, true, report.checks.filter((entry) => !entry.pass).map((entry) => `${entry.id}: ${entry.detail}`).join('\n'));
  assert.equal(report.archivedAssertions, 47);
  assert.equal(report.currentReplacementTests, W624D_REQUIRED_CURRENT_TESTS.length);
});

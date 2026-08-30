#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { getEonPwaRolloutTruth } from '../assets/js/eon-pwa-rollout-guard.js';
import { W440_PWA_ROLLOUT_CONTRACT, validateW440PwaRolloutContract } from '../config/w440-pwa-rollout-contract.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const read = (file) => readFileSync(path.join(root, file), 'utf8'); const ensure = (value, message) => assert.equal(Boolean(value), true, message);
export function inspectW440PwaRollout() {
  const checks = []; const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const guard = read('assets/js/eon-pwa-rollout-guard.js'); const manager = read('assets/js/eon-pwa-manager.js'); const updateSafe = read('assets/js/utils/update-safe-user-data.js'); const truth = getEonPwaRolloutTruth();
  check('required-files', ['assets/js/eon-pwa-rollout-guard.js', 'config/w440-pwa-rollout-contract.mjs', 'tests/unit/w440-pwa-rollout.test.mjs'].every((file) => existsSync(path.join(root, file))), 'rollout guard, contract and test exist');
  check('contract-valid', validateW440PwaRolloutContract().length === 0 && W440_PWA_ROLLOUT_CONTRACT.wave === 'W440', 'contract permits review but no automatic update');
  check('redacted-inventory', /summarizeW145ProtectedStorage/.test(guard) && /beforeFingerprint/.test(guard) && /secretsIncluded: false/.test(guard) && /rawValuesIncluded: false/.test(guard), 'review records a redacted W145 inventory instead of values');
  check('no-auto-update', /serviceWorkerUpdateApplied: false/.test(guard) && /pageReloaded: false/.test(guard) && !/SKIP_WAITING/.test(guard), 'guard cannot apply an update or reload a page');
  check('pwa-state-wiring', /eon-pwa-rollout-guard/.test(manager) && /rolloutReview/.test(manager) && /rolloutTruth/.test(manager), 'PWA state exposes rollout truth without claiming device proof');
  check('update-safe-key', updateSafe.includes('eon:pwa:rollout-review:v1'), 'rollout-review record is protected by W145 update survival');
  check('no-network', !/\bfetch\s*\(|XMLHttpRequest|WebSocket|navigator\.serviceWorker|window\.location/.test(guard), 'review guard creates no request, worker action or navigation');
  check('truth-boundary', truth.automaticUpdateApplication === false && truth.rollbackApplied === false && truth.productionRolloutProof === false, 'W440 remains a source-level review and rollback checklist foundation');
  return Object.freeze({ schema: 'eonapp.w440.pwa-rollout-gate.v1', wave: 'W440', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze(['No installed PWA, service-worker update, rollback, iOS, Android or desktop physical-device proof was run.']) });
}
export function runW440PwaRolloutGate({ writeArtifact = true } = {}) { const result = inspectW440PwaRollout(); if (writeArtifact) { const dir = path.join(root, 'artifacts', 'w440-pwa-rollout-gate'); mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`); } return result; }
if (import.meta.url === `file://${process.argv[1]}`) { const result = runW440PwaRolloutGate(); process.stdout.write(`W440 PWA rollout gate passed (${result.checkCount}/${result.checkCount}). No update was applied.\n`); }

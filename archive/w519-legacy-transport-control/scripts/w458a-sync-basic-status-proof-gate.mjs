#!/usr/bin/env node
/** W458.1 source gate: deployment probe remains read-only, opt-in and unauthenticated. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createW458ASyncBasicStatusProofPlan, runW458ASyncBasicStatusProof, validateW458ASyncBasicPublicStatus } from './w458a-sync-basic-status-proof.mjs';
import { W458A_SYNC_BASIC_STATUS_PROOF_CONTRACT, validateW458ASyncBasicStatusProofContract } from '../config/w458a-sync-basic-status-proof-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export async function inspectW458ASyncBasicStatusProof() {
  const errors = [...validateW458ASyncBasicStatusProofContract()];
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); if (!value) errors.push(`${id}: ${detail}`); };
  const contract = W458A_SYNC_BASIC_STATUS_PROOF_CONTRACT;
  const script = read('scripts/w458a-sync-basic-status-proof.mjs');
  const endpoint = read('functions/api/sync/status.js');
  const shared = read('functions/_shared/eon-sync-basic.js');
  const template = read('sync/wrangler.sync.example.toml');
  const plan = createW458ASyncBasicStatusProofPlan({ origin: 'https://eonapp.example' });
  const dryRun = await runW458ASyncBasicStatusProof({ origin: 'https://eonapp.example', allowNetwork: false, fetchImpl: () => { throw new Error('network must not run in dry mode'); } });
  const sample = {
    schema: 'eonapp.sync-basic-transport.w412.v1', available: false, rollout: 'disabled', signedIn: false, status: 'not-configured', identityOnly: false,
    automaticUpload: false, backgroundSync: false, automaticMerge: false, automaticDeletion: false, secureVaultSync: false, rawMediaSync: false, localModelSync: false, apiKeySync: false, liveReleaseApproved: false,
    manualProofRequired: true, supportedTypes: ['preferences'], exclusions: ['Vault entries']
  };

  check('required-files', contract.requiredFiles.every((relative) => fs.existsSync(path.join(root, relative))), 'status proof, source endpoint, fail-closed config, template and tests exist');
  check('plan-is-https-read-only', plan.endpoint === 'https://eonapp.example/api/sync/status' && plan.method === 'GET' && plan.requestCookieIncluded === false && plan.recordUploadCreated === false && plan.tombstoneCreated === false, 'probe has one HTTPS status route and never creates a write payload');
  check('dry-run-never-fetches', dryRun.ok === true && dryRun.status === 'dry-run' && dryRun.networkRequestCreated === false, 'network requires explicit --allow-network');
  check('unauthenticated-status-fails-closed', validateW458ASyncBasicPublicStatus(sample).ok === true && validateW458ASyncBasicPublicStatus({ ...sample, automaticUpload: true }).ok === false, 'public status accepts only manual-proof, non-automated unauthenticated state');
  check('source-omits-sensitive-primitives', !/method\s*:\s*['\"]POST|records\/tombstone|(?:globalThis\.)?localStorage\.(?:get|set|remove)Item|sessionStorage\.(?:get|set|remove)Item|document\.cookie|headers\s*:\s*\{[^}]*Authorization|Bearer\s+|request\.text\s*\(/.test(script), 'probe has no sync write, browser storage, cookie/header credential or raw response-body primitive');
  check('endpoint-is-status-only', /onRequestGet/.test(endpoint) && /publicEonSyncBasicStatus/.test(endpoint) && !/upsertEonSyncBasicRecords/.test(endpoint), 'public endpoint reads status only');
  check('worker-config-remains-manual-proof', /EON_SYNC_ROLLOUT/.test(shared) && /EON_SYNC_MUTATION_GATE/.test(shared) && /manual-proof-ready/.test(shared) && /EON_SYNC_DB/.test(template), 'D1 transport still requires dedicated binding and explicit manual-proof flags');
  check('no-release-claim', /liveReleaseApproved:\s*false/.test(script) && plan.liveReleaseApproved === false && plan.manualDeviceProofRequired === true, 'status proof cannot certify a Sync release or replace two-device evidence');

  return Object.freeze({
    schema: 'eonapp.w458.1.sync-basic-status-proof-gate.v1', wave: 'W458.1', status: errors.length ? 'fail' : 'pass', sourceOnly: true,
    checkCount: checks.length, errors: Object.freeze(errors), checks: Object.freeze(checks),
    limitations: Object.freeze([
      'This runner does not create a D1 database or binding, authenticate a user, upload, read or tombstone records, or prove a two-device merge/restore path.',
      'It records no response body and cannot certify browser clear, rollback, consent, privacy, production Sync or release readiness.',
      'Run it only after deployment with --origin=https://your-production-origin --allow-network, then perform the separate signed-in Device A/B manual proof.'
    ])
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = await inspectW458ASyncBasicStatusProof();
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  const directory = path.join(root, 'artifacts', 'w458a-sync-basic-status-proof-gate');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`W458.1 Sync Basic status proof source gate passed (${report.checkCount}/${report.checkCount}).\n`);
}

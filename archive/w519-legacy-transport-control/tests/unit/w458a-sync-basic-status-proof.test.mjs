import assert from 'node:assert/strict';
import test from 'node:test';
import { createW458ASyncBasicStatusProofPlan, parseW458AStatusProofArgs, runW458ASyncBasicStatusProof, validateW458ASyncBasicPublicStatus } from '../../scripts/w458a-sync-basic-status-proof.mjs';
import { W458A_SYNC_BASIC_STATUS_PROOF_CONTRACT, validateW458ASyncBasicStatusProofContract } from '../../config/w458a-sync-basic-status-proof-contract.mjs';
import { inspectW458ASyncBasicStatusProof } from '../../scripts/w458a-sync-basic-status-proof-gate.mjs';

const disabledStatus = {
  schema: 'eonapp.sync-basic-transport.w412.v1', available: false, rollout: 'disabled', signedIn: false, status: 'not-configured', identityOnly: false,
  automaticUpload: false, backgroundSync: false, automaticMerge: false, automaticDeletion: false, secureVaultSync: false, rawMediaSync: false, localModelSync: false, apiKeySync: false, liveReleaseApproved: false,
  manualProofRequired: true, supportedTypes: ['preferences'], exclusions: ['Vault entries']
};

test('W458.1 is HTTPS-only, dry by default and never builds a mutation request', async () => {
  assert.deepEqual(validateW458ASyncBasicStatusProofContract(), []);
  const plan = createW458ASyncBasicStatusProofPlan({ origin: 'https://eonapp.example/ignored?nope=1' });
  assert.equal(plan.origin, null);
  const validPlan = createW458ASyncBasicStatusProofPlan({ origin: 'https://eonapp.example' });
  assert.equal(validPlan.endpoint, 'https://eonapp.example/api/sync/status');
  assert.equal(validPlan.method, 'GET');
  assert.equal(validPlan.requestCookieIncluded, false);
  assert.equal(validPlan.recordUploadCreated, false);
  const result = await runW458ASyncBasicStatusProof({ origin: 'https://eonapp.example', allowNetwork: false, fetchImpl: () => { throw new Error('must not fetch'); } });
  assert.equal(result.status, 'dry-run');
  assert.equal(result.networkRequestCreated, false);
});

test('W458.1 only accepts a transparent unauthenticated manual-proof status', async () => {
  assert.equal(validateW458ASyncBasicPublicStatus(disabledStatus).ok, true);
  assert.equal(validateW458ASyncBasicPublicStatus({ ...disabledStatus, status: 'manual-proof-review-required' }).ok, false);
  assert.equal(validateW458ASyncBasicPublicStatus({ ...disabledStatus, secureVaultSync: true }).ok, false);
  let requested = null;
  const response = { status: 200, json: async () => disabledStatus };
  const result = await runW458ASyncBasicStatusProof({ origin: 'https://eonapp.example', allowNetwork: true, fetchImpl: async (url, init) => { requested = { url, init }; return response; } });
  assert.equal(result.ok, true);
  assert.equal(result.status, 'public-status-verified');
  assert.equal(result.responseBodyStored, false);
  assert.equal(requested.url, 'https://eonapp.example/api/sync/status');
  assert.equal(requested.init.credentials, 'omit');
  assert.equal(requested.init.redirect, 'error');
});

test('W458.1 CLI input requires an explicit network opt-in and uses no credentials', () => {
  assert.deepEqual(parseW458AStatusProofArgs(['--origin=https://eonapp.example']), { origin: 'https://eonapp.example', allowNetwork: false, timeoutMs: 8000 });
  assert.deepEqual(parseW458AStatusProofArgs(['--allow-network', '--origin=https://eonapp.example', '--timeout-ms=9000']), { origin: 'https://eonapp.example', allowNetwork: true, timeoutMs: 9000 });
  assert.equal(W458A_SYNC_BASIC_STATUS_PROOF_CONTRACT.liveReleaseApproved, false);
});

test('W458.1 source gate preserves D1 and two-device proof as external requirements', async () => {
  const report = await inspectW458ASyncBasicStatusProof();
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  assert.match(report.limitations.join(' '), /D1 database or binding/i);
  assert.match(report.limitations.join(' '), /two-device/i);
});

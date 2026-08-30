#!/usr/bin/env node
/** W411 source gate: local Sync Basic schema only, with no network activation. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W411_SYNC_BASIC_FOUNDATION_CONTRACT, validateW411SyncBasicFoundationContract } from '../config/w411-sync-basic-foundation-contract.mjs';
import { EON_SYNC_BASIC_EXCLUSIONS, EON_SYNC_BASIC_TYPES, getEonSyncBasicTruth } from '../assets/js/eon-sync/eon-sync-basic-foundation.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW411SyncBasicFoundation() {
  const foundation = read('assets/js/eon-sync/eon-sync-basic-foundation.js');
  const shell = read('assets/js/eon-app-shell.js');
  const backend = JSON.parse(read('platform-backend/contracts/eon-sync-basic-foundation.v1.json'));
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };

  check('contract-valid', validateW411SyncBasicFoundationContract().length === 0, 'W411 contract has no internal violations');
  check('record-envelope', /id: safeId/.test(foundation) && /type: safeType/.test(foundation) && /updatedAt: normalizeIso/.test(foundation) && /originDeviceId: safeDevice/.test(foundation) && /contentHash/.test(foundation) && /deletedAt/.test(foundation), 'record schema includes every required field');
  check('safe-types', JSON.stringify(EON_SYNC_BASIC_TYPES) === JSON.stringify(W411_SYNC_BASIC_FOUNDATION_CONTRACT.allowedTypes), 'safe type set matches the source contract');
  check('exclusions', EON_SYNC_BASIC_EXCLUSIONS.join(' ').includes('Vault') && EON_SYNC_BASIC_EXCLUSIONS.join(' ').includes('API keys') && /SENSITIVE_NAME/.test(foundation) && /SENSITIVE_VALUE/.test(foundation), 'sensitive scope is excluded and screened');
  check('explicit-opt-in', /explicitUserConsentRequired: true/.test(foundation) && /explicitUserConsent === true/.test(foundation) && /explicit-text-consent-required/.test(foundation), 'migration preview requires explicit opt-in and separate text consent');
  check('no-network', !/\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource)\s*\(/.test(foundation), 'foundation creates no transport');
  check('no-automatic-write', !/\.setItem\(/.test(foundation) && !/\.put\(/.test(foundation) && !/indexedDB\./.test(foundation), 'foundation does not persist, migrate or overwrite browser data');
  check('conflict-policy', /conflict-copy-required/.test(foundation) && /tombstone-newer/.test(foundation) && /automaticOverwrite: false/.test(foundation), 'text conflicts and deletions remain controlled');
  check('ui-truth', /EON Sync — manual proof only/.test(shell) && /Google Login is identity only/.test(shell) && /this Settings view does not upload, merge, delete, or restore anything/.test(shell), 'shell keeps Sync manually gated and identity separate');
  check('backend-inactive', backend.enabled === false && backend.automaticUpload === false && Array.isArray(backend.publicEndpoints) && backend.publicEndpoints.length === 0 && backend.googleLoginIsSync === false, 'backend design contract is inactive');
  const truth = getEonSyncBasicTruth();
  check('truth-inactive', truth.enabled === false && truth.automaticUpload === false && truth.networkEndpoints.length === 0 && truth.secureVaultSyncIncluded === false, 'runtime truth object stays inactive');

  return Object.freeze({ schema: 'eonapp.w411.sync-basic-foundation-gate.v1', wave: 'W411', status: 'pass', checkCount: checks.length, checks, limitations: Object.freeze(['Static/source verification only.', 'No two-device sync, cloud storage, identity binding, merge, deletion propagation, recovery or Vault Sync proof exists yet.']) });
}

export function runW411SyncBasicFoundationGate({ writeArtifact = true } = {}) {
  const result = inspectW411SyncBasicFoundation();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w411-sync-basic-foundation-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW411SyncBasicFoundationGate();
  process.stdout.write(`W411 Sync Basic foundation gate passed (${result.checkCount}/${result.checkCount}).\n`);
}

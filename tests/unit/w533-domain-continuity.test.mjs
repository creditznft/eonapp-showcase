import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  createDomainContinuityMovePlan,
  getDomainContinuityTruth
} from '../../assets/js/local-first/eon-domain-continuity.js';
import { W533_DOMAIN_CONTINUITY_CONTRACT } from '../../config/w533-domain-continuity-contract.mjs';
import { inspectW533DomainContinuity } from '../../scripts/w533-domain-continuity-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('W533 describes a canonical cross-device move as an explicit user-held encrypted Capsule process', () => {
  const truth = getDomainContinuityTruth();
  const plan = createDomainContinuityMovePlan({ sourceOrigin: 'https://eonapp.ch', targetOrigin: 'https://eonapp.ch' });
  assert.equal(truth.transferMode, 'explicit-user-held-encrypted-capsule-only');
  assert.equal(truth.trustHubCanReadBrowserData, false);
  assert.equal(truth.automaticSyncActive, false);
  assert.equal(truth.automaticRestoreActive, false);
  assert.equal(plan.allowed, true);
  assert.equal(plan.targetStatus, 'canonical-app');
  assert.equal(plan.automaticTransfer, false);
  assert.match(plan.steps.join(' '), /downloaded file/);
});

test('W533 fails closed for EON.HUB because a Trust Hub is not a Capsule storage or restore origin', () => {
  const plan = createDomainContinuityMovePlan({ sourceOrigin: 'https://eonapp.ch', targetOrigin: 'https://eon.hub' });
  assert.equal(plan.allowed, false);
  assert.equal(plan.targetStatus, 'blocked-trust-hub');
  assert.match(plan.headline, /cannot receive, inspect, store, or restore a Capsule/i);
});

test('W533 treats a future HTTPS EONAPP address as review-required, never a cross-origin read', () => {
  const plan = createDomainContinuityMovePlan({ sourceOrigin: 'https://eonapp.ch', targetOrigin: 'https://future.example' });
  assert.equal(plan.allowed, true);
  assert.equal(plan.targetStatus, 'review-required');
  assert.match(plan.blocked.join(' '), /No origin can read localStorage or IndexedDB from another origin/);
});

test('W533 capsule UI and source gate retain the manual-transfer boundary', () => {
  const capsule = fs.readFileSync(path.join(ROOT, 'capsule.html'), 'utf8');
  assert.equal(W533_DOMAIN_CONTINUITY_CONTRACT.prohibited.includes('automatic-domain-sync'), true);
  assert.match(capsule, /Move your workspace safely/);
  assert.match(capsule, /EON.HUB Trust &amp; Rescue page/);
  assert.equal(inspectW533DomainContinuity({ root: ROOT }).ok, true);
});

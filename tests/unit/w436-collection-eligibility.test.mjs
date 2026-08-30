import assert from 'node:assert/strict';
import test from 'node:test';
import { createEonCollectionEligibilityRegistry, getEonCollectionEligibilityTruth } from '../../assets/js/collection/eon-collection-eligibility.js';
import { inspectW436CollectionEligibility } from '../../scripts/w436-collection-eligibility-gate.mjs';

function memoryStorage() {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); },
    get length() { return data.size; },
    key(index) { return [...data.keys()][index] || null; }
  };
}

const HASH = 'sha256:collectionreviewevidence_abcdefghijklmnopqrstuvwxyz';

function registry() {
  return createEonCollectionEligibilityRegistry({ storage: memoryStorage(), now: () => Date.parse('2026-06-29T12:00:00.000Z') });
}

test('W436 requires explicit reviewed evidence and creates no grant', () => {
  const instance = registry();
  assert.equal(instance.recordEligibility({ missionId: 'forge-local-export-reviewed', evidenceKind: 'forge-source-review', evidenceHash: HASH }).error, 'explicit-user-action-required');
  assert.equal(instance.recordEligibility({ missionId: 'forge-local-export-reviewed', evidenceKind: 'forge-source-review', evidenceHash: HASH }, { explicitUserAction: true }).error, 'local-evidence-review-required');
  const recorded = instance.recordEligibility({ missionId: 'forge-local-export-reviewed', evidenceKind: 'forge-source-review', evidenceHash: HASH }, { explicitUserAction: true, approvedLocalEvidence: true });
  assert.equal(recorded.ok, true);
  assert.equal(recorded.revealStatus, 'local-review-eligible-not-granted');
  assert.equal(recorded.record.grantCreated, false);
  assert.equal(recorded.record.financial, false);
  assert.equal(recorded.snapshot.activeEligibilityCount, 1);
});

test('W436 rejects mismatched evidence and supports only confirmed local revocation', () => {
  const instance = registry();
  assert.equal(instance.recordEligibility({ missionId: 'forge-local-export-reviewed', evidenceKind: 'wrong-kind', evidenceHash: HASH }, { explicitUserAction: true, approvedLocalEvidence: true }).error, 'mission-evidence-not-eligible');
  const recorded = instance.recordEligibility({ missionId: 'share-pack-reviewed', evidenceKind: 'share-pack-review', evidenceHash: HASH }, { explicitUserAction: true, approvedLocalEvidence: true });
  assert.equal(instance.revokeEligibility(recorded.record.eligibilityId, { explicitUserAction: true }).error, 'revocation-confirmation-required');
  const revoked = instance.revokeEligibility(recorded.record.eligibilityId, { explicitUserAction: true, confirmed: true });
  assert.equal(revoked.ok, true);
  assert.equal(revoked.record.state, 'revoked');
  assert.equal(revoked.record.grantCreated, false);
});

test('W436 update survival proof is local source simulation only', () => {
  const instance = registry();
  const proof = instance.buildUpdateSurvivalProof();
  assert.equal(proof.preserved, true);
  assert.equal(proof.sourceSimulationOnly, true);
  assert.equal(proof.deploymentProof, false);
  assert.equal(proof.grantCreated, false);
});

test('W436 gate and truth preserve a non-financial disabled Collection boundary', () => {
  const gate = inspectW436CollectionEligibility();
  const truth = getEonCollectionEligibilityTruth();
  assert.equal(gate.status, 'pass');
  assert.ok(gate.checkCount >= 9);
  assert.equal(truth.collectionRolloutEnabled, false);
  assert.equal(truth.grantCreated, false);
  assert.equal(truth.marketplace, false);
  assert.equal(truth.tokenOrNft, false);
});

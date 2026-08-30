import assert from 'node:assert/strict'; import test from 'node:test';
import { createEonPwaRolloutGuard, getEonPwaRolloutTruth } from '../../assets/js/eon-pwa-rollout-guard.js';
import { seedW145ProofStorage } from '../../assets/js/utils/update-safe-user-data.js'; import { inspectW440PwaRollout } from '../../scripts/w440-pwa-rollout-gate.mjs';
function memoryStorage() { const data = new Map(); return { getItem: (key) => data.has(key) ? data.get(key) : null, setItem: (key, value) => data.set(key, String(value)), removeItem: (key) => data.delete(key), get length() { return data.size; }, key: (index) => [...data.keys()][index] || null }; }
const NOW = Date.parse('2026-06-29T12:00:00.000Z');
test('W440 prepares a redacted update review but never applies a service worker update', () => {
  const storage = memoryStorage(); seedW145ProofStorage(storage); const guard = createEonPwaRolloutGuard({ storage, now: () => NOW });
  assert.equal(guard.prepareUpdateReview({ toVersion: 'w444' }).error, 'explicit-user-action-required'); const prepared = guard.prepareUpdateReview({ fromVersion: 'w437', toVersion: 'w444', safeLabel: 'Review City update' }, { explicitUserAction: true });
  assert.equal(prepared.ok, true); assert.equal(prepared.review.actualServiceWorkerUpdateApplied, false); assert.equal(prepared.review.secretsIncluded, false); assert.equal(JSON.stringify(prepared.review).includes('eon-vault-secret'), false);
});
test('W440 checklist review requires final confirmation and cannot fabricate a before/after result', () => {
  const storage = memoryStorage(); const guard = createEonPwaRolloutGuard({ storage, now: () => NOW }); const prepared = guard.prepareUpdateReview({ toVersion: 'w444' }, { explicitUserAction: true });
  assert.equal(guard.markRollbackChecklistReviewed(prepared.review.reviewId, { explicitUserAction: true }).error, 'explicit-review-confirmation-required'); const reviewed = guard.markRollbackChecklistReviewed(prepared.review.reviewId, { explicitUserAction: true, explicitUserApproval: true });
  assert.equal(reviewed.ok, true); assert.equal(reviewed.rollbackApplied, false); assert.equal(guard.compareAfterUpdate(prepared.review.reviewId, storage, { explicitUserAction: true }).error, 'manual-w145-before-after-evidence-required');
});
test('W440 gate and truth preserve external device proof requirements', () => { const gate = inspectW440PwaRollout(); const truth = getEonPwaRolloutTruth(); assert.equal(gate.status, 'pass'); assert.ok(gate.checkCount >= 8); assert.equal(truth.automaticUpdateApplication, false); assert.equal(truth.productionRolloutProof, false); });

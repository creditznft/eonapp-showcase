import { buildW145UpdateSurvivalManifest, summarizeW145ProtectedStorage } from './utils/update-safe-user-data.js';

/**
 * W440 — PWA update and rollback review guard.
 *
 * This is deliberately a review layer. It records a redacted before-update
 * inventory and makes a rollback checklist available to the current browser.
 * It never applies a service-worker update, reloads the page, uploads data, or
 * claims that a device-level update has been proved.
 */
export const EON_PWA_ROLLOUT_GUARD_SCHEMA = 'eon.pwa.rollout-guard.w440.v1';
export const EON_PWA_ROLLOUT_GUARD_STORAGE_KEY = 'eon:pwa:rollout-review:v1';
const MAX_REVIEWS = 8;

const freeze = (value) => Object.freeze(value);
const cleanText = (value, fallback = '') => String(value || '').split('').filter((character) => character.charCodeAt(0) >= 32 && character !== '<' && character !== '>').join('').replace(/\s+/g, ' ').trim().slice(0, 120) || fallback;
const cleanVersion = (value) => String(value || '').replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 72);
const isStorage = (storage) => storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function';
const safeStorage = (storage = null) => storage || (() => { try { return globalThis.localStorage || null; } catch { return null; } })();
const safeNow = (now) => Number(typeof now === 'function' ? now() : Date.now());
const iso = (value) => new Date(Number(value) || Date.now()).toISOString();
const digest = (text) => {
  let hash = 2166136261;
  const value = String(text || '');
  for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return `local-${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

function emptyState(now) {
  return { schema: EON_PWA_ROLLOUT_GUARD_SCHEMA, updatedAt: iso(now), reviews: [] };
}
function readState(storage, now) {
  if (!isStorage(storage)) return emptyState(now);
  try {
    const parsed = JSON.parse(storage.getItem(EON_PWA_ROLLOUT_GUARD_STORAGE_KEY) || 'null');
    if (parsed?.schema === EON_PWA_ROLLOUT_GUARD_SCHEMA && Array.isArray(parsed.reviews)) return { ...parsed, reviews: parsed.reviews.slice(0, MAX_REVIEWS) };
  } catch {}
  return emptyState(now);
}
function writeState(storage, state) {
  if (!isStorage(storage)) return false;
  try { storage.setItem(EON_PWA_ROLLOUT_GUARD_STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}
function publicReview(review) {
  return freeze({
    reviewId: review.reviewId,
    fromVersion: review.fromVersion,
    toVersion: review.toVersion,
    safeLabel: review.safeLabel,
    createdAt: review.createdAt,
    status: review.status,
    protectedKeyCount: review.protectedKeyCount,
    protectedKeysPresent: review.protectedKeysPresent,
    beforeFingerprint: review.beforeFingerprint,
    rollbackPrepared: review.rollbackPrepared === true,
    actualServiceWorkerUpdateApplied: false,
    deviceProofAttached: false,
    secretsIncluded: false,
    rawValuesIncluded: false
  });
}
function snapshot(state) {
  return freeze({ schema: EON_PWA_ROLLOUT_GUARD_SCHEMA, reviews: freeze(state.reviews.map(publicReview)), reviewCount: state.reviews.length, localOnly: true, syncClaimed: false, actualUpdateApplied: false });
}

export function createEonPwaRolloutGuard({ storage = null, now = () => Date.now() } = {}) {
  const targetStorage = safeStorage(storage);
  const clock = () => safeNow(now);
  const current = () => readState(targetStorage, clock());
  const persist = (state) => {
    const stored = writeState(targetStorage, state);
    return freeze({ stored, browserStorageChanged: stored, networkRequestCreated: false, serviceWorkerUpdateApplied: false, pageReloaded: false, snapshot: snapshot(state) });
  };
  return freeze({
    getSnapshot() { return snapshot(current()); },
    prepareUpdateReview({ fromVersion = '', toVersion = '', safeLabel = '' } = {}, { explicitUserAction = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required', browserStorageChanged: false, networkRequestCreated: false, serviceWorkerUpdateApplied: false });
      const target = cleanVersion(toVersion);
      if (!target) return freeze({ ok: false, error: 'target-version-required', browserStorageChanged: false, networkRequestCreated: false, serviceWorkerUpdateApplied: false });
      const before = summarizeW145ProtectedStorage(targetStorage);
      const timestamp = clock();
      const review = {
        reviewId: `pwa-review-${timestamp}-${digest(`${target}:${before.protectedKeyCount}`).slice(-8)}`,
        fromVersion: cleanVersion(fromVersion, 'current-browser-build'),
        toVersion: target,
        safeLabel: cleanText(safeLabel, 'Review an app update'),
        createdAt: iso(timestamp),
        status: 'review-prepared',
        protectedKeyCount: before.protectedKeyCount,
        protectedKeysPresent: before.protectedKeysPresent,
        beforeFingerprint: digest(JSON.stringify(before.rows.map((row) => [row.key, row.fingerprint]))),
        rollbackPrepared: true,
        actualServiceWorkerUpdateApplied: false,
        deviceProofAttached: false,
        secretsIncluded: false,
        rawValuesIncluded: false
      };
      const state = current();
      const next = { schema: EON_PWA_ROLLOUT_GUARD_SCHEMA, updatedAt: iso(timestamp), reviews: [review, ...state.reviews].slice(0, MAX_REVIEWS) };
      const saved = persist(next);
      return freeze({ ok: saved.stored, review: publicReview(review), before: freeze({ protectedKeyCount: before.protectedKeyCount, protectedKeysPresent: before.protectedKeysPresent, unclassifiedAppOwnedKeyCount: before.unclassifiedAppOwnedKeyCount }), ...saved });
    },
    compareAfterUpdate(reviewId = '', afterStorage = targetStorage, { explicitUserAction = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required', networkRequestCreated: false, serviceWorkerUpdateApplied: false });
      const review = current().reviews.find((item) => item.reviewId === String(reviewId || ''));
      if (!review) return freeze({ ok: false, error: 'rollout-review-not-found', networkRequestCreated: false, serviceWorkerUpdateApplied: false });
      const beforeStorage = {};
      // W440 cannot reconstruct secret values or pretend to compare an unrecorded browser
      // update. A real before/after manifest must be supplied by the W145/manual test path.
      const incomplete = buildW145UpdateSurvivalManifest(beforeStorage, afterStorage, { source: 'w440-rollout-review' });
      return freeze({ ok: false, error: 'manual-w145-before-after-evidence-required', review: publicReview(review), incompleteManifest: freeze({ schema: incomplete.schema, observedAfterKeyCount: incomplete.afterSummary?.storageKeyCount || 0, valuesIncluded: false }), networkRequestCreated: false, serviceWorkerUpdateApplied: false, deviceProofAttached: false });
    },
    markRollbackChecklistReviewed(reviewId = '', { explicitUserAction = false, explicitUserApproval = false } = {}) {
      if (explicitUserAction !== true || explicitUserApproval !== true) return freeze({ ok: false, error: 'explicit-review-confirmation-required', browserStorageChanged: false, networkRequestCreated: false, rollbackApplied: false });
      const state = current();
      const review = state.reviews.find((item) => item.reviewId === String(reviewId || ''));
      if (!review) return freeze({ ok: false, error: 'rollout-review-not-found', browserStorageChanged: false, networkRequestCreated: false, rollbackApplied: false });
      const nextReview = { ...review, status: 'rollback-checklist-reviewed', rollbackPrepared: true, reviewedAt: iso(clock()) };
      const next = { ...state, updatedAt: iso(clock()), reviews: state.reviews.map((item) => item.reviewId === review.reviewId ? nextReview : item) };
      const saved = persist(next);
      return freeze({ ok: saved.stored, review: publicReview(nextReview), rollbackApplied: false, ...saved });
    }
  });
}

export function getEonPwaRolloutTruth() {
  return freeze({
    schema: EON_PWA_ROLLOUT_GUARD_SCHEMA,
    localUpdateReview: true,
    redactedProtectedInventory: true,
    explicitUserActionRequired: true,
    automaticUpdateApplication: false,
    rollbackApplied: false,
    pwaInstallProof: false,
    serviceWorkerDeviceProof: false,
    iosProof: false,
    androidProof: false,
    desktopProof: false,
    secretsStoredInReview: false,
    rawValuesStoredInReview: false,
    productionRolloutProof: false
  });
}

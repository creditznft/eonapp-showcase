/**
 * W357 — local model-manifest lifecycle governance.
 *
 * A model manifest is time-bound local evidence, not a permanent model claim.
 * This helper never contacts a provider. It asks the user to refresh a stale
 * direct-provider manifest rather than silently selecting a replacement.
 */

import { EON_MODEL_MANIFEST_SCHEMA } from './eon-model-manifest.js';

export const EON_MODEL_MANIFEST_LIFECYCLE_SCHEMA = 'eonapp.model-manifest-lifecycle.v1';
export const EON_MODEL_MANIFEST_MAX_AGE_MS = Object.freeze({
  'device-local': 1000 * 60 * 60 * 24 * 30,
  'direct-to-provider': 1000 * 60 * 60 * 24 * 7
});

function timestamp(value = '') {
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function allowedRoute(value = '') {
  return value === 'device-local' || value === 'direct-to-provider' ? value : '';
}

function lifecycleForRecord(record = {}, { now = Date.now() } = {}) {
  const route = allowedRoute(record.privacyRoute);
  const checkedAt = timestamp(record.checkedAt);
  const maxAgeMs = EON_MODEL_MANIFEST_MAX_AGE_MS[route] || 0;
  const ageMs = checkedAt === null ? null : Math.max(0, Number(now) - checkedAt);
  const verificationState = String(record.verificationState || 'unavailable');
  const status = !route || checkedAt === null
    ? 'invalid'
    : verificationState !== 'verified'
      ? verificationState === 'stale' ? 'recheck-required' : 'manual-only'
      : ageMs > maxAgeMs ? 'recheck-required' : 'current';
  return Object.freeze({
    providerId: String(record.providerId || ''),
    modelId: String(record.modelId || ''),
    privacyRoute: route,
    verificationState,
    checkedAt: checkedAt === null ? null : new Date(checkedAt).toISOString(),
    ageMs,
    maxAgeMs,
    status,
    autoSelectable: status === 'current',
    networkRequestCreated: false
  });
}

export function evaluateEonModelManifestLifecycle(manifest = {}, { now = Date.now() } = {}) {
  const validManifest = manifest?.schema === EON_MODEL_MANIFEST_SCHEMA && Array.isArray(manifest?.records);
  const records = validManifest ? manifest.records.map((record) => lifecycleForRecord(record, { now })) : [];
  const currentCount = records.filter((record) => record.status === 'current').length;
  const staleCount = records.filter((record) => record.status === 'recheck-required').length;
  const manualOnlyCount = records.filter((record) => record.status === 'manual-only').length;
  const invalidCount = records.filter((record) => record.status === 'invalid').length;
  const status = !validManifest ? 'invalid-manifest' : staleCount ? 'recheck-required' : invalidCount ? 'invalid-records' : manualOnlyCount ? 'manual-only' : currentCount ? 'current' : 'no-current-models';
  return Object.freeze({
    schema: EON_MODEL_MANIFEST_LIFECYCLE_SCHEMA,
    status,
    manifestSchema: String(manifest?.schema || ''),
    currentCount,
    staleCount,
    manualOnlyCount,
    invalidCount,
    records: Object.freeze(records),
    userRefreshRequired: staleCount > 0 || status === 'invalid-manifest' || status === 'invalid-records',
    backgroundRefreshCreated: false,
    providerCallCreated: false,
    silentModelReplacement: false,
    note: staleCount
      ? 'One or more model records need a user-triggered refresh. No replacement is selected automatically.'
      : currentCount
        ? 'Current model records may be used only under the selected provider policy and privacy route.'
        : 'No auto-selectable model record is available. Use a manual selection or refresh the manifest yourself.'
  });
}

export function getEonModelManifestLifecycleTruth() {
  return Object.freeze({
    schema: EON_MODEL_MANIFEST_LIFECYCLE_SCHEMA,
    directProviderRefreshWindowDays: 7,
    localRuntimeRefreshWindowDays: 30,
    backgroundRefreshCreated: false,
    providerCallCreated: false,
    silentModelReplacement: false,
    staleManifestAutoRouting: false
  });
}

export default Object.freeze({
  EON_MODEL_MANIFEST_LIFECYCLE_SCHEMA,
  EON_MODEL_MANIFEST_MAX_AGE_MS,
  evaluateEonModelManifestLifecycle,
  getEonModelManifestLifecycleTruth
});

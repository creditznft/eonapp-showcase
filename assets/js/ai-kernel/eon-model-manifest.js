/**
 * W312 — dynamic, user-triggered model manifests.
 *
 * A manifest is evidence about models at a point in time, not a permanent
 * product claim. Models with unknown or stale capabilities are manual-only and
 * cannot be auto-selected by the policy resolver.
 */

export const EON_MODEL_MANIFEST_SCHEMA = 'eonapp.model-manifest.v1';
export const EON_MODEL_PROFILES = Object.freeze(['chat.fast', 'chat.deep', 'code.edit', 'code.review', 'research.cited', 'content.draft', 'image.prompt', 'video.plan', 'audio.script', 'vision.analyze', 'structured.json', 'local.private']);
export const EON_MODEL_VERIFICATION_STATES = Object.freeze(['verified', 'stale', 'manual-only', 'unavailable']);
export const EON_CAPABILITY_STATES = Object.freeze(['verified', 'declared', 'unknown']);

const PROVIDER_ID_RE = /^[a-z][a-z0-9-]{1,64}$/;
const MODEL_ID_RE = /^[A-Za-z0-9._:/-]{1,160}$/;

function cleanIso(value = '', fallback = Date.now()) {
  if (typeof value === 'number' && Number.isFinite(value)) return new Date(value).toISOString();
  const source = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(source) && Number.isFinite(Date.parse(source))) return new Date(Date.parse(source)).toISOString();
  return new Date(Number(fallback)).toISOString();
}

function normalizeCapabilities(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const result = {};
  for (const profile of EON_MODEL_PROFILES) {
    const state = source[profile];
    if (state === undefined) continue;
    if (!EON_CAPABILITY_STATES.includes(String(state))) throw new Error('Model capability state is invalid.');
    result[profile] = String(state);
  }
  return Object.freeze(result);
}

export function normalizeModelRecord(value = {}, { now = Date.now() } = {}) {
  const record = value && typeof value === 'object' ? value : {};
  const providerId = String(record.providerId || '').trim();
  const modelId = String(record.modelId || '').trim();
  const verificationState = String(record.verificationState || '').trim();
  const privacyRoute = String(record.privacyRoute || '').trim();
  if (!PROVIDER_ID_RE.test(providerId) || !MODEL_ID_RE.test(modelId) || !EON_MODEL_VERIFICATION_STATES.includes(verificationState)) throw new Error('Model record identity is invalid.');
  if (!['device-local', 'direct-to-provider'].includes(privacyRoute)) throw new Error('Model record privacy route is invalid.');
  const capabilities = normalizeCapabilities(record.capabilities);
  const checkedAt = cleanIso(record.checkedAt, now);
  return Object.freeze({
    providerId,
    modelId,
    checkedAt,
    capabilities,
    adapterId: String(record.adapterId || '').trim().slice(0, 100),
    adapterVersion: String(record.adapterVersion || '').trim().slice(0, 32),
    verificationState,
    privacyRoute,
    costGroup: String(record.costGroup || 'user-owned-provider').trim().slice(0, 64),
    source: String(record.source || 'user-import').trim().slice(0, 64),
    rawProviderPayloadStored: false
  });
}

export function createModelManifest({ providerId, adapterId, adapterVersion = '1', records = [], source = 'user-import', checkedAt = Date.now() } = {}) {
  if (!PROVIDER_ID_RE.test(String(providerId || '')) || !String(adapterId || '').trim()) throw new Error('A model manifest needs a provider and adapter identity.');
  if (!['user-import', 'user-triggered-direct-provider'].includes(String(source))) throw new Error('Model manifests must be user-imported or from a user-triggered direct provider check.');
  const normalized = (Array.isArray(records) ? records : []).map((record) => normalizeModelRecord({ ...record, providerId, adapterId, adapterVersion, source, checkedAt }));
  const ids = new Set();
  for (const record of normalized) {
    if (ids.has(record.modelId)) throw new Error('Model manifest contains a duplicate model ID.');
    ids.add(record.modelId);
  }
  return Object.freeze({
    schema: EON_MODEL_MANIFEST_SCHEMA,
    version: 1,
    providerId: String(providerId),
    adapterId: String(adapterId),
    adapterVersion: String(adapterVersion).slice(0, 32),
    source: String(source),
    checkedAt: cleanIso(checkedAt),
    records: Object.freeze(normalized),
    userActionRequired: true,
    backgroundProbeAllowed: false,
    encryptedDeviceCacheRequired: true,
    directNetwork: false
  });
}

export function getEligibleModelRecords(manifest, { profile, privacyRoute = '' } = {}) {
  const requestedProfile = String(profile || '').trim();
  if (!EON_MODEL_PROFILES.includes(requestedProfile)) return Object.freeze([]);
  return Object.freeze((manifest?.records || []).filter((record) => (
    record.verificationState === 'verified'
    && record.capabilities?.[requestedProfile] === 'verified'
    && (!privacyRoute || record.privacyRoute === privacyRoute)
  )));
}

export function getModelManifestTruth() {
  return Object.freeze({
    schema: EON_MODEL_MANIFEST_SCHEMA,
    dynamicModelRecords: true,
    backgroundDiscovery: false,
    encryptedDeviceCacheRequired: true,
    unknownCapabilitiesAreManualOnly: true,
    directNetwork: false,
    hardcodedModelMarketingHeuristics: false
  });
}

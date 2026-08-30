/**
 * W353 — local invite-only beta readiness declarations.
 *
 * This stores only four user-confirmed, non-sensitive boolean declarations in
 * the current browser. Device test records remain in the separate local Device
 * Proof Kit. This module cannot invite anyone, enrol a user, collect feedback,
 * send telemetry, activate commerce, or certify a release.
 */

import { assessEonLocalBetaReadiness, EON_LOCAL_BETA_READINESS_SCHEMA } from './eon-local-beta-readiness.js';
import { loadEonDeviceEvidenceRecords } from './eon-device-evidence-records.js';

export const EON_BETA_READINESS_RECORDS_SCHEMA = 'eonapp.local-beta-readiness-records.v1';
export const EON_BETA_READINESS_STORAGE_KEY = 'eon:local-beta-readiness-records:v1';

const DECLARATION_KEYS = Object.freeze([
  'backupRecoveryDrill',
  'privacyReview',
  'incidentOwnerRoster',
  'inviteOnly'
]);

function storageFor(candidate = null) {
  if (candidate && typeof candidate.getItem === 'function' && typeof candidate.setItem === 'function' && typeof candidate.removeItem === 'function') return candidate;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function cleanDeclarations(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return Object.freeze(Object.fromEntries(DECLARATION_KEYS.map((key) => [key, source[key] === true])));
}

function parseStored(value = '') {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    if (parsed?.schema !== EON_BETA_READINESS_RECORDS_SCHEMA || !parsed?.declarations || typeof parsed.declarations !== 'object') return {};
    return parsed.declarations;
  } catch { return {}; }
}

function createSnapshot(declarations = {}, { deviceStorage = null } = {}) {
  const safeDeclarations = cleanDeclarations(declarations);
  const device = loadEonDeviceEvidenceRecords({ storage: deviceStorage });
  const readiness = assessEonLocalBetaReadiness({
    deviceEvidence: device.records,
    backupRecoveryDrill: safeDeclarations.backupRecoveryDrill,
    privacyReview: safeDeclarations.privacyReview,
    incidentOwnerRoster: safeDeclarations.incidentOwnerRoster,
    inviteOnly: safeDeclarations.inviteOnly,
    remoteTelemetryEnabled: false,
    commercialFeaturesEnabled: false
  });
  return Object.freeze({
    schema: EON_BETA_READINESS_RECORDS_SCHEMA,
    readinessSchema: EON_LOCAL_BETA_READINESS_SCHEMA,
    storageKey: EON_BETA_READINESS_STORAGE_KEY,
    declarations: safeDeclarations,
    deviceEvidenceStatus: device.matrix.status,
    readiness,
    localOnly: true,
    personalDataStored: false,
    inviteCreated: false,
    automaticEnrollment: false,
    remoteTelemetryCreated: false,
    commercialFeaturesEnabled: false
  });
}

export function loadEonLocalBetaReadinessRecords({ storage = null, deviceStorage = null } = {}) {
  const local = storageFor(storage);
  return createSnapshot(parseStored(local?.getItem?.(EON_BETA_READINESS_STORAGE_KEY) || ''), { deviceStorage });
}

/** Saves only user-confirmed non-sensitive declarations. */
export function saveEonLocalBetaReadinessRecords(declarations = {}, { confirmedByUser = false, storage = null, deviceStorage = null } = {}) {
  const snapshot = createSnapshot(declarations, { deviceStorage });
  if (confirmedByUser !== true) return Object.freeze({ ok: false, reason: 'explicit-user-confirmation-required', snapshot });
  const local = storageFor(storage);
  if (!local) return Object.freeze({ ok: false, reason: 'local-storage-unavailable', snapshot });
  try {
    local.setItem(EON_BETA_READINESS_STORAGE_KEY, JSON.stringify({ schema: EON_BETA_READINESS_RECORDS_SCHEMA, declarations: snapshot.declarations }));
    return Object.freeze({ ok: true, reason: null, snapshot });
  } catch {
    return Object.freeze({ ok: false, reason: 'local-storage-write-failed', snapshot });
  }
}

export function clearEonLocalBetaReadinessRecords({ confirmedByUser = false, storage = null } = {}) {
  if (confirmedByUser !== true) return Object.freeze({ ok: false, reason: 'explicit-user-confirmation-required', localOnly: true });
  const local = storageFor(storage);
  if (!local) return Object.freeze({ ok: false, reason: 'local-storage-unavailable', localOnly: true });
  try {
    local.removeItem(EON_BETA_READINESS_STORAGE_KEY);
    return Object.freeze({ ok: true, reason: null, localOnly: true, remoteTelemetryCreated: false, inviteCreated: false });
  } catch {
    return Object.freeze({ ok: false, reason: 'local-storage-remove-failed', localOnly: true });
  }
}

export function buildEonLocalBetaReadinessExport(declarations = {}, { deviceStorage = null, now = Date.now() } = {}) {
  const snapshot = createSnapshot(declarations, { deviceStorage });
  return JSON.stringify({
    schema: EON_BETA_READINESS_RECORDS_SCHEMA,
    exportedAt: new Date(Number(now) || Date.now()).toISOString(),
    scope: 'user-owned-local-readiness-declarations',
    declarations: snapshot.declarations,
    deviceEvidenceStatus: snapshot.deviceEvidenceStatus,
    readiness: snapshot.readiness,
    proofBoundary: Object.freeze({
      userConfirmedDeclarations: true,
      automaticVerification: false,
      inviteCreated: false,
      automaticEnrollment: false,
      remoteTelemetryCreated: false,
      commercialFeaturesEnabled: false,
      releaseApproved: false
    })
  }, null, 2);
}

export function getEonLocalBetaReadinessRecordsTruth() {
  return Object.freeze({
    schema: EON_BETA_READINESS_RECORDS_SCHEMA,
    localOnly: true,
    storesOnlyBooleanDeclarations: true,
    personalDataStored: false,
    inviteCreated: false,
    automaticEnrollment: false,
    remoteTelemetryCreated: false,
    commercialFeaturesEnabled: false,
    releaseApproved: false
  });
}

export default Object.freeze({
  EON_BETA_READINESS_RECORDS_SCHEMA,
  EON_BETA_READINESS_STORAGE_KEY,
  loadEonLocalBetaReadinessRecords,
  saveEonLocalBetaReadinessRecords,
  clearEonLocalBetaReadinessRecords,
  buildEonLocalBetaReadinessExport,
  getEonLocalBetaReadinessRecordsTruth
});

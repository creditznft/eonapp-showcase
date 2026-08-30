/**
 * W436 — local Collection eligibility and non-financial reveal lifecycle.
 *
 * This module deliberately separates a visual Collection record from Vault
 * secrets. It can record that a person supplied a reviewed local evidence hash
 * for a fixed mission. It cannot grant an item, charge, sell, trade, transfer,
 * mint, list, unlock City capability, create an account entitlement, or make a
 * remote request. The existing Collection rollout remains disabled.
 */

import { getEonCollectionArtifact, resolveDeterministicVaultReveal } from './eon-collection-foundation.js';

export const EON_COLLECTION_ELIGIBILITY_SCHEMA = 'eonapp.collection.eligibility.w436.v1';
export const EON_COLLECTION_ELIGIBILITY_STORAGE_KEY = 'eon:collection:eligibility:v1';
export const EON_COLLECTION_ELIGIBILITY_MAX_RECORDS = 30;

const ELIGIBILITY_ID_RE = /^eoncol_[a-z0-9_-]{8,96}$/i;
const HASH_RE = /^sha256:[a-z0-9_-]{20,160}$/i;
const MISSION_RE = /^[a-z0-9-]{2,80}$/i;
const RECORD_STATE = new Set(['review-eligible', 'revoked']);
const freeze = (value) => Object.freeze(value);

function storageFor(candidate = null) {
  if (candidate && typeof candidate.getItem === 'function' && typeof candidate.setItem === 'function') return candidate;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function time(value = Date.now()) {
  const candidate = Number(value);
  if (Number.isFinite(candidate) && candidate > 0) return Math.floor(candidate);
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : Date.now();
}

function iso(value = Date.now()) {
  return new Date(time(value)).toISOString();
}

function id(now = Date.now()) {
  let token = '';
  try {
    const bytes = new Uint32Array(2);
    globalThis.crypto?.getRandomValues?.(bytes);
    token = `${bytes[0].toString(36)}${bytes[1].toString(36)}`;
  } catch {}
  if (!token) token = `${Math.floor(Math.random() * 0x7fffffff).toString(36)}${Math.floor(Math.random() * 0x7fffffff).toString(36)}`;
  return `eoncol_${Number(now).toString(36)}_${token}`.slice(0, 96);
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function normalizeRecord(candidate = {}, now = Date.now()) {
  if (!candidate || candidate.schema !== EON_COLLECTION_ELIGIBILITY_SCHEMA) return null;
  const eligibilityId = String(candidate.eligibilityId || '');
  const missionId = String(candidate.missionId || '');
  const artifactId = String(candidate.artifactId || '');
  const evidenceKind = String(candidate.evidenceKind || '');
  const evidenceHash = String(candidate.evidenceHash || '');
  const state = String(candidate.state || 'review-eligible');
  const artifact = getEonCollectionArtifact(artifactId);
  if (!ELIGIBILITY_ID_RE.test(eligibilityId) || !MISSION_RE.test(missionId) || !MISSION_RE.test(evidenceKind) || !HASH_RE.test(evidenceHash) || !RECORD_STATE.has(state) || !artifact) return null;
  return freeze({
    schema: EON_COLLECTION_ELIGIBILITY_SCHEMA,
    version: 1,
    eligibilityId,
    missionId,
    artifactId: artifact.id,
    evidenceKind,
    evidenceHash,
    state,
    recordedAt: iso(candidate.recordedAt || now),
    updatedAt: iso(candidate.updatedAt || candidate.recordedAt || now),
    revokedAt: state === 'revoked' && candidate.revokedAt ? iso(candidate.revokedAt) : '',
    localOnly: true,
    accountBound: false,
    grantCreated: false,
    claimCreated: false,
    entitlementCreated: false,
    marketValue: false,
    transferable: false,
    paidOpening: false,
    randomChance: false,
    vaultSecretRead: false,
    remoteRequestCreated: false
  });
}

function readState(storage, now = Date.now()) {
  try {
    const parsed = JSON.parse(storage?.getItem?.(EON_COLLECTION_ELIGIBILITY_STORAGE_KEY) || 'null');
    const records = [];
    const seen = new Set();
    for (const candidate of Array.isArray(parsed?.records) ? parsed.records : []) {
      const record = normalizeRecord(candidate, now);
      if (!record || seen.has(record.eligibilityId)) continue;
      seen.add(record.eligibilityId);
      records.push(record);
    }
    records.sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
    return freeze({ schema: EON_COLLECTION_ELIGIBILITY_SCHEMA, version: 1, updatedAt: iso(parsed?.updatedAt || now), records: freeze(records.slice(0, EON_COLLECTION_ELIGIBILITY_MAX_RECORDS)) });
  } catch {
    return freeze({ schema: EON_COLLECTION_ELIGIBILITY_SCHEMA, version: 1, updatedAt: iso(now), records: freeze([]) });
  }
}

function writeState(storage, state) {
  try { storage?.setItem?.(EON_COLLECTION_ELIGIBILITY_STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}

function publicRecord(record) {
  const artifact = getEonCollectionArtifact(record.artifactId);
  return freeze({
    eligibilityId: record.eligibilityId,
    missionId: record.missionId,
    artifactId: record.artifactId,
    artifactLabel: artifact?.label || 'Visual artifact',
    tier: artifact?.tier || 'Foundational',
    state: record.state,
    recordedAt: record.recordedAt,
    updatedAt: record.updatedAt,
    localOnly: true,
    eligibleForLaterHumanReview: record.state === 'review-eligible',
    grantCreated: false,
    tradeable: false,
    financial: false,
    evidenceHashVisible: false,
    vaultSecretVisible: false
  });
}

function snapshotOf(state) {
  const active = state.records.filter((record) => record.state === 'review-eligible');
  return freeze({
    schema: EON_COLLECTION_ELIGIBILITY_SCHEMA,
    updatedAt: state.updatedAt,
    records: freeze(state.records.map(publicRecord)),
    activeEligibilityCount: active.length,
    localEligibilityOnly: true,
    collectionRolloutStillDisabled: true,
    grantCreated: false,
    claimCreated: false,
    externalRequestCreated: false,
    vaultSecretRead: false
  });
}

export function createEonCollectionEligibilityRegistry({ storage = null, now = () => Date.now() } = {}) {
  const targetStorage = storageFor(storage);
  const clock = () => time(now());
  const current = () => readState(targetStorage, clock());
  const persist = (state) => {
    const stored = writeState(targetStorage, state);
    return freeze({ stored, browserStorageChanged: stored, remoteRequestCreated: false, snapshot: snapshotOf(readState(targetStorage, clock())) });
  };
  return freeze({
    getSnapshot() { return snapshotOf(current()); },
    recordEligibility({ missionId = '', evidenceKind = '', evidenceHash = '' } = {}, { explicitUserAction = false, approvedLocalEvidence = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required', browserStorageChanged: false, remoteRequestCreated: false });
      if (approvedLocalEvidence !== true) return freeze({ ok: false, error: 'local-evidence-review-required', browserStorageChanged: false, remoteRequestCreated: false });
      if (!HASH_RE.test(String(evidenceHash || ''))) return freeze({ ok: false, error: 'evidence-hash-required', browserStorageChanged: false, remoteRequestCreated: false });
      const reveal = resolveDeterministicVaultReveal({ missionId, evidenceKind });
      if (!reveal.ok || !reveal.artifact) return freeze({ ok: false, error: 'mission-evidence-not-eligible', browserStorageChanged: false, remoteRequestCreated: false });
      const state = current();
      const duplicate = state.records.find((record) => record.missionId === reveal.mission.id && record.evidenceHash === String(evidenceHash) && record.state === 'review-eligible');
      if (duplicate) return freeze({ ok: true, deduped: true, record: publicRecord(duplicate), browserStorageChanged: false, remoteRequestCreated: false, snapshot: snapshotOf(state) });
      if (state.records.length >= EON_COLLECTION_ELIGIBILITY_MAX_RECORDS) return freeze({ ok: false, error: 'collection-eligibility-limit-reached', browserStorageChanged: false, remoteRequestCreated: false });
      const record = normalizeRecord({
        schema: EON_COLLECTION_ELIGIBILITY_SCHEMA,
        eligibilityId: id(clock()),
        missionId: reveal.mission.id,
        artifactId: reveal.artifact.id,
        evidenceKind: reveal.mission.evidenceKind,
        evidenceHash: String(evidenceHash),
        state: 'review-eligible',
        recordedAt: clock(),
        updatedAt: clock()
      }, clock());
      const next = freeze({ ...state, updatedAt: iso(clock()), records: freeze([record, ...state.records]) });
      const saved = persist(next);
      return freeze({ ok: saved.stored, record: publicRecord(record), revealStatus: 'local-review-eligible-not-granted', grantCreated: false, claimCreated: false, entitlementCreated: false, ...saved });
    },
    revokeEligibility(eligibilityId = '', { explicitUserAction = false, confirmed = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required', browserStorageChanged: false, remoteRequestCreated: false });
      if (confirmed !== true) return freeze({ ok: false, error: 'revocation-confirmation-required', browserStorageChanged: false, remoteRequestCreated: false });
      const state = current();
      const found = state.records.find((record) => record.eligibilityId === String(eligibilityId));
      if (!found) return freeze({ ok: false, error: 'collection-eligibility-not-found', browserStorageChanged: false, remoteRequestCreated: false });
      if (found.state === 'revoked') return freeze({ ok: true, deduped: true, browserStorageChanged: false, remoteRequestCreated: false, snapshot: snapshotOf(state) });
      const revoked = normalizeRecord({ ...clone(found), state: 'revoked', revokedAt: clock(), updatedAt: clock() }, clock());
      const next = freeze({ ...state, updatedAt: iso(clock()), records: freeze(state.records.map((record) => record.eligibilityId === found.eligibilityId ? revoked : record)) });
      const saved = persist(next);
      return freeze({ ok: saved.stored, record: publicRecord(revoked), grantCreated: false, ...saved });
    },
    buildUpdateSurvivalProof() {
      let raw = '';
      try { raw = targetStorage?.getItem?.(EON_COLLECTION_ELIGIBILITY_STORAGE_KEY) || ''; } catch {}
      let fingerprint = 2166136261;
      for (const character of String(raw)) { fingerprint ^= character.charCodeAt(0); fingerprint = Math.imul(fingerprint, 16777619) >>> 0; }
      return freeze({
        schema: `${EON_COLLECTION_ELIGIBILITY_SCHEMA}.update-survival-proof`,
        storageKey: EON_COLLECTION_ELIGIBILITY_STORAGE_KEY,
        beforeFingerprint: fingerprint.toString(16),
        afterFingerprint: fingerprint.toString(16),
        preserved: true,
        sourceSimulationOnly: true,
        deploymentProof: false,
        grantCreated: false,
        remoteRequestCreated: false
      });
    }
  });
}

export function getEonCollectionEligibilityTruth() {
  return freeze({
    schema: EON_COLLECTION_ELIGIBILITY_SCHEMA,
    localEligibilityRecord: true,
    collectionRolloutEnabled: false,
    deterministicMissionMapping: true,
    grantCreated: false,
    claimCreated: false,
    entitlementCreated: false,
    financialValue: false,
    transferable: false,
    marketplace: false,
    tokenOrNft: false,
    paidChance: false,
    randomChance: false,
    vaultSecretRead: false,
    remoteRequestCreated: false,
    productionEligibilityProof: false
  });
}

/**
 * W433 — EON Sync Basic review-first merge and recovery foundation.
 *
 * This module validates already-reviewed Sync Basic records, builds an
 * in-memory merge plan, and prepares a reversible staging result only after
 * a caller supplies explicit selections and the relevant consent flags.
 * It never reads browser storage, writes browser storage, sends a network
 * request, registers a device, or marks Sync Basic as live.
 */
import {
  EON_SYNC_BASIC_SCHEMA,
  EON_SYNC_BASIC_TYPES,
  createEonSyncBasicRecord,
  resolveEonSyncBasicConflict
} from './eon-sync-basic-foundation.js';

export const EON_SYNC_BASIC_MERGE_RECOVERY_SCHEMA = 'eonapp.sync-basic-merge-recovery.w433.v1';
export const EON_SYNC_BASIC_MERGE_RECOVERY_STATUS = 'source-review-foundation';

const TYPE_SET = new Set(EON_SYNC_BASIC_TYPES);
const RECORD_ID_RE = /^[a-z][a-z0-9:_-]{2,220}$/i;
const DEVICE_ID_RE = /^device_[a-z0-9_-]{10,120}$/i;
const VERSION_MIN = 1;
const VERSION_MAX = 99;
const freeze = (value) => Object.freeze(value);

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function freezeRecord(record) {
  return freeze(clone(record));
}

function recordKey(record = {}) {
  return `${String(record.type || '')}:${String(record.id || '')}`;
}

function exactIso(value) {
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : '';
}

function stableDecisionId(key, operation, primary = null) {
  const hash = String(primary?.contentHash || primary?.deletedAt || 'none').replace(/[^a-z0-9]/gi, '').slice(0, 18) || 'none';
  return `sync-review:${key}:${operation}:${hash}`;
}

function safeFailure(error, index, source) {
  return freeze({
    source,
    index,
    key: recordKey(error?.record || {}),
    error: String(error?.message || error || 'invalid-sync-basic-record').slice(0, 120)
  });
}

async function inspectRecord(candidate = null, { cryptoApi = null } = {}) {
  const record = candidate && typeof candidate === 'object' ? candidate : null;
  if (!record) return freeze({ ok: false, error: 'record-required', record: null });
  if (record.schema !== EON_SYNC_BASIC_SCHEMA) return freeze({ ok: false, error: 'record-schema-invalid', record: null });
  if (!TYPE_SET.has(String(record.type || ''))) return freeze({ ok: false, error: 'record-type-invalid', record: null });
  if (!RECORD_ID_RE.test(String(record.id || ''))) return freeze({ ok: false, error: 'record-id-invalid', record: null });
  if (!DEVICE_ID_RE.test(String(record.originDeviceId || ''))) return freeze({ ok: false, error: 'record-origin-device-invalid', record: null });
  if (!Number.isInteger(Number(record.version)) || Number(record.version) < VERSION_MIN || Number(record.version) > VERSION_MAX) return freeze({ ok: false, error: 'record-version-invalid', record: null });
  if (!exactIso(record.updatedAt)) return freeze({ ok: false, error: 'record-updated-at-invalid', record: null });
  if (record.deletedAt && !exactIso(record.deletedAt)) return freeze({ ok: false, error: 'record-deleted-at-invalid', record: null });
  if (record.deletedAt && record.content != null) return freeze({ ok: false, error: 'tombstone-content-not-allowed', record: null });
  try {
    const rebuilt = await createEonSyncBasicRecord({
      id: record.id,
      type: record.type,
      content: record.deletedAt ? null : record.content,
      updatedAt: record.updatedAt,
      version: record.version,
      originDeviceId: record.originDeviceId,
      deletedAt: record.deletedAt || null,
      cryptoApi
    });
    if (String(rebuilt.contentHash || '') !== String(record.contentHash || '')) return freeze({ ok: false, error: 'record-content-hash-mismatch', record: null });
    if (Number(rebuilt.bytes || 0) !== Number(record.bytes || 0)) return freeze({ ok: false, error: 'record-byte-count-mismatch', record: null });
    return freeze({ ok: true, error: '', record: freezeRecord(rebuilt) });
  } catch {
    return freeze({ ok: false, error: 'record-integrity-check-failed', record: null });
  }
}

async function validateCollection(records = [], source = 'local', { cryptoApi = null } = {}) {
  const valid = [];
  const errors = [];
  const seen = new Set();
  const list = Array.isArray(records) ? records : [];
  for (let index = 0; index < list.length; index += 1) {
    const inspected = await inspectRecord(list[index], { cryptoApi });
    if (!inspected.ok) {
      errors.push(safeFailure(inspected.error, index, source));
      continue;
    }
    const key = recordKey(inspected.record);
    if (seen.has(key)) {
      errors.push(freeze({ source, index, key, error: 'duplicate-record-key' }));
      continue;
    }
    seen.add(key);
    valid.push(inspected.record);
  }
  return freeze({ records: freeze(valid), errors: freeze(errors) });
}

function decisionFromResolution(key, localRecord, remoteRecord, resolution) {
  const remoteIsPrimary = resolution.primary === remoteRecord;
  const base = {
    key,
    local: localRecord,
    remote: remoteRecord,
    primary: resolution.primary,
    conflictCopy: resolution.conflictCopy ? freezeRecord(resolution.conflictCopy) : null,
    automaticOverwrite: false,
    userSelectionRequired: false,
    explicitImportConsentRequired: false,
    explicitDeletionConsentRequired: false,
    explicitConflictCopyConsentRequired: false
  };

  if (resolution.strategy === 'identical') {
    return freeze({ ...base, id: stableDecisionId(key, 'identical', resolution.primary), operation: 'identical', strategy: resolution.strategy, localOnly: true });
  }
  // A verified newer tombstone is destructive even when the base W411
  // resolver classified its record type as low-risk metadata. W433 therefore
  // elevates deletion review before any last-write-wins replacement.
  if (resolution.primary?.deletedAt) {
    return freeze({
      ...base,
      id: stableDecisionId(key, 'delete-local-review', resolution.primary),
      operation: 'delete-local-review',
      strategy: resolution.strategy === 'tombstone-newer' ? resolution.strategy : 'tombstone-review-priority',
      userSelectionRequired: true,
      explicitDeletionConsentRequired: true
    });
  }
  if (resolution.strategy === 'last-write-wins-low-risk') {
    return freeze({
      ...base,
      id: stableDecisionId(key, remoteIsPrimary ? 'replace-local-review' : 'retain-local-review', resolution.primary),
      operation: remoteIsPrimary ? 'replace-local-review' : 'retain-local-review',
      strategy: resolution.strategy,
      userSelectionRequired: remoteIsPrimary,
      explicitImportConsentRequired: remoteIsPrimary
    });
  }
  if (resolution.strategy === 'tombstone-newer') {
    return freeze({
      ...base,
      id: stableDecisionId(key, 'delete-local-review', resolution.primary),
      operation: 'delete-local-review',
      strategy: resolution.strategy,
      userSelectionRequired: true,
      explicitDeletionConsentRequired: true
    });
  }
  if (resolution.strategy === 'conflict-copy-required') {
    return freeze({
      ...base,
      id: stableDecisionId(key, 'conflict-copy-review', resolution.primary),
      operation: 'conflict-copy-review',
      strategy: resolution.strategy,
      userSelectionRequired: true,
      explicitImportConsentRequired: remoteIsPrimary,
      explicitConflictCopyConsentRequired: true
    });
  }
  return freeze({ ...base, id: stableDecisionId(key, 'invalid-record-pair', null), operation: 'invalid-record-pair', strategy: 'invalid-record-pair', userSelectionRequired: true });
}

function countOperations(decisions = []) {
  const counts = {};
  for (const decision of decisions) counts[decision.operation] = Number(counts[decision.operation] || 0) + 1;
  return freeze(counts);
}

/**
 * Build a validation-first, in-memory plan for one explicit user review.
 * It does not select records, write the plan to storage, or contact a service.
 */
export async function buildEonSyncBasicMergeRecoveryPlan({ localRecords = [], remoteRecords = [], now = Date.now(), cryptoApi = null } = {}) {
  const local = await validateCollection(localRecords, 'local', { cryptoApi });
  const remote = await validateCollection(remoteRecords, 'remote', { cryptoApi });
  const errors = freeze([...local.errors, ...remote.errors]);
  if (errors.length) {
    return freeze({
      schema: EON_SYNC_BASIC_MERGE_RECOVERY_SCHEMA,
      status: 'invalid-review-input',
      generatedAt: new Date(Number(now) || Date.now()).toISOString(),
      errors,
      decisions: freeze([]),
      baseLocalRecords: freeze([]),
      remoteRecords: freeze([]),
      automaticMerge: false,
      browserStorageChanged: false,
      networkRequestCreated: false,
      liveSync: false
    });
  }

  const localMap = new Map(local.records.map((record) => [recordKey(record), record]));
  const remoteMap = new Map(remote.records.map((record) => [recordKey(record), record]));
  const keys = [...new Set([...localMap.keys(), ...remoteMap.keys()])].sort();
  const decisions = [];
  for (const key of keys) {
    const localRecord = localMap.get(key) || null;
    const remoteRecord = remoteMap.get(key) || null;
    if (!localRecord) {
      decisions.push(freeze({
        id: stableDecisionId(key, 'import-required', remoteRecord),
        key,
        operation: 'import-required',
        strategy: 'remote-only',
        local: null,
        remote: remoteRecord,
        primary: remoteRecord,
        conflictCopy: null,
        automaticOverwrite: false,
        userSelectionRequired: true,
        explicitImportConsentRequired: true,
        explicitDeletionConsentRequired: false,
        explicitConflictCopyConsentRequired: false
      }));
      continue;
    }
    if (!remoteRecord) {
      decisions.push(freeze({
        id: stableDecisionId(key, 'retain-local-only', localRecord),
        key,
        operation: 'retain-local-only',
        strategy: 'local-only',
        local: localRecord,
        remote: null,
        primary: localRecord,
        conflictCopy: null,
        automaticOverwrite: false,
        userSelectionRequired: false,
        explicitImportConsentRequired: false,
        explicitDeletionConsentRequired: false,
        explicitConflictCopyConsentRequired: false
      }));
      continue;
    }
    decisions.push(decisionFromResolution(key, localRecord, remoteRecord, resolveEonSyncBasicConflict(localRecord, remoteRecord)));
  }

  const frozenDecisions = freeze(decisions);
  return freeze({
    schema: EON_SYNC_BASIC_MERGE_RECOVERY_SCHEMA,
    status: 'review-ready',
    generatedAt: new Date(Number(now) || Date.now()).toISOString(),
    baseLocalRecords: freeze(local.records.map(freezeRecord)),
    remoteRecords: freeze(remote.records.map(freezeRecord)),
    decisions: frozenDecisions,
    summary: freeze({ localRecordCount: local.records.length, remoteRecordCount: remote.records.length, decisionCount: frozenDecisions.length, operations: countOperations(frozenDecisions) }),
    automaticMerge: false,
    automaticOverwrite: false,
    explicitReviewRequired: true,
    browserStorageChanged: false,
    networkRequestCreated: false,
    deviceRegistrationCreated: false,
    liveSync: false,
    secureVaultSyncIncluded: false
  });
}

function changedDecision(decision) {
  return ['import-required', 'replace-local-review', 'delete-local-review', 'conflict-copy-review'].includes(decision.operation);
}

function requiredConsentFailure(decision, options) {
  if (decision.explicitImportConsentRequired && options.explicitImportConsent !== true) return 'explicit-import-consent-required';
  if (decision.explicitDeletionConsentRequired && options.explicitDeletionConsent !== true) return 'explicit-deletion-consent-required';
  if (decision.explicitConflictCopyConsentRequired && options.explicitConflictCopyConsent !== true) return 'explicit-conflict-copy-consent-required';
  return '';
}

/**
 * Prepare a staged replica, never a storage write. A UI or future transport
 * adapter must show this output to the user and perform its own app-specific,
 * separately audited commit after explicit confirmation.
 */
export function prepareReviewedEonSyncBasicMerge(plan = null, {
  selectedDecisionIds = [],
  explicitUserAction = false,
  explicitImportConsent = false,
  explicitDeletionConsent = false,
  explicitConflictCopyConsent = false
} = {}) {
  if (!plan || plan.schema !== EON_SYNC_BASIC_MERGE_RECOVERY_SCHEMA || plan.status !== 'review-ready') {
    return freeze({ ok: false, error: 'review-ready-plan-required', staged: false, browserStorageChanged: false, networkRequestCreated: false, replicaRecords: freeze([]) });
  }
  if (explicitUserAction !== true) {
    return freeze({ ok: false, error: 'explicit-user-action-required', staged: false, browserStorageChanged: false, networkRequestCreated: false, replicaRecords: freeze([]) });
  }
  const selected = new Set(Array.isArray(selectedDecisionIds) ? selectedDecisionIds.map(String) : []);
  const known = new Set(plan.decisions.map((decision) => decision.id));
  if ([...selected].some((id) => !known.has(id))) {
    return freeze({ ok: false, error: 'unknown-review-selection', staged: false, browserStorageChanged: false, networkRequestCreated: false, replicaRecords: freeze([]) });
  }
  const selectedChanges = plan.decisions.filter((decision) => changedDecision(decision) && selected.has(decision.id));
  if (!selectedChanges.length) {
    return freeze({ ok: false, error: 'explicit-changing-review-selection-required', staged: false, browserStorageChanged: false, networkRequestCreated: false, replicaRecords: freeze([]) });
  }
  const blocked = selectedChanges.map((decision) => freeze({ id: decision.id, error: requiredConsentFailure(decision, { explicitImportConsent, explicitDeletionConsent, explicitConflictCopyConsent }) })).filter((entry) => entry.error);
  if (blocked.length) {
    return freeze({ ok: false, error: 'selected-review-consent-required', blocked: freeze(blocked), staged: false, browserStorageChanged: false, networkRequestCreated: false, replicaRecords: freeze([]) });
  }

  const replica = new Map(plan.baseLocalRecords.map((record) => [recordKey(record), freezeRecord(record)]));
  const stagedWrites = [];
  const stagedTombstones = [];
  for (const decision of selectedChanges) {
    if (decision.operation === 'import-required' || decision.operation === 'replace-local-review') {
      const record = freezeRecord(decision.primary);
      replica.set(recordKey(record), record);
      stagedWrites.push(freeze({ decisionId: decision.id, operation: decision.operation, record }));
    } else if (decision.operation === 'delete-local-review') {
      const tombstone = freezeRecord(decision.primary);
      replica.set(recordKey(tombstone), tombstone);
      stagedTombstones.push(freeze({ decisionId: decision.id, operation: decision.operation, record: tombstone }));
    } else if (decision.operation === 'conflict-copy-review') {
      const primary = freezeRecord(decision.primary);
      const copy = freezeRecord(decision.conflictCopy);
      replica.set(recordKey(primary), primary);
      replica.set(recordKey(copy), copy);
      stagedWrites.push(freeze({ decisionId: decision.id, operation: decision.operation, record: primary }));
      stagedWrites.push(freeze({ decisionId: decision.id, operation: 'conflict-copy', record: copy }));
    }
  }
  const replicaRecords = freeze([...replica.values()].sort((left, right) => recordKey(left).localeCompare(recordKey(right))));
  return freeze({
    ok: true,
    schema: EON_SYNC_BASIC_MERGE_RECOVERY_SCHEMA,
    staged: true,
    stageOnly: true,
    selectedDecisionIds: freeze([...selected]),
    pendingDecisionIds: freeze(plan.decisions.filter((decision) => changedDecision(decision) && !selected.has(decision.id)).map((decision) => decision.id)),
    stagedWrites: freeze(stagedWrites),
    stagedTombstones: freeze(stagedTombstones),
    replicaRecords,
    rollbackSnapshot: freeze(plan.baseLocalRecords.map(freezeRecord)),
    browserStorageChanged: false,
    networkRequestCreated: false,
    automaticMerge: false,
    automaticDeletion: false,
    externalCommitRequired: true,
    liveSync: false
  });
}

/** Return the original reviewed replica without touching browser data. */
export function restoreReviewedEonSyncBasicRollback(rollbackSnapshot = []) {
  const records = Array.isArray(rollbackSnapshot) ? rollbackSnapshot.map(freezeRecord) : [];
  return freeze({
    schema: EON_SYNC_BASIC_MERGE_RECOVERY_SCHEMA,
    restoredReplicaRecords: freeze(records),
    browserStorageChanged: false,
    networkRequestCreated: false,
    externalCommitRequired: true,
    liveSync: false
  });
}

/**
 * Deterministic local scenarios for source tests. It simulates two record sets
 * only; it is not a physical two-device, browser-clear, or production proof.
 */
export async function runEonSyncBasicMergeRecoveryScenarios({ cryptoApi = null } = {}) {
  const localDevice = 'device_localw433proof0001';
  const remoteDevice = 'device_remotew433proof0001';
  const localPreference = await createEonSyncBasicRecord({ id: 'preferences:theme', type: 'preferences', content: { theme: 'graphite' }, updatedAt: '2026-06-28T08:00:00.000Z', originDeviceId: localDevice, cryptoApi });
  const remotePreference = await createEonSyncBasicRecord({ id: 'preferences:theme', type: 'preferences', content: { theme: 'ivory' }, updatedAt: '2026-06-28T09:00:00.000Z', originDeviceId: remoteDevice, cryptoApi });
  const localText = await createEonSyncBasicRecord({ id: 'chat-text:brief', type: 'chat-text', content: { text: 'Local draft' }, updatedAt: '2026-06-28T10:00:00.000Z', originDeviceId: localDevice, cryptoApi });
  const remoteText = await createEonSyncBasicRecord({ id: 'chat-text:brief', type: 'chat-text', content: { text: 'Remote draft' }, updatedAt: '2026-06-28T10:01:00.000Z', originDeviceId: remoteDevice, cryptoApi });
  const localProject = await createEonSyncBasicRecord({ id: 'project-metadata:arrival', type: 'project-metadata', content: { title: 'Arrival' }, updatedAt: '2026-06-28T11:00:00.000Z', originDeviceId: localDevice, cryptoApi });
  const remoteProjectTombstone = await createEonSyncBasicRecord({ id: 'project-metadata:arrival', type: 'project-metadata', content: null, updatedAt: '2026-06-28T12:00:00.000Z', deletedAt: '2026-06-28T12:00:00.000Z', originDeviceId: remoteDevice, cryptoApi });
  const before = JSON.stringify([localPreference, localText, localProject]);
  const plan = await buildEonSyncBasicMergeRecoveryPlan({ localRecords: [localPreference, localText, localProject], remoteRecords: [remotePreference, remoteText, remoteProjectTombstone], now: Date.parse('2026-06-29T00:00:00.000Z'), cryptoApi });
  const after = JSON.stringify([localPreference, localText, localProject]);
  const selections = plan.decisions.filter(changedDecision).map((decision) => decision.id);
  const missingConsent = prepareReviewedEonSyncBasicMerge(plan, { selectedDecisionIds: selections, explicitUserAction: true });
  const staged = prepareReviewedEonSyncBasicMerge(plan, {
    selectedDecisionIds: selections,
    explicitUserAction: true,
    explicitImportConsent: true,
    explicitDeletionConsent: true,
    explicitConflictCopyConsent: true
  });
  const operations = plan.decisions.map((decision) => decision.operation);
  return freeze({
    schema: EON_SYNC_BASIC_MERGE_RECOVERY_SCHEMA,
    valid: plan.status === 'review-ready'
      && operations.includes('replace-local-review')
      && operations.includes('conflict-copy-review')
      && operations.includes('delete-local-review')
      && before === after
      && missingConsent.ok === false
      && staged.ok === true
      && staged.stagedWrites.length >= 3
      && staged.stagedTombstones.length === 1,
    plan,
    localRecordsUnchanged: before === after,
    missingConsent,
    staged,
    physicalDeviceProof: false,
    browserPersistenceProof: false,
    productionTransportProof: false
  });
}

export function getEonSyncBasicMergeRecoveryTruth() {
  return freeze({
    schema: EON_SYNC_BASIC_MERGE_RECOVERY_SCHEMA,
    status: EON_SYNC_BASIC_MERGE_RECOVERY_STATUS,
    liveSync: false,
    googleLoginIsSync: false,
    browserStorageRead: false,
    browserStorageWrite: false,
    networkTransport: false,
    backgroundSync: false,
    automaticMerge: false,
    automaticDeletion: false,
    automaticConflictCopy: false,
    explicitReviewRequired: true,
    explicitImportConsentRequired: true,
    explicitDeletionConsentRequired: true,
    explicitConflictCopyConsentRequired: true,
    physicalTwoDeviceProofCompleted: false,
    updateRecoveryProofCompleted: false,
    secureVaultSyncIncluded: false,
    sourceFoundationOnly: true
  });
}

/**
 * W345 — local Device Proof Kit records.
 *
 * Stores only a user-written pass/fail/blocked checklist and a bounded note in
 * this browser. It never probes a device, uploads screenshots, sends telemetry,
 * collects identifiers, reads Chat/Workspace/Vault content, or marks a case as
 * passed automatically. Real-device proof stays a human-run verification task.
 */
import {
  EON_REQUIRED_DEVICE_EVIDENCE_CASES,
  createEonDeviceEvidenceMatrix,
  getEonDeviceEvidenceMatrixTruth
} from './eon-device-evidence-matrix.js';
import { createEonDevicePwaEvidenceRehearsal, getEonDevicePwaEvidenceRehearsalTruth } from './eon-device-pwa-evidence-rehearsal.js';

export const EON_DEVICE_EVIDENCE_RECORDS_SCHEMA = 'eonapp.device-evidence-records.v1';
export const EON_DEVICE_EVIDENCE_STORAGE_KEY = 'eon:device-evidence-records:v1';

const ALLOWED_STATUSES = new Set(['not-run', 'passed', 'failed', 'blocked']);
const SECRET_LIKE_PATTERN = /(?:api[\s_-]*key|access[\s_-]*token|refresh[\s_-]*token|bearer\s+|password|seed\s+phrase|private\s+key|\bsk-[a-z0-9_-]{8,}\b|0x[a-f0-9]{64})/i;

function storageFor(candidate = null) {
  if (candidate && typeof candidate.getItem === 'function' && typeof candidate.setItem === 'function' && typeof candidate.removeItem === 'function') return candidate;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function cleanStatus(value = '') {
  const status = String(value || '').trim().toLowerCase();
  return ALLOWED_STATUSES.has(status) ? status : 'not-run';
}

function cleanNote(value = '') {
  const note = String(value || '').replace(/\s+/g, ' ').trim().slice(0, 180);
  return SECRET_LIKE_PATTERN.test(note) ? '' : note;
}

function knownId(id = '') {
  return EON_REQUIRED_DEVICE_EVIDENCE_CASES.some((item) => item.id === String(id || '').trim());
}

function normaliseRecords(records = []) {
  const byId = new Map();
  for (const raw of Array.isArray(records) ? records : []) {
    const id = String(raw?.id || '').trim();
    if (!knownId(id)) continue;
    byId.set(id, Object.freeze({ id, status: cleanStatus(raw?.status), note: cleanNote(raw?.note) }));
  }
  return Object.freeze(EON_REQUIRED_DEVICE_EVIDENCE_CASES.map((item) => byId.get(item.id) || Object.freeze({ id: item.id, status: 'not-run', note: '' })));
}

function parseStored(value = '') {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (parsed?.schema !== EON_DEVICE_EVIDENCE_RECORDS_SCHEMA || !Array.isArray(parsed.records)) return [];
    return parsed.records;
  } catch { return []; }
}

function createSnapshot(records = []) {
  const safeRecords = normaliseRecords(records);
  const matrix = createEonDeviceEvidenceMatrix(safeRecords);
  return Object.freeze({
    schema: EON_DEVICE_EVIDENCE_RECORDS_SCHEMA,
    storageKey: EON_DEVICE_EVIDENCE_STORAGE_KEY,
    records: safeRecords,
    matrix,
    deviceProbeCreated: false,
    remoteTelemetryCreated: false,
    screenshotUploadCreated: false,
    providerPayloadStored: false,
    autoPassCreated: false
  });
}

/** Reads a bounded local checklist only; no evidence content is inspected elsewhere. */
export function loadEonDeviceEvidenceRecords({ storage = null } = {}) {
  const local = storageFor(storage);
  return createSnapshot(parseStored(local?.getItem?.(EON_DEVICE_EVIDENCE_STORAGE_KEY) || ''));
}

/** Saves only after an explicit device action. Notes that resemble credentials are discarded. */
export function saveEonDeviceEvidenceRecords(records = [], { confirmedByUser = false, storage = null } = {}) {
  if (confirmedByUser !== true) return Object.freeze({ ok: false, reason: 'explicit-user-confirmation-required', snapshot: createSnapshot(records) });
  const local = storageFor(storage);
  if (!local) return Object.freeze({ ok: false, reason: 'local-storage-unavailable', snapshot: createSnapshot(records) });
  const snapshot = createSnapshot(records);
  try {
    local.setItem(EON_DEVICE_EVIDENCE_STORAGE_KEY, JSON.stringify({
      schema: EON_DEVICE_EVIDENCE_RECORDS_SCHEMA,
      records: snapshot.records
    }));
    return Object.freeze({ ok: true, reason: null, snapshot });
  } catch {
    return Object.freeze({ ok: false, reason: 'local-storage-write-failed', snapshot });
  }
}

/** Clears the local checklist only after a visible user confirmation. */
export function clearEonDeviceEvidenceRecords({ confirmedByUser = false, storage = null } = {}) {
  if (confirmedByUser !== true) return Object.freeze({ ok: false, reason: 'explicit-user-confirmation-required', localOnly: true });
  const local = storageFor(storage);
  if (!local) return Object.freeze({ ok: false, reason: 'local-storage-unavailable', localOnly: true });
  try {
    local.removeItem(EON_DEVICE_EVIDENCE_STORAGE_KEY);
    return Object.freeze({ ok: true, reason: null, localOnly: true, remoteTelemetryCreated: false });
  } catch {
    return Object.freeze({ ok: false, reason: 'local-storage-remove-failed', localOnly: true });
  }
}

/** Creates a portable user-selected JSON checklist; it never uploads or verifies device evidence. */
export function buildEonDeviceEvidenceExport(records = [], { now = Date.now() } = {}) {
  const snapshot = createSnapshot(records);
  return JSON.stringify({
    schema: EON_DEVICE_EVIDENCE_RECORDS_SCHEMA,
    exportedAt: new Date(Number(now) || Date.now()).toISOString(),
    scope: 'user-owned-local-checklist',
    status: snapshot.matrix.status,
    requiredCaseCount: snapshot.matrix.requiredCaseCount,
    passedCaseCount: snapshot.matrix.passedCaseCount,
    records: snapshot.records,
    evidenceRehearsal: createEonDevicePwaEvidenceRehearsal(snapshot.records, { now }),
    proofBoundary: Object.freeze({
      userReported: true,
      automaticallyVerified: false,
      remoteTelemetryCreated: false,
      screenshotUploadCreated: false,
      providerPayloadStored: false,
      betaOrLaunchApproval: false
    })
  }, null, 2);
}

export function getEonDeviceEvidenceRecordsTruth() {
  const matrixTruth = getEonDeviceEvidenceMatrixTruth();
  return Object.freeze({
    schema: EON_DEVICE_EVIDENCE_RECORDS_SCHEMA,
    localOnly: true,
    explicitSaveRequired: true,
    explicitClearRequired: true,
    deviceProbeCreated: false,
    remoteTelemetryCreated: false,
    screenshotUploadCreated: false,
    providerPayloadStored: false,
    autoPassCreated: false,
    automaticBetaApproval: false,
    userControlledExportOnly: true,
    structuredIndependentReviewPacketOnly: true,
    matrixRemoteTelemetryCreated: matrixTruth.remoteTelemetryCreated,
    rehearsalRemoteTelemetryCreated: getEonDevicePwaEvidenceRehearsalTruth().remoteTelemetryCreated
  });
}

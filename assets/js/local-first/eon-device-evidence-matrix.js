/**
 * W341 — local-first device and recovery evidence plan.
 *
 * The plan holds case IDs and status only. It never gathers telemetry, device
 * identifiers, chat content, provider keys, screenshots, or usage histories.
 */

export const EON_DEVICE_EVIDENCE_MATRIX_SCHEMA = 'eonapp.device-evidence-matrix.v1';

export const EON_REQUIRED_DEVICE_EVIDENCE_CASES = Object.freeze([
  Object.freeze({ id: 'desktop-standard', label: 'Desktop browser: local-first Chat, Workspace, and City Lite', required: true }),
  Object.freeze({ id: 'desktop-city-duration', label: 'Desktop City duration: enter, work, exit, re-enter, and observe stable cleanup', required: true }),
  Object.freeze({ id: 'android-4gb', label: '4 GB Android: City Lite, direct-BYOK error handling, and no local-runner promise', required: true }),
  Object.freeze({ id: 'android-city-pwa', label: 'Android: City entry, responsive controls, PWA launch, and safe fallback behaviour', required: true }),
  Object.freeze({ id: 'ios-safari-pwa', label: 'iPhone Safari/PWA: safe areas, install guidance, local state, and no false support claim', required: true }),
  Object.freeze({ id: 'tablet-responsive', label: 'Tablet: layout, touch navigation, City entry, and recovery controls remain usable', required: true }),
  Object.freeze({ id: 'offline', label: 'Offline: local drafts, review, export and City pause states', required: true }),
  Object.freeze({ id: 'pwa-install-update-offline', label: 'PWA install/update/offline: manual install, update prompt, reopen, and offline recovery rehearsal', required: true }),
  Object.freeze({ id: 'private-browsing', label: 'Private browsing: clear storage warning and no false persistence claim', required: true }),
  Object.freeze({ id: 'storage-denied', label: 'Denied/quota-limited storage: safe error and export guidance', required: true }),
  Object.freeze({ id: 'backup-restore', label: 'Encrypted portable backup: export, wrong passphrase, and restore drill', required: true }),
  Object.freeze({ id: 'capsule-recovery-rehearsal', label: 'Portable Workspace Capsule: encrypted export, inspect, wrong passphrase, explicit restore plan, and rollback safety', required: true }),
  Object.freeze({ id: 'direct-byok-failure', label: 'Direct BYOK: provider/network/error disclosure with no silent fallback', required: true }),
  Object.freeze({ id: 'console-network-metrics', label: 'Operator-held console, network, and performance summary: no sensitive payloads copied into this checklist', required: true }),
  Object.freeze({ id: 'screenshot-provenance', label: 'Operator-held screenshot provenance: named review evidence exists outside this browser, without upload here', required: true })
]);

const ALLOWED_STATUSES = new Set(['not-run', 'passed', 'failed', 'blocked']);

function cleanStatus(value = '') {
  const status = String(value || '').trim().toLowerCase();
  return ALLOWED_STATUSES.has(status) ? status : 'not-run';
}

function cleanNote(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 180);
}

export function createEonDeviceEvidenceMatrix(records = []) {
  const byId = new Map();
  for (const raw of Array.isArray(records) ? records : []) {
    const id = String(raw?.id || '').trim();
    if (!EON_REQUIRED_DEVICE_EVIDENCE_CASES.some((item) => item.id === id)) continue;
    byId.set(id, Object.freeze({ status: cleanStatus(raw.status), note: cleanNote(raw.note) }));
  }
  const cases = EON_REQUIRED_DEVICE_EVIDENCE_CASES.map((item) => Object.freeze({
    id: item.id,
    label: item.label,
    required: item.required,
    status: byId.get(item.id)?.status || 'not-run',
    note: byId.get(item.id)?.note || ''
  }));
  const required = cases.filter((item) => item.required);
  const passed = required.every((item) => item.status === 'passed');
  return Object.freeze({
    schema: EON_DEVICE_EVIDENCE_MATRIX_SCHEMA,
    scope: 'user-owned-local-evidence',
    status: passed ? 'complete' : 'incomplete',
    requiredCaseCount: required.length,
    passedCaseCount: required.filter((item) => item.status === 'passed').length,
    cases: Object.freeze(cases),
    remoteTelemetryCreated: false,
    rawDeviceDataStored: false,
    providerPayloadStored: false
  });
}

export function getEonDeviceEvidenceMatrixTruth() {
  return Object.freeze({
    schema: EON_DEVICE_EVIDENCE_MATRIX_SCHEMA,
    remoteTelemetryCreated: false,
    rawDeviceDataStored: false,
    providerPayloadStored: false,
    screenshotsAutoUploaded: false,
    userControlledEvidenceOnly: true
  });
}

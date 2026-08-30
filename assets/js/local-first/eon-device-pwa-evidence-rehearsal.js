/**
 * W524 — builds a bounded, operator-owned evidence handoff from manual local
 * checklist state. It never probes a device, reads browser logs, stores a
 * screenshot, uploads evidence, or converts a completed checklist into proof.
 */
import { EON_REQUIRED_DEVICE_EVIDENCE_CASES, createEonDeviceEvidenceMatrix } from './eon-device-evidence-matrix.js';
import {
  W524_DEVICE_PWA_EVIDENCE_REHEARSAL_SCHEMA,
  W524_REQUIRED_CASE_IDS,
  W524_REQUIRED_OPERATOR_ARTIFACT_KINDS,
  W524_TRUTH
} from '../../../config/w524-device-pwa-evidence-rehearsal-contract.mjs';

export const EON_DEVICE_PWA_EVIDENCE_REHEARSAL_SCHEMA = W524_DEVICE_PWA_EVIDENCE_REHEARSAL_SCHEMA;

const SECRET_LIKE_PATTERN = /(?:api[\s_-]*key|access[\s_-]*token|refresh[\s_-]*token|bearer\s+|password|seed\s+phrase|private\s+key|\bsk-[a-z0-9_-]{8,}\b|0x[a-f0-9]{64})/i;
const SAFE_TEXT = /^[a-z0-9][a-z0-9 .,:;_\-+/()]{0,160}$/i;
const knownCase = new Map(EON_REQUIRED_DEVICE_EVIDENCE_CASES.map((entry) => [entry.id, entry]));

function cleanText(value = '', fallback = '') {
  const cleaned = String(value || '').replace(/\s+/g, ' ').trim().slice(0, 160);
  return !cleaned || SECRET_LIKE_PATTERN.test(cleaned) || !SAFE_TEXT.test(cleaned) ? fallback : cleaned;
}

function cleanRevision(value = '') {
  const candidate = String(value || '').trim();
  if (!candidate) return '';
  return /^(?:[a-f0-9]{7,64}|portable:[a-f0-9]{64}|preview:[a-z0-9._-]{1,96})$/i.test(candidate) ? candidate : '';
}

function cleanTarget(value = '') {
  try {
    const url = new URL(String(value || ''));
    if (!/^https?:$/.test(url.protocol)) return '';
    return `${url.protocol}//${url.host}`;
  } catch { return ''; }
}

function normaliseRecords(records = []) {
  const matrix = createEonDeviceEvidenceMatrix(records);
  const byId = new Map(matrix.cases.map((entry) => [entry.id, entry]));
  return Object.freeze(W524_REQUIRED_CASE_IDS.map((id) => {
    const source = byId.get(id) || { status: 'not-run', note: '' };
    const item = knownCase.get(id);
    return Object.freeze({ id, label: item?.label || id, status: source.status, note: cleanText(source.note) });
  }));
}

/**
 * A complete local checklist means only "ready for independent review". The
 * reviewer still needs real named-device, browser, deployment, screenshot and
 * console/network evidence outside this browser-managed envelope.
 */
export function createEonDevicePwaEvidenceRehearsal(records = [], {
  sourceRevision = '',
  deploymentTarget = '',
  now = Date.now()
} = {}) {
  const cases = normaliseRecords(records);
  const passedCaseCount = cases.filter((entry) => entry.status === 'passed').length;
  const allPassed = passedCaseCount === W524_REQUIRED_CASE_IDS.length;
  const revision = cleanRevision(sourceRevision);
  const target = cleanTarget(deploymentTarget);
  const createdAt = new Date(Number(now) || Date.now()).toISOString();
  return Object.freeze({
    schema: EON_DEVICE_PWA_EVIDENCE_REHEARSAL_SCHEMA,
    createdAt,
    scope: 'operator-owned-external-evidence-rehearsal',
    sourceRevision: revision || null,
    deploymentTarget: target || null,
    status: allPassed ? 'ready-for-independent-review' : 'evidence-rehearsal-incomplete',
    requiredCaseCount: W524_REQUIRED_CASE_IDS.length,
    passedCaseCount,
    cases,
    requiredOperatorArtifacts: W524_REQUIRED_OPERATOR_ARTIFACT_KINDS,
    userReportedChecklistComplete: allPassed,
    independentlyVerified: false,
    externalEvidenceAccepted: false,
    productionApproved: false,
    launchApproval: false,
    deviceProbeCreated: false,
    remoteTelemetryCreated: false,
    screenshotUploadCreated: false,
    deviceIdentifiersStored: false,
    consoleLogsStored: false,
    rawBrowserDataStored: false,
    limitations: Object.freeze([
      'This browser stores only manual case status and a short non-sensitive note when the user chooses to save the existing Device Proof Kit.',
      'Named-device information, screenshots, console/network logs, performance metrics, deployment provenance, and browser traces remain operator-held review evidence.',
      'A complete user-reported checklist is not independent verification, a production result, commercial approval, or launch approval.'
    ])
  });
}

export function buildEonDevicePwaEvidenceHandoff(records = [], options = {}) {
  return JSON.stringify(createEonDevicePwaEvidenceRehearsal(records, options), null, 2);
}

export function getEonDevicePwaEvidenceRehearsalTruth() {
  return Object.freeze({
    schema: EON_DEVICE_PWA_EVIDENCE_REHEARSAL_SCHEMA,
    ...W524_TRUTH,
    deviceProbeCreated: false,
    rawBrowserDataStored: false,
    userReportedChecklistCanApproveProduction: false
  });
}

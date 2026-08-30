/** A15 C11 — City accessibility, device, offline, performance and resilience evidence authority. */
import { getEonCityC09SignalFrontierTruth } from '../c09/eon-city-c09-signal-frontier-summit.js';
import { getEonCityC10FrontierRegionTruth } from '../c10/eon-city-c10-frontier-region-governance.js';

export const EON_CITY_C11_CERTIFICATION_SCHEMA = 'eon.city.device-performance-certification.a15.c11.v1';
const freeze = (value) => Object.freeze(value);
const DIGEST = /^[a-f0-9]{64}$/i;

export const EON_CITY_C11_EVIDENCE_LANES = freeze([
  ['keyboard-complete', 'accessibility'], ['nvda-chrome', 'accessibility'], ['zoom-reflow-200-400', 'accessibility'],
  ['forced-colors', 'accessibility'], ['reduced-motion', 'accessibility'], ['touch-targets', 'accessibility'],
  ['chrome-desktop', 'browser'], ['edge-desktop', 'browser'], ['mobile-landscape', 'physical-device'],
  ['pwa-install', 'offline'], ['offline-hard-reload', 'offline'], ['offline-update', 'offline'],
  ['offline-rollback', 'offline'], ['offline-repair', 'offline'], ['protected-storage', 'offline'],
  ['performance-lite', 'performance'], ['performance-balanced', 'performance'], ['performance-cinematic', 'performance'],
  ['transition-soak', 'resilience'], ['endurance-four-hours', 'resilience'],
  ['context-loss-recovery', 'resilience'], ['repeated-mount-disposal', 'resilience']
].map(([id, kind]) => freeze({ id, kind, sourceReady: true })));

function validEvidence(row, expectedBuildDigest) {
  if (!row || row.status !== 'pass' || !DIGEST.test(String(row.evidenceDigest || '')) || !DIGEST.test(String(row.buildDigest || ''))) return false;
  if (expectedBuildDigest && String(row.buildDigest).toLowerCase() !== String(expectedBuildDigest).toLowerCase()) return false;
  if (!(Number(row.measuredAt) > 0)) return false;
  if (row.id === 'transition-soak' && !(Number(row.completedTransitions) >= 10)) return false;
  if (row.id === 'endurance-four-hours' && !(Number(row.durationMinutes) >= 240)) return false;
  if (row.id === 'repeated-mount-disposal' && row.resourcesDisposed !== true) return false;
  if (row.id === 'protected-storage' && row.protectedDataPreserved !== true) return false;
  return true;
}

export function createEonCityC11CertificationReceipt(evidence = [], { expectedBuildDigest = '', sourceAuthority = {} } = {}) {
  const supplied = new Map((Array.isArray(evidence) ? evidence : []).map((row) => [row?.id, row]));
  const lanes = freeze(EON_CITY_C11_EVIDENCE_LANES.map((lane) => {
    const row = supplied.get(lane.id);
    const passed = validEvidence(row, expectedBuildDigest);
    return freeze({ ...lane, status: passed ? 'pass' : 'pending', evidenceDigest: passed ? String(row.evidenceDigest).toLowerCase() : null, buildDigest: passed ? String(row.buildDigest).toLowerCase() : null });
  }));
  const frontier = getEonCityC09SignalFrontierTruth();
  const regions = getEonCityC10FrontierRegionTruth();
  const sourceReady = sourceAuthority.serviceWorkerSourceGenerated === true
    && sourceAuthority.serviceWorkerMayDeleteProtectedDatabases === false
    && sourceAuthority.minimumTargetPx === 48
    && sourceAuthority.coreInitialBundleMayContainCityImplementation === false
    && frontier.flagshipSourceProgrammeComplete
    && regions.myFrontierSourceReady;
  const externalComplete = lanes.every((lane) => lane.status === 'pass');
  return freeze({
    schema: EON_CITY_C11_CERTIFICATION_SCHEMA,
    lanes,
    laneCount: lanes.length,
    passedLaneCount: lanes.filter((lane) => lane.status === 'pass').length,
    sourceReady,
    externalComplete,
    manualCertificationDecisionAvailable: sourceReady && externalComplete,
    accessibilityCertified: false,
    physicalDeviceCertified: false,
    offlineCertified: false,
    performanceCertified: false,
    enduranceCertified: false,
    automaticCertification: false,
    automaticDeployment: false,
    privateContentStored: false
  });
}

export function validateEonCityC11CertificationReceipt(receipt) {
  if (!receipt) return freeze({ ok: false, errors: freeze(['receipt-required']), receipt: null });
  const errors = [];
  if (receipt.schema !== EON_CITY_C11_CERTIFICATION_SCHEMA) errors.push('schema-invalid');
  if (receipt.laneCount !== 22 || new Set(receipt.lanes.map((lane) => lane.id)).size !== 22) errors.push('evidence-lanes-invalid');
  if (!receipt.sourceReady) errors.push('source-not-ready');
  if (!receipt.externalComplete && receipt.manualCertificationDecisionAvailable) errors.push('manual-decision-exposed-early');
  if (receipt.accessibilityCertified || receipt.physicalDeviceCertified || receipt.offlineCertified || receipt.performanceCertified || receipt.enduranceCertified || receipt.automaticCertification || receipt.automaticDeployment) errors.push('certification-fabricated');
  if (receipt.privateContentStored) errors.push('private-content-stored');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), receipt });
}

export function getEonCityC11CertificationTruth(sourceAuthority = {}) {
  const result = validateEonCityC11CertificationReceipt(createEonCityC11CertificationReceipt([], { sourceAuthority }));
  return freeze({
    schema: EON_CITY_C11_CERTIFICATION_SCHEMA,
    sourceValid: result.ok,
    evidenceLaneCount: result.receipt.laneCount,
    sourceReady: result.receipt.sourceReady,
    externalEvidenceComplete: false,
    fourHourEnduranceRequired: true,
    transitionSoakMinimum: 10,
    productionReady: false,
    privateContentStored: false
  });
}

export default freeze({ EON_CITY_C11_EVIDENCE_LANES, createEonCityC11CertificationReceipt, validateEonCityC11CertificationReceipt, getEonCityC11CertificationTruth });

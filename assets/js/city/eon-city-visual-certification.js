/**
 * W372 — EON City visual-certification readiness board.
 *
 * This module does not create a certificate. It names the external proof that
 * must be independently collected before anyone may call the City visually or
 * release ready. Source code cannot substitute for browser, touch, GPU, audio
 * or production-route observations.
 */
export const CITY_VISUAL_CERTIFICATION_SCHEMA = 'eon.city.visual-certification.w372.v1';

export const CITY_VISUAL_CERTIFICATION_CASES = Object.freeze([
  Object.freeze({ id: 'portal-first-impression', label: 'Portal first impression', evidence: 'desktop and mobile capture showing Enter EON City before City Lite.' }),
  Object.freeze({ id: 'city-lite-map', label: 'City Lite overview', evidence: 'desktop and low-device capture, landmarks, routing and fallback copy.' }),
  Object.freeze({ id: 'immersive-desktop-input', label: 'Immersive desktop controls', evidence: 'keyboard, mouse/click-to-move, pause, minimap, route review and clean exit.' }),
  Object.freeze({ id: 'immersive-mobile-touch', label: 'Immersive mobile controls', evidence: 'real touch joystick, buttons, safe areas, orientation guidance and fallback.' }),
  Object.freeze({ id: 'spatial-command-space', label: 'Spatial Command Space', evidence: 'camera presets, command board, EONBOT review and renderer disposal/re-entry.' }),
  Object.freeze({ id: 'eonbot-work-loop', label: 'EONBOT work loop', evidence: 'no hidden call, local review, native handoff and truthful return state.' }),
  Object.freeze({ id: 'soundscape-consent', label: 'Soundscape consent', evidence: 'default-off, explicit gesture activation, reduced-sensory setting and cleanup.' }),
  Object.freeze({ id: 'realm-visual-backup', label: 'My Realm visual backup', evidence: 'save, encrypted export, wrong-passphrase handling, restore and no cloud assumption.' }),
  Object.freeze({ id: 'performance-device-matrix', label: 'Performance device matrix', evidence: 'manual desktop integrated, desktop GPU, Android, iPhone Safari and weak-WebGL records.' }),
  Object.freeze({ id: 'route-graph-production', label: 'Production route graph', evidence: 'Preview then production route checks without loops or stale build mismatch.' })
]);

const ALLOWED_STATUSES = new Set(['pending', 'passed', 'failed', 'blocked']);

function cleanStatus(value = '') {
  const status = String(value || '').trim().toLowerCase();
  return ALLOWED_STATUSES.has(status) ? status : 'pending';
}

function knownCase(id = '') {
  return CITY_VISUAL_CERTIFICATION_CASES.some((item) => item.id === String(id || '').trim());
}

function cleanEvidence(value = {}) {
  const id = String(value?.id || '').trim();
  const status = cleanStatus(value?.status);
  const reference = String(value?.reference || '').trim().slice(0, 180);
  const observedAt = /^\d{4}-\d{2}-\d{2}T/.test(String(value?.observedAt || '')) ? String(value.observedAt).slice(0, 40) : null;
  return Object.freeze({ id, status, reference, observedAt, humanObserved: value?.humanObserved === true });
}

/**
 * Evaluates caller-supplied evidence metadata only. It cannot inspect a live
 * browser, infer proof from screenshots, mark a case passed, or issue a launch
 * approval. A passed result remains a human assertion requiring independent review.
 */
export function evaluateCityVisualCertificationEvidence(evidence = []) {
  const byId = new Map();
  for (const raw of Array.isArray(evidence) ? evidence : []) {
    const row = cleanEvidence(raw);
    if (!knownCase(row.id)) continue;
    byId.set(row.id, row);
  }
  const cases = CITY_VISUAL_CERTIFICATION_CASES.map((item) => {
    const row = byId.get(item.id) || cleanEvidence({ id: item.id });
    return Object.freeze({ ...item, status: row.status, reference: row.reference, observedAt: row.observedAt, humanObserved: row.humanObserved });
  });
  const passed = cases.filter((item) => item.status === 'passed' && item.humanObserved).length;
  const blocked = cases.filter((item) => item.status === 'blocked').length;
  const failed = cases.filter((item) => item.status === 'failed').length;
  return Object.freeze({
    schema: CITY_VISUAL_CERTIFICATION_SCHEMA,
    status: passed === cases.length ? 'evidence-submitted-awaiting-independent-review' : 'pending-external-evidence',
    caseCount: cases.length,
    humanPassedCaseCount: passed,
    blockedCaseCount: blocked,
    failedCaseCount: failed,
    cases: Object.freeze(cases),
    sourceOnly: true,
    independentlyCertified: false,
    productionVerified: false,
    launchApproved: false
  });
}

export function getCityVisualCertificationTruth() {
  return Object.freeze({
    schema: CITY_VISUAL_CERTIFICATION_SCHEMA,
    sourceOnly: true,
    automaticBrowserProof: false,
    automaticDeviceProof: false,
    automaticProductionProof: false,
    automaticCertification: false,
    launchApproval: false,
    independentReviewRequired: true,
    initialStatus: 'pending-external-evidence'
  });
}

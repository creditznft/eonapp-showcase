/**
 * W669 — evidence-gated 9.5 flagship release authority.
 *
 * Source checks may prove implementation readiness. They can never assign the
 * owner score, replace authenticated gameplay, or certify production.
 */
const freeze = (value) => Object.freeze(value);

export const W669_FLAGSHIP_RECEIPT_SCHEMA = 'eonapp.w669.flagship-owner-receipt.v1';
export const W669_FLAGSHIP_CONTRACT_SCHEMA = 'eonapp.w669.flagship-release-contract.v1';

export const W669_REQUIRED_BROWSERS = freeze(['chrome', 'edge', 'firefox', 'opera']);
export const W669_REQUIRED_DEVICES = freeze(['owner-desktop', 'mobile-landscape']);
export const W669_REQUIRED_REALMS = freeze([
  'archive-noir',
  'living-bio-city',
  'golden-sovereign-realm',
  'oceanic-light',
  'path-of-time',
  'eonbot-temple'
]);

export const W669_EVIDENCE_LANES = freeze([
  freeze({
    id: 'input-authority',
    sourceWave: 'W664',
    sourceCommand: 'qa:w664-w667-local-recovery',
    humanProof: 'Keyboard, arrows, D-pad and touch agree at eight camera headings and after Core/Expanse/Realm transfers.',
    minimumMinutes: 5
  }),
  freeze({
    id: 'seamless-core',
    sourceWave: 'W665',
    sourceCommand: 'qa:w664-w667-local-recovery',
    humanProof: 'Twenty-minute continuous Core traversal with no room pop, one-frame replacement, fall-through or confusing district identity.',
    minimumMinutes: 20
  }),
  freeze({
    id: 'functional-assets',
    sourceWave: 'W666',
    sourceCommand: 'qa:w664-w667-local-recovery',
    humanProof: 'Every shipped character, terminal, prop and landmark is visibly present or intentionally deferred and every visible pick opens only its own truthful function.',
    minimumMinutes: 15
  }),
  freeze({
    id: 'infinite-expanse-atlas',
    sourceWave: 'W667',
    sourceCommand: 'qa:w664-w667-local-recovery',
    humanProof: 'Traverse at least 25 cell boundaries, observe varied coherent regions, record discoveries, set a return point and return exactly through Atlas.',
    minimumMinutes: 20
  }),
  freeze({
    id: 'flagship-nexus',
    sourceWave: 'W668',
    sourceCommand: 'qa:w668-flagship-nexus',
    humanProof: 'Pulse, Expanded Nexus and Spatial Living Nexus visibly preserve the same state, node identity, selected project and next action without card-wall confusion.',
    minimumMinutes: 10
  }),
  freeze({
    id: 'realm-round-trips',
    sourceWave: 'W668C',
    sourceCommand: 'qa:w668c-world-first-city-nexus',
    humanProof: 'Inspect, enter and return from all six authored Realms without losing position, input authority, EONBOT or Nexus continuity.',
    minimumMinutes: 15
  }),
  freeze({
    id: 'performance-recovery',
    sourceWave: 'W669',
    sourceCommand: 'qa:w669-flagship-release',
    humanProof: 'No page, console or first-party HTTP errors; stable recovery after refresh/backgrounding; bounded memory growth and acceptable frame pacing on the owner device.',
    minimumMinutes: 20
  })
]);

export const W669_FLAGSHIP_RELEASE_CONTRACT = freeze({
  schema: W669_FLAGSHIP_CONTRACT_SCHEMA,
  wave: 'W669',
  product: 'EONAPP + EON NEXUS + EONCITY',
  releaseState: 'source-ready-human-proof-required',
  sourceAuthority: freeze({
    localFirst: true,
    githubActionsArtifactsRequired: false,
    codexRequired: false,
    productionDeploymentRequiredForSourceGate: false
  }),
  quality: freeze({
    overallMinimum: 9.5,
    categoryMinimum: 9.0,
    criticalDefectsMaximum: 0,
    ownerScoreRequired: true,
    automationMayAssignScore: false
  }),
  candidate: freeze({
    commitShaRequired: true,
    candidateDigestRequired: true,
    deploymentIdRequired: true,
    productionUrlRequired: true,
    exactCandidateEvidenceRequired: true
  }),
  evidence: freeze({
    lanes: W669_EVIDENCE_LANES,
    browsers: W669_REQUIRED_BROWSERS,
    devices: W669_REQUIRED_DEVICES,
    realms: W669_REQUIRED_REALMS,
    screenRecordingRequired: true,
    screenshotDigestRequired: true,
    secretsForbidden: true,
    personalIdentityForbidden: true,
    pageErrorsMaximum: 0,
    consoleErrorsMaximum: 0,
    firstPartyHttpErrorsMaximum: 0
  }),
  claimFence: freeze({
    sourcePassIsNotReleaseApproval: true,
    automatedBrowserPassIsNotOwnerApproval: true,
    previewPassIsNotProductionApproval: true,
    incompleteLaneBlocksNinePointFiveClaim: true,
    ownerGoRequired: true
  })
});

const text = (value = '') => String(value || '').trim();
const finite = (value) => Number.isFinite(Number(value));

export function validateW669FlagshipReleaseContract(value = W669_FLAGSHIP_RELEASE_CONTRACT) {
  const errors = [];
  if (value?.schema !== W669_FLAGSHIP_CONTRACT_SCHEMA || value?.wave !== 'W669') errors.push('identity-invalid');
  if (value?.releaseState !== 'source-ready-human-proof-required') errors.push('release-state-must-remain-human-proof-required');
  if (value?.sourceAuthority?.githubActionsArtifactsRequired !== false || value?.sourceAuthority?.codexRequired !== false) errors.push('local-first-boundary-invalid');
  if (value?.quality?.overallMinimum !== 9.5 || value?.quality?.categoryMinimum !== 9 || value?.quality?.criticalDefectsMaximum !== 0) errors.push('quality-threshold-invalid');
  if (value?.quality?.automationMayAssignScore !== false || value?.quality?.ownerScoreRequired !== true) errors.push('owner-score-boundary-invalid');
  if (!Array.isArray(value?.evidence?.lanes) || value.evidence.lanes.length !== W669_EVIDENCE_LANES.length) errors.push('evidence-lanes-invalid');
  if (!W669_REQUIRED_BROWSERS.every((id) => value?.evidence?.browsers?.includes(id))) errors.push('browser-matrix-incomplete');
  if (!W669_REQUIRED_DEVICES.every((id) => value?.evidence?.devices?.includes(id))) errors.push('device-matrix-incomplete');
  if (!W669_REQUIRED_REALMS.every((id) => value?.evidence?.realms?.includes(id))) errors.push('realm-matrix-incomplete');
  if (value?.claimFence?.sourcePassIsNotReleaseApproval !== true || value?.claimFence?.incompleteLaneBlocksNinePointFiveClaim !== true || value?.claimFence?.ownerGoRequired !== true) errors.push('claim-fence-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export function createW669OwnerReceiptTemplate() {
  return {
    schema: W669_FLAGSHIP_RECEIPT_SCHEMA,
    candidate: { commitSha: '', candidateDigest: '', deploymentId: '', productionUrl: '' },
    evidence: {
      lanes: W669_EVIDENCE_LANES.map((lane) => ({ id: lane.id, status: 'pending', recordingRef: '', screenshotDigest: '', notes: '' })),
      browsers: W669_REQUIRED_BROWSERS.map((id) => ({ id, status: 'pending', evidenceRef: '' })),
      devices: W669_REQUIRED_DEVICES.map((id) => ({ id, status: 'pending', evidenceRef: '' })),
      realms: W669_REQUIRED_REALMS.map((id) => ({ id, status: 'pending', evidenceRef: '' })),
      diagnostics: { pageErrors: null, consoleErrors: null, firstPartyHttpErrors: null, requestFailuresReviewed: false }
    },
    quality: { overallScore: null, categoryScores: [], criticalDefects: null, ownerVisualApproval: false },
    ownerGo: false
  };
}

function rowsComplete(rows, requiredIds) {
  if (!Array.isArray(rows)) return false;
  return requiredIds.every((id) => rows.some((row) => row?.id === id && row?.status === 'pass' && text(row?.evidenceRef || row?.recordingRef)));
}

export function validateW669OwnerReceipt(receipt = {}) {
  const blockers = [];
  if (receipt?.schema !== W669_FLAGSHIP_RECEIPT_SCHEMA) blockers.push('receipt-schema-invalid');
  if (!/^[a-f0-9]{40}$/i.test(text(receipt?.candidate?.commitSha))) blockers.push('candidate-sha-required');
  if (!/^[a-f0-9]{64}$/i.test(text(receipt?.candidate?.candidateDigest))) blockers.push('candidate-digest-required');
  if (!text(receipt?.candidate?.deploymentId)) blockers.push('deployment-id-required');
  if (!/^https:\/\/eonapp\.ch\/?$/i.test(text(receipt?.candidate?.productionUrl))) blockers.push('production-url-required');
  if (!rowsComplete(receipt?.evidence?.lanes, W669_EVIDENCE_LANES.map((lane) => lane.id))) blockers.push('evidence-lanes-incomplete');
  if (!rowsComplete(receipt?.evidence?.browsers, W669_REQUIRED_BROWSERS)) blockers.push('browser-matrix-incomplete');
  if (!rowsComplete(receipt?.evidence?.devices, W669_REQUIRED_DEVICES)) blockers.push('device-matrix-incomplete');
  if (!rowsComplete(receipt?.evidence?.realms, W669_REQUIRED_REALMS)) blockers.push('realm-matrix-incomplete');
  const diagnostics = receipt?.evidence?.diagnostics || {};
  if (diagnostics.pageErrors !== 0 || diagnostics.consoleErrors !== 0 || diagnostics.firstPartyHttpErrors !== 0 || diagnostics.requestFailuresReviewed !== true) blockers.push('diagnostics-not-clean');
  const overall = Number(receipt?.quality?.overallScore);
  const scores = Array.isArray(receipt?.quality?.categoryScores) ? receipt.quality.categoryScores : [];
  if (!finite(overall) || overall < 9.5) blockers.push('overall-score-below-9.5');
  if (!scores.length || scores.some((entry) => !finite(entry?.score) || Number(entry.score) < 9)) blockers.push('category-score-below-9');
  if (receipt?.quality?.criticalDefects !== 0) blockers.push('critical-defects-remain');
  if (receipt?.quality?.ownerVisualApproval !== true) blockers.push('owner-visual-approval-required');
  if (receipt?.ownerGo !== true) blockers.push('owner-go-required');
  return freeze({ ok: blockers.length === 0, releaseApproved: blockers.length === 0, blockers: freeze(blockers), overallScore: finite(overall) ? overall : null });
}

export default W669_FLAGSHIP_RELEASE_CONTRACT;

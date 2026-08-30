import {
  W644_CITY_ARTIFACT_SCHEMA,
  W644_CITY_OWNER_RECEIPT_SCHEMA,
  W644_CITY_REQUIRED_CATEGORIES,
  W644_CITY_REQUIRED_VIEWPORTS
} from '../../config/w644-city-owner-certification-contract.mjs';

const freeze = (value) => Object.freeze(value);
const HEX64 = /^[a-f0-9]{64}$/;
const HEX40 = /^[a-f0-9]{40}$/;
const SAFE_LABEL = /^[a-z0-9][a-z0-9._/-]{0,179}$/i;
const PERSONAL_OR_SECRET = /(?:@|cookie|authorization|bearer|token|secret|password|session(?:id)?|oauth|code=|state=)/i;
const ABSOLUTE_PATH = /(?:^[A-Za-z]:[\\/]|^\/|\\Users\\|\/home\/|\.\.[\\/])/;
const iso = (value) => Number.isFinite(Date.parse(String(value || '')));
const unique = (rows) => [...new Set(rows)];

function validateArtifact(value = {}) {
  const issues = [];
  if (value?.schema !== W644_CITY_ARTIFACT_SCHEMA) issues.push('artifact-schema-invalid');
  if (!['screenshot', 'screen-recording', 'diagnostic-json', 'performance-json'].includes(value?.kind)) issues.push('artifact-kind-invalid');
  const label = String(value?.label || '');
  if (!SAFE_LABEL.test(label) || ABSOLUTE_PATH.test(label)) issues.push('artifact-label-invalid');
  if (PERSONAL_OR_SECRET.test(label)) issues.push('artifact-label-sensitive');
  if (!HEX64.test(String(value?.sha256 || ''))) issues.push('artifact-digest-invalid');
  if (!Number.isInteger(value?.bytes) || value.bytes < 1) issues.push('artifact-bytes-invalid');
  if (value?.redactionReviewed !== true) issues.push('artifact-redaction-review-required');
  return freeze({ ok: issues.length === 0, issues: freeze(unique(issues)) });
}

function validateScoreRows(rows = []) {
  const issues = [];
  if (!Array.isArray(rows)) return freeze({ ok: false, issues: freeze(['score-rows-invalid']), average: 0, minimum: 0 });
  const byId = new Map(rows.map((row) => [row?.id, row]));
  if (byId.size !== W644_CITY_REQUIRED_CATEGORIES.length) issues.push('score-category-count-invalid');
  const scores = [];
  for (const id of W644_CITY_REQUIRED_CATEGORIES) {
    const row = byId.get(id);
    if (!row) { issues.push(`score-missing:${id}`); continue; }
    const score = Number(row.score);
    if (!Number.isFinite(score) || score < 0 || score > 10) issues.push(`score-invalid:${id}`);
    else {
      scores.push(score);
      if (score < 9) issues.push(`score-below-category-minimum:${id}`);
    }
    if (String(row.ownerNote || '').trim().length < 12) issues.push(`owner-note-too-short:${id}`);
    if (PERSONAL_OR_SECRET.test(String(row.ownerNote || ''))) issues.push(`owner-note-sensitive:${id}`);
  }
  const average = scores.length ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(3)) : 0;
  const minimum = scores.length ? Math.min(...scores) : 0;
  if (average < 9.5) issues.push('overall-score-below-9.5');
  return freeze({ ok: issues.length === 0, issues: freeze(unique(issues)), average, minimum });
}

export function validateW644CityOwnerReceipt(value = {}) {
  const issues = [];
  if (value?.schema !== W644_CITY_OWNER_RECEIPT_SCHEMA || value?.wave !== 'W644') issues.push('receipt-identity-invalid');
  if (value?.status !== 'pass') issues.push('status-not-pass');
  if (!iso(value?.occurredAt)) issues.push('occurred-at-invalid');
  if (!HEX64.test(String(value?.candidateDigest || ''))) issues.push('candidate-digest-invalid');
  if (!HEX40.test(String(value?.commitSha || ''))) issues.push('commit-sha-invalid');
  if (!SAFE_LABEL.test(String(value?.deploymentId || ''))) issues.push('deployment-id-invalid');
  if (value?.route !== '/eoncity') issues.push('route-invalid');
  if (value?.releaseIdentityVisible !== true) issues.push('visible-release-identity-required');
  if (value?.guestGate?.heavyRendererBlocked !== true || value?.guestGate?.identityRequired !== true || value?.guestGate?.cacheNoStore !== true) issues.push('guest-gate-proof-invalid');
  if (value?.authenticatedLane?.manualGoogleSignIn !== true || value?.authenticatedLane?.signedIn === true && value?.authenticatedLane?.rendererBooted !== true) issues.push('authenticated-lane-invalid');
  if (value?.authenticatedLane?.signedIn !== true) issues.push('authenticated-google-session-required');
  if (value?.authenticatedLane?.credentialsCaptured !== false || value?.authenticatedLane?.cookiesCaptured !== false || value?.authenticatedLane?.tokensCaptured !== false || value?.authenticatedLane?.bypassUsed !== false) issues.push('authentication-privacy-boundary-invalid');

  const viewportRows = Array.isArray(value?.viewports) ? value.viewports : [];
  const viewportIds = new Set(viewportRows.map((row) => row?.id));
  for (const id of W644_CITY_REQUIRED_VIEWPORTS) if (!viewportIds.has(id)) issues.push(`viewport-missing:${id}`);
  for (const row of viewportRows) {
    if (!W644_CITY_REQUIRED_VIEWPORTS.includes(row?.id)) issues.push(`viewport-unknown:${row?.id || 'missing'}`);
    if (row?.canvasVisible !== true || row?.hudUsable !== true || row?.noBlockingOverflow !== true) issues.push(`viewport-proof-invalid:${row?.id || 'missing'}`);
    if (row?.id?.startsWith('mobile-') && row?.touchControlsUsable !== true) issues.push(`mobile-touch-proof-invalid:${row.id}`);
  }

  const diagnostics = value?.diagnostics || {};
  for (const field of ['pageErrors', 'consoleErrors', 'firstPartyHttpErrors']) if (Number(diagnostics[field]) !== 0) issues.push(`${field}-must-be-zero`);
  if (!Number.isInteger(diagnostics.requestFailures) || diagnostics.requestFailures < 0 || diagnostics.requestFailuresReviewed !== true) issues.push('request-failures-review-invalid');
  if (diagnostics.unexplainedRequestFailures !== 0) issues.push('unexplained-request-failures-present');

  for (const field of ['keyboardProof', 'pointerProof', 'mobileTouchProof', 'refreshRecovery', 'reducedMotionProof', 'resumeProof', 'commandRoomProof', 'eonbotWorkPathProof']) {
    if (value?.interaction?.[field] !== true) issues.push(`${field}-required`);
  }
  if (value?.performance?.firstUsableFrameMs > 15000 || !Number.isFinite(Number(value?.performance?.firstUsableFrameMs))) issues.push('first-usable-frame-invalid');
  if (Number(value?.performance?.observedFpsP50) < 30) issues.push('observed-fps-below-minimum');
  if (value?.performance?.catastrophicLongTaskObserved !== false || value?.performance?.crashObserved !== false) issues.push('performance-stability-invalid');

  const artifacts = Array.isArray(value?.artifacts) ? value.artifacts : [];
  if (artifacts.length < 6) issues.push('artifact-count-below-minimum');
  const artifactKinds = new Set();
  for (const artifact of artifacts) {
    const report = validateArtifact(artifact);
    artifactKinds.add(artifact?.kind);
    issues.push(...report.issues);
  }
  for (const required of ['screenshot', 'screen-recording', 'diagnostic-json', 'performance-json']) if (!artifactKinds.has(required)) issues.push(`artifact-kind-missing:${required}`);

  const score = validateScoreRows(value?.ownerScores);
  issues.push(...score.issues);
  if (value?.ownerReviewed !== true || value?.ownerVisualApproval !== true || value?.redactionReviewed !== true) issues.push('owner-review-boundary-invalid');
  if (value?.secretsIncluded !== false || value?.personalIdentityIncluded !== false || value?.absolutePathsIncluded !== false) issues.push('redaction-boundary-invalid');

  return freeze({
    ok: issues.length === 0,
    issues: freeze(unique(issues)),
    overallScore: score.average,
    minimumCategoryScore: score.minimum
  });
}

export function evaluateW644CityOwnerCertification(board = {}) {
  const receipt = validateW644CityOwnerReceipt(board?.receipt || {});
  const pass = board?.productionVerdict === 'pass' && board?.ownerReviewed === true && receipt.ok;
  return freeze({
    schema: 'eonapp.city-owner-certification-result.w644.v1',
    wave: 'W644',
    pass,
    productionVerdict: pass ? 'pass' : 'not-run-or-no-go',
    receipt
  });
}

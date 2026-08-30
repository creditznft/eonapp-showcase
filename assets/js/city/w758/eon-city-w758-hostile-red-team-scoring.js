/**
 * W758 — hostile red-team and evidence-based machine scoring.
 *
 * Source tests prove only that this scoring authority is internally coherent.
 * A score can pass only with immutable candidate identity plus real browser,
 * device, API, build, security and deployment evidence. Regex/unit/source-only
 * references are deliberately rejected as machine-certification evidence.
 */
export const EON_CITY_W758_SCHEMA = 'eon.city.hostile-red-team-scoring.w758.v2';
const freeze = (value) => Object.freeze(value);

// Final launch-machine model inherited from the W736 certification authority.
export const EON_CITY_W758_PILLARS = freeze([
  freeze({ id: 'releaseIntegrity', label: 'Release integrity and provenance', weight: 0.08 }),
  freeze({ id: 'normalApp', label: 'Normal app route and interaction truth', weight: 0.14 }),
  freeze({ id: 'commandContinuity', label: 'Quick Command and Nexus continuity', weight: 0.14 }),
  freeze({ id: 'cityRuntime', label: 'EON City runtime and station correctness', weight: 0.20 }),
  freeze({ id: 'performance', label: 'Performance and device adaptation', weight: 0.10 }),
  freeze({ id: 'accessibility', label: 'Accessibility and input', weight: 0.08 }),
  freeze({ id: 'aiProviders', label: 'AI provider and Local AI regression', weight: 0.08 }),
  freeze({ id: 'businessTruth', label: 'Billing, subscriptions, referrals and entitlements', weight: 0.10 }),
  freeze({ id: 'persistence', label: 'Persistence, backup, update and PWA', weight: 0.05 }),
  freeze({ id: 'securityTruth', label: 'Security, privacy, truth and public metadata', weight: 0.03 })
]);

export const EON_CITY_W758_SCENARIOS = freeze([
  'first-time-user-no-project',
  'returning-user-active-project-approval',
  'offline',
  'provider-unavailable',
  'referral-endpoint-timeout',
  'billing-signed-out',
  'billing-signed-in-free',
  'billing-paid',
  'billing-error',
  'capture-unsupported',
  'capture-permission-denied',
  'low-gpu-lite-mode',
  'reduced-motion',
  'keyboard-only',
  'touch-landscape',
  'stale-service-worker',
  'missing-glb-material',
  'context-loss-restart',
  'long-session',
  'all-ten-stations',
  'all-mission-families',
  'reveal-cosmetic',
  'transit-board-skip',
  'npc-load-failure',
  'privacy-inspection',
  'twenty-dock-focus-cycles',
  'ten-city-restarts',
  'authenticated-chrome',
  'authenticated-edge',
  'authenticated-firefox',
  'opera-public-surface',
  'mobile-portrait',
  'mobile-landscape',
  'service-worker-update-rollback',
  'normal-app-route-matrix',
  'provider-key-reload-custody',
  'billing-webhook-entitlement-dry-run',
  'referral-replay-self-referral-fail-closed',
  'social-card-public-metadata'
]);

export const EON_CITY_W758_SEVERITY = freeze({
  P0: freeze(['secret-or-cookie-leak', 'incorrect-payment-or-entitlement', 'destructive-data-loss', 'auth-bypass', 'unsafe-action-without-consent', 'production-unusable', 'rollback-unavailable']),
  P1: freeze(['blank-or-black-city', 'city-crash-or-movement-unusable', 'missing-critical-assets-or-functions', 'dead-primary-action', 'incorrect-price-trial-entitlement', 'referral-replay-or-browser-grant', 'provider-key-loss-or-leak', 'backup-update-data-loss', 'duplicate-engine-scene-loop', 'severe-blocking-overlap'])
});

const MACHINE_STATUS = freeze({
  BLOCKED: 'W758 MACHINE BLOCKED — EVIDENCE INCOMPLETE',
  FAIL: 'W758 MACHINE FAIL — REPAIR REQUIRED',
  PASS: 'W758 MACHINE PASS — OWNER REVIEW READY'
});

const EVIDENCE_KINDS = new Set([
  'browser', 'owner-device', 'screenshot', 'video', 'console', 'network',
  'performance', 'memory', 'accessibility', 'api', 'build', 'provenance',
  'deployment', 'rollback', 'security', 'metadata', 'storage', 'database'
]);

export function buildEonCityW758RedTeamPlan() {
  return freeze({
    schema: EON_CITY_W758_SCHEMA,
    pillars: EON_CITY_W758_PILLARS,
    scenarios: EON_CITY_W758_SCENARIOS,
    severity: EON_CITY_W758_SEVERITY,
    thresholds: freeze({ weightedScore: 9.5, everyPillar: 9.0, unresolvedP0: 0, unresolvedP1: 0 }),
    evidence: freeze({
      exactCandidateRequired: true,
      functionsInclusivePreviewRequired: true,
      realAuthenticatedBrowserRequired: true,
      sourceRegexAloneSufficient: false,
      unitTestsAloneSufficient: false,
      screenshotsRequired: true,
      videoRequired: true,
      consoleNetworkRequired: true,
      performanceMemoryRequired: true,
      deviceBrowserMatrixRequired: true,
      evidenceRefsRequiredPerPillar: true,
      evidenceRefsRequiredPerScenario: true
    }),
    ownerApprovalRequiredAfterMachinePass: true,
    productionAuthorizedByMachinePass: false
  });
}

export function validateEonCityW758RedTeamPlan(plan = buildEonCityW758RedTeamPlan()) {
  const errors = [];
  const weight = (plan.pillars || []).reduce((sum, pillar) => sum + Number(pillar.weight || 0), 0);
  if (plan.schema !== EON_CITY_W758_SCHEMA) errors.push('schema');
  if (plan.pillars?.length !== 10 || Math.abs(weight - 1) > 0.0001) errors.push('pillar-weights');
  if (plan.scenarios?.length < 35 || new Set(plan.scenarios || []).size !== plan.scenarios?.length) errors.push('scenario-coverage');
  if (plan.thresholds?.weightedScore !== 9.5 || plan.thresholds?.everyPillar !== 9.0) errors.push('score-thresholds');
  if (plan.thresholds?.unresolvedP0 !== 0 || plan.thresholds?.unresolvedP1 !== 0) errors.push('critical-issue-thresholds');
  if (plan.evidence?.exactCandidateRequired !== true || plan.evidence?.functionsInclusivePreviewRequired !== true) errors.push('candidate-preview-boundary');
  if (plan.evidence?.realAuthenticatedBrowserRequired !== true || plan.evidence?.sourceRegexAloneSufficient !== false || plan.evidence?.unitTestsAloneSufficient !== false) errors.push('evidence-boundary');
  if (plan.ownerApprovalRequiredAfterMachinePass !== true || plan.productionAuthorizedByMachinePass !== false) errors.push('owner-production-boundary');
  return freeze({ schema: EON_CITY_W758_SCHEMA, ok: errors.length === 0, errors: freeze(errors), plan });
}

function normalizeEvidenceRefs(value) {
  if (!Array.isArray(value)) return freeze([]);
  return freeze(value.map((entry) => {
    if (!entry || typeof entry !== 'object') return null;
    const kind = String(entry.kind || '').trim().toLowerCase();
    const id = String(entry.id || entry.path || '').trim().slice(0, 300);
    if (!EVIDENCE_KINDS.has(kind) || !id) return null;
    return freeze({ kind, id, sha256: String(entry.sha256 || '').trim().toLowerCase().slice(0, 64) });
  }).filter(Boolean).slice(0, 80));
}

function normalizeCandidate(candidate = {}) {
  const commit = String(candidate.commit || '').trim().toLowerCase();
  const tree = String(candidate.tree || '').trim().toLowerCase();
  const digest = String(candidate.digest || '').trim().toLowerCase();
  const previewUrl = String(candidate.previewUrl || '').trim();
  const deploymentId = String(candidate.deploymentId || '').trim();
  const complete = /^[a-f0-9]{40}$/.test(commit)
    && /^[a-f0-9]{40}$/.test(tree)
    && /^[a-f0-9]{64}$/.test(digest)
    && /^https:\/\//i.test(previewUrl)
    && deploymentId.length >= 8;
  return freeze({ commit, tree, digest, previewUrl, deploymentId, complete });
}

export function createEonCityW758EvidenceTemplate() {
  return freeze({
    schema: EON_CITY_W758_SCHEMA,
    candidate: freeze({ commit: '', tree: '', digest: '', previewUrl: '', deploymentId: '' }),
    pillars: freeze(Object.fromEntries(EON_CITY_W758_PILLARS.map((pillar) => [pillar.id, freeze({ score: null, evidenceRefs: freeze([]), notes: '' })]))),
    scenarios: freeze(Object.fromEntries(EON_CITY_W758_SCENARIOS.map((id) => [id, freeze({ passed: null, evidenceRefs: freeze([]), notes: '' })]))),
    unresolvedIssues: freeze([]),
    ownerApproved: false
  });
}

export function evaluateEonCityW758MachineScore(evidence = {}) {
  const plan = buildEonCityW758RedTeamPlan();
  const candidate = normalizeCandidate(evidence?.candidate);
  const missingPillars = [];
  const missingScenarios = [];
  const normalizedPillars = {};
  let weightedScore = 0;
  let minimumPillarScore = 10;

  for (const pillar of plan.pillars) {
    const entry = evidence?.pillars?.[pillar.id] || {};
    const score = Number(entry.score);
    const refs = normalizeEvidenceRefs(entry.evidenceRefs);
    const valid = Number.isFinite(score) && score >= 0 && score <= 10 && refs.length > 0;
    if (!valid) missingPillars.push(pillar.id);
    const safeScore = valid ? score : null;
    normalizedPillars[pillar.id] = freeze({ score: safeScore, evidenceRefs: refs, notes: String(entry.notes || '').slice(0, 1000) });
    if (valid) {
      weightedScore += safeScore * pillar.weight;
      minimumPillarScore = Math.min(minimumPillarScore, safeScore);
    }
  }

  const normalizedScenarios = {};
  for (const id of plan.scenarios) {
    const entry = evidence?.scenarios?.[id] || {};
    const refs = normalizeEvidenceRefs(entry.evidenceRefs);
    const valid = entry.passed === true && refs.length > 0;
    if (!valid) missingScenarios.push(id);
    normalizedScenarios[id] = freeze({ passed: entry.passed === true, evidenceRefs: refs, notes: String(entry.notes || '').slice(0, 1000) });
  }

  const unresolvedIssues = freeze((Array.isArray(evidence?.unresolvedIssues) ? evidence.unresolvedIssues : []).map((issue) => freeze({
    id: String(issue?.id || '').slice(0, 120),
    severity: String(issue?.severity || '').toUpperCase().slice(0, 8),
    status: String(issue?.status || 'open').toLowerCase().slice(0, 24),
    summary: String(issue?.summary || '').slice(0, 1000),
    evidenceRefs: normalizeEvidenceRefs(issue?.evidenceRefs)
  })));
  const unresolvedP0 = unresolvedIssues.filter((issue) => issue.severity === 'P0' && issue.status !== 'resolved').length;
  const unresolvedP1 = unresolvedIssues.filter((issue) => issue.severity === 'P1' && issue.status !== 'resolved').length;
  const evidenceComplete = candidate.complete && missingPillars.length === 0 && missingScenarios.length === 0;
  const roundedWeightedScore = evidenceComplete ? Math.round(weightedScore * 100) / 100 : null;
  const roundedMinimumPillar = evidenceComplete ? Math.round(minimumPillarScore * 100) / 100 : null;
  const scorePass = evidenceComplete && roundedWeightedScore >= plan.thresholds.weightedScore && roundedMinimumPillar >= plan.thresholds.everyPillar;
  const issuePass = unresolvedP0 === 0 && unresolvedP1 === 0;
  const pass = scorePass && issuePass;
  const status = !evidenceComplete
    ? MACHINE_STATUS.BLOCKED
    : !issuePass || !scorePass
      ? MACHINE_STATUS.FAIL
      : MACHINE_STATUS.PASS;

  return freeze({
    schema: EON_CITY_W758_SCHEMA,
    status,
    pass,
    candidate,
    weightedScore: roundedWeightedScore,
    minimumPillarScore: roundedMinimumPillar,
    thresholds: plan.thresholds,
    pillars: freeze(normalizedPillars),
    scenarios: freeze(normalizedScenarios),
    missingPillars: freeze(missingPillars),
    missingScenarios: freeze(missingScenarios),
    unresolvedP0,
    unresolvedP1,
    unresolvedIssues,
    evidenceComplete,
    sourceOnlyPassAllowed: false,
    ownerApproved: evidence?.ownerApproved === true,
    ownerReviewRequired: true,
    productionAuthorized: false
  });
}

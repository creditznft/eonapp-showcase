/**
 * W718 — independent certification and owner acceptance authority.
 *
 * This module is intentionally pure. It defines the evidence model and score
 * rules but cannot award browser, device, build, security or production proof.
 */
export const W718_INDEPENDENT_CERTIFICATION_SCHEMA = 'eonapp.independent-certification.w718.v1';

const freeze = Object.freeze;

export const W718_BABYLON_REQUIRED_TESTS = freeze([
  'tests/unit/w649-eoncity-authenticated-entry.test.mjs',
  'tests/unit/w649-eoncity-controllable-core.test.mjs',
  'tests/unit/w649-eoncity-district-runtime.test.mjs',
  'tests/unit/w649-eoncity-asset-acceptance.test.mjs',
  'tests/unit/w649-eoncity-preview-evidence-bridge.test.mjs',
  'tests/unit/w650-eoncity-cache-update-safety.test.mjs',
  'tests/unit/w652-eoncity-entry-first-impression.test.mjs',
  'tests/unit/w427-babylon-direct-boot.test.mjs',
  'tests/unit/w455a-noir-world-composition.test.mjs',
  'tests/unit/w456a-noir-readable-guide-cast.test.mjs',
  'tests/unit/w660f-city-nexus.test.mjs',
  'tests/unit/w660n-eon-nexus-end-to-end.test.mjs',
  'tests/unit/w660o-nexus-launch-continuity.test.mjs',
  'tests/unit/w660r-living-nexus-expanse-renderer.test.mjs',
  'tests/unit/w660s-living-nexus-functional-encounters.test.mjs',
  'tests/unit/w660u-living-nexus-world-systems.test.mjs',
  'tests/unit/w660v-curated-nexus-realms.test.mjs',
  'tests/unit/w660x-premium-nexus-realms.test.mjs',
  'tests/unit/w660y-connected-core.test.mjs',
  'tests/unit/w660z-living-nexus-institutional.test.mjs',
  'tests/unit/w661d-nexus-convergence.test.mjs',
  'tests/unit/city-noir-architecture.test.mjs',
  'tests/unit/w613-eon-city-final-red-team.test.mjs',
  'tests/unit/w660i-eoncity-visual-rescue.test.mjs',
]);

export const W718_SCORE_PILLARS = freeze([
  freeze({ id: 'product-clarity', label: 'Product clarity and first-run journey', weight: 10 }),
  freeze({ id: 'projects-atlas', label: 'Projects and Atlas task success', weight: 10 }),
  freeze({ id: 'nexus-spatial', label: 'NEXUS spatial quality', weight: 12 }),
  freeze({ id: 'city-core', label: 'EONCITY Core art and navigation', weight: 12 }),
  freeze({ id: 'command-centre', label: 'Command Centre productivity', weight: 8 }),
  freeze({ id: 'expanse', label: 'Expanse flagship experience', weight: 10 }),
  freeze({ id: 'performance', label: 'Performance and device adaptation', weight: 10 }),
  freeze({ id: 'accessibility', label: 'Accessibility and input', weight: 7 }),
  freeze({ id: 'reliability', label: 'Reliability and persistence', weight: 7 }),
  freeze({ id: 'security', label: 'Security, privacy and truth', weight: 6 }),
  freeze({ id: 'consistency', label: 'Visual and interaction consistency', weight: 5 }),
  freeze({ id: 'release', label: 'Release and operations', weight: 3 })
]);

export const W718_QUANTITATIVE_GATES = freeze([
  freeze({ id: 'world-floor', target: '0 camera/player/target poses below the allowed world floor' }),
  freeze({ id: 'expanse-desktop', target: '20/20 desktop entry and return attempts' }),
  freeze({ id: 'projects-single-owner', target: '0 duplicate Projects continuation surfaces' }),
  freeze({ id: 'atlas-no-project', target: 'useful Atlas visible without a selected project' }),
  freeze({ id: 'nexus-input-parity', target: 'selection, inspection and primary action by keyboard, mouse and touch' }),
  freeze({ id: 'city-warm-start', target: '<=8 seconds owner-laptop balanced warm first playable frame' }),
  freeze({ id: 'city-low-start', target: '<=12 seconds selected low-device first playable frame' }),
  freeze({ id: 'core-fps', target: '>=50 FPS sustained owner-laptop balanced Core route' }),
  freeze({ id: 'expanse-fps', target: '>=45 FPS sustained owner-laptop balanced Expanse route' }),
  freeze({ id: 'low-fps', target: '>=30 FPS selected weak-device low mode' }),
  freeze({ id: 'memory', target: 'no unbounded growth during 30-minute Core/Expanse/Realm/Core loop' }),
  freeze({ id: 'transfer', target: '<=10 MB compressed desktop initial City; <=4 MB low first play' }),
  freeze({ id: 'touch-focus', target: 'visible focus and practical 48x48 CSS pixel touch targets' }),
  freeze({ id: 'provenance', target: 'exact wave, source, candidate, build time and rollback authority' })
]);

export const W718_REQUIRED_JOURNEYS = freeze([
  'guest-chat-signin-city',
  'project-atlas-work-object',
  'nexus-compact-split-full-inworld',
  'command-centre-reviewed-action',
  'core-nine-district-transit',
  'expanse-discover-enter-return',
  'realm-my-realm-core-return',
  'project-refresh-update-persistence',
  'low-mode-reduced-motion-recovery'
]);

export function createW718OwnerScorecardTemplate() {
  return freeze({
    schema: W718_INDEPENDENT_CERTIFICATION_SCHEMA,
    wave: 'W718',
    ownerApproved: false,
    p0Open: 0,
    p1Open: 0,
    pillars: freeze(W718_SCORE_PILLARS.map((row) => freeze({ ...row, score: null, evidence: freeze([]), notes: '' }))),
    quantitativeGates: freeze(W718_QUANTITATIVE_GATES.map((row) => freeze({ ...row, passed: null, evidence: freeze([]) }))),
    journeys: freeze(W718_REQUIRED_JOURNEYS.map((id) => freeze({ id, passed: null, evidence: freeze([]) })))
  });
}

export function evaluateW718OwnerScorecard(scorecard = createW718OwnerScorecardTemplate()) {
  const pillarRows = Array.isArray(scorecard?.pillars) ? scorecard.pillars : [];
  const expected = new Map(W718_SCORE_PILLARS.map((row) => [row.id, row]));
  const normalized = W718_SCORE_PILLARS.map((definition) => {
    const row = pillarRows.find((candidate) => candidate?.id === definition.id) || {};
    const score = row.score === null || row.score === undefined || row.score === '' ? null : Number(row.score);
    const evidence = Array.isArray(row.evidence) ? row.evidence.filter(Boolean) : [];
    return freeze({ ...definition, score: score !== null && Number.isFinite(score) ? score : null, evidenceCount: evidence.length });
  });
  const allScored = normalized.every((row) => row.score !== null && row.score >= 0 && row.score <= 10);
  const weightedScore = allScored
    ? Number((normalized.reduce((sum, row) => sum + row.score * row.weight, 0) / 100).toFixed(3))
    : null;
  const quantitative = Array.isArray(scorecard?.quantitativeGates) ? scorecard.quantitativeGates : [];
  const journeys = Array.isArray(scorecard?.journeys) ? scorecard.journeys : [];
  const checks = freeze({
    schema: scorecard?.schema === W718_INDEPENDENT_CERTIFICATION_SCHEMA,
    definitions: expected.size === 12 && W718_SCORE_PILLARS.reduce((sum, row) => sum + row.weight, 0) === 100,
    allScored,
    minimumPillar: allScored && normalized.every((row) => row.score >= 9),
    weightedTarget: weightedScore !== null && weightedScore >= 9.5,
    pillarEvidence: normalized.every((row) => row.evidenceCount > 0),
    quantitative: quantitative.length === W718_QUANTITATIVE_GATES.length && quantitative.every((row) => row.passed === true && Array.isArray(row.evidence) && row.evidence.length > 0),
    journeys: journeys.length === W718_REQUIRED_JOURNEYS.length && journeys.every((row) => row.passed === true && Array.isArray(row.evidence) && row.evidence.length > 0),
    zeroCriticals: Number(scorecard?.p0Open) === 0 && Number(scorecard?.p1Open) === 0,
    ownerApproved: scorecard?.ownerApproved === true
  });
  return freeze({
    ok: Object.values(checks).every(Boolean),
    weightedScore,
    minimumScore: allScored ? Math.min(...normalized.map((row) => row.score)) : null,
    checks,
    normalized: freeze(normalized)
  });
}

export function getW718IndependentCertificationTruth() {
  return freeze({
    schema: W718_INDEPENDENT_CERTIFICATION_SCHEMA,
    sourceReadinessCanRunWithoutDependencies: true,
    exactCertificationRequiresDependencies: true,
    exactBabylonTestCount: W718_BABYLON_REQUIRED_TESTS.length,
    productionBuildRequired: true,
    realBrowsersRequired: true,
    ownerDeviceRequired: true,
    assistiveTechnologyRequired: true,
    securityExternalEvidenceRequired: true,
    ownerApprovalRequired: true,
    sourceReadinessIsCertification: false,
    infrastructureFailureIsProductFailure: false,
    automaticScoreAwarded: false,
    automaticDeployment: false
  });
}

export default freeze({
  W718_INDEPENDENT_CERTIFICATION_SCHEMA,
  W718_BABYLON_REQUIRED_TESTS,
  W718_SCORE_PILLARS,
  W718_QUANTITATIVE_GATES,
  W718_REQUIRED_JOURNEYS,
  createW718OwnerScorecardTemplate,
  evaluateW718OwnerScorecard,
  getW718IndependentCertificationTruth
});

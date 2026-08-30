import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EON_CITY_W758_PILLARS,
  EON_CITY_W758_SCENARIOS,
  buildEonCityW758RedTeamPlan,
  createEonCityW758EvidenceTemplate,
  evaluateEonCityW758MachineScore,
  validateEonCityW758RedTeamPlan
} from '../../assets/js/city/w758/eon-city-w758-hostile-red-team-scoring.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
const candidate = {
  commit: 'a'.repeat(40), tree: 'b'.repeat(40), digest: 'c'.repeat(64),
  previewUrl: 'https://w758-proof.eonapp-ch.pages.dev', deploymentId: 'deployment-w758-proof'
};
const evidence = (kind, id) => [{ kind, id }];

function completeEvidence(score = 9.6) {
  return {
    candidate,
    pillars: Object.fromEntries(EON_CITY_W758_PILLARS.map((pillar) => [pillar.id, { score, evidenceRefs: evidence('browser', `pillar/${pillar.id}`) }])),
    scenarios: Object.fromEntries(EON_CITY_W758_SCENARIOS.map((id) => [id, { passed: true, evidenceRefs: evidence('video', `scenario/${id}`) }])),
    unresolvedIssues: []
  };
}

test('W758 uses the final ten-pillar machine model and all hostile scenarios', () => {
  const plan = buildEonCityW758RedTeamPlan();
  assert.equal(validateEonCityW758RedTeamPlan(plan).ok, true);
  assert.equal(plan.pillars.length, 10);
  assert.equal(Math.round(plan.pillars.reduce((sum, item) => sum + item.weight, 0) * 100), 100);
  assert.ok(plan.scenarios.length >= 35);
  for (const required of ['first-time-user-no-project', 'referral-endpoint-timeout', 'billing-error', 'capture-permission-denied', 'stale-service-worker', 'all-ten-stations', 'privacy-inspection']) assert.ok(plan.scenarios.includes(required));
  assert.equal(plan.thresholds.weightedScore, 9.5);
  assert.equal(plan.thresholds.everyPillar, 9.0);
});

test('W758 source-only template is blocked and cannot award a score', () => {
  const result = evaluateEonCityW758MachineScore(createEonCityW758EvidenceTemplate());
  assert.equal(result.status, 'W758 MACHINE BLOCKED — EVIDENCE INCOMPLETE');
  assert.equal(result.pass, false);
  assert.equal(result.weightedScore, null);
  assert.equal(result.productionAuthorized, false);
  assert.equal(result.sourceOnlyPassAllowed, false);
});

test('W758 rejects string and source-regex references as machine evidence', () => {
  const attempted = completeEvidence();
  attempted.pillars.releaseIntegrity.evidenceRefs = ['tests passed'];
  attempted.scenarios.offline.evidenceRefs = [{ kind: 'source', id: 'regex-only' }];
  const result = evaluateEonCityW758MachineScore(attempted);
  assert.equal(result.status, 'W758 MACHINE BLOCKED — EVIDENCE INCOMPLETE');
  assert.ok(result.missingPillars.includes('releaseIntegrity'));
  assert.ok(result.missingScenarios.includes('offline'));
});

test('W758 passes only a complete exact candidate with 9.5 weighted, every pillar 9.0 and no P0/P1', () => {
  const result = evaluateEonCityW758MachineScore(completeEvidence(9.6));
  assert.equal(result.status, 'W758 MACHINE PASS — OWNER REVIEW READY');
  assert.equal(result.pass, true);
  assert.equal(result.weightedScore, 9.6);
  assert.equal(result.minimumPillarScore, 9.6);
  assert.equal(result.ownerReviewRequired, true);
  assert.equal(result.productionAuthorized, false);
});

test('W758 unresolved P0/P1 is a no-go regardless of average score', () => {
  const input = completeEvidence(10);
  input.unresolvedIssues = [{ id: 'black-city', severity: 'P1', status: 'open', summary: 'Canvas is blank.', evidenceRefs: evidence('screenshot', 'black-city.png') }];
  const result = evaluateEonCityW758MachineScore(input);
  assert.equal(result.status, 'W758 MACHINE FAIL — REPAIR REQUIRED');
  assert.equal(result.pass, false);
  assert.equal(result.unresolvedP1, 1);
});

test('W758 red-team closes W757 declared-but-unenforced throttling and stale provenance', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const reliability = read('assets/js/city/w757/eon-city-w757-performance-reliability.js');
  const manifest = read('assets/js/city/w731/eon-city-w731-launch-asset-manifest.js');
  const sw = read('sw.js');
  assert.match(runtime, /shouldRenderFrame\(\{ at: frameAt, background: backgroundPresentation/);
  assert.match(runtime, /shouldUpdateAnimation\(\{ id: `station:/);
  assert.match(runtime, /shouldUpdateAnimation\(\{ id: `ambient-citizen:/);
  assert.match(reliability, /backgroundDockFrameCapFps: 12/);
  assert.match(reliability, /animationDistanceThrottling: true/);
  assert.match(manifest, /EON_CITY_W757_RUNTIME_PROVENANCE = 'eon-city-living-nexus-command-core-w757-1'/);
  assert.match(sw, /CITY_RUNTIME_PROVENANCE = 'eon-city-living-nexus-command-core-w757-1'/);
});

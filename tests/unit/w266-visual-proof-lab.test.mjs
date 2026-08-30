import assert from 'node:assert/strict';
import test from 'node:test';
import {
  W266_CAPTURE_PROFILES,
  W266_EXTERNAL_VISUAL_EVIDENCE,
  W266_VISUAL_PROOF_LAB_SCHEMA,
  classifyW266CaptureEnvironmentError,
  buildW266VisualProofPlan,
  validateW266VisualProofPlan
} from '../../assets/js/utils/w266-visual-proof-lab.js';

test('W266 defines a local-only visual capture matrix without device or release claims', () => {
  const plan = buildW266VisualProofPlan();
  const validation = validateW266VisualProofPlan(plan);
  assert.equal(plan.schema, W266_VISUAL_PROOF_LAB_SCHEMA);
  assert.equal(validation.ok, true);
  assert.equal(plan.canCertifyDeviceSupport, false);
  assert.equal(plan.canCertifyReleaseReadiness, false);
  assert.ok(W266_CAPTURE_PROFILES.length >= 3);
  assert.ok(plan.captures.length >= 10);
  assert.ok(plan.captures.every((capture) => capture.localAutomationOnly === true));
  assert.ok(plan.captures.every((capture) => capture.userDataPolicy.includes('Do not seed credentials')));
});

test('W266 only captures City Play through the exact W259 opt-in entry route', () => {
  const plan = buildW266VisualProofPlan();
  const playCaptures = plan.captures.filter((capture) => capture.route.includes('/eoncity/play'));
  assert.ok(playCaptures.length >= 2);
  assert.ok(playCaptures.every((capture) => capture.route === '/eoncity/play?preview=1'));
  assert.equal(plan.externalVisualEvidence.length, W266_EXTERNAL_VISUAL_EVIDENCE.length);
  assert.ok(plan.externalVisualEvidence.every((row) => row.status === 'not-collected' && row.evidenceRefs.length === 0));
});

test('W266 rejects a visual plan that claims external evidence or bypasses exact Preview opt-in', () => {
  const plan = buildW266VisualProofPlan();
  const invalid = {
    ...plan,
    canCertifyReleaseReadiness: true,
    captures: plan.captures.map((capture, index) => index === 0 ? { ...capture, route: '/eoncity/play' } : { ...capture }),
    externalVisualEvidence: plan.externalVisualEvidence.map((row, index) => index === 0 ? { ...row, status: 'passed' } : { ...row })
  };
  const validation = validateW266VisualProofPlan(invalid);
  assert.equal(validation.ok, false);
  assert.ok(validation.errors.some((error) => error.includes('self-certify')));
  assert.ok(validation.errors.some((error) => error.includes('exact ?preview=1')));
  assert.ok(validation.errors.some((error) => error.includes('must not pre-claim external evidence')));
});


test('W266 classifies unavailable or policy-blocked browser infrastructure without treating it as app evidence', () => {
  const missingBrowser = classifyW266CaptureEnvironmentError(new Error('browserType.launch: Executable doesn\'t exist at /tmp/chromium'));
  const policyBlocked = classifyW266CaptureEnvironmentError(new Error('net::ERR_BLOCKED_BY_ADMINISTRATOR URLBlocklist'));
  const appFailure = classifyW266CaptureEnvironmentError(new Error('HTTP 500'));
  assert.deepEqual({ blocked: missingBrowser.blocked, code: missingBrowser.code }, { blocked: true, code: 'playwright-browser-unavailable' });
  assert.deepEqual({ blocked: policyBlocked.blocked, code: policyBlocked.code }, { blocked: true, code: 'managed-browser-url-policy' });
  assert.equal(appFailure.blocked, false);
});

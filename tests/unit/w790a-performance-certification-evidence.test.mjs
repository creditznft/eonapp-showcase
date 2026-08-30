import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeEonExpanseW790APerformanceEvidence, validateEonExpanseW790APerformanceEvidence } from '../../assets/js/city/w790/eon-expanse-w790a-performance-certification-evidence.js';

const valid = () => ({
  quality: 'balanced',
  buildDigest: 'c'.repeat(64),
  foregroundTelemetry: { foreground: true, browserProofId: 'chrome-desktop', p50Fps: 56, p95FrameMs: 28, sustainedSingleDigitFrames: 0, measuredAt: 1000, rawFrames: [1, 2, 3] },
  transitionSoak: { verified: true, completedTransitions: 12, memoryGrowthBytes: -2048, measuredAt: 2000, heapDump: 'remove' },
  oneCanonicalScene: true,
  ownsEngine: false,
  ownsScene: false,
  ownsRenderLoop: false,
  privateContentStored: false
});

test('W790A stores bounded foreground and soak metrics only', () => {
  const state = sanitizeEonExpanseW790APerformanceEvidence(valid());
  assert.ok(state);
  assert.equal(state.foregroundTelemetry.rawFrames, undefined);
  assert.equal(state.transitionSoak.heapDump, undefined);
  assert.equal(state.backgroundThrottleReportAccepted, false);
  assert.equal(state.privateContentStored, false);
});

test('W790A rejects background, malformed and second-runtime evidence', () => {
  assert.equal(sanitizeEonExpanseW790APerformanceEvidence({ ...valid(), backgroundThrottleReport: true }), null);
  assert.equal(sanitizeEonExpanseW790APerformanceEvidence({ ...valid(), foregroundTelemetry: { ...valid().foregroundTelemetry, foreground: false } }), null);
  assert.equal(sanitizeEonExpanseW790APerformanceEvidence({ ...valid(), ownsScene: true }), null);
});

test('W790A revalidates quality profile and exact build digest', () => {
  const state = sanitizeEonExpanseW790APerformanceEvidence(valid());
  assert.equal(validateEonExpanseW790APerformanceEvidence(state, { expectedQuality: 'balanced', expectedBuildDigest: 'c'.repeat(64) }).ok, true);
  assert.equal(validateEonExpanseW790APerformanceEvidence(state, { expectedQuality: 'cinematic' }).ok, false);
  assert.equal(validateEonExpanseW790APerformanceEvidence(state, { expectedBuildDigest: 'd'.repeat(64) }).ok, false);
});

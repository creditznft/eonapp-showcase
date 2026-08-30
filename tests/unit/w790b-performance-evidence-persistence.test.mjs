import test from 'node:test';
import assert from 'node:assert/strict';
import { createEonExpanseW766AInitialState, createEonExpanseW766APersistence, validateEonExpanseW766AState } from '../../assets/js/city/w766/eon-expanse-w766a-foundation.js';

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
}

const validEvidence = () => ({
  quality: 'balanced',
  buildDigest: 'c'.repeat(64),
  foregroundTelemetry: { foreground: true, browserProofId: 'chrome-desktop', p50Fps: 55, p95FrameMs: 30, sustainedSingleDigitFrames: 0, measuredAt: 1000, rawFrames: [1, 2] },
  transitionSoak: { verified: true, completedTransitions: 11, memoryGrowthBytes: -1024, measuredAt: 2000, heapDump: 'remove' },
  oneCanonicalScene: true,
  ownsEngine: false,
  ownsScene: false,
  ownsRenderLoop: false,
  privateContentStored: false
});

test('W790B persists normalized foreground evidence and strips raw diagnostics', () => {
  const storage = memoryStorage();
  const persistence = createEonExpanseW766APersistence({ storage, now: () => 5000 });
  const base = createEonExpanseW766AInitialState({ now: 1000 });
  persistence.write({ ...base, futureRegionPerformanceEvidence: validEvidence() });
  const restored = persistence.read(base).futureRegionPerformanceEvidence;
  assert.equal(restored.quality, 'balanced');
  assert.equal(restored.foregroundTelemetry.rawFrames, undefined);
  assert.equal(restored.transitionSoak.heapDump, undefined);
  assert.equal(restored.backgroundThrottleReportAccepted, false);
});

test('W790B drops background or malformed performance evidence', () => {
  const storage = memoryStorage();
  const persistence = createEonExpanseW766APersistence({ storage, now: () => 5000 });
  const base = createEonExpanseW766AInitialState({ now: 1000 });
  persistence.write({ ...base, futureRegionPerformanceEvidence: { ...validEvidence(), backgroundThrottleReport: true } });
  assert.equal(persistence.read(base).futureRegionPerformanceEvidence, null);
});

test('W790B state validation rejects second-runtime or automatic-certification claims', () => {
  const base = createEonExpanseW766AInitialState({ now: 1000 });
  const validation = validateEonExpanseW766AState({ ...base, futureRegionPerformanceEvidence: { ownsScene: true, automaticCertification: true } });
  assert.equal(validation.ok, false);
  assert.match(validation.errors.join(','), /future-region-performance-evidence-boundary-invalid/);
});

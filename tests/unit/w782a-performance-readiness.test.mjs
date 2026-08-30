import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { deriveEonExpanseW782APerformanceReadiness } from '../../assets/js/city/w782/eon-expanse-w782a-performance-readiness.js';

const renderer = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766i-open-world-renderer.js', import.meta.url), 'utf8');
const summary = {
  quality: 'balanced',
  performanceEstimate: { triangles: 200000, drawCalls: 200, lights: 10, particles: 100 },
  performanceBudget: { triangles: 360000, drawCalls: 320, lights: 18, particles: 180 }
};

test('W782A exposes the continuity estimate and quality budget through the canonical renderer summary', () => {
  assert.match(renderer, /performanceEstimate: continuity\?\.performanceEstimate \|\| null/);
  assert.match(renderer, /performanceBudget: continuity\?\.performanceBudget \|\| null/);
  assert.match(renderer, /quality: resolvedQuality/);
});

test('W782A can pass static budgets without claiming foreground certification', () => {
  const readiness = deriveEonExpanseW782APerformanceReadiness({ openWorldSummary: summary });
  assert.equal(readiness.staticBudgetPass, true);
  assert.equal(readiness.foregroundMeasured, false);
  assert.equal(readiness.certificationReady, false);
  assert.equal(readiness.status, 'foreground-browser-measurement-required');
});

test('W782A rejects exceeded static budgets before browser certification', () => {
  const readiness = deriveEonExpanseW782APerformanceReadiness({ openWorldSummary: { ...summary, performanceEstimate: { ...summary.performanceEstimate, drawCalls: 500 } } });
  assert.equal(readiness.staticBudgetPass, false);
  assert.equal(readiness.status, 'static-budget-exceeded');
});

test('W782A requires foreground telemetry and repeated Hub to Expanse soak together', () => {
  const foregroundTelemetry = { foreground: true, p50Fps: 48, p95FrameMs: 32, sustainedSingleDigitFrames: 0 };
  const withoutSoak = deriveEonExpanseW782APerformanceReadiness({ openWorldSummary: summary, foregroundTelemetry });
  const withSoak = deriveEonExpanseW782APerformanceReadiness({ openWorldSummary: summary, foregroundTelemetry, transitionSoak: { verified: true, completedTransitions: 12, memoryGrowthBytes: 0 } });
  assert.equal(withoutSoak.status, 'hub-expanse-transition-soak-required');
  assert.equal(withSoak.certificationReady, true);
});

test('W782A never accepts background throttling reports as certification', () => {
  const readiness = deriveEonExpanseW782APerformanceReadiness({ openWorldSummary: summary, foregroundTelemetry: { foreground: false, p50Fps: 60, p95FrameMs: 16 } });
  assert.equal(readiness.backgroundThrottleReportAcceptedAsCertification, false);
  assert.equal(readiness.automaticCertification, false);
  assert.equal(readiness.grantsXp, false);
  assert.equal(readiness.mutatesRuntime, false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runtime = readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('W790C counts performance evidence only after current-candidate verification', () => {
  assert.match(runtime, /let expanseVerifiedPerformanceEvidence = null/);
  assert.match(runtime, /foregroundTelemetry: expanseVerifiedPerformanceEvidence\?\.foregroundTelemetry/);
  assert.match(runtime, /transitionSoak: expanseVerifiedPerformanceEvidence\?\.transitionSoak/);
});

test('W790C verifies the exact served candidate digest before persistence', () => {
  assert.match(runtime, /submitExpanseFutureRegionPerformanceEvidence/);
  assert.match(runtime, /\/release\/candidate-provenance\.json/);
  assert.match(runtime, /cache: 'no-store'/);
  assert.match(runtime, /expectedQuality: resolvedQuality, expectedBuildDigest: candidateDigest/);
  assert.match(runtime, /served-candidate-provenance-unavailable/);
});

test('W790C requires explicit revalidation after reload and cannot certify or activate', () => {
  assert.match(runtime, /revalidateExpanseFutureRegionPerformanceEvidence/);
  assert.match(runtime, /explicit-user-action-required/);
  assert.match(runtime, /certified: false, gatewayActivated: false/);
  assert.equal((runtime.match(/engine = new Engine\(/g) || []).length, 1);
  assert.equal((runtime.match(/scene = new Scene\(/g) || []).length, 1);
});

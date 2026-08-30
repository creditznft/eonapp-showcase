import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateEonCityR11RuntimeGate } from '../../assets/js/city/r11/eon-city-r11-runtime-gate.js';

test('R11 refuses an owner candidate when the loaded spatial report is not clean', () => {
  const result = evaluateEonCityR11RuntimeGate({
    spatialReport: { ok: false },
    surfaceSnapshot: { openBlockingCount: 0 },
    viewportProfile: { id: 'desktop-standard', mobile: false, labelBudget: 3 },
    firstPlayableFrame: true
  });
  assert.equal(result.ok, false);
  assert.ok(result.failures.includes('spatial-diagnostics'));
});

test('R11 passes only a clean loaded scene with one surface authority and viewport profile', () => {
  const result = evaluateEonCityR11RuntimeGate({
    spatialReport: { ok: true },
    surfaceSnapshot: { openBlockingCount: 1 },
    viewportProfile: { id: 'mobile-portrait', mobile: true, labelBudget: 1 },
    firstPlayableFrame: true
  });
  assert.equal(result.ok, true, result.failures.join('\n'));
  assert.equal(result.ownerCandidateReady, true);
});

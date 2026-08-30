import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const overlay = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');

test('W782B derives readiness from the canonical open-world summary and separately verified browser evidence', () => {
  assert.match(runtime, /deriveEonExpanseW782APerformanceReadiness\(\{ openWorldSummary: openWorld, foregroundTelemetry: expanseVerifiedPerformanceEvidence/);
  assert.match(runtime, /transitionSoak: expanseVerifiedPerformanceEvidence/);
  assert.match(runtime, /performanceReadiness,/);
  assert.doesNotMatch(runtime, /foregroundTelemetry:\s*\{[^}]*foreground:\s*true/);
});

test('W782B surfaces static and foreground performance gates through the existing frontier card', () => {
  assert.match(overlay, /performanceReadiness: lastBoard\.performanceReadiness/);
  assert.match(overlay, /Performance gate:/);
  assert.match(overlay, /performanceReadiness\?\.status/);
});

test('W782B does not claim browser certification or add another runtime owner', () => {
  assert.doesNotMatch(overlay, /Performance certified/);
  assert.equal((runtime.match(/new Engine\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\(/g) || []).length, 1);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runtime = readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('W787B refreshes privacy-safe evidence from the current release authorities', () => {
  assert.match(runtime, /createEonExpanseW787AReleaseEvidence/);
  assert.match(runtime, /releaseMatrix: futureRegionReleaseMatrix/);
  assert.match(runtime, /packageReadiness: futureRegionPackageReadiness/);
  assert.match(runtime, /performanceReadiness, artAudit: openWorldArtAudit/);
});

test('W787B exposes read-only evidence and requires explicit action for JSON export', () => {
  assert.match(runtime, /getExpanseFutureRegionReleaseEvidence\(\)/);
  assert.match(runtime, /exportExpanseFutureRegionReleaseEvidence/);
  assert.match(runtime, /explicit-user-action-required/);
  assert.match(runtime, /serializeEonExpanseW787AReleaseEvidence/);
});

test('W787B does not add another engine, scene or release action', () => {
  assert.equal((runtime.match(/engine = new Engine\(/g) || []).length, 1);
  assert.equal((runtime.match(/scene = new Scene\(/g) || []).length, 1);
  assert.doesNotMatch(runtime, /activateFutureRegionGateway|releaseFutureRegion\(/);
});

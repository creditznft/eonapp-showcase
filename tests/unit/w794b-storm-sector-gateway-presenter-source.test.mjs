import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../assets/js/city/w794/eon-expanse-w794b-storm-sector-gateway-presenter.js', import.meta.url), 'utf8');

test('W794B mounts an authored gateway only after exact activation', () => {
  assert.match(source, /sanitizeEonExpanseW793AActivation/);
  assert.match(source, /exact-storm-sector-activation-required/);
  assert.match(source, /charged-transit-gate/);
  assert.match(source, /evaluateEonExpanseW767AAssetPresentation/);
  assert.match(source, /presented-authored-gateway/);
  assert.match(source, /rejected-authored-gateway/);
});

test('W794B interaction exists only after visible authored validation', () => {
  const truthIndex = source.indexOf('if (!truth.ok)');
  const actionIndex = source.indexOf("action: 'enter-storm-sector'");
  assert.ok(truthIndex >= 0 && actionIndex > truthIndex);
  assert.match(source, /proceduralGatewayFallbackShown: false/);
  assert.match(source, /interactive: presentation\?\.status === 'presented-authored-gateway'/);
});

test('W794B preserves the canonical runtime and disposes stale loads', () => {
  assert.doesNotMatch(source, /new\s+Engine\s*\(/);
  assert.doesNotMatch(source, /new\s+Scene\s*\(/);
  assert.doesNotMatch(source, /runRenderLoop\s*\(/);
  assert.match(source, /stale-gateway-load/);
  assert.match(source, /container\.dispose/);
  assert.match(source, /secondEngineCreated: false/);
  assert.match(source, /secondSceneCreated: false/);
  assert.match(source, /secondRenderLoopCreated: false/);
});

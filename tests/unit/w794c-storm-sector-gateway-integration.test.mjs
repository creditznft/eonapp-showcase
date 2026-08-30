import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sourcePath = new URL('../../assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js', import.meta.url);
const source = await readFile(sourcePath, 'utf8');

test('W794C mounts Storm Sector gateway in the canonical Gateway root', () => {
  assert.match(source, /mountEonExpanseW794BStormSectorGatewayPresenter/);
  assert.match(source, /scene, parent: signalRoot, reducedMotion/);
  assert.match(source, /initialFutureRegionActivation = null/);
  assert.doesNotMatch(source, /new Engine\s*\(/);
  assert.doesNotMatch(source, /new Scene\s*\(/);
  assert.doesNotMatch(source, /runRenderLoop\s*\(/);
});

test('W794C routes only visibly authored gateway interactions through the canonical dispatcher', () => {
  assert.match(source, /action === 'enter-storm-sector'/);
  assert.match(source, /metadata\.kind === 'future-region-authored-gateway'/);
  assert.match(source, /activationId: metadata\.activationId/);
  assert.match(source, /packageDigest: metadata\.packageDigest/);
  assert.match(source, /explicitUserAction: true/);
});

test('W794C exposes activation, update, summary and disposal lifecycle', () => {
  assert.match(source, /applyFutureRegionActivation\(nextActivation = null\)/);
  assert.match(source, /stormSectorGateway\.applyActivation/);
  assert.match(source, /stormSectorGateway\.update/);
  assert.match(source, /stormSectorGateway\?\.dispose/);
  assert.match(source, /stormSectorGateway: stormSectorGateway\?\.getSummary/);
});

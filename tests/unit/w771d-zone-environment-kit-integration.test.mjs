import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const gateway = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js', import.meta.url), 'utf8');

test('W771D mounts the cinematic environment kit under the existing Gateway root', () => {
  assert.match(gateway, /mountEonExpanseW771CEnvironmentKitPresenter/);
  assert.match(gateway, /parent: root/);
  assert.match(gateway, /cinematic-environment-kit-failed/);
  assert.equal((gateway.match(/new Engine\s*\(/g) || []).length, 0);
  assert.equal((gateway.match(/new Scene\s*\(/g) || []).length, 0);
});

test('W771D follows the existing Expanse lifecycle and render update', () => {
  assert.match(gateway, /cinematicEnvironment\.activate/);
  assert.match(gateway, /cinematicEnvironment\.deactivate/);
  assert.match(gateway, /cinematicEnvironment\.update/);
  assert.match(gateway, /cinematicEnvironment\?\.dispose/);
  assert.equal((gateway.match(/requestAnimationFrame/g) || []).length, 0);
});

test('W771D projects real mission and companion progress into environmental restoration', () => {
  assert.match(gateway, /cinematicEnvironment\.applyProgress/);
  assert.match(gateway, /companionBonded: companionState\?\.bonded === true/);
  assert.match(gateway, /frontier\?\.applyProgress/);
});

test('W771D exposes cinematic environment truth in the existing Gateway summary', () => {
  assert.match(gateway, /cinematicEnvironment: cinematicEnvironment\?\.getSummary/);
  assert.match(gateway, /assetsDeferredUntilEntry: true/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../assets/js/city/w792/eon-expanse-w792c-storm-sector-presenter.js', import.meta.url), 'utf8');

test('W792C presenter mounts under the canonical scene without owning runtime', () => {
  assert.match(source, /canonical-scene-required/);
  assert.match(source, /oneCanonicalScene: true/);
  assert.match(source, /secondEngineCreated: false/);
  assert.match(source, /secondSceneCreated: false/);
  assert.match(source, /secondRenderLoopCreated: false/);
  assert.doesNotMatch(source, /new\s+Engine\s*\(/);
  assert.doesNotMatch(source, /new\s+Scene\s*\(/);
  assert.doesNotMatch(source, /runRenderLoop\s*\(/);
});

test('W792C exact activation and package digest are mandatory', () => {
  assert.match(source, /explicitOwnerAction === true/);
  assert.match(source, /automaticActivation === false/);
  assert.match(source, /EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST/);
  assert.match(source, /exact-owner-activation-required/);
});

test('W792C validates authored heroes and disposes stale or inactive loads', () => {
  assert.match(source, /evaluateEonExpanseW767AAssetPresentation/);
  assert.match(source, /stale-authored-hero-load/);
  assert.match(source, /container\.dispose/);
  assert.match(source, /clearWorld/);
  assert.match(source, /rejected-authored-hero/);
  assert.match(source, /presented-authored-hero/);
});

test('W792C uses authored hero GLBs while primitives remain connector-only', () => {
  assert.match(source, /future-region-authored-hero/);
  assert.match(source, /future-region-ground-connector/);
  assert.match(source, /finishedHero: false/);
  assert.match(source, /finishedHeroPrimitive: false/);
  assert.doesNotMatch(source, /developmentProxy: true/);
});
test('W792C suspension retains decoded Storm resources while final dispose still clears them', () => {
  assert.match(source, /suspended = currentPlan !== null/);
  assert.match(source, /decodedAssetsRetained: suspended/);
  assert.match(source, /disposedRegionResources: false/);
  assert.match(source, /root\.setEnabled\?\.\(false\)/);
  const suspendStart = source.indexOf('    suspend() {');
  const disposeStart = source.indexOf('    dispose() {', suspendStart);
  assert.ok(suspendStart >= 0 && disposeStart > suspendStart);
  assert.doesNotMatch(source.slice(suspendStart, disposeStart), /clearWorld\(/);
  assert.match(source.slice(disposeStart), /clearWorld\(\)/);
});

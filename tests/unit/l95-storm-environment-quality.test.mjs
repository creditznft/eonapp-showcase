import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createEonExpanseW792BStormSectorPlan } from '../../assets/js/city/w792/eon-expanse-w792b-storm-sector-layout.js';

const presenter = await readFile(new URL('../../assets/js/city/w792/eon-expanse-w792c-storm-sector-presenter.js', import.meta.url), 'utf8');
const runtime = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('L95 Storm Sector quality tiers have bounded streaming budgets', () => {
  const lite = createEonExpanseW792BStormSectorPlan({ quality: 'lite' });
  const balanced = createEonExpanseW792BStormSectorPlan({ quality: 'balanced' });
  const cinematic = createEonExpanseW792BStormSectorPlan({ quality: 'cinematic' });
  assert.equal(lite.cells.length, 5);
  assert.equal(balanced.cells.length, 9);
  assert.equal(cinematic.cells.length, 13);
  assert.ok(lite.streamingBudget.maxParticles < balanced.streamingBudget.maxParticles);
  assert.ok(balanced.streamingBudget.maxParticles < cinematic.streamingBudget.maxParticles);
});

test('L95 Storm presenter prunes cells when quality drops instead of accumulating old tiers', () => {
  assert.match(presenter, /desiredCellIds/);
  assert.match(presenter, /if \(desiredCellIds\.has\(cellId\)\) continue/);
  assert.match(presenter, /cells\.delete\(cellId\)/);
  assert.match(presenter, /qualityPruningApplied: cells\.size === plan\.cells\.length/);
  assert.match(presenter, /qualityPruningGuaranteed/);
});

test('L95 Storm creates a bounded Storm Eye spectacle and charged cell language without fake heroes', () => {
  assert.match(presenter, /storm-eye-vortex-root/);
  assert.match(presenter, /desiredRingCount = plan\.quality === 'cinematic' \? 3 : plan\.quality === 'balanced' \? 2 : 1/);
  assert.match(presenter, /family: 'electrical-storms'/);
  assert.match(presenter, /family: 'signal-pylons'/);
  assert.match(presenter, /finishedHero: false/);
  assert.match(presenter, /interactive: false/);
});

test('L95 Storm animation uses the canonical City render update and owns no second loop', () => {
  assert.match(presenter, /update\(seconds = 0\)/);
  assert.match(presenter, /ownsRenderLoop: false/);
  assert.match(runtime, /expanseStormSectorPresenter\?\.update\?\.\(seconds\)/);
  assert.doesNotMatch(presenter, /requestAnimationFrame/);
  assert.doesNotMatch(presenter, /setInterval/);
});

test('L95 Storm hero GLBs obey the shared optional asset pressure gate', () => {
  assert.match(presenter, /buildEonCityL95ProgressiveAssetAdmission/);
  assert.match(presenter, /optionalConcurrencyLimit/);
  assert.match(presenter, /queued-authored-hero/);
  assert.match(presenter, /setOptionalAssetAdmission/);
  assert.match(runtime, /stormAdmission/);
});


test('L95 Storm freezes static world transforms while storm-eye effects remain dynamic', () => {
  assert.match(presenter, /function freezeStaticNode/);
  assert.match(presenter, /freezeStaticNode\(platform\)/);
  assert.match(presenter, /freezeStaticNode\(mesh\)/);
  assert.match(presenter, /freezeStaticNode\(wrapper\)/);
  assert.match(presenter, /staticWorldMatrices:\s*true/);
  assert.match(presenter, /dynamicEnvironmentLimitedToStormEye:\s*true/);
  assert.match(presenter, /id\.startsWith\('storm-eye-ring:'\)/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  createEonExpanseW770ABuildingCompositionCatalog,
  getEonExpanseW770ABuildingComposition,
  validateEonExpanseW770ABuildingCompositionCatalog
} from '../../assets/js/city/w770/eon-expanse-w770a-my-frontier-building-composition-catalog.js';

const catalog = createEonExpanseW770ABuildingCompositionCatalog();

test('W770A provides one validated authored composition for all 19 approved buildings', () => {
  assert.equal(catalog.buildingCount, 19);
  assert.equal(catalog.compositionReadyCount, 19);
  assert.equal(catalog.partCount >= 45, true);
  assert.equal(validateEonExpanseW770ABuildingCompositionCatalog(catalog).ok, true);
});

test('W770A uses only same-origin content-hashed authored GLBs with fixed local transforms', () => {
  for (const entry of catalog.entries) {
    assert.equal(entry.parts.length >= 2, true);
    for (const component of entry.parts) {
      assert.match(component.variants.primary.path, /^\/assets\/city\/(?:w649|w659f)\//);
      assert.match(component.variants.primary.path, /\.[a-f0-9]{12}\.glb$/i);
      assert.match(component.variants.fallback.path, /\.[a-f0-9]{12}\.glb$/i);
      assert.equal(component.userTransformAllowed, false);
      assert.equal(component.remoteAssetAllowed, false);
    }
  }
});

test('W770A truthfully distinguishes interim compositions from bespoke building art', () => {
  const design = getEonExpanseW770ABuildingComposition('design-pavilion');
  const garden = getEonExpanseW770ABuildingComposition('reflection-garden');
  assert.equal(design.status, 'authored-composition-ready');
  assert.equal(design.bespokeArtComplete, false);
  assert.match(design.dedicatedArtNote, /dedicated pavilion skin/i);
  assert.match(garden.dedicatedArtNote, /dedicated authored landscape kit/i);
  assert.equal(catalog.finishedBespokeBuildingClaimed, false);
});

test('W770A creates no runtime, network, storage, construction or free-placement authority', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w770/eon-expanse-w770a-my-frontier-building-composition-catalog.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)|runRenderLoop|fetch\s*\(|localStorage|sessionStorage|confirmConstruction|awardXp/);
  assert.equal(catalog.rawCoordinatesAccepted, false);
  assert.equal(catalog.privateContentStored, false);
});

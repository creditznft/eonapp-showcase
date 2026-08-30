import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  buildEonCityW710ContinuousCoreFabric,
  getEonCityW710ContinuousCoreFabricTruth,
  validateEonCityW710ContinuousCoreFabric
} from '../../assets/js/city/w710/eon-city-w710-continuous-core-fabric.js';
import { buildEonCityConnectedCorePlan, validateEonCityConnectedCorePlan } from '../../assets/js/city/eon-city-connected-core.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

function fixture(quality = 'balanced') {
  const core = buildEonCityConnectedCorePlan({ quality, mode: 'explore' });
  return { core, fabric: core.continuousFabric };
}

test('W710 validates continuous Core fabric at all three quality levels', () => {
  for (const quality of ['lite', 'balanced', 'cinematic']) {
    const { core, fabric } = fixture(quality);
    assert.equal(validateEonCityConnectedCorePlan(core).ok, true, quality);
    assert.equal(validateEonCityW710ContinuousCoreFabric(fabric).ok, true, quality);
    assert.equal(fabric.continuousGround.seamless, true, quality);
    assert.equal(fabric.undersideShield.opaqueFromBelow, true, quality);
    assert.equal(fabric.coverage.groundCoverageRatio, 1, quality);
    assert.equal(fabric.coverage.noUncoveredTerrain, true, quality);
    assert.ok(fabric.coverage.occupiedCellRatio >= 0.52, `${quality}:${fabric.coverage.occupiedCellRatio}`);
  }
});

test('W710 preserves all authored district Sanctums while filling their gaps', () => {
  const { fabric } = fixture();
  assert.equal(fabric.districtExclusionZones.length, 9);
  assert.equal(fabric.districtExclusionZones.every((entry) => entry.sanctumPreserved), true);
  assert.ok(fabric.infillBlocks.length >= 40);
  assert.equal(fabric.infillBlocks.every((entry) => entry.sanctumPreserved && entry.interactive === false), true);
  assert.equal(fabric.sanctumsPreserved, true);
});

test('W710 provides streets, public plazas, three skyline depths and four physical border continuations', () => {
  const { fabric } = fixture();
  assert.ok(fabric.roads.length >= 17);
  assert.ok(fabric.plazas.length >= 4);
  assert.deepEqual(fabric.skylineLayers.map((entry) => entry.id), ['near', 'mid', 'far']);
  assert.equal(fabric.borderCorridors.length, 4);
  const flagship = fabric.borderCorridors.find((entry) => entry.flagshipGateway);
  assert.equal(flagship?.id, 'w710:border:north-expanse');
  assert.equal(flagship?.visibleContinuation, true);
  assert.equal(flagship?.automaticEntry, false);
  assert.equal(flagship?.automaticNavigation, false);
});

test('W710 is deterministic for identical public inputs', () => {
  const { core } = fixture();
  const first = buildEonCityW710ContinuousCoreFabric({
    districts: core.districts,
    streetConnections: core.streetConnections,
    physicalGateway: core.physicalGateway,
    quality: 'balanced'
  });
  const second = buildEonCityW710ContinuousCoreFabric({
    districts: core.districts,
    streetConnections: core.streetConnections,
    physicalGateway: core.physicalGateway,
    quality: 'balanced'
  });
  assert.deepEqual(first, second);
});

test('W710 renderer stays inside the existing Babylon scene and renders every fabric layer', () => {
  const source = read('assets/js/city/eon-city-connected-core-babylon.js');
  assert.match(source, /w710-continuous-core-deck/);
  assert.match(source, /w710-continuous-core-underside-shield/);
  assert.match(source, /continuous-core-road-foundation/);
  assert.match(source, /continuous-core-infill-block/);
  assert.match(source, /continuous-core-public-plaza/);
  assert.match(source, /continuous-core-skyline-/);
  assert.match(source, /continuous-core-border-corridor/);
  assert.doesNotMatch(source, /new\s+(?:Engine|Scene)\s*\(/);
  assert.doesNotMatch(source, /runRenderLoop\s*\(/);
  assert.doesNotMatch(source, /createElement\s*\(\s*['"]canvas/);
});

test('W710 truth does not invent work, navigation, entry or private data', () => {
  const truth = getEonCityW710ContinuousCoreFabricTruth();
  assert.equal(truth.authoredSanctumsPreserved, true);
  assert.equal(truth.continuousUrbanGround, true);
  assert.equal(truth.interDistrictInfillRequired, true);
  assert.equal(truth.threeSkylineDepths, true);
  assert.equal(truth.physicalBorderContinuations, true);
  assert.equal(truth.oneCanonicalScene, true);
  assert.equal(truth.startsSecondRenderer, false);
  assert.equal(truth.automaticNavigation, false);
  assert.equal(truth.automaticEntry, false);
  assert.equal(truth.readsPrivateWork, false);
});

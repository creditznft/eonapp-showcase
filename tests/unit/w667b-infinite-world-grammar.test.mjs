import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  EON_CITY_W667_PRACTICAL_WORLD_BOUND,
  EON_CITY_W667_REGION_SIZE_CELLS,
  EON_CITY_W667_WORLD_GRAMMAR_SCHEMA,
  buildEonCityW667WorldCell,
  getEonCityW667WorldGrammarSummary,
  validateEonCityW667WorldCell
} from '../../assets/js/city/w667/eon-city-w667-expanse-world-grammar.js';
import { buildEonCityLivingNexusExpanse } from '../../assets/js/city/eon-city-living-nexus-hybrid.js';

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('W667B world grammar is deterministic, seed-variable and practically unbounded', () => {
  assert.equal(EON_CITY_W667_WORLD_GRAMMAR_SCHEMA, 'eon.city.expanse-world-grammar.w667b.v1');
  assert.equal(EON_CITY_W667_PRACTICAL_WORLD_BOUND, 1_000_000);
  const runtimeSource = read('assets/js/city/eon-city-living-nexus-babylon-runtime.js');
  assert.match(runtimeSource, /EON_CITY_LIVING_NEXUS_WORLD_BOUND = EON_CITY_W667_PRACTICAL_WORLD_BOUND/);
  const first = buildEonCityW667WorldCell({ x: 281, z: -917, seed: 'owner-world-a' });
  const again = buildEonCityW667WorldCell({ x: 281, z: -917, seed: 'owner-world-a' });
  const other = buildEonCityW667WorldCell({ x: 281, z: -917, seed: 'owner-world-b' });
  assert.deepEqual(first, again);
  assert.notEqual(first.variationSignature, other.variationSignature);
  assert.equal(validateEonCityW667WorldCell(first).ok, true);
  assert.equal(first.visibleHardBorder, false);
  assert.equal(first.privateDataRead, false);
  assert.equal(first.networkRequestCreated, false);
});

test('W667B coherent 6×6 regions avoid random-noise world design', () => {
  const origin = buildEonCityW667WorldCell({ x: 12, z: -24, seed: 'regional-world' });
  for (let dx = 0; dx < EON_CITY_W667_REGION_SIZE_CELLS; dx += 1) {
    for (let dz = 0; dz < EON_CITY_W667_REGION_SIZE_CELLS; dz += 1) {
      const cell = buildEonCityW667WorldCell({ x: 12 + dx, z: -24 + dz, seed: 'regional-world' });
      assert.equal(cell.region.id, origin.region.id);
      assert.equal(cell.region.archetype.id, origin.region.archetype.id);
      assert.equal(cell.visualIdentity.id, origin.visualIdentity.id);
    }
  }
  const neighbourRegion = buildEonCityW667WorldCell({ x: 18, z: -24, seed: 'regional-world' });
  assert.notEqual(neighbourRegion.region.id, origin.region.id);
});

test('W667B produces high variation without breaking connected streets', () => {
  const signatures = new Set();
  const archetypes = new Set();
  const streets = new Set();
  const landmarks = [];
  for (let x = -20; x < 20; x += 1) {
    for (let z = -20; z < 20; z += 1) {
      const cell = buildEonCityW667WorldCell({ x, z, seed: 'variation-world' });
      signatures.add(cell.variationSignature);
      archetypes.add(cell.region.archetype.id);
      streets.add(cell.streetProfile.id);
      if (cell.landmark) landmarks.push(cell.landmark);
      assert.equal(cell.roadGrammar.connected, true);
      assert.equal(cell.roadGrammar.north && cell.roadGrammar.east && cell.roadGrammar.south && cell.roadGrammar.west, true);
      assert.ok(cell.lotPlan.length >= 3 && cell.lotPlan.length <= 5);
      assert.ok(cell.terrainProfile?.id && cell.publicSpaceProfile?.id && cell.skylineProfile?.id && cell.microClimate?.id);
    }
  }
  assert.ok(signatures.size > 1500, `unique signatures: ${signatures.size}`);
  assert.ok(archetypes.size >= 8, `archetypes: ${archetypes.size}`);
  assert.ok(streets.size >= 9, `streets: ${streets.size}`);
  assert.ok(landmarks.length >= 80, `landmarks: ${landmarks.length}`);
  assert.ok(landmarks.some((entry) => entry.rarity === 'rare' || entry.rarity === 'epic' || entry.rarity === 'legendary'));
});

test('W667B advertises a million-plus combination space and streams it through the active Expanse', () => {
  const summary = getEonCityW667WorldGrammarSummary();
  assert.ok(summary.approximateCombinationSpace > 1_000_000_000, String(summary.approximateCombinationSpace));
  assert.ok(summary.regionArchetypeCount >= 18);
  assert.ok(summary.streetProfileCount >= 18);
  assert.ok(summary.terrainProfileCount >= 10);
  assert.ok(summary.publicSpaceProfileCount >= 10);
  assert.ok(summary.skylineProfileCount >= 10);
  assert.equal(summary.visibleHardBorder, false);
  const expanse = buildEonCityLivingNexusExpanse({ position: { x: 48, z: 5 }, seed: 'owner-world' });
  assert.equal(expanse.practicallyInfinite, true);
  assert.equal(expanse.worldGrammar.schema, EON_CITY_W667_WORLD_GRAMMAR_SCHEMA);
  assert.equal(expanse.worldGrammar.practicalWorldBound, 1_000_000);
  assert.ok(expanse.cells.every((cell) => cell.region?.archetype?.id && cell.streetProfile?.id && cell.variationSignature && cell.discovery?.code));
});

test('W667B renderer varies streets, lots, plazas and exact landmark interactions', () => {
  const runtime = read('assets/js/city/eon-city-living-nexus-babylon-runtime.js');
  const product = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
  assert.match(runtime, /cell\.roadGrammar\?\.roadWidth/);
  assert.match(runtime, /living-nexus-expanse-plaza/);
  assert.match(runtime, /cell\.lotPlan/);
  assert.match(runtime, /regionArchetypeId/);
  assert.match(runtime, /interactionKind: 'expanse-landmark'/);
  assert.match(runtime, /discoveryCode/);
  assert.match(product, /metadata\.interactionKind === 'expanse-landmark'/);
  assert.match(product, /Its one reviewed action is ready/);
  assert.match(product, /type: 'asset-function'/);
});

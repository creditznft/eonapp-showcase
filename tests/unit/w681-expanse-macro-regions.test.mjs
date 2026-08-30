import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildEonCityW681ExpanseMacroRegionPlan,
  getEonCityW681ExpanseMacroRegionTruth,
  validateEonCityW681ExpanseMacroRegionPlan
} from '../../assets/js/city/w681/eon-city-w681-expanse-macro-regions.js';

test('W681 surrounds the detailed stream with nine coherent macro-regions', () => {
  const plan = buildEonCityW681ExpanseMacroRegionPlan({ position: { x: 0, z: 0 }, seed: 'w681-test' });
  const validation = validateEonCityW681ExpanseMacroRegionPlan(plan);
  assert.equal(validation.ok, true);
  assert.equal(plan.macroRegionCount, 9);
  assert.equal(plan.arterials.length, 12);
  assert.equal(plan.horizonAnchors.length, 8);
  assert.equal(plan.regions.find((entry) => entry.role === 'current').center.x, 0);
});

test('W681 changes macro authority only after crossing the macro boundary', () => {
  const origin = buildEonCityW681ExpanseMacroRegionPlan({ position: { x: 0, z: 0 }, seed: 'w681-test' });
  const same = buildEonCityW681ExpanseMacroRegionPlan({ position: { x: 70, z: 0 }, seed: 'w681-test' });
  const east = buildEonCityW681ExpanseMacroRegionPlan({ position: { x: 100, z: 0 }, seed: 'w681-test' });
  assert.equal(same.currentRegionId, origin.currentRegionId);
  assert.notEqual(east.currentRegionId, origin.currentRegionId);
  assert.equal(east.detailedWindowCells, 25);
});

test('W681 macro identities are deterministic and road-connected', () => {
  const first = buildEonCityW681ExpanseMacroRegionPlan({ position: { x: 190, z: -210 }, seed: 'w681-repeat' });
  const second = buildEonCityW681ExpanseMacroRegionPlan({ position: { x: 190, z: -210 }, seed: 'w681-repeat' });
  assert.deepEqual(first.regions.map((entry) => entry.deterministicSignature), second.regions.map((entry) => entry.deterministicSignature));
  assert.equal(first.allAdjacentRegionsRoadConnected, true);
  assert.equal(first.visibleHardBorder, false);
});

test('W681 is rendered below the existing Expanse root without another renderer', () => {
  const runtime = fs.readFileSync('assets/js/city/eon-city-living-nexus-babylon-runtime.js', 'utf8');
  assert.match(runtime, /buildEonCityW681ExpanseMacroRegionPlan/);
  assert.match(runtime, /w681-expanse-macro-arterial/);
  assert.match(runtime, /macroRegionRoot\.parent = expanseRoot/);
  const truth = getEonCityW681ExpanseMacroRegionTruth();
  assert.equal(truth.secondRendererCreated, false);
  assert.equal(truth.detailedFiveByFiveStreamingPreserved, true);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { EON_CITY_AUTHORED_VERTICAL_SLICE_REGIONS, getCityAuthoredVerticalSlicePlan, getCityAuthoredVerticalSliceRegion, getCityAuthoredVerticalSliceSummary, getCityAuthoredVerticalSliceTruth, validateCityAuthoredVerticalSlice } from '../../assets/js/city/eon-city-authored-vertical-slice.js';
import { inspectW430AuthoredCityVerticalSlice } from '../../scripts/w430-authored-city-vertical-slice-gate.mjs';

test('W430 defines four source-controlled City regions across quality tiers', () => {
  assert.equal(validateCityAuthoredVerticalSlice().ok, true);
  assert.deepEqual(EON_CITY_AUTHORED_VERTICAL_SLICE_REGIONS.map((entry) => entry.id), ['arrival-gate', 'command-district', 'creator-atrium', 'forge-bay']);
  const lite = getCityAuthoredVerticalSlicePlan({ quality: 'lite' });
  const balanced = getCityAuthoredVerticalSlicePlan({ quality: 'balanced' });
  assert.equal(lite.route, '/eoncity');
  assert.equal(lite.renderer, 'Babylon WebGL');
  assert.equal(lite.markerBudget.maxLabelTextures, 2);
  assert.equal(balanced.markerBudget.maxLabelTextures, 4);
  assert.equal(balanced.regions.length, 4);
  assert.equal(balanced.regions.every((entry) => entry.runtimeBudget.maxAdditionalLights === 0), true);
  assert.equal(getCityAuthoredVerticalSliceRegion('forge-bay')?.wayfinding?.x, 7.25);
  assert.equal(getCityAuthoredVerticalSliceSummary().finalBinaryArt, false);
  assert.equal(getCityAuthoredVerticalSliceTruth().remoteAssets, false);
});

test('W430 static source gate stays green without final-art or device claims', () => {
  const report = inspectW430AuthoredCityVerticalSlice();
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 8);
  assert.match(report.limitations.join(' '), /final GLB\/GLTF art/i);
});

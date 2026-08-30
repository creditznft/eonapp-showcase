import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  EON_CITY_W676_ORIENTATION_AUTHORED_ASSET_IDS,
  EON_CITY_W676_ORIENTATION_RESIDENT_CAST,
  getEonCityW676OrientationResidentCoherenceTruth,
  projectEonCityW676OrientationResidentPresentation
} from '../../assets/js/city/w676/eon-city-w676-orientation-resident-coherence.js';
import { getEonCityW649District, validateEonCityW649DistrictManifest } from '../../assets/js/city/w649/eon-city-w649-district-manifest.js';
import { getEonCityW649AnimationProfile } from '../../assets/js/city/w649/eon-city-w649-animation-manifest.js';

test('W676 gives Orientation Hall six unique authored animated residents', () => {
  assert.equal(EON_CITY_W676_ORIENTATION_RESIDENT_CAST.length, 6);
  assert.equal(new Set(EON_CITY_W676_ORIENTATION_AUTHORED_ASSET_IDS).size, 6);
  const orientation = getEonCityW649District('orientation-hall');
  for (const assetId of EON_CITY_W676_ORIENTATION_AUTHORED_ASSET_IDS) {
    assert.ok(orientation.assets.includes(assetId), assetId);
    assert.ok(getEonCityW649AnimationProfile(assetId), `animation-profile:${assetId}`);
  }
  assert.equal(validateEonCityW649DistrictManifest().ok, true);
});

test('W676 shows one representation per resident and hides a fallback when its GLB is loaded', () => {
  const loaded = EON_CITY_W676_ORIENTATION_AUTHORED_ASSET_IDS.slice(0, 3);
  const presentation = projectEonCityW676OrientationResidentPresentation(EON_CITY_W676_ORIENTATION_RESIDENT_CAST, loaded);
  assert.equal(presentation.authoredCount, 3);
  assert.equal(presentation.fallbackCount, 3);
  assert.equal(presentation.totalCount, 6);
  assert.equal(presentation.duplicateVisibleRepresentations, 0);
  for (const row of presentation.residents) {
    assert.notEqual(row.authoredVisible, row.fallbackVisible);
    assert.equal(row.claimsRealWork, false);
    assert.equal(row.automaticWork, false);
  }
});

test('W676 active renderers synchronize fallback silhouettes with W649 residency', () => {
  const belt = fs.readFileSync(new URL('../../assets/js/city/w674/eon-city-w674-orientation-district-belt-babylon.js', import.meta.url), 'utf8');
  const connected = fs.readFileSync(new URL('../../assets/js/city/eon-city-connected-core-babylon.js', import.meta.url), 'utf8');
  const districtRuntime = fs.readFileSync(new URL('../../assets/js/city/w649/eon-city-w649-district-runtime.js', import.meta.url), 'utf8');
  assert.match(belt, /setAuthoredResidentAssets/);
  assert.match(belt, /projectEonCityW676OrientationResidentPresentation/);
  assert.match(connected, /eonCityW649Districts/);
  assert.match(connected, /setAuthoredResidentAssets/);
  assert.match(connected, /schedule\.districtId === 'orientation-hall'/);
  for (const assetId of EON_CITY_W676_ORIENTATION_AUTHORED_ASSET_IDS) assert.match(districtRuntime, new RegExp(assetId));
});

test('W676 resident coherence preserves truth and control boundaries', () => {
  const truth = getEonCityW676OrientationResidentCoherenceTruth();
  assert.equal(truth.uniqueAuthoredAssetPerResident, true);
  assert.equal(truth.authoredAssetsLoadedByExistingResidencyRuntime, true);
  assert.equal(truth.fallbackHiddenWhenAuthoredVisible, true);
  assert.equal(truth.authoredAnimationRuntimePreserved, true);
  assert.equal(truth.claimsRealWork, false);
  assert.equal(truth.automaticWork, false);
  assert.equal(truth.automaticNavigation, false);
  assert.equal(truth.privateDataRead, false);
  assert.equal(truth.networkRequestCreated, false);
});

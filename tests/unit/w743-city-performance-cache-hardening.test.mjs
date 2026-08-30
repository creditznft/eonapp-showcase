import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EON_CITY_W731_LAUNCH_ASSET_MANIFEST,
  EON_CITY_W747_RUNTIME_PROVENANCE,
  getEonCityW731QualityBudget,
  validateEonCityW731LaunchAssetManifest
} from '../../assets/js/city/w731/eon-city-w731-launch-asset-manifest.js';
import {
  EON_CITY_W743_ARRIVAL_CAMERA,
  inspectEonCityW743ArrivalCamera
} from '../../assets/js/city/w731/eon-city-w731-command-hub-contract.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W743 binds the City runtime, manifest and service worker to one current provenance', () => {
  const sw = read('sw.js');
  const publicSw = read('public/sw.js');
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');

  assert.equal(EON_CITY_W747_RUNTIME_PROVENANCE, 'eon-city-living-nexus-command-core-w757-1');
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.version, '757.0.0');
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.cacheVersion, EON_CITY_W747_RUNTIME_PROVENANCE);
  assert.equal(validateEonCityW731LaunchAssetManifest().ok, true);
  assert.match(sw, /RELEASE_ID = 'w765-2026-07-31-release-identity-source-template'/);
  assert.match(sw, /CITY_RUNTIME_PROVENANCE = 'eon-city-living-nexus-command-core-w757-1'/);
  assert.match(sw, /fetch\(event\.request, \{ cache: 'no-store' \}\)/);
  assert.match(sw, /x-eon-city-runtime-provenance/);
  assert.match(sw, /cityRuntimeProvenance: CITY_RUNTIME_PROVENANCE/);
  assert.match(sw, /PERSISTENT_CITY_ASSET_CACHE = 'eonapp-city-assets-v1'/);
  assert.equal(sw, publicSw);
  assert.match(runtime, /EON_CITY_W731_LAUNCH_ASSET_MANIFEST\.cacheVersion !== EON_CITY_W757_RUNTIME_PROVENANCE/);
  assert.match(runtime, /runtimeProvenance: EON_CITY_W757_RUNTIME_PROVENANCE/);
});

test('W743 enforces quality-specific concurrency and resident asset budgets', () => {
  const assets = read('assets/js/city/w731/eon-city-w731-local-assets.js');
  const lite = getEonCityW731QualityBudget('lite');
  const balanced = getEonCityW731QualityBudget('balanced');
  const cinematic = getEonCityW731QualityBudget('cinematic');

  assert.deepEqual([lite.maxConcurrentLoads, balanced.maxConcurrentLoads, cinematic.maxConcurrentLoads], [1, 2, 2]);
  assert.deepEqual([lite.maxResidentAssets, balanced.maxResidentAssets, cinematic.maxResidentAssets], [20, 45, 49]);
  assert.match(assets, /while \(activeLoads < maxConcurrentLoads && queue\.length > 0\)/);
  assert.match(assets, /records\.size \+ inflight\.size >= maxResidentAssets/);
  assert.match(assets, /reason: 'resident-asset-budget'/);
  assert.match(assets, /queued: queue\.length/);
  assert.match(assets, /activeLoads/);
  assert.match(assets, /maxConcurrentLoads/);
  assert.match(assets, /maxResidentAssets/);
  assert.match(assets, /local-asset-runtime-disposed/);
});

test('W743 arrival camera clears every station footprint and no longer sits behind My Realm', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const result = inspectEonCityW743ArrivalCamera();

  assert.equal(result.ok, true);
  assert.deepEqual(result.blockedStationIds, []);
  assert.ok(result.minimumClearance >= EON_CITY_W743_ARRIVAL_CAMERA.minimumStationClearance);
  assert.ok(Math.abs(result.cameraPosition.x) < 0.1);
  assert.ok(result.cameraPosition.z > 16);
  assert.equal(result.target.z, 3.8);
  assert.match(runtime, /new ArcRotateCamera\([\s\S]*EON_CITY_W743_ARRIVAL_CAMERA\.alpha/);
  assert.match(runtime, /arrivalCamera: arrivalCameraValidation/);
  assert.match(runtime, /resetWayfinderCamera\(\)\s*\{[\s\S]*applyCameraPose\(EON_CITY_W747_CAMERA_POSES\.return/);
  assert.doesNotMatch(runtime, /camera\.alpha = -Math\.PI \/ 2/);
});

test('W743 refuses materialless or all-white untextured authored hero assets', () => {
  const assets = read('assets/js/city/w731/eon-city-w731-local-assets.js');

  assert.match(assets, /export function inspectEonCityW743VisualReadiness/);
  assert.match(assets, /materiallessMeshes === 0/);
  assert.match(assets, /!allMaterialsPureWhite/);
  assert.match(assets, /w743-local-asset-visual-not-ready/);
  assert.match(assets, /textureBearingMaterials/);
  assert.match(assets, /pureWhiteUntexturedMaterials/);
  assert.match(assets, /visualReadinessPass/);
});

test('W743 pauses hidden rendering, restores WebGL safely and applies real bounded performance protection', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const access = read('assets/js/city/eon-city-access-station.js');

  assert.match(runtime, /canvas\.addEventListener\('webglcontextlost'/);
  assert.match(runtime, /canvas\.addEventListener\('webglcontextrestored'/);
  assert.match(runtime, /document\?\.addEventListener\?\.\('visibilitychange'/);
  assert.match(runtime, /const bootFramePending = !firstFrame/);
  assert.match(runtime, /shouldRenderFrame\(\{ at: frameAt, background: backgroundPresentation, hidden: documentHidden && !bootFramePending, contextLost \}\)/);
  assert.match(runtime, /contextLossCount/);
  assert.match(runtime, /contextRestoreCount/);
  assert.match(runtime, /engine\.setHardwareScalingLevel\?\.\(currentHardwareScalingLevel\)/);
  assert.match(runtime, /lowFpsSamples >= 3/);
  assert.match(runtime, /applyPerformanceProtection\(`sustained-\$\{measuredFps\}-fps`\)/);
  assert.match(runtime, /removeEventListener\('webglcontextrestored'/);
  assert.match(runtime, /removeEventListener\?\.\('visibilitychange'/);
  assert.match(access, /data-eon-city-retry-3d hidden tabindex="-1" aria-hidden="true"/);
  assert.match(access, /onContextLoss:/);
  assert.match(access, /retry\.hidden = false/);
  assert.match(access, /onContextRestored:/);
  assert.match(access, /retry\.hidden = true/);
});

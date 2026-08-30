import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { buildEonCityL95AssetTransferObservation } from '../../assets/js/city/l95/eon-city-l95-asset-transfer-observation.js';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('RT96 transfer observation classifies warm reuse without pretending to know the browser cache layer', () => {
  const path = '/assets/city/w649/primary/world/eoncity_nav_info_kiosk.b3d27d9b4bea.glb';
  const report = buildEonCityL95AssetTransferObservation({
    baseUrl: 'https://eonapp.ch/eoncity',
    cacheStatus: { cachedEntries: 1, cachedPaths: [path] },
    resourceEntries: [{ name: `https://eonapp.ch${path}`, transferSize: 0, encodedBodySize: 1000, decodedBodySize: 1000, workerStart: 2 }]
  });
  assert.equal(report.sessionProfile, 'warm-reuse-observed');
  assert.equal(report.networkTransferAssetCount, 0);
  assert.equal(report.localReuseOnlyAssetCount, 1);
  assert.equal(report.truth.zeroTransferDoesNotClaimSpecificCacheLayer, true);
});

test('RT96 W731 captures cache baseline before progressive loads and exposes refreshable local transfer evidence', async () => {
  const source = await read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(source, /assetCacheBaselinePromise = inspectEonCityAssetCache/);
  assert.match(source, /void refreshAssetTransferObservation\('visible-frame-ready'\)/);
  assert.match(source, /getAssetTransferObservation\(\)/);
  assert.match(source, /refreshAssetTransferObservation\(reason = 'runtime-api'\)/);
  assert.match(source, /eonCityAssetTransferProfile/);
});

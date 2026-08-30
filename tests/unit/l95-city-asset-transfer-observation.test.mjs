import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  buildEonCityL95AssetTransferObservation,
  describeEonCityL95AssetTransferObservation
} from '../../assets/js/city/l95/eon-city-l95-asset-transfer-observation.js';

const cached = '/assets/city/w649/primary/world/eoncity_nav_info_kiosk.b3d27d9b4bea.glb';
const network = '/assets/city/w649/primary/world/eoncity_ai_tower_core.326f271af6ea.glb';

test('asset transfer observation separates observed network bytes from browser-local reuse', () => {
  const report = buildEonCityL95AssetTransferObservation({
    baseUrl: 'https://eonapp.ch/eoncity',
    cacheStatus: { cachedEntries: 1, cachedPaths: [cached] },
    resourceEntries: [
      { name: `https://eonapp.ch${cached}`, transferSize: 0, encodedBodySize: 350000, decodedBodySize: 350000, workerStart: 2, duration: 12 },
      { name: `https://eonapp.ch${network}`, transferSize: 420000, encodedBodySize: 419500, decodedBodySize: 419500, workerStart: 0, duration: 80 }
    ]
  });
  assert.equal(report.observedAssetCount, 2);
  assert.equal(report.localReuseOnlyAssetCount, 1);
  assert.equal(report.networkTransferAssetCount, 1);
  assert.equal(report.totalTransferBytes, 420000);
  assert.equal(report.assets.find((asset) => asset.pathname === cached)?.delivery, 'saved-browser-cache-reuse-observed');
  assert.equal(report.assets.find((asset) => asset.pathname === network)?.delivery, 'network-transfer-observed');
  assert.match(describeEonCityL95AssetTransferObservation(report), /reused without observed network transfer/);
});

test('asset transfer observation never treats non-content-addressed files as immutable City art', () => {
  const report = buildEonCityL95AssetTransferObservation({
    resourceEntries: [
      { name: 'https://eonapp.ch/assets/city/model.glb', transferSize: 1000, decodedBodySize: 1000 },
      { name: 'https://eonapp.ch/assets/js/eon-city-play.js', transferSize: 2000, decodedBodySize: 2000 }
    ]
  });
  assert.equal(report.observedAssetCount, 0);
  assert.equal(report.totalTransferBytes, 0);
});

test('City performance lab surfaces the local asset transfer observation', () => {
  const source = fs.readFileSync(new URL('../../assets/js/eon-city-play-station.js', import.meta.url), 'utf8');
  assert.match(source, /observeEonCityL95AssetTransfer/);
  assert.match(source, /describeEonCityL95AssetTransferObservation/);
  assert.match(source, /data-eon-performance-asset-transfer/);
  assert.match(source, /eonCityAssetNetworkTransfers/);
});

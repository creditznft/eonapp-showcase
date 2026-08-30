import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { buildCityPerformanceObservationExport } from '../../assets/js/city/eon-city-performance-observation.js';

const station = await readFile(new URL('../../assets/js/eon-city-play-station.js', import.meta.url), 'utf8');

test('L95 exported renderer evidence is self-identifying by Open World', () => {
  const exported = JSON.parse(buildCityPerformanceObservationExport({ averageFrameMs: 16.7, estimatedFps: 60 }, { worldRegionId: 'my-frontier' }));
  assert.equal(exported.worldRegionId, 'my-frontier');
  assert.equal(exported.scope, 'user-exported-local-eon-city-renderer-session');
});

test('L95 renderer export derives its world from the live runtime summary', () => {
  assert.match(station, /worldRegionId = String\(runtimeSummary\?\.activeWorldRegionId \|\| runtimeSummary\?\.lifecycle\?\.lastFpsSample\?\.worldRegionId \|\| 'command-hub'\)/);
  assert.match(station, /buildCityPerformanceObservationExport\(observation, \{ worldRegionId, assetTransfer, fpsSample \}\)/);
});

test('L95 renderer export includes bounded immutable-art transfer/reuse evidence for reopen proof', () => {
  const exported = JSON.parse(buildCityPerformanceObservationExport(
    { estimatedFps: 60 },
    {
      worldRegionId: 'command-hub',
      assetTransfer: {
        observedAssetCount: 12,
        networkTransferAssetCount: 0,
        localReuseOnlyAssetCount: 12,
        persistentCacheEntryCount: 29,
        totalTransferBytes: 0,
        truth: { zeroTransferDoesNotClaimSpecificCacheLayer: true }
      }
    }
  ));
  assert.deepEqual(exported.assetTransfer, {
    observedAssetCount: 12,
    networkTransferAssetCount: 0,
    localReuseOnlyAssetCount: 12,
    persistentCacheEntryCount: 29,
    totalTransferBytes: 0,
    zeroTransferDoesNotClaimSpecificCacheLayer: true
  });
});

test('L95 renderer export samples live asset transfer evidence at download time', () => {
  assert.match(station, /const assetTransfer = observeEonCityL95AssetTransfer\(\{ performanceRef: globalThis\.performance, cacheStatus/);
  assert.match(station, /buildCityPerformanceObservationExport\(observation, \{ worldRegionId, assetTransfer, fpsSample \}\)/);
});

test('L95 renderer export labels the latest FPS evidence as startup or stable session', () => {
  const exported = JSON.parse(buildCityPerformanceObservationExport(
    { estimatedFps: 35 },
    { worldRegionId: 'command-hub', fpsSample: { samplePhase: 'stable-session', fps: 35, engineFps: 34, sampleMs: 1031, hardwareScalingLevel: 1 } }
  ));
  assert.deepEqual(exported.fpsSample, { samplePhase: 'stable-session', fps: 35, engineFps: 34, sampleMs: 1031, hardwareScalingLevel: 1 });
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  EON_CITY_ASSET_CACHE_ENTRY_LIMIT,
  EON_CITY_ASSET_CACHE_RETENTION,
  EON_CITY_RELEASE_SHELL_CACHE_PREFIX,
  isEonCityAssetPathCached
} from '../../assets/js/city/eon-city-asset-cache-policy.js';
import { planEonCityR09CacheRetention } from '../../assets/js/city/r09/eon-city-r09-cache-retention.js';
import {
  EON_CITY_IMMUTABLE_MANIFEST_SCHEMA,
  contentAddressEonCityBinaries
} from '../../scripts/eon-city-content-addressed-binaries.mjs';

const hashedA = '/assets/city/immutable/world/a.aaaaaaaaaaaa.glb';
const hashedB = '/assets/city/immutable/world/b.bbbbbbbbbbbb.glb';
const hashedC = '/assets/city/immutable/world/c.cccccccccccc.glb';

function manifest(paths) {
  return { entries: paths.map((url) => ({ url })) };
}

test('R09 uses release-scoped runtime shell plus browser-managed immutable art retention', () => {
  assert.equal(EON_CITY_RELEASE_SHELL_CACHE_PREFIX, 'eonapp-city-shell-');
  assert.equal(EON_CITY_ASSET_CACHE_ENTRY_LIMIT, null);
  assert.equal(EON_CITY_ASSET_CACHE_RETENTION, 'content-addressed-browser-managed');
  assert.equal(isEonCityAssetPathCached({ cachedPaths: [hashedA] }, hashedA), true);
  assert.equal(isEonCityAssetPathCached({ cachedPaths: [hashedA] }, hashedB), false);
});

test('R09 never prunes immutable art automatically and protects current rollback and offline manifests', () => {
  const noPressure = planEonCityR09CacheRetention({
    cachedPaths: [hashedA, hashedB, hashedC],
    currentManifest: manifest([hashedA]),
    rollbackManifest: manifest([hashedB]),
    offlineManifests: [manifest([hashedC])]
  });
  assert.equal(noPressure.mayPrune, false);
  assert.deepEqual(noPressure.deletablePaths, []);
  assert.deepEqual(noPressure.protectedPaths, [hashedA, hashedB, hashedC]);

  const pressure = planEonCityR09CacheRetention({
    cachedPaths: [hashedA, hashedB, hashedC],
    currentManifest: manifest([hashedA]),
    rollbackManifest: manifest([hashedB]),
    storagePressure: true,
    explicitUserAction: true
  });
  assert.deepEqual(pressure.deletablePaths, [hashedC]);
  assert.deepEqual(pressure.retainedPaths, [hashedA, hashedB]);
  assert.equal(pressure.automaticReleasePruning, false);
});

test('R09 production content-addressing emits a deterministic immutable asset manifest', () => {
  const distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eon-r09-dist-'));
  try {
    const modelDir = path.join(distDir, 'assets', 'city', 'demo');
    fs.mkdirSync(modelDir, { recursive: true });
    fs.writeFileSync(path.join(modelDir, 'model.glb'), Buffer.from('r09-demo-model'));
    fs.writeFileSync(path.join(distDir, 'runtime.js'), "export const model='/assets/city/demo/model.glb';\n");
    const result = contentAddressEonCityBinaries({ distDir, removeOriginals: true });
    assert.equal(result.ok, true);
    assert.equal(result.immutableManifest.schema, EON_CITY_IMMUTABLE_MANIFEST_SCHEMA);
    assert.equal(result.immutableManifest.entries, 1);
    assert.match(result.immutableManifest.digest, /^[a-f0-9]{64}$/);
    const manifestPath = path.join(distDir, result.immutableManifest.path);
    const emitted = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.equal(emitted.schema, EON_CITY_IMMUTABLE_MANIFEST_SCHEMA);
    assert.equal(emitted.entries.length, 1);
    assert.equal(emitted.entries[0].sourcePath, '/assets/city/demo/model.glb');
    assert.match(emitted.entries[0].url, /^\/assets\/city\/immutable\/demo\/model\.[a-f0-9]{12}\.glb$/);
    assert.match(fs.readFileSync(path.join(distDir, 'runtime.js'), 'utf8'), /assets\/city\/immutable\/demo\/model\.[a-f0-9]{12}\.glb/);
  } finally {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
});

test('R09 service worker exposes only explicit storage-pressure pruning and same-release shell reuse', () => {
  const sw = fs.readFileSync(new URL('../../sw.js', import.meta.url), 'utf8');
  assert.match(sw, /CITY_SHELL_CACHE = `eonapp-city-shell-\$\{RELEASE_ID\}`/);
  assert.match(sw, /cityRuntimeReleaseCacheFirst/);
  assert.match(sw, /EONAPP_CITY_ASSET_CACHE_PRUNE/);
  assert.match(sw, /explicit-storage-pressure-maintenance-required/);
  assert.match(sw, /currentRollbackOfflineProtectionRequired: true/);
  assert.doesNotMatch(sw, /MAX_PERSISTENT_CITY_ASSET_ENTRIES/);
});

test('R09 normal Signal Frontier return suspends decoded assets while repair and teardown still dispose', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js', import.meta.url), 'utf8');
  const deactivateStart = source.indexOf('    deactivate() {');
  const applyProgressStart = source.indexOf('    applyProgress(', deactivateStart);
  const deactivateBody = source.slice(deactivateStart, applyProgressStart);
  assert.ok(deactivateStart >= 0 && applyProgressStart > deactivateStart);
  assert.match(deactivateBody, /expanseAssetsSuspended: true/);
  assert.match(deactivateBody, /decodedAssetsRetained: true/);
  assert.match(deactivateBody, /expanseAssetsDisposed: false/);
  assert.doesNotMatch(deactivateBody, /disposeDeferredAssets\(/);
  const reloadStart = source.indexOf('    reloadAuthoredAssets(');
  const interactStart = source.indexOf('    interactNearest(', reloadStart);
  assert.match(source.slice(reloadStart, interactStart), /disposeDeferredAssets\(\)/);
  const disposeStart = source.indexOf('    dispose() {', interactStart);
  const summaryStart = source.indexOf('    getSummary() {', disposeStart);
  assert.match(source.slice(disposeStart, summaryStart), /disposeDeferredAssets\(\)/);
});

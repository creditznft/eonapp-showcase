import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CITY_ASSET_CATALOG,
  CITY_ASSET_QUALITY_BUDGETS,
  getCityAssetById,
  getCityAssetCatalogSummary,
  getCityAssetLoadPlan,
  isCityAssetLoadable,
  validateCityAssetCatalog
} from '../../assets/js/city/eon-city-asset-catalog.js';
import {
  createCityAssetRuntime,
  disposeBabylonCityAsset,
  disposeThreeCityAsset
} from '../../assets/js/city/eon-city-asset-runtime.js';
import { getCityMaterialPolicySummary, validateCityMaterialSpec } from '../../assets/js/city/eon-city-material-policy.js';

test('W365 catalog truth: local engineering candidates are loadable while planned assets retain procedural fallbacks', () => {
  const result = validateCityAssetCatalog();
  assert.equal(result.ok, true, result.errors.join(' | '));
  const summary = getCityAssetCatalogSummary();
  assert.ok(summary.shippedBinaryCount >= 8);
  assert.equal(summary.byStatus.shipped, summary.shippedBinaryCount);
  assert.ok(summary.byStatus.planned > 0);

  const operator = getCityAssetById('operator-hero');
  const eonbot = getCityAssetById('eonbot-companion');
  const planned = getCityAssetById('creator-atrium-exterior');
  assert.ok(operator && eonbot && planned);
  assert.equal(isCityAssetLoadable(operator), true);
  assert.equal(isCityAssetLoadable(eonbot), true);
  assert.equal(isCityAssetLoadable(planned), false);

  const plan = getCityAssetLoadPlan({ quality: 'cinematic' });
  assert.ok(plan.shippedCount >= 8);
  assert.ok(plan.entries.filter((entry) => entry.loadable).every((entry) => entry.sourcePath?.startsWith('/assets/city/') && /^[a-f0-9]{64}$/i.test(entry.sha256 || '')));
  assert.ok(plan.entries.filter((entry) => !entry.loadable).every((entry) => entry.sourcePath === null && entry.fallback.mode === 'procedural-source-controlled'));
});

test('W365 rejects remote, unreviewed or malformed shipped asset variants', () => {
  const invalid = JSON.parse(JSON.stringify(CITY_ASSET_CATALOG));
  invalid[0].lods.balanced.sourcePath = 'https://example.invalid/operator.glb';
  invalid[0].provenance.evidencePath = 'docs/fake.md';
  const result = validateCityAssetCatalog(invalid);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((message) => /invalid balanced LOD variant|fails local asset release checks/i.test(message)));
});

test('W365 quality tiers remain bounded and runtime loads only catalog-provenanced local candidates', async () => {
  assert.ok(CITY_ASSET_QUALITY_BUDGETS.lite.maxAssets < CITY_ASSET_QUALITY_BUDGETS.balanced.maxAssets);
  assert.ok(CITY_ASSET_QUALITY_BUDGETS.balanced.maxAssets < CITY_ASSET_QUALITY_BUDGETS.cinematic.maxAssets);

  const runtime = createCityAssetRuntime({ engine: 'babylon', quality: 'balanced' });
  let called = 0;
  const blocked = await runtime.loadBabylonAsset('creator-atrium-exterior', {
    loadAssetContainer: async () => { called += 1; return null; }
  });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'asset-not-shipped-or-not-provenanced');
  assert.equal(called, 0);

  const loaded = await runtime.loadBabylonAsset('operator-hero', {
    loadAssetContainer: async () => {
      called += 1;
      return { addAllToScene() {}, removeAllFromScene() {}, dispose() {}, meshes: [], animationGroups: [] };
    }
  });
  assert.equal(loaded.ok, true);
  assert.equal(called, 1);
  assert.equal(runtime.getSummary().loadedAssets, 1);
  runtime.dispose();
  assert.equal(runtime.getSummary().disposed, true);
});

test('W365 times out a stalled Babylon asset adapter instead of waiting forever', async () => {
  const runtime = createCityAssetRuntime({ engine: 'babylon', quality: 'balanced' });
  const startedAt = Date.now();
  const result = await runtime.loadBabylonAsset('operator-hero', {
    timeoutMs: 25,
    loadAssetContainer: async () => new Promise(() => {})
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'babylon-load-timeout');
  assert.ok(Date.now() - startedAt < 1000);
  runtime.dispose();
});

test('W365 material policy keeps PBR values, truth signal colours and texture boundaries bounded', () => {
  assert.equal(getCityMaterialPolicySummary('cinematic').remoteNetwork, false);
  assert.equal(validateCityMaterialSpec({ family: 'command-steel', emissiveIntensity: 0.8 }, { quality: 'balanced' }).ok, true);
  assert.equal(validateCityMaterialSpec({ family: 'command-steel', emissiveIntensity: 9 }, { quality: 'balanced' }).ok, false);
  assert.equal(validateCityMaterialSpec({ family: 'command-steel', remoteTexture: true }, { quality: 'balanced' }).ok, false);
  assert.equal(validateCityMaterialSpec({ family: 'command-steel', signalRole: 'verified' }, { quality: 'balanced' }).ok, false);
});

test('W365 disposal adapters release supplied Three.js/Babylon handles without requiring engine packages in the test', () => {
  let geometryDisposed = 0;
  let materialDisposed = 0;
  let mapDisposed = 0;
  let removed = 0;
  disposeThreeCityAsset({
    traverse(callback) { callback({ geometry: { dispose() { geometryDisposed += 1; } }, material: { map: { dispose() { mapDisposed += 1; } }, dispose() { materialDisposed += 1; } } }); },
    removeFromParent() { removed += 1; }
  });
  assert.equal(geometryDisposed, 1);
  assert.equal(materialDisposed, 1);
  assert.equal(mapDisposed, 1);
  assert.equal(removed, 1);
  let animationDisposed = 0;
  let containerDisposed = 0;
  let meshDisposed = 0;
  disposeBabylonCityAsset({
    animationGroups: [{ stop() {}, dispose() { animationDisposed += 1; } }],
    removeAllFromScene() {},
    dispose() { containerDisposed += 1; },
    meshes: [{ dispose() { meshDisposed += 1; } }]
  });
  assert.equal(animationDisposed, 1);
  assert.equal(containerDisposed, 1);
  assert.equal(meshDisposed, 1);
});

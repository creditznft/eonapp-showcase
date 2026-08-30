import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { Scene } from '@babylonjs/core/scene.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { ALL_ROUTE_ROWS } from '../../config/route-contract.mjs';
import {
  EON_CITY_W649_ACTION_BINDINGS,
  EON_CITY_W649_DISTRICT_CENTERS,
  createEonCityW649DistrictRuntime,
  getEonCityW649DistrictCollisionVolumes,
  getEonCityW649DistrictRuntimeTruth,
  resolveEonCityW649DistrictAtPosition,
  validateEonCityW649ActionBindings
} from '../../assets/js/city/w649/eon-city-w649-district-runtime.js';
import { EON_CITY_W649_CHARACTER_MANIFEST } from '../../assets/js/city/w649/eon-city-w649-character-manifest.js';
import { EON_CITY_W649_WORLD_MANIFEST } from '../../assets/js/city/w649/eon-city-w649-world-manifest.js';
import { getEonCityW649District } from '../../assets/js/city/w649/eon-city-w649-district-manifest.js';
import { EON_CITY_W659F_SUPERSEDED_W649_ASSET_IDS } from '../../assets/js/city/w659f/eon-city-w659f-functional-asset-manifest.js';

const assets = [...EON_CITY_W649_CHARACTER_MANIFEST.entries, ...EON_CITY_W649_WORLD_MANIFEST.entries];
const pathToId = new Map();
for (const asset of assets) {
  pathToId.set(asset.variants.primary.path, asset.id);
  pathToId.set(asset.variants.fallback.path, asset.id);
}

function createMockLoader(scene, observations) {
  return async ({ path, signal }) => {
    assert.equal(pathToId.has(path), true, `unexpected path ${path}`);
    assert.equal(signal.aborted, false);
    const assetId = pathToId.get(path);
    observations.loaded.push(assetId);
    const root = new TransformNode(`mock-${assetId}-${observations.loaded.length}`, scene);
    return {
      rootNodes: [root],
      meshes: [],
      animationGroups: [],
      addAllToScene() {},
      removeAllFromScene() {},
      dispose() {
        observations.disposed.push(assetId);
        root.dispose();
      }
    };
  };
}

function expectedBalancedDistrictAssets(districtId) {
  const district = getEonCityW649District(districtId);
  return (district?.assets || []).filter((assetId) => !EON_CITY_W659F_SUPERSEDED_W649_ASSET_IDS.has(assetId));
}

function makeRuntime({ quality = 'balanced', excludedAssetIds } = {}) {
  const engine = new NullEngine({ renderWidth: 64, renderHeight: 64 });
  const scene = new Scene(engine);
  const observations = { loaded: [], disposed: [] };
  const runtime = createEonCityW649DistrictRuntime({
    scene,
    quality,
    reducedMotion: quality === 'lite',
    loadContainer: createMockLoader(scene, observations),
    ...(excludedAssetIds === undefined ? {} : { excludedAssetIds })
  });
  return { engine, scene, runtime, observations };
}

test('W649E-H district truth covers nine proximity districts, 33 active assets, safe actions, and primitive collisions', () => {
  const truth = getEonCityW649DistrictRuntimeTruth();
  assert.equal(truth.districtCount, 9);
  assert.equal(truth.activeAssetCount, 33);
  assert.deepEqual(truth.unknownAssets, []);
  assert.equal(truth.actionValidation.ok, true, truth.actionValidation.errors.join('\n'));
  assert.equal(truth.collisionVolumeCount, 7);
  assert.equal(truth.maxResidentDistricts, 2);
  assert.equal(truth.preloadAll, false);
  assert.equal(truth.localOnly, true);

  const collisions = getEonCityW649DistrictCollisionVolumes();
  assert.equal(collisions.length, 7);
  for (const collision of collisions) {
    assert.equal(collision.type, 'circle');
    assert.equal(collision.visualMeshCollision, false);
    assert.equal(collision.source, 'w649-primitive-collision-proxy');
    assert.ok(collision.radius >= 1.1 && collision.radius <= 2.35);
    assert.equal(truth.excludedAssetIds.includes(collision.assetId), false);
  }
});

test('W649E-H proximity resolver selects only bounded nearest district centers', () => {
  for (const [districtId, center] of Object.entries(EON_CITY_W649_DISTRICT_CENTERS)) {
    assert.equal(resolveEonCityW649DistrictAtPosition({ x: center.x, z: center.z })?.districtId, districtId);
  }
  assert.equal(resolveEonCityW649DistrictAtPosition({ x: 100, z: 100 }), null);
  assert.equal(resolveEonCityW649DistrictAtPosition({ x: Number.NaN, z: 0 }), null);
});

test('W649E-H actions are route-backed or panel-backed and all declared routes exist in the canonical route contract', () => {
  const validation = validateEonCityW649ActionBindings();
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  assert.equal(validation.districtCount, 8);
  const canonicalRoutes = new Set(ALL_ROUTE_ROWS.map((row) => row.from));
  const actions = Object.values(EON_CITY_W649_ACTION_BINDINGS).flat();
  assert.ok(actions.length >= 10);
  for (const action of actions) {
    assert.ok(['route', 'city-panel'].includes(action.kind));
    if (action.kind === 'route') assert.equal(canonicalRoutes.has(action.route), true, action.route);
    if (action.kind === 'city-panel') assert.ok(['command-room', 'travel-map'].includes(action.panel));
  }
  const realm = EON_CITY_W649_ACTION_BINDINGS['trade-dome'][0];
  assert.equal(realm.route, '/realm-studio');
  assert.equal(realm.reviewRequired, true);
  const market = EON_CITY_W649_ACTION_BINDINGS['trade-dome'][1];
  assert.equal(market.route, '/market');
  assert.equal(market.informationalOnly, true);
  assert.equal(EON_CITY_W649_ACTION_BINDINGS['vault-station'][0].route, '/local-ai');
});

test('W665 keeps the prior district resident during the next load, then evicts the oldest after a third district', async () => {
  const orientationAssets = expectedBalancedDistrictAssets('orientation-hall');
  const forgeAssets = expectedBalancedDistrictAssets('forge-basilica');
  const archiveAssets = expectedBalancedDistrictAssets('archive-canopy');
  const { engine, scene, runtime, observations } = makeRuntime();
  const started = await runtime.start();
  assert.equal(started.ok, true);
  assert.equal(started.districtId, 'orientation-hall');
  assert.equal(started.loadedCount, orientationAssets.length);
  assert.deepEqual(new Set(observations.loaded), new Set(orientationAssets));
  let summary = runtime.getSummary();
  assert.equal(summary.residentDistrictCount, 1);
  assert.equal(summary.activeDistrictId, 'orientation-hall');
  assert.equal(summary.loadedAssetCount, orientationAssets.length);
  assert.equal(summary.preloadAll, false);

  observations.loaded.length = 0;
  const forge = await runtime.enterDistrict('forge-basilica', { reason: 'test-transition' });
  assert.equal(forge.ok, true);
  assert.equal(forge.loadedCount, forgeAssets.length);
  assert.equal(observations.disposed.length, 0);
  assert.deepEqual(new Set(observations.loaded), new Set(forgeAssets));
  summary = runtime.getSummary();
  assert.equal(summary.residentDistrictCount, 2);
  assert.equal(summary.activeDistrictId, 'forge-basilica');
  assert.equal(summary.loadedAssetCount, orientationAssets.length + forgeAssets.length);
  assert.deepEqual(new Set(summary.residents.map((row) => row.districtId)), new Set(['orientation-hall', 'forge-basilica']));

  observations.loaded.length = 0;
  const archive = await runtime.enterDistrict('archive-canopy', { reason: 'test-third-district' });
  assert.equal(archive.ok, true);
  assert.equal(archive.loadedCount, archiveAssets.length);
  assert.deepEqual(new Set(observations.loaded), new Set(archiveAssets));
  assert.equal(observations.disposed.length, orientationAssets.length, 'the oldest Orientation residency should retire only after Archive is ready');
  summary = runtime.getSummary();
  assert.equal(summary.residentDistrictCount, 2);
  assert.equal(summary.activeDistrictId, 'archive-canopy');
  assert.equal(summary.loadedAssetCount, forgeAssets.length + archiveAssets.length);
  assert.deepEqual(new Set(summary.residents.map((row) => row.districtId)), new Set(['forge-basilica', 'archive-canopy']));

  runtime.dispose();
  assert.equal(observations.disposed.length, orientationAssets.length + forgeAssets.length + archiveAssets.length);
  scene.dispose();
  engine.dispose();
});

test('W649H quality policies keep one Vault Steward and remove optional crowd models from Lite residency', async () => {
  const balanced = makeRuntime({ quality: 'balanced' });
  await balanced.runtime.enterDistrict('vault-station');
  let loaded = new Set(balanced.observations.loaded);
  assert.equal(loaded.has('eoncity-vault-steward-6clips'), true);
  assert.equal(loaded.has('eoncity-vault-steward-male-6clips'), false);
  assert.equal(loaded.has('security-sentinel-6clips'), true);
  assert.equal(balanced.runtime.getSummary().loadedAssetCount, 3);
  balanced.runtime.dispose();
  balanced.scene.dispose();
  balanced.engine.dispose();

  const cinematic = makeRuntime({ quality: 'cinematic' });
  await cinematic.runtime.enterDistrict('vault-station');
  loaded = new Set(cinematic.observations.loaded);
  assert.equal(loaded.has('eoncity-vault-steward-male-6clips'), true);
  assert.equal(loaded.has('eoncity-vault-steward-6clips'), false);
  cinematic.runtime.dispose();
  cinematic.scene.dispose();
  cinematic.engine.dispose();

  const lite = makeRuntime({ quality: 'lite' });
  await lite.runtime.enterDistrict('vault-station');
  loaded = new Set(lite.observations.loaded);
  assert.equal(loaded.has('security-sentinel-6clips'), false);
  assert.equal(lite.runtime.getSummary().loadedAssetCount, 2);
  lite.observations.loaded.length = 0;
  await lite.runtime.enterDistrict('trade-dome');
  loaded = new Set(lite.observations.loaded);
  assert.equal(loaded.has('citizen-variant-6clips'), false);
  assert.equal(lite.runtime.getSummary().loadedAssetCount, 3);
  lite.observations.loaded.length = 0;
  await lite.runtime.enterDistrict('agent-theatre');
  loaded = new Set(lite.observations.loaded);
  assert.equal(loaded.has('eoncity-holo-interface-operator-6clips'), true);
  assert.equal(lite.runtime.getSummary().loadedAssetCount, 1);
  lite.observations.loaded.length = 0;
  await lite.runtime.enterDistrict('forge-basilica');
  loaded = new Set(lite.observations.loaded);
  assert.equal(loaded.has('eon-x1-worker-9clips'), true);
  assert.equal(loaded.has('forge-device-lab-specialist-6clips'), false);
  assert.equal([...loaded].filter((assetId) => assetId.endsWith('clips')).length, 1);
  assert.equal(lite.runtime.getSummary().performanceProfile.maxPopulationCharactersPerDistrict, 1);
  lite.runtime.dispose();
  lite.scene.dispose();
  lite.engine.dispose();
});


test('W649 P0 replacement boundary filters five superseded assets and disposes an already-resident predecessor', async () => {
  const defaultRuntime = makeRuntime();
  await defaultRuntime.runtime.start();
  await defaultRuntime.runtime.enterDistrict('creator-atrium');
  await defaultRuntime.runtime.enterDistrict('transit-network');
  await defaultRuntime.runtime.enterDistrict('agent-theatre');
  const excluded = new Set(defaultRuntime.runtime.getSummary().excludedAssetIds);
  assert.deepEqual([...excluded].sort(), [
    'eoncity-ascension-portal',
    'eoncity-command-chair',
    'eoncity-eonbot-charging-station',
    'eoncity-holo-interface-landmark',
    'eoncity-transit-core'
  ]);
  assert.equal(defaultRuntime.observations.loaded.some((assetId) => excluded.has(assetId)), false);
  assert.equal(defaultRuntime.runtime.getSummary().replacementState.noSupersededResidents, true);
  defaultRuntime.runtime.dispose();
  defaultRuntime.scene.dispose();
  defaultRuntime.engine.dispose();

  const preReplacement = makeRuntime({ excludedAssetIds: [] });
  await preReplacement.runtime.start();
  assert.equal(preReplacement.runtime.getSummary().residents[0].loadedAssetIds.includes('eoncity-ascension-portal'), true);
  const result = preReplacement.runtime.excludeAssets(['eoncity-ascension-portal'], { reason: 'test-replacement' });
  assert.deepEqual(result.disposedAssetIds, ['eoncity-ascension-portal']);
  assert.equal(preReplacement.observations.disposed.includes('eoncity-ascension-portal'), true);
  assert.equal(preReplacement.runtime.getSummary().residents[0].loadedAssetIds.includes('eoncity-ascension-portal'), false);
  assert.equal(preReplacement.runtime.getSummary().replacementState.noSupersededResidents, true);
  preReplacement.runtime.dispose();
  preReplacement.scene.dispose();
  preReplacement.engine.dispose();
});

test('W649 P0 accepts realm-relay only as an alias and summarizes trade-dome canonically', async () => {
  const runtimeFixture = makeRuntime();
  const result = await runtimeFixture.runtime.enterDistrict('realm-relay');
  assert.equal(result.ok, true);
  assert.equal(result.districtId, 'trade-dome');
  assert.equal(runtimeFixture.runtime.getSummary().activeDistrictId, 'trade-dome');
  assert.equal(runtimeFixture.runtime.getActionBindings('realm-relay')[0].route, '/realm-studio');
  runtimeFixture.runtime.dispose();
  runtimeFixture.scene.dispose();
  runtimeFixture.engine.dispose();
});

test('W649E-H Babylon integration exposes district streaming, summaries, NPC states, collisions, and disposal', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/eon-city-play-babylon.js', import.meta.url), 'utf8');
  assert.match(source, /createEonCityW649DistrictRuntime/);
  assert.match(source, /trackAsyncCityBootStage\('W649_ORIENTATION_DISTRICT'/);
  assert.match(source, /getEonCityW649DistrictCollisionVolumes\(\)/);
  assert.match(source, /w649DistrictRuntime\.update\(operator\.position\)/);
  assert.match(source, /enterW649District/);
  assert.match(source, /requestW649NpcState/);
  assert.match(source, /w649DistrictRuntime\.dispose\(\)/);
});

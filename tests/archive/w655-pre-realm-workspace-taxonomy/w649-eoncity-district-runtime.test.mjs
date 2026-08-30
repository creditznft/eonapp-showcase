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

function makeRuntime({ quality = 'balanced' } = {}) {
  const engine = new NullEngine({ renderWidth: 64, renderHeight: 64 });
  const scene = new Scene(engine);
  const observations = { loaded: [], disposed: [] };
  const runtime = createEonCityW649DistrictRuntime({
    scene,
    quality,
    reducedMotion: quality === 'lite',
    loadContainer: createMockLoader(scene, observations)
  });
  return { engine, scene, runtime, observations };
}

test('W649E-H district truth covers eight proximity districts, 33 active assets, safe actions, and primitive collisions', () => {
  const truth = getEonCityW649DistrictRuntimeTruth();
  assert.equal(truth.districtCount, 8);
  assert.equal(truth.activeAssetCount, 33);
  assert.deepEqual(truth.unknownAssets, []);
  assert.equal(truth.actionValidation.ok, true, truth.actionValidation.errors.join('\n'));
  assert.equal(truth.collisionVolumeCount, 8);
  assert.equal(truth.maxResidentDistricts, 1);
  assert.equal(truth.preloadAll, false);
  assert.equal(truth.localOnly, true);

  const collisions = getEonCityW649DistrictCollisionVolumes();
  assert.equal(collisions.length, 8);
  for (const collision of collisions) {
    assert.equal(collision.type, 'circle');
    assert.equal(collision.visualMeshCollision, false);
    assert.equal(collision.source, 'w649-primitive-collision-proxy');
    assert.ok(collision.radius >= 1.1 && collision.radius <= 2.35);
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
  const trade = EON_CITY_W649_ACTION_BINDINGS['trade-dome'][0];
  assert.equal(trade.route, '/market');
  assert.equal(trade.informationalOnly, true);
});

test('W649E-H starts with Orientation only, then unloads it before making Forge the sole resident district', async () => {
  const { engine, scene, runtime, observations } = makeRuntime();
  const started = await runtime.start();
  assert.equal(started.ok, true);
  assert.equal(started.districtId, 'orientation-hall');
  assert.equal(started.loadedCount, 5);
  assert.deepEqual(new Set(observations.loaded), new Set([
    'eoncity-orientation-hall',
    'eoncity-eon-architect-12clips',
    'eoncity-nav-info-kiosk',
    'eoncity-district-info',
    'eoncity-ascension-portal'
  ]));
  let summary = runtime.getSummary();
  assert.equal(summary.residentDistrictCount, 1);
  assert.equal(summary.activeDistrictId, 'orientation-hall');
  assert.equal(summary.loadedAssetCount, 5);
  assert.equal(summary.preloadAll, false);

  observations.loaded.length = 0;
  const forge = await runtime.enterDistrict('forge-basilica', { reason: 'test-transition' });
  assert.equal(forge.ok, true);
  assert.equal(forge.loadedCount, 6);
  assert.equal(observations.disposed.length, 5);
  assert.deepEqual(new Set(observations.loaded), new Set([
    'eoncity-forge-basilica',
    'eoncity-forge-workbench',
    'eoncity-ai-tower-core',
    'eon-x1-worker-9clips',
    'eoncity-holo-interface-operator-6clips',
    'forge-device-lab-specialist-6clips'
  ]));
  summary = runtime.getSummary();
  assert.equal(summary.residentDistrictCount, 1);
  assert.equal(summary.activeDistrictId, 'forge-basilica');
  assert.equal(summary.loadedAssetCount, 6);
  assert.deepEqual(summary.residents.map((row) => row.districtId), ['forge-basilica']);

  runtime.dispose();
  assert.equal(observations.disposed.length, 11);
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
  assert.equal(loaded.has('eoncity-holo-interface-operator-6clips'), false);
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

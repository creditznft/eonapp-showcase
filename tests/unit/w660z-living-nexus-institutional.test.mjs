import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { Scene } from '@babylonjs/core/scene.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { buildEonCityConnectedCorePlan, validateEonCityConnectedCorePlan } from '../../assets/js/city/eon-city-connected-core.js';
import { createEonCityLivingNexusBabylonRuntime } from '../../assets/js/city/eon-city-living-nexus-babylon-runtime.js';
import { createEonCityLivingNexusRealmBabylonRenderer } from '../../assets/js/city/eon-city-living-nexus-realm-babylon.js';
import { buildEonCityLivingNexusRealmPlan, EON_CITY_LIVING_NEXUS_REALM_IDS, getEonCityLivingNexusRealmCatalog, validateEonCityLivingNexusRealmPlan } from '../../assets/js/city/eon-city-living-nexus-realms.js';
import { inspectW660zLivingNexusInstitutionalReadiness } from '../../scripts/w660z-living-nexus-institutional-gate.mjs';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(sourceRoot, relative), 'utf8');

function makeScene() {
  const engine = new NullEngine({ renderWidth: 960, renderHeight: 540, textureSize: 256, deterministicLockstep: true });
  const scene = new Scene(engine);
  scene.activeCamera = new FreeCamera('w660z-test-camera', new Vector3(0, 8, -18), scene);
  return { engine, scene };
}

function realmMeshCount(scene, realmId) {
  return scene.meshes.filter((mesh) => mesh.metadata?.realmId === realmId || mesh.parent?.metadata?.realmId === realmId || String(mesh.name || '').includes(`-${realmId}-`)).length;
}

test('W660Z complete product surface has nine connected districts and six premium Realms', () => {
  const core = buildEonCityConnectedCorePlan({ quality: 'cinematic', mode: 'explore' });
  const coreValidation = validateEonCityConnectedCorePlan(core);
  assert.equal(coreValidation.ok, true, coreValidation.errors.join(','));
  assert.equal(core.districts.length, 9);
  assert.ok(core.streetConnections.length >= 17);
  assert.equal(core.transitLoop.stations.length, 9);
  assert.equal(core.transitLoop.closed, true);

  const catalog = getEonCityLivingNexusRealmCatalog();
  assert.deepEqual(catalog.map((entry) => entry.id), EON_CITY_LIVING_NEXUS_REALM_IDS);
  assert.equal(catalog.length, 6);
  for (const id of EON_CITY_LIVING_NEXUS_REALM_IDS) {
    const plan = buildEonCityLivingNexusRealmPlan(id, { quality: 'cinematic', storage: null });
    const validation = validateEonCityLivingNexusRealmPlan(plan);
    assert.equal(validation.ok, true, `${id}: ${validation.errors.join(',')}`);
    assert.equal(plan.premiumAuthoredDepth, true, id);
    assert.ok(plan.zones.length >= 4, id);
    assert.ok(plan.discoveries.length >= 3, id);
    assert.ok(plan.specialist?.functional, id);
    assert.ok(plan.movementSystem?.path?.length >= 4, id);
    assert.equal(plan.realmReflection.requiresVerifiedTransformation, true, id);
  }
});

test('W661E Living Nexus stays discoverable after the progressive Productive City menu mounts', () => {
  const panelSource = read('assets/js/city/eon-city-living-nexus-panel.js');
  const stationSource = read('assets/js/eon-city-play-station.js');
  const productSource = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');

  assert.match(stationSource, /data-eon-play-open-living-nexus/);
  assert.match(stationSource, /renderEonCityLivingNexusPanel\(\)/);
  assert.match(productSource, /data-eon-w659n-panel="city-menu"/);
  assert.match(productSource, /data-eon-w659n-open="nexus"/);

  assert.match(panelSource, /PRODUCTIVE_MENU_GRID_SELECTOR/);
  assert.match(panelSource, /data-eon-w661e-open-living-nexus/);
  assert.match(panelSource, /Connected Core, the Expanse, My Realm and six authored Realms/);
  assert.match(panelSource, /MutationObserver/);
  assert.match(panelSource, /oneCanonicalPanel:\s*true/);
  assert.match(panelSource, /existing EON NEXUS continuity card stays separate/);
});

test('W660Z repeated Expanse travel keeps a 5x5 visible horizon, 3x3 interaction neighbourhood and bounded scene size', () => {
  const { engine, scene } = makeScene();
  const player = new TransformNode('w660z-player', scene);
  const runtime = createEonCityLivingNexusBabylonRuntime({ scene, playerAnchor: player, quality: 'balanced', seed: 'w660z-streaming-proof' });
  try {
    assert.equal(runtime.setDestination('expanse', { explicitUserAction: true }).ok, true);
    const meshCounts = [];
    for (let index = 0; index < 144; index += 1) {
      const x = 48 + (index % 12) * 10.4;
      const z = 5 + Math.floor(index / 12) * 10.4;
      player.position.set(x, 0, z);
      const summary = runtime.update({ position: player.position, now: index * 1000 });
      assert.equal(summary.residentCellCount, 25, `resident cells at ${index}`);
      assert.equal(summary.renderedCellCount, 25, `rendered cells at ${index}`);
      assert.equal(summary.interactiveCellCount, 9, `interactive cells at ${index}`);
      assert.ok(summary.collisionVolumeCount > 0, `collision volumes at ${index}`);
      scene.render();
      meshCounts.push(scene.meshes.length);
    }
    const tail = meshCounts.slice(24);
    assert.ok(Math.max(...tail) - Math.min(...tail) <= 36, `unbounded mesh variation: ${Math.min(...tail)}..${Math.max(...tail)}`);
    assert.ok(Math.max(...tail) < 900, `unexpected scene growth: ${Math.max(...tail)}`);
  } finally {
    runtime.dispose();
    scene.dispose();
    engine.dispose();
  }
});

test('W660Z repeated six-Realm render cycles replace rather than accumulate content', () => {
  const { engine, scene } = makeScene();
  const parent = new TransformNode('existing-city-root', scene);
  const renderer = createEonCityLivingNexusRealmBabylonRenderer({ scene, parent });
  const firstRound = new Map();
  try {
    for (let round = 0; round < 8; round += 1) {
      for (const id of EON_CITY_LIVING_NEXUS_REALM_IDS) {
        const result = renderer.render(buildEonCityLivingNexusRealmPlan(id, { quality: 'balanced', storage: null }));
        assert.equal(result.ok, true, id);
        renderer.update(round * 30000 + 4500, { reducedEffects: false, mode: 'explore' });
        scene.render();
        const count = realmMeshCount(scene, id);
        assert.ok(count >= 12, `${id} content missing`);
        if (!firstRound.has(id)) firstRound.set(id, count);
        else assert.equal(count, firstRound.get(id), `${id} accumulated meshes across cycles`);
        assert.ok(scene.meshes.length < 180, `${id} scene mesh count escaped bound`);
      }
    }
  } finally {
    renderer.dispose();
    assert.equal(scene.meshes.filter((mesh) => String(mesh.name || '').startsWith('w660v-')).length, 0);
    scene.dispose();
    engine.dispose();
  }
});

test('W660Z Focus, mobile-lite and reduced effects retain every navigation and safety route', () => {
  const mobile = buildEonCityConnectedCorePlan({ quality: 'lite', mode: 'focus', reducedEffects: true });
  assert.equal(mobile.motionEnabled, false);
  assert.equal(mobile.transitLoop.motionEnabled, false);
  assert.equal(mobile.transitLoop.stations.length, 9);
  assert.equal(mobile.transitLoop.capsuleCount, 1);
  assert.equal(mobile.focusModeFastTravelRetained, true);
  assert.equal(mobile.districtFastTravelRetained, true);
  assert.equal(mobile.physicalWalkingSupported, true);
  for (const id of EON_CITY_LIVING_NEXUS_REALM_IDS) {
    const plan = buildEonCityLivingNexusRealmPlan(id, { quality: 'lite', reducedEffects: true, storage: null });
    assert.equal(plan.atmosphere.motionEnabled, false, id);
    assert.equal(plan.specialist.motionEnabled, false, id);
    assert.equal(plan.movementSystem.motionEnabled, false, id);
    assert.ok(plan.safeRoute.length >= 4, id);
    assert.equal(plan.immediateSafeReturn, true, id);
  }
});

test('W660Z destination lifecycle stays one-scene, explicit and immediately reversible', () => {
  const { engine, scene } = makeScene();
  const player = new TransformNode('w660z-player', scene);
  const runtime = createEonCityLivingNexusBabylonRuntime({ scene, playerAnchor: player, quality: 'lite', reducedMotion: true });
  try {
    for (let index = 0; index < 30; index += 1) {
      assert.equal(runtime.setDestination('expanse', { explicitUserAction: true }).ok, true);
      player.position.set(48 + (index % 4) * 10.2, 0, 5 + (index % 3) * 10.2);
      runtime.update({ position: player.position, now: index * 800 });
      assert.equal(runtime.getSummary().residentCellCount, 25);
      assert.equal(runtime.getSummary().interactiveCellCount, 9);
      assert.equal(runtime.setDestination('my-realm', { explicitUserAction: true }).ok, true);
      assert.equal(runtime.getSummary().myRealmVisible, true);
      assert.equal(runtime.setDestination('core', { explicitUserAction: true }).ok, true);
      const summary = runtime.getSummary();
      assert.equal(summary.connectedCoreVisible, true);
      assert.equal(summary.oneCanonicalScene, true);
      assert.equal(summary.secondCanvasCreated, false);
      assert.equal(summary.secondRenderLoopCreated, false);
      assert.equal(summary.automaticNavigation, false);
      assert.equal(summary.automaticExecution, false);
    }
  } finally {
    runtime.dispose();
    scene.dispose();
    engine.dispose();
  }
});

test('W660Z source gate locks institutional release boundaries', () => {
  const report = inspectW660zLivingNexusInstitutionalReadiness();
  assert.equal(report.ok, true, report.checks.filter((entry) => !entry.pass).map((entry) => `${entry.id}: ${entry.detail}`).join('\n'));
});

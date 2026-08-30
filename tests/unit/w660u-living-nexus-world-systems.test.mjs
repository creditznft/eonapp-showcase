import test from 'node:test';
import assert from 'node:assert/strict';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { Scene } from '@babylonjs/core/scene.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { buildEonCityLivingNexusExpanse } from '../../assets/js/city/eon-city-living-nexus-hybrid.js';
import {
  buildEonCityLivingNexusWorldSystemsPlan,
  validateEonCityLivingNexusWorldSystemsPlan
} from '../../assets/js/city/eon-city-living-nexus-world-systems.js';
import { inspectW660uLivingNexusWorldSystems } from '../../scripts/w660u-living-nexus-world-systems-gate.mjs';
import { createEonCityLivingNexusBabylonRuntime } from '../../assets/js/city/eon-city-living-nexus-babylon-runtime.js';

function resident(seed = 'w660u-world') {
  return buildEonCityLivingNexusExpanse({ position: { x: 48, z: 5 }, seed });
}

test('W660U builds deterministic bounded transit, weather, maintenance and authored world-event plans', () => {
  const expanse = resident('w660u-deterministic');
  const input = { cells: expanse.cells, currentCellId: expanse.currentCellId, seed: 'w660u-deterministic', quality: 'balanced', phaseIndex: 2 };
  const first = buildEonCityLivingNexusWorldSystemsPlan(input);
  const second = buildEonCityLivingNexusWorldSystemsPlan(input);
  assert.deepEqual(first, second);
  assert.equal(first.residentCellCount, 9);
  assert.equal(first.transit.length, 1);
  assert.equal(first.maintenance.length, 2);
  assert.equal(first.phase.id, 'creator-glow');
  assert.equal(first.phase.readsDeviceClock, false);
  assert.equal(first.weather.readsRealWeather, false);
  assert.equal(first.worldEvent.authored, true);
  assert.equal(first.oneCanonicalScene, true);
  assert.equal(first.oneExistingRenderLoop, true);
  assert.equal(validateEonCityLivingNexusWorldSystemsPlan(first).ok, true);
});

test('W660U reduced-effects mode removes motion-heavy transit and rain while preserving navigation truth', () => {
  const expanse = resident('w660u-reduced');
  const plan = buildEonCityLivingNexusWorldSystemsPlan({ cells: expanse.cells, currentCellId: expanse.currentCellId, seed: 'w660u-reduced', quality: 'cinematic', reducedEffects: true, phaseIndex: 3 });
  assert.equal(plan.weather.id, 'clear-neon');
  assert.equal(plan.weather.rainStrandCount, 0);
  assert.equal(plan.weather.motionEnabled, false);
  assert.equal(plan.transit.length, 0);
  assert.ok(plan.maintenance.length >= 1);
  assert.equal(plan.automaticNavigation, false);
  assert.equal(plan.automaticExecution, false);
  assert.equal(validateEonCityLivingNexusWorldSystemsPlan(plan).ok, true);
});

test('W660U rare portals remain deterministic, uncommon, authored and inspect-only', () => {
  const expanse = resident('w660u-portal-search');
  let found = null;
  let absent = 0;
  for (let index = 0; index < 300; index += 1) {
    const plan = buildEonCityLivingNexusWorldSystemsPlan({ cells: expanse.cells, currentCellId: expanse.currentCellId, seed: `w660u-portal-${index}`, quality: 'balanced' });
    if (plan.rarePortal && !found) found = plan;
    if (!plan.rarePortal) absent += 1;
  }
  assert.ok(found, 'expected at least one deterministic rare portal seed');
  assert.ok(absent > 240, `rare portals should remain uncommon; absent=${absent}`);
  assert.equal(found.rarePortal.inspectOnly, true);
  assert.equal(found.rarePortal.authoredRealm, true);
  assert.equal(found.rarePortal.generatedGeometry, false);
  assert.equal(found.rarePortal.automaticNavigation, false);
  assert.equal(found.rarePortal.privateContentStored, false);
  assert.equal(validateEonCityLivingNexusWorldSystemsPlan(found).ok, true);
});

test('W660U quality profiles scale bounded ambience without changing truth boundaries', () => {
  const expanse = resident('w660u-quality');
  const lite = buildEonCityLivingNexusWorldSystemsPlan({ cells: expanse.cells, currentCellId: expanse.currentCellId, seed: 'w660u-quality', quality: 'lite' });
  const balanced = buildEonCityLivingNexusWorldSystemsPlan({ cells: expanse.cells, currentCellId: expanse.currentCellId, seed: 'w660u-quality', quality: 'balanced' });
  const cinematic = buildEonCityLivingNexusWorldSystemsPlan({ cells: expanse.cells, currentCellId: expanse.currentCellId, seed: 'w660u-quality', quality: 'cinematic' });
  assert.equal(lite.transit.length, 0);
  assert.equal(balanced.transit.length, 1);
  assert.equal(cinematic.transit.length, 2);
  for (const plan of [lite, balanced, cinematic]) {
    assert.equal(plan.userDataRead, false);
    assert.equal(plan.networkRequestCreated, false);
    assert.equal(plan.rewardIssued, false);
    assert.equal(plan.paymentClaimed, false);
    assert.equal(validateEonCityLivingNexusWorldSystemsPlan(plan).ok, true);
  }
});


test('W660U renders bounded world systems through the existing Babylon scene and update call', () => {
  const engine = new NullEngine({ renderWidth: 800, renderHeight: 600, textureSize: 256, deterministicLockstep: true });
  const scene = new Scene(engine);
  const player = new TransformNode('w660u-player', scene);
  const runtime = createEonCityLivingNexusBabylonRuntime({ scene, playerAnchor: player, quality: 'balanced', seed: 'w660u-runtime-seed' });
  try {
    assert.equal(runtime.setDestination('expanse', { explicitUserAction: true }).ok, true);
    const before = runtime.getSummary();
    assert.equal(before.transitCapsuleCount, 1);
    assert.equal(before.maintenanceCueCount, 2);
    assert.equal(before.localVisualWeather, true);
    assert.equal(before.realWeatherRead, false);
    assert.equal(before.authoredWorldEventCount, 1);
    assert.ok(scene.transformNodes.some((node) => node.metadata?.kind === 'living-nexus-transit-capsule'));
    assert.ok(scene.meshes.some((mesh) => mesh.metadata?.kind === 'living-nexus-maintenance-cue'));
    runtime.update({ position: { x: 48, z: 5 }, now: 62000 });
    const after = runtime.getSummary();
    assert.notEqual(after.worldSystemsPhaseId, before.worldSystemsPhaseId);
    const reduced = runtime.setReducedEffects(true);
    assert.equal(reduced.transitCapsuleCount, 0);
    assert.equal(reduced.worldSystemsWeatherId, 'clear-neon');
    assert.equal(reduced.weatherNodeCount, 0);
  } finally {
    runtime.dispose();
    scene.dispose();
    engine.dispose();
  }
});

test('W660U source gate locks one-scene rendering, consent reuse and external-proof boundaries', () => {
  const report = inspectW660uLivingNexusWorldSystems();
  assert.equal(report.ok, true, report.checks.filter((entry) => !entry.pass).map((entry) => `${entry.id}: ${entry.detail}`).join('\n'));
});

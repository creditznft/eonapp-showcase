#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { Scene } from '@babylonjs/core/scene.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { createEonCityLivingNexusBabylonRuntime } from '../assets/js/city/eon-city-living-nexus-babylon-runtime.js';
import { createEonCityLivingNexusRealmBabylonRenderer } from '../assets/js/city/eon-city-living-nexus-realm-babylon.js';
import { buildEonCityLivingNexusRealmPlan, EON_CITY_LIVING_NEXUS_REALM_IDS } from '../assets/js/city/eon-city-living-nexus-realms.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'reports', 'w660z-living-nexus', 'performance');
await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });
const startHeap = process.memoryUsage().heapUsed;
const started = performance.now();

function makeScene() {
  const engine = new NullEngine({ renderWidth: 1280, renderHeight: 720, textureSize: 256, deterministicLockstep: true });
  const scene = new Scene(engine);
  scene.activeCamera = new FreeCamera('w660z-proof-camera', new Vector3(0, 8, -18), scene);
  return { engine, scene };
}

function runExpanseProof() {
  const { engine, scene } = makeScene();
  const player = new TransformNode('w660z-performance-player', scene);
  const runtime = createEonCityLivingNexusBabylonRuntime({ scene, playerAnchor: player, quality: 'balanced', seed: 'w660z-performance-seed' });
  const meshCounts = [];
  let residentCellViolations = 0;
  let renderedCellViolations = 0;
  let interactiveCellViolations = 0;
  let maximumCollisionVolumes = 0;
  try {
    runtime.setDestination('expanse', { explicitUserAction: true });
    for (let index = 0; index < 400; index += 1) {
      player.position.set(48 + (index % 20) * 10.2, 0, 5 + Math.floor(index / 20) * 10.2);
      const summary = runtime.update({ position: player.position, now: index * 250 });
      if (summary.residentCellCount !== 25) residentCellViolations += 1;
      if (summary.renderedCellCount !== 25) renderedCellViolations += 1;
      if (summary.interactiveCellCount !== 9) interactiveCellViolations += 1;
      maximumCollisionVolumes = Math.max(maximumCollisionVolumes, summary.collisionVolumeCount || 0);
      scene.render();
      meshCounts.push(scene.meshes.length);
    }
  } finally {
    runtime.dispose(); player.dispose(); scene.dispose(); engine.dispose();
  }
  const stableTail = meshCounts.slice(40);
  return {
    crossings: 400,
    expectedResidentCells: 25,
    expectedInteractiveCells: 9,
    residentCellViolations,
    renderedCellViolations,
    interactiveCellViolations,
    minimumStableMeshCount: Math.min(...stableTail),
    maximumStableMeshCount: Math.max(...stableTail),
    stableMeshVariation: Math.max(...stableTail) - Math.min(...stableTail),
    maximumCollisionVolumes
  };
}

function runRealmProof() {
  const { engine, scene } = makeScene();
  const parent = new TransformNode('w660z-performance-realm-parent', scene);
  const renderer = createEonCityLivingNexusRealmBabylonRenderer({ scene, parent });
  const counts = Object.fromEntries(EON_CITY_LIVING_NEXUS_REALM_IDS.map((id) => [id, []]));
  try {
    for (let round = 0; round < 25; round += 1) {
      for (const id of EON_CITY_LIVING_NEXUS_REALM_IDS) {
        const result = renderer.render(buildEonCityLivingNexusRealmPlan(id, { quality: 'balanced', storage: null }));
        if (!result.ok) throw new Error(`Realm render failed: ${id}`);
        renderer.update(round * 6000, { reducedEffects: false, mode: 'explore' });
        scene.render();
        counts[id].push(scene.meshes.length);
      }
    }
  } finally {
    renderer.dispose(); parent.dispose(); scene.dispose(); engine.dispose();
  }
  return {
    realmCount: EON_CITY_LIVING_NEXUS_REALM_IDS.length,
    renderCycles: 25,
    totalRealmEntries: 25 * EON_CITY_LIVING_NEXUS_REALM_IDS.length,
    stablePerRealm: Object.fromEntries(Object.entries(counts).map(([id, values]) => [id, new Set(values).size === 1])),
    counts
  };
}

const expanse = runExpanseProof();
const realms = runRealmProof();
if (global.gc) { global.gc(); global.gc(); }
const endHeap = process.memoryUsage().heapUsed;
const elapsedMs = Math.round((performance.now() - started) * 100) / 100;
const status = expanse.residentCellViolations === 0 && expanse.renderedCellViolations === 0 && expanse.interactiveCellViolations === 0 && expanse.stableMeshVariation <= 36 && Object.values(realms.stablePerRealm).every(Boolean) ? 'PASS' : 'FAIL';
const report = {
  schema: 'eonapp.w660z.local-nullengine-lifecycle-performance-proof.2026-07-21.v3',
  generatedAt: new Date().toISOString(), status,
  claims: { productionFpsClaimed: false, physicalDeviceClaimed: false, realBrowserClaimed: false, nullEngineLifecycleAndDisposalOnly: true, oneCanonicalScenePerRuntime: true, automaticWorkClaimed: false },
  expanse, realms,
  processObservation: { elapsedMs, startHeapBytes: startHeap, endHeapBytes: endHeap, heapDeltaBytes: endHeap - startHeap, garbageCollectionExplicitlyAvailable: Boolean(global.gc), note: 'Process heap is observational only; acceptance is based on bounded streamed scene residency, a 5x5 visible horizon, a 3x3 interaction neighbourhood and stable per-Realm mesh counts.' }
};
await fs.writeFile(path.join(outputDir, 'W660Z_LOCAL_LIFECYCLE_PERFORMANCE_PROOF.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (status !== 'PASS') process.exitCode = 1;

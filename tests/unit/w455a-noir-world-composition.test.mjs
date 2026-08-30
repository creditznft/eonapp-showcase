import assert from 'node:assert/strict';
import test from 'node:test';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { Scene } from '@babylonjs/core/scene.js';
import {
  EON_NOIR_WORLD_COMPOSITION_SCHEMA,
  createEonNoirWorldLayer,
  getEonNoirArchitectureSummary,
  getEonNoirWorldCompositionPlan
} from '../../assets/js/city/eon-city-noir-architecture.js';
import { validateW455ANoirWorldCompositionContract } from '../../config/w455a-noir-world-composition-contract.mjs';
import { inspectW455ANoirWorldComposition } from '../../scripts/w455a-noir-world-composition-gate.mjs';

test('W455.1 defines a quality-scaled original City composition with world-first layers', () => {
  const lite = getEonNoirWorldCompositionPlan({ quality: 'lite' });
  const balanced = getEonNoirWorldCompositionPlan({ quality: 'balanced' });
  const cinematic = getEonNoirWorldCompositionPlan({ quality: 'cinematic' });
  const summary = getEonNoirArchitectureSummary();

  assert.equal(lite.schema, EON_NOIR_WORLD_COMPOSITION_SCHEMA);
  assert.deepEqual(validateW455ANoirWorldCompositionContract(summary, balanced), []);
  assert.deepEqual(lite.foreground, ['wet-street-edges', 'route-rails', 'street-lanterns', 'arrival-thresholds']);
  assert.ok(balanced.midground.includes('original-landmark-silhouettes'));
  assert.ok(cinematic.background.includes('atmospheric-light-couriers'));
  assert.deepEqual([lite.ambientTransit.count, balanced.ambientTransit.count, cinematic.ambientTransit.count], [0, 1, 2]);
  assert.equal(cinematic.ambientTransit.decorativeOnly, true);
  assert.equal(cinematic.ambientTransit.passengerData, false);
  assert.equal(cinematic.ambientTransit.routeData, false);
  assert.equal(cinematic.ambientTransit.stationStatus, false);
  assert.equal(cinematic.ambientTransit.simulatedTraffic, false);
});

test('W455.1 renders quality-scaled decorative couriers locally without population or status data', () => {
  const engine = new NullEngine({ renderWidth: 640, renderHeight: 360, textureSize: 512 });
  const scene = new Scene(engine);
  scene.metadata = { playPaused: true, playReducedEffects: true };
  const lite = createEonNoirWorldLayer(scene, { quality: 'lite', seed: 'w455a-lite' });
  const balanced = createEonNoirWorldLayer(scene, { quality: 'balanced', seed: 'w455a-balanced' });
  const cinematic = createEonNoirWorldLayer(scene, { quality: 'cinematic', seed: 'w455a-cinematic' });

  assert.equal(lite.ambientTransitCount, 0);
  assert.equal(balanced.ambientTransitCount, 1);
  assert.equal(cinematic.ambientTransitCount, 2);
  assert.equal(balanced.root.metadata.simulatedTraffic, false);
  assert.equal(balanced.root.metadata.passengerData, false);
  assert.equal(balanced.root.metadata.routeData, false);
  assert.equal(balanced.root.metadata.stationStatus, false);
  assert.equal(balanced.root.metadata.taskStatusFabricated, false);
  const couriers = scene.transformNodes.filter((node) => node.metadata?.kind === 'eon-noir-ambient-transit-courier');
  assert.equal(couriers.length, 3);
  assert.ok(couriers.every((node) => node.metadata.decorative === true && node.metadata.localOnly === true));

  scene.dispose();
  engine.dispose();
});

test('W455.1 source gate keeps City composition original, local and honest about final art', () => {
  const report = inspectW455ANoirWorldComposition();
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  assert.deepEqual(report.qualityProfiles.map((entry) => entry.ambientTransitCount), [0, 1, 2]);
  assert.match(report.limitations.join(' '), /does not ship final licensed GLB\/glTF landmarks/i);
});

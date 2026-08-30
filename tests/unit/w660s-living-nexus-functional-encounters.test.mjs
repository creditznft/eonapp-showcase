import test from 'node:test';
import assert from 'node:assert/strict';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { Scene } from '@babylonjs/core/scene.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { buildEonCityLivingNexusExpanse } from '../../assets/js/city/eon-city-living-nexus-hybrid.js';
import {
  buildEonCityLivingNexusEncounters,
  createEonCityLivingNexusEncounterController,
  EON_CITY_LIVING_NEXUS_ENCOUNTER_STORAGE_KEY,
  validateEonCityLivingNexusEncounterSnapshot
} from '../../assets/js/city/eon-city-living-nexus-encounters.js';
import { createEonCityLivingNexusBabylonRuntime, EON_CITY_LIVING_NEXUS_ENTRY_POSES } from '../../assets/js/city/eon-city-living-nexus-babylon-runtime.js';
import { recordEonCityProductiveRpgOutcome } from '../../assets/js/contracts/city/eon-city-productive-rpg-loop.js';
import { inspectW660sLivingNexusFunctionalEncounters } from '../../scripts/w660s-living-nexus-functional-encounters-gate.mjs';

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) || null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    dump() { return Object.fromEntries(values); }
  };
}

const OUTCOME_BY_MISSION = Object.freeze({
  orientation: Object.freeze({ kind: 'orientation-receipt', route: '/eoncity', source: 'city-local' }),
  project: Object.freeze({ kind: 'project-shell', route: '/projects', source: 'projects-local' }),
  'local-ai-byok': Object.freeze({ kind: 'local-ai-self-test', route: '/local-ai', source: 'local-ai-device' }),
  creator: Object.freeze({ kind: 'creator-guide-artifact', route: '/create', source: 'create-local-guide' }),
  automation: Object.freeze({ kind: 'automation-proposal', route: '/automations', source: 'automations-local' }),
  'vault-recovery': Object.freeze({ kind: 'backup-readiness-receipt', route: '/capsule', source: 'capsule-local' })
});

function expanseCells(seed = 'w660s-test-seed') {
  return buildEonCityLivingNexusExpanse({ position: EON_CITY_LIVING_NEXUS_ENTRY_POSES.expanse, seed }).cells;
}

function createRuntimeFixture(seed = 'w660s-test-seed') {
  const engine = new NullEngine({ renderWidth: 800, renderHeight: 600, textureSize: 256, deterministicLockstep: true, lockstepMaxSteps: 4 });
  const scene = new Scene(engine);
  const player = new TransformNode('w660s-test-player', scene);
  const runtime = createEonCityLivingNexusBabylonRuntime({ scene, playerAnchor: player, quality: 'balanced', seed });
  runtime.setDestination('expanse', { explicitUserAction: true });
  return { engine, scene, player, runtime, dispose() { runtime.dispose(); scene.dispose(); engine.dispose(); } };
}

test('W660S builds nine deterministic public-safe resident encounters from the rendered 3×3 Expanse', () => {
  const storage = createMemoryStorage();
  const cells = expanseCells();
  const first = buildEonCityLivingNexusEncounters(cells, { seed: 'w660s-test-seed', storage, now: 1000 });
  const second = buildEonCityLivingNexusEncounters(cells, { seed: 'w660s-test-seed', storage, now: 2000 });
  assert.equal(first.length, 9);
  assert.deepEqual(first, second);
  assert.equal(new Set(first.map((entry) => entry.id)).size, 9);
  assert.ok(new Set(first.map((entry) => entry.missionId)).size >= 4);
  assert.ok(first.every((entry) => entry.reviewFirst && entry.requiresSeparateRouteConfirmation && !entry.executesWork && !entry.automaticNavigation && !entry.automaticExecution));
  const controller = createEonCityLivingNexusEncounterController({ storage, now: () => 3000, getCells: () => cells, getPosition: () => first[0].position, seed: 'w660s-test-seed' });
  const snapshot = controller.getSnapshot();
  assert.equal(snapshot.encounterCount, 9);
  assert.equal(snapshot.nearest.id, first[0].id);
  assert.equal(validateEonCityLivingNexusEncounterSnapshot(snapshot).ok, true);
  controller.dispose();
});

test('W660S requires explicit inspection and mission preparation and stores only opaque bounded review state', () => {
  const storage = createMemoryStorage();
  const cells = expanseCells();
  const encounters = buildEonCityLivingNexusEncounters(cells, { seed: 'w660s-test-seed', storage, now: 1000 });
  const target = encounters[0];
  const controller = createEonCityLivingNexusEncounterController({ storage, now: () => 5000, getCells: () => cells, getPosition: () => target.position, seed: 'w660s-test-seed' });
  assert.equal(controller.inspect(target.id).reason, 'explicit-user-action-required');
  assert.equal(controller.prepareMission(target.id).reason, 'explicit-user-action-required');
  const inspected = controller.inspect(target.id, { explicitUserAction: true });
  assert.equal(inspected.ok, true);
  const interpreted = controller.interpret(target.id, { explicitUserAction: true });
  assert.equal(interpreted.ok, true);
  assert.equal(interpreted.providerRequestCreated, false);
  const prepared = controller.prepareMission(target.id, { explicitUserAction: true });
  assert.equal(prepared.ok, true);
  assert.equal(prepared.encounter.state, 'prepared');
  assert.equal(prepared.opensRoute, false);
  const stored = storage.getItem(EON_CITY_LIVING_NEXUS_ENCOUNTER_STORAGE_KEY);
  assert.match(stored, new RegExp(target.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.equal(/project title|prompt|file content|api[_-]?key|payment complete|reward earned/i.test(stored), false);
  controller.dispose();
});

test('W660S transforms only the exact prepared encounter after its matching verified native receipt returns', () => {
  const storage = createMemoryStorage();
  const cells = expanseCells();
  const encounters = buildEonCityLivingNexusEncounters(cells, { seed: 'w660s-test-seed', storage, now: 1000 });
  const target = encounters.find((entry) => OUTCOME_BY_MISSION[entry.missionId]);
  const other = encounters.find((entry) => entry.id !== target.id);
  const controller = createEonCityLivingNexusEncounterController({ storage, now: () => 7000, getCells: () => cells, getPosition: () => target.position, seed: 'w660s-test-seed' });
  assert.equal(controller.prepareMission(target.id, { explicitUserAction: true }).ok, true);
  const absent = controller.syncVerifiedReturn({ explicitUserAction: true });
  assert.equal(absent.reason, 'matching-verified-receipt-not-found');
  assert.equal(absent.resolved, null);
  assert.equal(absent.snapshot.encounters.find((entry) => entry.id === target.id).state, 'prepared');

  const nativeOutcome = OUTCOME_BY_MISSION[target.missionId];
  const receipt = recordEonCityProductiveRpgOutcome({ ...nativeOutcome, receiptId: `${nativeOutcome.kind}:w660s`, verified: true }, { storage, now: 7100 });
  assert.equal(receipt.ok, true);
  const synced = controller.syncVerifiedReturn({ explicitUserAction: true });
  assert.equal(synced.ok, true);
  assert.equal(synced.resolved.encounterId, target.id);
  assert.equal(synced.resolved.cellId, target.cellId);
  assert.equal(synced.resolved.missionId, target.missionId);
  assert.equal(synced.snapshot.encounters.find((entry) => entry.id === target.id).state, 'transformed');
  assert.notEqual(synced.snapshot.encounters.find((entry) => entry.id === other.id).state, 'transformed');
  assert.equal(synced.privateContentStored, false);
  assert.equal(synced.rewardIssued, false);
  assert.equal(synced.paymentClaimed, false);
  controller.dispose();
});

test('W660S runtime proximity follows the actual rendered NPC and applies the resolved material only to that encounter', () => {
  const fixture = createRuntimeFixture();
  try {
    const opportunities = fixture.runtime.getOpportunities();
    assert.equal(opportunities.length, 9);
    const target = opportunities[0];
    fixture.player.position.set(target.position.x, 0, target.position.z);
    const nearest = fixture.runtime.getNearestOpportunity(fixture.player.position);
    assert.equal(nearest.id, target.id);
    assert.ok(nearest.distance <= target.interactionRadius);
    const resolution = { encounterId: target.id, cellId: target.cellId, missionId: target.missionId, receiptId: 'receipt:w660s-runtime', outcomeKind: OUTCOME_BY_MISSION[target.missionId].kind, resolvedAt: 8000 };
    const applied = fixture.runtime.setEncounterResolutions([resolution]);
    assert.equal(applied.ok, true);
    assert.equal(applied.summary.resolvedOpportunityCount, 1);
    assert.equal(fixture.runtime.getOpportunities().find((entry) => entry.id === target.id).state, 'transformed');
    assert.equal(fixture.runtime.getOpportunities().filter((entry) => entry.state === 'transformed').length, 1);
    const targetMesh = fixture.scene.meshes.find((mesh) => mesh.metadata?.encounterId === target.id && mesh.metadata?.kind === 'living-nexus-functional-npc-signal');
    assert.equal(targetMesh.metadata.encounterState, 'transformed');
    assert.match(targetMesh.material.name, /resolved/i);
  } finally { fixture.dispose(); }
});

test('W660S source gate locks the review-first encounter, receipt and browser-proof boundaries', () => {
  const report = inspectW660sLivingNexusFunctionalEncounters();
  assert.equal(report.ok, true, report.checks.filter((entry) => !entry.pass).map((entry) => `${entry.id}: ${entry.detail}`).join('\n'));
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EON_CITY_AMBIENT_NPC_ARCHETYPES,
  EON_CITY_NPC_ARCHETYPES_SCHEMA,
  getEonCityAmbientNpcCrowdPlan,
  getEonCityNpcArchetypeTruth,
  validateEonCityAmbientNpcCrowdPlan
} from '../../assets/js/city/eon-city-npc-archetypes.js';
import { inspectW570CityNpcArchetypes } from '../../scripts/w570-city-npc-archetypes-gate.mjs';

test('W570 has original human, robot, and alien ambient archetypes with readable faces only where profile permits', () => {
  assert.deepEqual(EON_CITY_AMBIENT_NPC_ARCHETYPES.map((entry) => entry.species), ['human', 'robot', 'alien']);
  const lite = getEonCityAmbientNpcCrowdPlan({ quality: 'lite' });
  const balanced = getEonCityAmbientNpcCrowdPlan({ quality: 'balanced' });
  const cinematic = getEonCityAmbientNpcCrowdPlan({ quality: 'cinematic' });
  assert.equal(lite.schema, EON_CITY_NPC_ARCHETYPES_SCHEMA);
  assert.equal(lite.ambientCount, 0);
  assert.equal(lite.readableFaces, false);
  assert.equal(balanced.ambientCount, 3);
  assert.equal(balanced.readableFaces, true);
  assert.equal(cinematic.ambientCount, 5);
  assert.equal(validateEonCityAmbientNpcCrowdPlan(lite).ok, true);
  assert.equal(validateEonCityAmbientNpcCrowdPlan(balanced).ok, true);
  assert.equal(validateEonCityAmbientNpcCrowdPlan(cinematic).ok, true);
});

test('W570 maintains deterministic spacing and local visual-only truth', () => {
  const plan = getEonCityAmbientNpcCrowdPlan({ quality: 'cinematic' });
  assert.ok(plan.measuredMinSpacing >= plan.minSpacing);
  assert.equal(plan.originalProcedural, true);
  assert.equal(plan.binaryAssets, false);
  assert.equal(plan.remoteAssets, false);
  assert.equal(plan.remoteTelemetry, false);
  assert.equal(plan.userData, false);
  assert.equal(plan.interactive, false);
  assert.equal(plan.autonomous, false);
  assert.equal(plan.socialMultiplayer, false);
  const truth = getEonCityNpcArchetypeTruth({ quality: 'balanced' });
  assert.equal(truth.chatOrVoice, false);
  assert.equal(truth.browserDeviceProofCaptured, false);
});

test('W570 rejects duplicate/unsafe ambient identities, private fields, and spacing regressions', () => {
  const safe = getEonCityAmbientNpcCrowdPlan({ quality: 'balanced' });
  const duplicate = {
    ...safe,
    entities: [safe.entities[0], { ...safe.entities[0] }]
  };
  assert.equal(validateEonCityAmbientNpcCrowdPlan(duplicate).ok, false);
  assert.ok(validateEonCityAmbientNpcCrowdPlan(duplicate).errors.includes('ambient-count-invalid') || validateEonCityAmbientNpcCrowdPlan(duplicate).errors.includes('entity-id-invalid-or-duplicate'));
  const sensitive = { ...safe, projectId: 'not-allowed' };
  assert.equal(validateEonCityAmbientNpcCrowdPlan(sensitive).ok, false);
  assert.ok(validateEonCityAmbientNpcCrowdPlan(sensitive).errors.includes('plan-has-unknown-or-sensitive-fields'));
});

test('W570 source gate keeps NPCs local, non-interactive, and separate from EONBOT', () => {
  const report = inspectW570CityNpcArchetypes();
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 14);
});

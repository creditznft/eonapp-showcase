import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EON_CITY_SEEDED_AMBIENCE_SCHEMA,
  getEonCitySeededAmbiencePlan,
  getEonCitySeededAmbienceTruth,
  validateEonCitySeededAmbiencePlan
} from '../../assets/js/city/eon-city-seeded-ambience.js';
import { inspectW573SeededCityAmbience } from '../../scripts/w573-seeded-city-ambience-gate.mjs';

test('W573 produces deterministic seeded local ambience without a wall-clock or external feed', () => {
  const first = getEonCitySeededAmbiencePlan({ quality: 'balanced', seed: 'command-horizon-alpha', phaseIndex: 2 });
  const second = getEonCitySeededAmbiencePlan({ quality: 'balanced', seed: 'command-horizon-alpha', phaseIndex: 2 });
  assert.deepEqual(first, second);
  assert.equal(first.schema, EON_CITY_SEEDED_AMBIENCE_SCHEMA);
  assert.equal(first.phase.realWorldTime, false);
  assert.equal(first.phase.calendar, false);
  assert.equal(first.readsDeviceClock, false);
  assert.equal(first.realWorldCalendar, false);
  assert.equal(validateEonCitySeededAmbiencePlan(first).ok, true);
});

test('W573 keeps Lite genuinely static while richer profiles stay capped and decorative', () => {
  const lite = getEonCitySeededAmbiencePlan({ quality: 'lite', seed: 'command-horizon-alpha' });
  const balanced = getEonCitySeededAmbiencePlan({ quality: 'balanced', seed: 'command-horizon-alpha' });
  const cinematic = getEonCitySeededAmbiencePlan({ quality: 'cinematic', seed: 'command-horizon-alpha' });
  assert.equal(lite.signs.length, 2);
  assert.equal(lite.npcSchedule.length, 0);
  assert.equal(lite.traffic.length, 0);
  assert.equal(lite.visualMoments.length, 0);
  assert.equal(lite.motionEnabled, false);
  assert.equal(lite.motionState, 'quality-lite');
  assert.equal(balanced.npcSchedule.length, 3);
  assert.equal(balanced.traffic.length, 2);
  assert.equal(balanced.visualMoments.length, 1);
  assert.equal(cinematic.npcSchedule.length, 5);
  assert.equal(cinematic.traffic.length, 4);
  assert.equal(cinematic.visualMoments.length, 2);
  assert.equal(balanced.signs.every((entry) => entry.static && entry.interactive === false), true);
  assert.equal(cinematic.visualMoments.every((entry) => entry.notification === false && entry.calendar === false && entry.social === false && entry.reward === null), true);
});

test('W573 makes pause and reduced effects stop motion while retaining static wayfinding', () => {
  const paused = getEonCitySeededAmbiencePlan({ quality: 'cinematic', paused: true });
  const reduced = getEonCitySeededAmbiencePlan({ quality: 'balanced', reducedEffects: true });
  assert.equal(paused.motionEnabled, false);
  assert.equal(paused.motionState, 'city-paused');
  assert.equal(paused.staticSignsRemainVisible, true);
  assert.equal(reduced.motionEnabled, false);
  assert.equal(reduced.motionState, 'reduced-effects');
  assert.equal(reduced.staticSignsRemainVisible, true);
  assert.equal(validateEonCitySeededAmbiencePlan(paused).ok, true);
  assert.equal(validateEonCitySeededAmbiencePlan(reduced).ok, true);
});

test('W573 rejects sensitive fields, calendar semantics, and malformed visual budgets', () => {
  const plan = getEonCitySeededAmbiencePlan({ quality: 'balanced' });
  const sensitive = { ...plan, accountId: 'nope' };
  const calendar = { ...plan, phase: { ...plan.phase, calendar: true } };
  const invalidTraffic = { ...plan, traffic: [{ ...plan.traffic[0], speed: 5 }] };
  assert.equal(validateEonCitySeededAmbiencePlan(sensitive).ok, false);
  assert.equal(validateEonCitySeededAmbiencePlan(calendar).ok, false);
  assert.equal(validateEonCitySeededAmbiencePlan(invalidTraffic).ok, false);
});

test('W573 truth remains source-only, local visual, non-interactive, and non-commercial', () => {
  const truth = getEonCitySeededAmbienceTruth({ quality: 'cinematic' });
  assert.equal(truth.valid, true);
  assert.equal(truth.originalProcedural, true);
  assert.equal(truth.binaryAssets, false);
  assert.equal(truth.remoteAssets, false);
  assert.equal(truth.remoteTelemetry, false);
  assert.equal(truth.userData, false);
  assert.equal(truth.interactive, false);
  assert.equal(truth.autonomous, false);
  assert.equal(truth.realWorldCalendar, false);
  assert.equal(truth.notificationRequested, false);
  assert.equal(truth.workloadJobStarted, false);
  const report = inspectW573SeededCityAmbience({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 16);
});

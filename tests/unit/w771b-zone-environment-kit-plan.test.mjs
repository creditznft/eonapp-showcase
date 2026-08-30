import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveEonExpanseW771BEnvironmentKitPlan, validateEonExpanseW771BEnvironmentKitPlan } from '../../assets/js/city/w771/eon-expanse-w771b-zone-environment-kit-plan.js';

test('W771B produces a deterministic validated modular kit for all five zones', () => {
  const a = deriveEonExpanseW771BEnvironmentKitPlan({ worldSeed: 7441, quality: 'balanced' });
  const b = deriveEonExpanseW771BEnvironmentKitPlan({ worldSeed: 7441, quality: 'balanced' });
  assert.deepEqual(a, b);
  assert.equal(validateEonExpanseW771BEnvironmentKitPlan(a).ok, true);
  assert.equal(a.zoneCount, 5);
  assert.equal(a.moduleCount, 35);
});

test('W771B scales prop density by quality while preserving every zone identity', () => {
  const lite = deriveEonExpanseW771BEnvironmentKitPlan({ quality: 'lite' });
  const balanced = deriveEonExpanseW771BEnvironmentKitPlan({ quality: 'balanced' });
  const cinematic = deriveEonExpanseW771BEnvironmentKitPlan({ quality: 'cinematic' });
  assert.equal(lite.moduleCount, 20);
  assert.equal(balanced.moduleCount, 35);
  assert.equal(cinematic.moduleCount, 50);
  assert.deepEqual(lite.zones.map((zone) => zone.zoneId), cinematic.zones.map((zone) => zone.zoneId));
});

test('W771B uses primitives only as noninteractive modular environmental props', () => {
  const plan = deriveEonExpanseW771BEnvironmentKitPlan({ quality: 'cinematic' });
  for (const zone of plan.zones) for (const entry of zone.modules) {
    assert.equal(entry.finishedHeroBuilding, false);
    assert.equal(entry.modularEnvironmentProp, true);
    assert.equal(entry.visualWeight, 'support');
    assert.equal(entry.interactive, false);
    const visualHeight = Number(entry.dimensions?.height || entry.dimensions?.diameter || 0);
    assert.ok(visualHeight > 0 && visualHeight <= 4.5);
    assert.equal(typeof entry.milestone, 'string');
  }
  assert.equal(plan.finishedHeroPrimitiveCount, 0);
  assert.equal(plan.rawUserCoordinatesAccepted, false);
});

test('W771B reserves later modules for receipt-backed restoration milestones', () => {
  const plan = deriveEonExpanseW771BEnvironmentKitPlan({ quality: 'balanced' });
  for (const zone of plan.zones) {
    const restored = zone.modules.filter((entry) => entry.restoredOnly);
    assert.ok(restored.length > 0);
    assert.ok(restored.every((entry) => entry.milestone));
  }
});


test('W771B Beacon Fields includes bounded maintenance-drone ambience without increasing the quality mesh budget', () => {
  const lite = deriveEonExpanseW771BEnvironmentKitPlan({ quality: 'lite' });
  const cinematic = deriveEonExpanseW771BEnvironmentKitPlan({ quality: 'cinematic' });
  const liteBeacon = lite.zones.find((zone) => zone.zoneId === 'beacon-fields');
  const cinematicBeacon = cinematic.zones.find((zone) => zone.zoneId === 'beacon-fields');
  assert.equal(liteBeacon.modules.some((entry) => entry.type === 'drone'), true);
  assert.ok(cinematicBeacon.modules.filter((entry) => entry.type === 'drone').length <= 2);
  assert.equal(lite.moduleCount, 20);
  assert.equal(cinematic.moduleCount, 50);
  for (const entry of cinematicBeacon.modules.filter((row) => row.type === 'drone')) {
    assert.equal(entry.interactive, false);
    assert.equal(entry.finishedHeroBuilding, false);
    assert.equal(entry.modularEnvironmentProp, true);
  }
});

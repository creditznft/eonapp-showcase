import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SESSION8_MISSION_SCHEMA,
  SESSION8_STORAGE_KEY,
  SESSION8_PUBLIC_AUDIENCE,
  SESSION8_OWNER_AUDIENCE,
  Session8MissionRuntime,
  migrateSession8State
} from '../../assets/js/realm3d/engine/EonCitySession8MissionRuntime.js';

class MemoryStorage {
  constructor(seed = {}) { this.map = new Map(Object.entries(seed)); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

function completeFirstArrival(runtime) {
  runtime.record('city-entered', { world: 'eon-city' });
  runtime.record('player-position', { x: 0, z: 0, districts: [] });
  runtime.record('player-position', { x: 7, z: 0, districts: [] });
  runtime.record('eonbot-opened', {});
  runtime.record('interior-entered', { interiorId: 'ai', districtId: 'ai', targetId: 'ai' });
  runtime.record('station-opened', { stationId: 'station-eonbot-chat', districtId: 'ai', interiorId: 'ai', eventToken: 'first-chat' });
  runtime.record('station-closed', { stationId: 'station-eonbot-chat', districtId: 'ai', interiorId: 'ai' });
  runtime.record('interior-exited', { interiorId: 'ai', districtId: 'ai', targetId: 'ai' });
}

test('Session 8 starts public visitors in the first-arrival chain only', () => {
  const runtime = new Session8MissionRuntime({ storage: new MemoryStorage(), now: () => 1000 });
  const snapshot = runtime.getSnapshot();
  assert.equal(snapshot.schema, SESSION8_MISSION_SCHEMA);
  assert.equal(snapshot.audience, SESSION8_PUBLIC_AUDIENCE);
  assert.equal(snapshot.activeMission.id, 'first-arrival');
  assert.equal(snapshot.currentObjective.id, 'arrive');
  assert.ok(snapshot.availableMissions.every((mission) => mission.audience === SESSION8_PUBLIC_AUDIENCE));
  assert.ok(!snapshot.availableMissions.some((mission) => mission.id === 'owner-operator-check'));
});

test('Session 8 migration strips identity, wallet, and credential-shaped unknown fields', () => {
  const migrated = migrateSession8State({
    version: 1,
    email: 'private@example.test',
    wallet: '0xsecret',
    apiKey: 'sk-secret',
    seedPhrase: 'never store this',
    public: { activeMissionId: 'first-arrival', ownerPrivateData: { key: 'hidden' } },
    owner: { activeMissionId: 'owner-operator-check', providerCredential: 'hidden' }
  }, 2000);
  const serialized = JSON.stringify(migrated);
  assert.equal(migrated.schema, SESSION8_MISSION_SCHEMA);
  assert.ok(!serialized.includes('private@example.test'));
  assert.ok(!serialized.includes('0xsecret'));
  assert.ok(!serialized.includes('sk-secret'));
  assert.ok(!serialized.includes('never store this'));
  assert.ok(!serialized.includes('ownerPrivateData'));
  assert.ok(!serialized.includes('providerCredential'));
});

test('Session 8 resumes the deterministic first-arrival objective from local storage', () => {
  let now = 10_000;
  const storage = new MemoryStorage();
  const first = new Session8MissionRuntime({ storage, now: () => now++ });
  first.record('city-entered', { world: 'eon-city' });
  first.record('player-position', { x: 0, z: 0, districts: [] });
  first.record('player-position', { x: 7, z: 0, districts: [] });
  assert.equal(first.getSnapshot().currentObjective.id, 'meet-eonbot');
  const resumed = new Session8MissionRuntime({ storage, now: () => now++ });
  assert.equal(resumed.getSnapshot().currentObjective.id, 'meet-eonbot');
  assert.equal(resumed.getSnapshot().completedObjectives, 2);
});

test('Session 8 one-time completion credit cannot duplicate on replay', () => {
  let now = 20_000;
  const runtime = new Session8MissionRuntime({ storage: new MemoryStorage(), now: () => now++ });
  completeFirstArrival(runtime);
  const firstCredit = runtime.state.profiles[SESSION8_PUBLIC_AUDIENCE].completionCredits['first-arrival'];
  assert.ok(firstCredit > 0);
  assert.equal(runtime.getSnapshot().activeMission.id, 'district-tour');
  runtime.replayMission('first-arrival');
  completeFirstArrival(runtime);
  const secondCredit = runtime.state.profiles[SESSION8_PUBLIC_AUDIENCE].completionCredits['first-arrival'];
  assert.equal(secondCredit, firstCredit);
  assert.equal(runtime.state.profiles[SESSION8_PUBLIC_AUDIENCE].missions['first-arrival'].replayCount, 1);
});

test('Session 8 repeatable district activities are idempotent per cycle and repeat next cycle', () => {
  let now = Date.parse('2026-06-09T10:00:00Z');
  const runtime = new Session8MissionRuntime({ storage: new MemoryStorage(), now: () => now });
  runtime.record('station-opened', { stationId: 'station-provider-health', districtId: 'ai', cycleKey: '2026-06-09', eventToken: 'open-a' });
  runtime.record('station-opened', { stationId: 'station-provider-health', districtId: 'ai', cycleKey: '2026-06-09', eventToken: 'open-b' });
  let entry = runtime.state.profiles[SESSION8_PUBLIC_AUDIENCE].activityCycles['ai-health-check'];
  assert.equal(entry.count, 1);
  assert.equal(entry.cycleKey, '2026-06-09');
  now = Date.parse('2026-06-10T10:00:00Z');
  runtime.record('station-opened', { stationId: 'station-provider-health', districtId: 'ai', cycleKey: '2026-06-10', eventToken: 'open-c' });
  entry = runtime.state.profiles[SESSION8_PUBLIC_AUDIENCE].activityCycles['ai-health-check'];
  assert.equal(entry.count, 1);
  assert.equal(entry.cycleKey, '2026-06-10');
});

test('Session 8 keeps public and owner mission progress strictly separated', () => {
  const storage = new MemoryStorage();
  const runtime = new Session8MissionRuntime({ storage, now: () => 30_000 });
  runtime.record('city-entered', { world: 'eon-city' });
  assert.equal(runtime.getSnapshot().completedObjectives, 1);
  runtime.setAudience(SESSION8_OWNER_AUDIENCE);
  assert.equal(runtime.getSnapshot().activeMission.id, 'owner-operator-check');
  assert.equal(runtime.getSnapshot().completedObjectives, 0);
  runtime.record('world-entered', { world: 'private-workstation', targetId: 'private-workstation' });
  assert.equal(runtime.getSnapshot().completedObjectives, 1);
  runtime.setAudience(SESSION8_PUBLIC_AUDIENCE);
  assert.equal(runtime.getSnapshot().activeMission.id, 'first-arrival');
  assert.equal(runtime.getSnapshot().completedObjectives, 1);
  const stored = JSON.parse(storage.getItem(SESSION8_STORAGE_KEY));
  assert.equal(stored.profiles[SESSION8_PUBLIC_AUDIENCE].audience, SESSION8_PUBLIC_AUDIENCE);
  assert.equal(stored.profiles[SESSION8_OWNER_AUDIENCE].audience, SESSION8_OWNER_AUDIENCE);
});

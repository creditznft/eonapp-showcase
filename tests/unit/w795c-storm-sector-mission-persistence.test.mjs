import test from 'node:test';
import assert from 'node:assert/strict';
import { createEonExpanseW766AInitialState, createEonExpanseW766APersistence } from '../../assets/js/city/w766/eon-expanse-w766a-foundation.js';
import { createEonExpanseW795AInitialStormMissionState } from '../../assets/js/city/w795/eon-expanse-w795a-storm-sector-mission-runtime.js';

function memoryStorage() {
  const map = new Map();
  return { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: (key) => map.delete(key) };
}

test('W795C persists only sanitized ordered Storm Sector progress', () => {
  const storage = memoryStorage();
  const persistence = createEonExpanseW766APersistence({ storage, now: () => 1000 });
  const base = createEonExpanseW766AInitialState({ now: 1 });
  const storm = createEonExpanseW795AInitialStormMissionState();
  const write = persistence.write({ ...base, stormSectorMissions: { ...storm, completedObjectiveActions: ['storm-weather-array-reviewed'], processedReceiptIds: ['storm:one'], privateContentStored: { prompt: 'secret' } } });
  assert.equal(write.ok, true);
  const restored = persistence.read();
  assert.deepEqual(restored.stormSectorMissions.completedObjectiveActions, ['storm-weather-array-reviewed']);
  assert.equal(restored.stormSectorMissions.privateContentStored, false);
  assert.equal(restored.stormSectorMissions.awardsXp, false);
});

test('W795C prunes forged completed-region claims on reload', () => {
  const storage = memoryStorage();
  const persistence = createEonExpanseW766APersistence({ storage, now: () => 2000 });
  const base = createEonExpanseW766AInitialState({ now: 1 });
  const write = persistence.write({ ...base, stormSectorMissions: { ...createEonExpanseW795AInitialStormMissionState(), completedObjectiveActions: ['storm-worker-recovered'], completedMissionIds: ['storm-rescue'], regionCompleted: true } });
  assert.equal(write.ok, true);
  assert.equal(persistence.read().stormSectorMissions.regionCompleted, false);
  assert.deepEqual(persistence.read().stormSectorMissions.completedObjectiveActions, []);
});

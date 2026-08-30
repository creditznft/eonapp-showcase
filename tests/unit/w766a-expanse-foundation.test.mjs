import test from 'node:test';
import assert from 'node:assert/strict';
import { createEonExpanseW766AWorldSeed, createEonExpanseW766AInitialState, createEonExpanseW766APersistence, createEonExpanseW766AMapView, sanitizeEonExpanseW766APlayerPosition, validateEonExpanseW766AState, EON_EXPANSE_W766A_STORAGE_KEY } from '../../assets/js/city/w766/eon-expanse-w766a-foundation.js';

test('W766A world seed is deterministic and privacy safe', () => {
  const a = createEonExpanseW766AWorldSeed({ profileId: 'owner-1' });
  const b = createEonExpanseW766AWorldSeed({ profileId: 'owner-1' });
  assert.deepEqual(a, b);
  assert.equal(a.privateProjectContentIncluded, false);
});

test('W766A initial state and map expose truthful Gateway Overlook', () => {
  const state = createEonExpanseW766AInitialState({ now: 1 });
  assert.equal(validateEonExpanseW766AState(state).ok, true);
  const map = createEonExpanseW766AMapView(state);
  assert.equal(map.zones.find((zone) => zone.id === 'gateway-overlook').discovered, true);
  assert.equal(map.zones.find((zone) => zone.id === 'horizon-vault').discovered, false);
  assert.equal(map.hardWorldEdgeShown, false);
});

test('W766A persistence normalizes duplicate receipts', () => {
  const memory = new Map();
  const storage = { getItem: (key) => memory.get(key) || null, setItem: (key, value) => memory.set(key, value), removeItem: (key) => memory.delete(key) };
  const persistence = createEonExpanseW766APersistence({ storage, now: () => 5 });
  const state = createEonExpanseW766AInitialState({ now: 1 });
  const written = persistence.write({ ...state, processedReceipts: ['r1', 'r1'] });
  assert.equal(written.ok, true);
  assert.deepEqual(persistence.read().processedReceipts, ['r1']);
});

test('W766A persistence strips unknown and private fields while retaining canonical ledgers', () => {
  const memory = new Map();
  const storage = { getItem: (key) => memory.get(key) || null, setItem: (key, value) => memory.set(key, value), removeItem: (key) => memory.delete(key) };
  const persistence = createEonExpanseW766APersistence({ storage, now: () => 9 });
  const written = persistence.write({
    ...createEonExpanseW766AInitialState({ now: 1 }),
    privateProjectText: 'must never persist',
    currentZone: 'invented-private-zone',
    discovered: ['gateway-overlook', 'invented-private-zone'],
    missionLedger: {
      totalXp: 120,
      currentLevel: 2,
      activeMissionId: 'beyond-the-gate',
      completedMissions: [],
      processedReceipts: ['mission:r1'],
      worldMilestones: [],
      privatePrompt: 'secret mission text',
      missions: { 'beyond-the-gate': { status: 'active', currentObjective: 'meet-pathfinder', completedObjectives: ['review-expedition', 'enter-expanse'], privatePrompt: 'secret' } }
    },
    livingContent: {
      xp: 20,
      discoveries: ['overlook-panorama', 'invented-discovery'],
      completedSideMissions: [],
      completedProductiveMissions: [],
      processedReceipts: ['discovery:overlook-panorama'],
      privateProjectText: 'secret living content'
    }
  });
  assert.equal(written.ok, true);
  const raw = JSON.parse(memory.get(EON_EXPANSE_W766A_STORAGE_KEY));
  assert.equal('privateProjectText' in raw, false);
  assert.equal('privatePrompt' in raw.missionLedger, false);
  assert.equal('privatePrompt' in raw.missionLedger.missions['beyond-the-gate'], false);
  assert.equal('privateProjectText' in raw.livingContent, false);
  assert.equal(raw.currentZone, 'gateway-overlook');
  assert.deepEqual(raw.discovered, ['gateway-overlook']);
  assert.deepEqual(raw.livingContent.discoveries, ['overlook-panorama']);
});


test('W766IR2-G Expanse movement remains finite without inheriting the Command Hub hard radius', () => {
  const far = sanitizeEonExpanseW766APlayerPosition({ x: 176, y: 0.15, z: -192 }, { x: 0, y: 0.15, z: 16 });
  assert.deepEqual({ x: far.x, y: far.y, z: far.z }, { x: 176, y: 0.15, z: -192 });
  assert.equal(far.hardWorldClampApplied, false);
  const recovered = sanitizeEonExpanseW766APlayerPosition({ x: Number.NaN, y: 0.15, z: Number.POSITIVE_INFINITY }, { x: 12, y: 0.15, z: -24 });
  assert.deepEqual({ x: recovered.x, y: recovered.y, z: recovered.z }, { x: 12, y: 0.15, z: -24 });
  assert.equal(recovered.finiteFallbackUsed, true);
});

test('W767A persistence migrates an entered legacy campaign before objective sanitization', () => {
  const memory = new Map();
  const storage = { getItem: (key) => memory.get(key) || null, setItem: (key, value) => memory.set(key, value), removeItem: (key) => memory.delete(key) };
  const persistence = createEonExpanseW766APersistence({ storage, now: () => 12 });
  const written = persistence.write({
    ...createEonExpanseW766AInitialState({ now: 1 }),
    missionLedger: {
      schema: 'eon.city.expanse.missions.w766eg.v3',
      totalXp: 0,
      currentLevel: 1,
      activeMissionId: 'beyond-the-gate',
      completedMissions: [],
      missions: {
        'beyond-the-gate': {
          status: 'active',
          currentObjective: 'activate-map',
          completedObjectives: ['review-expedition', 'enter-expanse', 'meet-pathfinder']
        }
      }
    }
  });
  assert.equal(written.ok, true);
  const raw = JSON.parse(memory.get(EON_EXPANSE_W766A_STORAGE_KEY));
  assert.equal(raw.missionLedger.missions['companion-in-the-static'].status, 'completed');
  assert.equal(raw.missionLedger.completedMissions.includes('companion-in-the-static'), true);
  assert.deepEqual(raw.missionLedger.missions['beyond-the-gate'].completedObjectives, ['meet-pathfinder']);
  assert.equal(raw.missionLedger.activeMissionId, 'beyond-the-gate');
});

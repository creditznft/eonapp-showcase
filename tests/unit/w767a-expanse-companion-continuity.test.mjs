import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EON_EXPANSE_W767A_COMPANION_PHASES,
  deriveEonExpanseW767ACompanionState,
  validateEonExpanseW767ACompanionState
} from '../../assets/js/city/w766/eon-expanse-w767a-companion-continuity.js';

const ledger = (completedObjectives = [], status = 'active') => ({
  completedMissions: status === 'completed' ? ['companion-in-the-static'] : [],
  missions: { 'companion-in-the-static': { status, completedObjectives } }
});

test('companion continuity projects the rescue sequence without a second identity', () => {
  const detected = deriveEonExpanseW767ACompanionState({ missionLedger: ledger(['review-expedition', 'enter-expanse', 'detect-companion-signal']), worldMode: 'EXPANSE_ACTIVE' });
  assert.equal(detected.phase, EON_EXPANSE_W767A_COMPANION_PHASES.SIGNAL_DETECTED);
  assert.equal(detected.nextAction, 'scan-dormant-eonbot');
  assert.equal(detected.visible, true);
  assert.equal(detected.movementMode, 'dormant-rescue');
  assert.equal(validateEonExpanseW767ACompanionState(detected).ok, true);
});

test('bonded EONBOT follows in Expanse and remains in Transit formation', () => {
  const bonded = deriveEonExpanseW767ACompanionState({ missionLedger: ledger([], 'completed'), worldMode: 'EXPANSE_ACTIVE' });
  assert.equal(bonded.bonded, true);
  assert.equal(bonded.movementMode, 'formation-follow');
  const transit = deriveEonExpanseW767ACompanionState({ missionLedger: ledger([], 'completed'), worldMode: 'EXPANSE_ACTIVE', transitState: { status: 'active' } });
  assert.equal(transit.movementMode, 'transit-formation');
  assert.equal(transit.visible, true);
});

test('Hub continuity keeps the one canonical companion visible', () => {
  const state = deriveEonExpanseW767ACompanionState({ missionLedger: ledger([], 'completed'), worldMode: 'COMMAND_HUB' });
  assert.equal(state.visible, true);
  assert.equal(state.movementMode, 'hub-companion');
});

test('legacy review-only ledgers migrate into the rescue prologue without losing the reviewed step', async () => {
  const { createEonExpanseW766EMissionRuntime } = await import('../../assets/js/city/w766/eon-expanse-w766e-mission-runtime.js');
  const runtime = createEonExpanseW766EMissionRuntime({ initialState: {
    schema: 'eon.city.expanse.missions.w766eg.v3',
    totalXp: 0,
    currentLevel: 1,
    activeMissionId: 'beyond-the-gate',
    completedMissions: [],
    missions: {
      'beyond-the-gate': {
        status: 'active',
        currentObjective: 'enter-expanse',
        completedObjectives: ['review-expedition']
      }
    }
  } });
  const state = runtime.getState();
  assert.equal(state.activeMissionId, 'companion-in-the-static');
  assert.deepEqual(state.missions['companion-in-the-static'].completedObjectives, ['review-expedition']);
  assert.equal(state.missions['companion-in-the-static'].currentObjective, 'enter-expanse');
  assert.equal(state.missions['beyond-the-gate'].status, 'locked');
});

test('legacy entered campaigns restore companion continuity without resetting XP or Beyond progress', async () => {
  const { createEonExpanseW766EMissionRuntime } = await import('../../assets/js/city/w766/eon-expanse-w766e-mission-runtime.js');
  const runtime = createEonExpanseW766EMissionRuntime({ initialState: {
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
  } });
  const state = runtime.getState();
  assert.equal(state.completedMissions.includes('companion-in-the-static'), true);
  assert.equal(state.activeMissionId, 'beyond-the-gate');
  assert.deepEqual(state.missions['beyond-the-gate'].completedObjectives, ['meet-pathfinder']);
  assert.equal(state.missions['beyond-the-gate'].currentObjective, 'activate-map');
  assert.equal(state.totalXp, 0);
  assert.equal(state.worldMilestones.includes('migration:w767a:companion-restored'), true);
});

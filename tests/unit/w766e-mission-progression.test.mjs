import test from 'node:test';
import assert from 'node:assert/strict';
import { EON_EXPANSE_W766E_CAMPAIGN, createEonExpanseW766EInitialLedger, createEonExpanseW766EMissionRuntime } from '../../assets/js/city/w766/eon-expanse-w766e-mission-runtime.js';

function completeMission(runtime, missionId) {
  const definition = EON_EXPANSE_W766E_CAMPAIGN.find((entry) => entry.id === missionId);
  assert.equal(runtime.start(missionId, { explicitUserAction: true }).ok, true);
  for (const objective of definition.objectives) assert.equal(runtime.completeObjective(missionId, objective, { receiptId: `test:${missionId}:${objective}` }).ok, true);
}

test('Companion rescue and Beyond the Gate complete once, award XP once and unlock First Light', () => {
  const runtime = createEonExpanseW766EMissionRuntime({ now: () => 1000 });
  for (const signal of ['expanse-reviewed', 'expanse-entered', 'companion-signal-detected', 'dormant-eonbot-scanned', 'companion-signal-core-recovered', 'companion-link-restored', 'pathfinder-met', 'map-opened', 'zone:gateway-overlook']) assert.equal(runtime.recordSignal(signal).ok, true);
  const state = runtime.getState();
  assert.equal(state.missions['beyond-the-gate'].status, 'completed');
  assert.equal(state.missions['first-light'].status, 'available');
  assert.equal(state.totalXp, 220);
  assert.equal(state.currentLevel, 2);
  assert.equal(runtime.recordSignal('zone:gateway-overlook').reason, 'duplicate-receipt');
});

test('First Light cannot start early and requires every objective', () => {
  const runtime = createEonExpanseW766EMissionRuntime();
  assert.equal(runtime.start('first-light', { explicitUserAction: true }).reason, 'mission-locked');
  completeMission(runtime, 'companion-in-the-static');
  completeMission(runtime, 'beyond-the-gate');
  assert.equal(runtime.start('first-light', { explicitUserAction: true }).ok, true);
  for (const objective of EON_EXPANSE_W766E_CAMPAIGN.find((mission) => mission.id === 'first-light').objectives.slice(0, -1)) assert.equal(runtime.completeObjective('first-light', objective, { receiptId: `first:${objective}` }).ok, true);
  assert.equal(runtime.getState().missions['first-light'].status, 'active');
  const completed = runtime.completeObjective('first-light', 'reveal-beacon-fields', { receiptId: 'first:final' });
  assert.equal(completed.ok, true);
  assert.equal(completed.awardedXp, 220);
  assert.equal(runtime.getState().totalXp, 440);
  assert.equal(runtime.getState().currentLevel, 3);
  assert.equal(runtime.completeObjective('first-light', 'reveal-beacon-fields', { receiptId: 'first:final' }).reason, 'duplicate-receipt');
});

test('mission state survives reconstruction without duplicate XP', () => {
  const first = createEonExpanseW766EMissionRuntime({ initialState: createEonExpanseW766EInitialLedger() });
  completeMission(first, 'companion-in-the-static');
  completeMission(first, 'beyond-the-gate');
  const restored = createEonExpanseW766EMissionRuntime({ initialState: first.getState() });
  assert.equal(restored.recordSignal('zone:gateway-overlook').reason, 'mission-not-active');
  assert.equal(restored.getState().totalXp, 220);
  assert.equal(restored.getState().missions['first-light'].status, 'available');
});

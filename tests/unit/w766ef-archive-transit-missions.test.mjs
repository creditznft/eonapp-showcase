import test from 'node:test';
import assert from 'node:assert/strict';
import { EON_EXPANSE_W766E_CAMPAIGN, buildEonExpanseW766EMissionBoard, createEonExpanseW766EMissionRuntime } from '../../assets/js/city/w766/eon-expanse-w766e-mission-runtime.js';

function completeMission(runtime, missionId) {
  const definition = EON_EXPANSE_W766E_CAMPAIGN.find((entry) => entry.id === missionId);
  assert.equal(runtime.start(missionId, { explicitUserAction: true }).ok, true);
  for (const objective of definition.objectives) assert.equal(runtime.completeObjective(missionId, objective, { receiptId: `test:${missionId}:${objective}` }).ok, true);
}

test('campaign exposes seven ordered missions with the companion rescue first', () => {
  assert.deepEqual(EON_EXPANSE_W766E_CAMPAIGN.map(({ id }) => id), ['companion-in-the-static', 'beyond-the-gate', 'first-light', 'echoes-in-the-archive', 'the-broken-line', 'horizon-reconnected', 'the-first-reveal']);
});

test('archive and transit missions award canonical XP once', () => {
  const runtime = createEonExpanseW766EMissionRuntime({ now: () => 100 });
  completeMission(runtime, 'companion-in-the-static');
  completeMission(runtime, 'beyond-the-gate');
  completeMission(runtime, 'first-light');
  completeMission(runtime, 'echoes-in-the-archive');
  completeMission(runtime, 'the-broken-line');
  assert.equal(runtime.getState().totalXp, 1080);
  assert.equal(runtime.getState().currentLevel, 5);
  assert.equal(runtime.recordSignal('beacon-two-repaired').reason, 'mission-not-active');
  assert.equal(runtime.recordSignal('regional-transit-restored').reason, 'mission-not-active');
});

test('reconstructed ledger rejects duplicate archive and transit awards', () => {
  const first = createEonExpanseW766EMissionRuntime();
  for (const mission of EON_EXPANSE_W766E_CAMPAIGN.slice(0, 5)) completeMission(first, mission.id);
  const restored = createEonExpanseW766EMissionRuntime({ initialState: first.getState() });
  assert.equal(restored.recordSignal('beacon-two-repaired').reason, 'mission-not-active');
  assert.equal(restored.recordSignal('regional-transit-restored').reason, 'mission-not-active');
  assert.equal(restored.getState().totalXp, 1080);
});

test('mission board exposes only the current unlocked objective guidance', () => {
  const runtime = createEonExpanseW766EMissionRuntime();
  completeMission(runtime, 'companion-in-the-static');
  completeMission(runtime, 'beyond-the-gate');
  completeMission(runtime, 'first-light');
  assert.equal(runtime.start('echoes-in-the-archive', { explicitUserAction: true }).ok, true);
  assert.equal(runtime.completeObjective('echoes-in-the-archive', 'reach-archive-ruins', { receiptId: 'archive:reach' }).ok, true);
  const board = buildEonExpanseW766EMissionBoard(runtime.getState());
  assert.equal(board.activeMission.id, 'echoes-in-the-archive');
  assert.equal(board.activeMission.currentObjective, 'meet-navigator');
  assert.equal(board.activeMission.guidance.zoneId, 'archive-ruins');
  assert.equal(board.completion.total, 7);
  assert.equal(board.lockedMissions.some((mission) => mission.id === 'the-broken-line'), true);
});

import test from 'node:test';
import assert from 'node:assert/strict';

import { createEonCityRt91LiveContractDirector } from '../../assets/js/city/rt91/eon-city-rt91-live-contract-director.js';
import { createEonCityRt91RuntimeIntegration } from '../../assets/js/city/rt91/eon-city-rt91-runtime-integration.js';
import { EON_EXPANSE_W795A_STORM_MISSIONS, createEonExpanseW795AInitialStormMissionState } from '../../assets/js/city/w795/eon-expanse-w795a-storm-sector-mission-runtime.js';

function memoryStorage() {
  const map = new Map();
  return { getItem: (key) => map.has(key) ? map.get(key) : null, setItem: (key, value) => map.set(key, String(value)), removeItem: (key) => map.delete(key), dump: () => map };
}
function completeStormFoundation() {
  const base = createEonExpanseW795AInitialStormMissionState();
  const completedObjectiveActions = EON_EXPANSE_W795A_STORM_MISSIONS.flatMap((mission) => mission.objectives.map((objective) => objective.action));
  return { ...base, completedObjectiveActions, completedMissionIds: EON_EXPANSE_W795A_STORM_MISSIONS.map((mission) => mission.id), processedReceiptIds: completedObjectiveActions.map((action) => `receipt:${action}`), regionCompleted: true, updatedAt: 1 };
}
const completedSignal = { completedMissions: ['companion-in-the-static', 'beyond-the-gate', 'first-light', 'echoes-in-the-archive', 'the-broken-line', 'horizon-reconnected', 'the-first-reveal'] };
const unlockedFrontier = { unlocked: true, buildingChoices: { 'plot-central-command': 'command-core', 'plot-creator': 'creator-workshop', 'plot-knowledge': 'project-atlas', 'plot-systems': 'local-ai-observatory', 'plot-signal': 'broadcast-tower', 'plot-transit': 'regional-transit-station', 'plot-personal': 'eonbot-temple' } };
function makeRuntime(storage = memoryStorage()) {
  let tick = Date.UTC(2026, 7, 14, 8, 0, 0);
  return createEonCityRt91RuntimeIntegration({
    storage,
    now: () => ++tick,
    getWorldSeed: () => 'owner-world-91',
    getSignalState: () => completedSignal,
    getStormFoundationState: () => completeStormFoundation(),
    getMyFrontierState: () => unlockedFrontier
  });
}

test('RT91 live contract director exposes exactly one deterministic no-FOMO offer per flagship world', () => {
  const director = createEonCityRt91LiveContractDirector({ worldSeed: 'owner-world-91', now: () => Date.UTC(2026, 7, 14), getHistory: () => [] });
  const first = director.getOffers();
  const second = director.getOffers();
  assert.equal(first, second, 'unchanged cycle/history should reuse the bounded cached offer set');
  assert.equal(first.length, 3);
  assert.deepEqual(new Set(first.map((offer) => offer.worldId)), new Set(['signal-frontier', 'storm-sector', 'my-frontier']));
  for (const offer of first) {
    assert.equal(offer.ok, true);
    assert.equal(offer.placement.ok, true);
    assert.equal(offer.template.objectives.length, offer.placement.placements.length);
    assert.equal(offer.streakRequired || offer.penaltyForSkipping || offer.missingCycleLosesProgress || offer.awardsXp || offer.writesProgression || offer.runtimeAiRequired, false);
  }
});

test('RT91 live Mission Board surfaces three repeatable contracts without replacing authored story', () => {
  const runtime = makeRuntime();
  const board = runtime.getMissionBoard();
  assert.equal(board.sections.contracts.length, 3);
  assert.equal(board.sections.story.length > 0, true);
  assert.deepEqual(new Set(board.sections.contracts.map((row) => row.worldId)), new Set(['signal-frontier', 'storm-sector', 'my-frontier']));
  assert.equal(board.sections.contracts.every((row) => row.status === 'available' && row.grantsProgressionAutomatically === false), true);
});

test('RT91 repeatable contract uses the same explicit physical target path and records only bounded completion history', () => {
  const storage = memoryStorage();
  const runtime = makeRuntime(storage);
  const contract = runtime.getMissionBoard().sections.contracts.find((row) => row.worldId === 'signal-frontier');
  const started = runtime.startMission(contract.id, { explicitUserAction: true });
  assert.equal(started.ok, true);
  assert.equal(started.repeatableContract, true);
  runtime.setCurrentWorld('signal-frontier');
  let completed = null;
  for (let index = 0; index < 3; index += 1) {
    const target = runtime.getActiveTarget('signal-frontier');
    assert.equal(target.repeatableContract, true);
    completed = runtime.completeActiveObjective({ worldId: 'signal-frontier', playerPosition: target.position, explicitUserAction: true, expectedTargetId: target.targetId });
    assert.equal(completed.ok, true);
  }
  assert.equal(completed.contractComplete, true);
  const session = runtime.getSession();
  assert.equal(session.repeatableContract, null);
  assert.equal(session.livingFrontier.completedContractIds.includes(contract.id), true);
  assert.equal(session.livingFrontier.contractHistory.length, 1);
  assert.equal(session.livingFrontier.contractHistory[0].familyId.length > 0, true);
  assert.equal(session.privateContentStored || session.receiptPayloadStored || session.ownsXpAuthority || session.ownsUnlockAuthority, false);
});

test('RT91 active repeatable contract survives reload with the exact next physical target', () => {
  const storage = memoryStorage();
  const first = makeRuntime(storage);
  const contract = first.getMissionBoard().sections.contracts.find((row) => row.worldId === 'storm-sector');
  assert.equal(first.startMission(contract.id, { explicitUserAction: true }).ok, true);
  first.setCurrentWorld('storm-sector');
  const firstTarget = first.getActiveTarget('storm-sector');
  assert.equal(first.completeActiveObjective({ worldId: 'storm-sector', playerPosition: firstTarget.position, explicitUserAction: true, expectedTargetId: firstTarget.targetId }).ok, true);
  const expectedNext = first.getActiveTarget('storm-sector');
  const second = makeRuntime(storage);
  assert.equal(second.getSummary().sessionRestored, true);
  assert.equal(second.getSummary().repeatable.activeContract.id, contract.id);
  const restored = second.getActiveTarget('storm-sector');
  assert.equal(restored.targetId, expectedNext.targetId);
  assert.deepEqual(restored.position, expectedNext.position);
});

test('RT91 enforces one clear active flagship mission across authored and repeatable systems', () => {
  const runtime = makeRuntime();
  const contract = runtime.getMissionBoard().sections.contracts.find((row) => row.worldId === 'my-frontier');
  assert.equal(runtime.startMission(contract.id, { explicitUserAction: true }).ok, true);
  const blocked = runtime.startMission('gateway-frontier-bearings', { explicitUserAction: true });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'rt91-another-mission-active');
  const legacyView = runtime.getLegacyCompatibleMissionView({ missions: [], xp: 0, claimableCount: 0, claimedCount: 0, pendingReveals: 0 });
  const flagshipRows = legacyView.missions.filter((row) => row.rt91 === true);
  assert.equal(flagshipRows.length, 1);
  assert.equal(flagshipRows[0].id, contract.id);
  assert.equal(flagshipRows[0].state, 'in-progress');
});

test('RT91 next-action follows an active contract across Hub return instead of producing a blank state', () => {
  const runtime = makeRuntime();
  const contract = runtime.getMissionBoard().sections.contracts.find((row) => row.worldId === 'signal-frontier');
  runtime.startMission(contract.id, { explicitUserAction: true });
  runtime.setCurrentWorld('command-hub');
  const next = runtime.getNextAction('command-hub');
  assert.equal(next.blankState, false);
  assert.equal(next.action.id, contract.id);
  assert.equal(next.action.reason, 'active-repeatable-contract');
  assert.equal(next.action.worldId, 'signal-frontier');
});

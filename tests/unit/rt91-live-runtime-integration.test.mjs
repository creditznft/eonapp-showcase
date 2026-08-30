import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { createEonCityRt91RuntimeIntegration } from '../../assets/js/city/rt91/eon-city-rt91-runtime-integration.js';
import { buildEonCityRt91SignalMasteryTargets, validateEonCityRt91SignalMasteryTargets } from '../../assets/js/city/rt91/signal/eon-city-rt91-signal-mastery-targets.js';
import { EON_EXPANSE_W795A_STORM_MISSIONS, createEonExpanseW795AInitialStormMissionState } from '../../assets/js/city/w795/eon-expanse-w795a-storm-sector-mission-runtime.js';

function memoryStorage() {
  const map = new Map();
  return { getItem: (k) => map.has(k) ? map.get(k) : null, setItem: (k,v) => map.set(k,String(v)), removeItem: (k) => map.delete(k) };
}
function completeStormFoundation() {
  const base = createEonExpanseW795AInitialStormMissionState();
  const completedObjectiveActions = EON_EXPANSE_W795A_STORM_MISSIONS.flatMap((mission) => mission.objectives.map((objective) => objective.action));
  return { ...base, completedObjectiveActions, completedMissionIds: EON_EXPANSE_W795A_STORM_MISSIONS.map((mission) => mission.id), processedReceiptIds: completedObjectiveActions.map((action) => `receipt:${action}`), regionCompleted: true, updatedAt: 1 };
}

const completedSignal = { completedMissions: ['beyond-the-gate','first-light','echoes-in-the-archive','the-broken-line','horizon-reconnected','the-first-reveal'] };
const unlockedFrontier = { unlocked: true, buildingChoices: { 'plot-central-command': 'command-core', 'plot-creator': 'creator-workshop', 'plot-knowledge': 'project-atlas', 'plot-systems': 'local-ai-observatory', 'plot-signal': 'broadcast-tower', 'plot-transit': 'regional-transit-station', 'plot-personal': 'eonbot-temple' } };

function makeRuntime(options = {}) {
  let now = 1000;
  return createEonCityRt91RuntimeIntegration({
    storage: options.storage || memoryStorage(),
    now: () => ++now,
    getSignalState: () => completedSignal,
    getStormFoundationState: () => completeStormFoundation(),
    getMyFrontierState: () => unlockedFrontier,
    verifyProductiveReceipt: ({ receipt, requiredKind }) => receipt?.kind === requiredKind ? { ok: true, receipt } : { ok: false, reason: 'wrong-kind' }
  });
}

test('RT91 Signal mastery physical target authority covers all 40 objectives with no geometry owner', () => {
  const plan = buildEonCityRt91SignalMasteryTargets();
  const validation = validateEonCityRt91SignalMasteryTargets(plan);
  assert.equal(validation.ok, true, validation.errors.join(', '));
  assert.equal(plan.targetCount, 40);
  assert.equal(plan.ownsGeometry || plan.ownsMissionState, false);
});

test('RT91 live adapter restores local campaign state and owns no Babylon/progression authority', () => {
  const runtime = makeRuntime();
  const summary = runtime.getSummary();
  assert.equal(summary.schema, 'eon.city.runtime-integration.rt91.v1');
  assert.equal(summary.currentWorldId, 'command-hub');
  assert.equal(summary.ownsBabylonEngine || summary.ownsScene || summary.ownsRenderLoop || summary.ownsXpAuthority || summary.ownsUnlockAuthority || summary.networkRequestCreated, false);
});

test('RT91 live Mission Board exposes available Signal, Storm and My Frontier authored missions', () => {
  const runtime = makeRuntime();
  const board = runtime.getMissionBoard();
  const worlds = new Set(board.sections.story.filter((row) => row.status === 'available').map((row) => row.worldId));
  assert.equal(worlds.has('signal-frontier'), true);
  assert.equal(worlds.has('storm-sector'), true);
  assert.equal(worlds.has('my-frontier'), true);
});

test('RT91 live adapter starts a mission only from explicit user action and never auto-enters a world', () => {
  const runtime = makeRuntime();
  assert.equal(runtime.startMission('gateway-frontier-bearings').ok, false);
  const started = runtime.startMission('gateway-frontier-bearings', { explicitUserAction: true });
  assert.equal(started.ok, true);
  assert.equal(started.worldId, 'signal-frontier');
  assert.equal(started.startsWorldAutomatically, false);
});

test('RT91 physical objective completion requires current world, explicit action and real player range', () => {
  const runtime = makeRuntime();
  runtime.startMission('gateway-frontier-bearings', { explicitUserAction: true });
  const target = runtime.getActiveTarget('signal-frontier');
  assert.ok(target?.targetId);
  assert.equal(runtime.completeActiveObjective({ worldId: 'signal-frontier', playerPosition: target.position }).reason, 'explicit-user-action-required');
  runtime.setCurrentWorld('signal-frontier');
  assert.equal(runtime.completeActiveObjective({ worldId: 'signal-frontier', playerPosition: { x: target.position.x + 100, z: target.position.z + 100 }, explicitUserAction: true }).reason, 'rt91-objective-not-in-range');
  const completed = runtime.completeActiveObjective({ worldId: 'signal-frontier', playerPosition: target.position, explicitUserAction: true, expectedTargetId: target.targetId });
  assert.equal(completed.ok, true);
  assert.equal(completed.objectiveId, target.objectiveId);
  assert.equal(completed.awardsXp, false);
});

test('RT91 productive My Frontier objective refuses physical-only completion without reviewed productive receipt', () => {
  const runtime = makeRuntime();
  runtime.setCurrentWorld('my-frontier');
  assert.equal(runtime.startMission('my-frontier-central-mission-1', { explicitUserAction: true }).ok, true);
  for (let i = 0; i < 3; i++) {
    const target = runtime.getActiveTarget('my-frontier');
    assert.ok(target);
    const result = runtime.completeActiveObjective({ worldId: 'my-frontier', playerPosition: target.position, explicitUserAction: true, expectedTargetId: target.targetId });
    assert.equal(result.ok, true);
  }
  assert.equal(runtime.startMission('my-frontier-central-mission-2', { explicitUserAction: true }).ok, true);
  for (let i = 0; i < 3; i++) {
    const target = runtime.getActiveTarget('my-frontier');
    const result = runtime.completeActiveObjective({ worldId: 'my-frontier', playerPosition: target.position, explicitUserAction: true, expectedTargetId: target.targetId });
    assert.equal(result.ok, true);
  }
  assert.equal(runtime.startMission('my-frontier-central-mission-3', { explicitUserAction: true }).ok, true);
  let target = runtime.getActiveTarget('my-frontier');
  assert.equal(runtime.completeActiveObjective({ worldId: 'my-frontier', playerPosition: target.position, explicitUserAction: true, expectedTargetId: target.targetId }).ok, true);
  target = runtime.getActiveTarget('my-frontier');
  assert.equal(target.requiredProductiveReceiptKind, 'command-status-reviewed');
  const blocked = runtime.completeActiveObjective({ worldId: 'my-frontier', playerPosition: target.position, explicitUserAction: true, expectedTargetId: target.targetId });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'wrong-kind');
  const accepted = runtime.completeActiveObjective({ worldId: 'my-frontier', playerPosition: target.position, explicitUserAction: true, expectedTargetId: target.targetId, productiveReceipt: { id: 'reviewed:command-status', kind: 'command-status-reviewed' } });
  assert.equal(accepted.ok, true);
});

test('RT91 live adapter persists campaign progress and current world in the RT91-only session key', () => {
  const storage = memoryStorage();
  const first = makeRuntime({ storage });
  first.startMission('gateway-frontier-bearings', { explicitUserAction: true });
  first.setCurrentWorld('signal-frontier');
  const target = first.getActiveTarget('signal-frontier');
  first.completeActiveObjective({ worldId: 'signal-frontier', playerPosition: target.position, explicitUserAction: true, expectedTargetId: target.targetId });
  const second = makeRuntime({ storage });
  assert.equal(second.getSummary().sessionRestored, true);
  assert.equal(second.getSummary().currentWorldId, 'signal-frontier');
  assert.equal(second.getActiveTarget('signal-frontier').objectiveId !== target.objectiveId, true);
});

test('RT91 legacy-compatible mission projection adds flagship rows without changing legacy claim authority', () => {
  const runtime = makeRuntime();
  const legacy = { xp: 80, claimedCount: 2, claimableCount: 1, pendingReveals: 0, missions: [{ id: 'legacy-one', title: 'Legacy', stationId: 'command-console', claimable: true }] };
  const view = runtime.getLegacyCompatibleMissionView(legacy);
  assert.equal(view.missions[0].id, 'legacy-one');
  assert.equal(view.missions.some((row) => row.rt91 === true && row.rt91WorldId === 'signal-frontier'), true);
  assert.equal(view.claimableCount, 1);
  assert.equal(view.rt91Board.awardsXp, false);
});

test('RT91 live adapter source owns no engine/scene/render loop/fetch or legacy write path', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/rt91/eon-city-rt91-runtime-integration.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)\s*\(/);
  assert.doesNotMatch(source, /runRenderLoop\s*\(/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /awardXp\s*\(/);
  assert.doesNotMatch(source, /expansePersistence\.write/);
});

test('W731 maintained runtime mounts RT91 exactly once and projects flagship rows through the existing Mission Board', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  assert.match(source, /import \{ createEonCityRt91RuntimeIntegration \} from '\.\.\/rt91\/eon-city-rt91-runtime-integration\.js';/);
  assert.equal((source.match(/createEonCityRt91RuntimeIntegration\s*\(/g) || []).length, 1);
  assert.match(source, /getMissionView:\s*\(\)\s*=>\s*rt91Integration\.getLegacyCompatibleMissionView\(missionsProgression\.getView\?\.\(\)\s*\|\|\s*\{\}\)/);
  assert.match(source, /record\.rt91\s*===\s*true[\s\S]{0,120}onGuideFlagshipMission/);
  assert.match(source, /rt91MissionBoard:\s*rt91Integration\.getMissionBoard\(\)/);
});

test('W731 RT91 physical completion is bound to the maintained player anchor and canonical Use dispatch', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  assert.match(source, /rt91Integration\.completeActiveObjective\(\{\s*worldId:\s*expanseActiveRegionId,\s*playerPosition:\s*playerAnchor\.position,\s*explicitUserAction:\s*true/);
  assert.match(source, /completeRt91ActiveObjective\(\{\s*explicitUserAction[\s\S]{0,280}playerPosition:\s*playerAnchor\.position/);
  assert.doesNotMatch(source, /completeRt91ActiveObjective\([^)]*playerPosition/);
  assert.match(source, /rt91InteractionTarget\.targetId/);
  assert.match(source, /KeyE/);
});

test('W731 keeps one render-loop owner while allowing the existing marker presenter to show RT91 targets', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  assert.equal((source.match(/engine\.runRenderLoop\s*\(/g) || []).length, 1);
  assert.match(source, /expanseObjectiveMarker\.update\(rt91Guidance\?\.rt91\s*===\s*true\s*\?\s*rt91Guidance\s*:\s*null/);
  assert.doesNotMatch(source, /rt91Integration[\s\S]{0,120}runRenderLoop/);
});

test('W731 synchronizes RT91 current-world state only at maintained world transition boundaries', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  for (const marker of [
    "setCurrentWorld('signal-frontier', { reason: 'direct-signal-entry' })",
    "setCurrentWorld('storm-sector', { reason: 'storm-sector-transition-complete' })",
    "setCurrentWorld('my-frontier', { reason: 'direct-my-frontier-entry' })",
    "setCurrentWorld('command-hub', { reason: 'return-to-command-hub' })"
  ]) assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

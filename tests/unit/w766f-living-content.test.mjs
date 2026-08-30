import assert from 'node:assert/strict';
import { createEonExpanseW766FLivingContent } from '../../assets/js/city/w766/eon-expanse-w766f-living-content.js';
import { EON_CITY_PRODUCTIVE_RPG_SCHEMA } from '../../assets/js/contracts/city/eon-city-productive-rpg-loop.js';
import { deriveEonExpanseW767WProductiveReceipt, validateEonExpanseW767WProductiveReceipt } from '../../assets/js/city/w766/eon-expanse-w767w-productive-receipt-bridge.js';

const nativePlan = {
  schema: EON_CITY_PRODUCTIVE_RPG_SCHEMA,
  missions: [{ id: 'creator', state: 'completed', outcome: { kind: 'creator-guide-artifact', route: '/create', source: 'create-local-guide', receiptId: 'create-1', verifiedAt: 767001, verified: true } }]
};
const canonicalProductiveReceipt = deriveEonExpanseW767WProductiveReceipt(nativePlan, 'create-expedition');
const canonicalAwards = [];
const runtime = createEonExpanseW766FLivingContent({
  worldSeed: 42,
  now: () => Date.UTC(2026, 7, 2, 2, 0, 0),
  onAwardXp: ({ sourceId, amount, receiptId }) => {
    canonicalAwards.push({ sourceId, amount, receiptId });
    return { ok: true, totalXp: canonicalAwards.reduce((sum, award) => sum + award.amount, 0), level: 2 };
  },
  verifyWorkspaceReceipt: ({ missionId, workspaceReceipt }) => validateEonExpanseW767WProductiveReceipt({ missionId, workspaceReceipt, nativePlan })
});

assert.equal(runtime.completeSideMission('lost-worker').reason, 'explicit-user-action-required');
assert.equal(runtime.completeSideMission('lost-worker', { explicitUserAction: true, receiptId: 'side:lost-worker:1' }).reason, 'valid-completion-proof-required');
const side = runtime.completeSideMission('lost-worker', { explicitUserAction: true, receiptId: 'side:lost-worker:1', completionProof: { workerLocated: true, routeTerminalActivated: true } });
assert.equal(side.ok, true); assert.equal(side.awardedXp, 110); assert.equal(side.canonicalLedger, true);
assert.equal(runtime.completeSideMission('lost-worker', { explicitUserAction: true, receiptId: 'side:lost-worker:2', completionProof: { workerLocated: true, routeTerminalActivated: true } }).reason, 'mission-already-completed');

assert.equal(runtime.completeProductiveMission('create-expedition', { explicitUserAction: true, workspaceReceipt: { id: 'bad', workspaceId: 'library', status: 'completed' } }).reason, 'native-workspace-receipt-mismatch');
const productive = runtime.completeProductiveMission('create-expedition', { explicitUserAction: true, workspaceReceipt: canonicalProductiveReceipt });
assert.equal(productive.ok, true); assert.equal(productive.awardedXp, 60);
const discovery = runtime.recordDiscovery('beacon-echo'); assert.equal(discovery.ok, true); assert.equal(runtime.recordDiscovery('beacon-echo').reason, 'discovery-already-recorded');
const eventA = runtime.resolveEvent({ at: 1_800_000, windowMinutes: 30 }); const eventB = runtime.resolveEvent({ at: 1_800_001, windowMinutes: 30 }); assert.deepEqual(eventA, eventB); assert.equal(eventA.blocksHubReturn, false);
assert.equal(runtime.completeDailySignal({ dayKey: '2026-08-02' }).reason, 'explicit-user-action-required');
assert.equal(runtime.completeDailySignal({ dayKey: '2026-08-02', explicitUserAction: true }).reason, 'daily-signal-authority-unavailable');

const physical = createEonExpanseW766FLivingContent({
  worldSeed: 7,
  now: () => Date.UTC(2026, 7, 2, 8, 0, 0),
  onAwardXp: ({ amount }) => ({ ok: true, totalXp: amount, level: 1 })
});
assert.equal(physical.recordWorldInteraction('signal-fragment-collected', { itemId: 'a' }).reason, 'explicit-user-action-required');
assert.equal(physical.recordWorldInteraction('signal-fragment-collected', { itemId: 'a' }, { explicitUserAction: true }).thresholdReached, false);
assert.equal(physical.recordWorldInteraction('signal-fragment-collected', { itemId: 'b' }, { explicitUserAction: true }).thresholdReached, false);
const salvage = physical.recordWorldInteraction('signal-fragment-collected', { itemId: 'c' }, { explicitUserAction: true });
assert.equal(salvage.completion.ok, true); assert.equal(salvage.completion.awardedXp, 80);
assert.equal(physical.recordWorldInteraction('signal-fragment-collected', { itemId: 'c' }, { explicitUserAction: true }).reason, 'interaction-already-recorded');
const nextCycle = physical.recordWorldInteraction('signal-fragment-collected', { itemId: 'a', cycleKey: '2026-08-03' }, { explicitUserAction: true });
assert.equal(nextCycle.ok, true); assert.equal(nextCycle.activityProgress.cycleKey, '2026-08-03');
const workerA = physical.recordWorldInteraction('lost-worker-located', { itemId: 'lost-worker' }, { explicitUserAction: true });
assert.equal(workerA.thresholdReached, false);
const workerB = physical.recordWorldInteraction('lost-worker-terminal-activated', { itemId: 'terminal' }, { explicitUserAction: true });
assert.equal(workerB.completion.ok, true); assert.equal(workerB.completion.awardedXp, 110);
const calibration = physical.recordWorldInteraction('transit-calibration-completed', { journeyReceipt: { id: 'journey-1', status: 'completed' } }, { explicitUserAction: true });
assert.equal(calibration.completion.ok, true); assert.equal(calibration.completion.awardedXp, 100);
assert.equal(physical.getSummary().sideCompletionCounts['signal-salvage'], 1);

assert.equal(canonicalAwards.length, 3);
console.log('w766f living content tests passed');

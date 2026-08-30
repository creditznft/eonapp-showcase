import assert from 'node:assert/strict'; import test from 'node:test';
import { buildEonCityAgentSignalSnapshot, getEonCityAgentSignalTruth } from '../../assets/js/city/eon-city-agent-signal.js';
import { createEonbotJobFabric } from '../../assets/js/chat/eonbot-job-fabric.js';
import { inspectW439AgentSignal } from '../../scripts/w439-agent-signal-gate.mjs';
function memoryStorage() { const data = new Map(); return { getItem: (key) => data.has(key) ? data.get(key) : null, setItem: (key, value) => data.set(key, String(value)), removeItem: (key) => data.delete(key), get length() { return data.size; }, key: (index) => [...data.keys()][index] || null }; }
const NOW = Date.parse('2026-06-29T12:00:00.000Z'); const HASH_A = 'sha256:abcdefghi_123456789012345678901234567890'; const HASH_B = 'sha256:zyxwvutsr_098765432109876543210987654321';
function fabric() { return createEonbotJobFabric({ storage: memoryStorage(), now: () => NOW }); }
test('W439 maps only W435 lifecycle receipts to sanitized City signals', () => {
  const instance = fabric(); const created = instance.createAnswer({ intentText: 'Build a private client campaign', safeLabel: 'Campaign plan' }, { explicitUserAction: true }); const id = created.job.jobId;
  instance.createDraftFromAnswer(id, { explicitUserAction: true }); let signals = buildEonCityAgentSignalSnapshot(instance.getSnapshot()); assert.equal(signals.visibleSignals[0].state, 'planning'); assert.equal(JSON.stringify(signals).includes('Build a private client campaign'), false);
  instance.markReadyForReview(id, { explicitUserAction: true, localDraftHash: HASH_A }); instance.requestApproval(id, { explicitUserAction: true, explicitUserApproval: true }); signals = buildEonCityAgentSignalSnapshot(instance.getSnapshot());
  assert.equal(signals.visibleSignals[0].state, 'needs-approval'); assert.equal(signals.visibleSignals[0].rawPromptVisible, false); assert.equal(signals.visibleSignals[0].presenceEntry.source, 'agent-executor');
});
test('W439 completed signal requires a local result receipt and never begins an external effect', () => {
  const instance = fabric(); const created = instance.createAnswer({ intentText: 'Research a route', safeLabel: 'Route research' }, { explicitUserAction: true }); const id = created.job.jobId;
  instance.createDraftFromAnswer(id, { explicitUserAction: true }); instance.markReadyForReview(id, { explicitUserAction: true, localDraftHash: HASH_A }); instance.requestApproval(id, { explicitUserAction: true, explicitUserApproval: true }); instance.completeLocalReview(id, { explicitUserAction: true, localResultReceiptHash: HASH_B });
  const signals = buildEonCityAgentSignalSnapshot(instance.getSnapshot()); assert.equal(signals.visibleSignals[0].state, 'completed'); assert.equal(signals.outcome.visible, true); assert.equal(signals.externalEffect, false); assert.equal(signals.writesAgentPresenceStore, false);
});
test('W439 gate and truth reject live-agent claims', () => { const gate = inspectW439AgentSignal(); const truth = getEonCityAgentSignalTruth(); assert.equal(gate.status, 'pass'); assert.ok(gate.checkCount >= 7); assert.equal(truth.providerExecutionStarted, false); assert.equal(truth.externalActionStarted, false); assert.equal(truth.npcAutonomyClaimed, false); });

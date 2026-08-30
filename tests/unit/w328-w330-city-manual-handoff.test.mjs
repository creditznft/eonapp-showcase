import assert from 'node:assert/strict';
import test from 'node:test';
import { getAgentPresenceOutcome } from '../../assets/js/operator/agent-presence.js';
import { recordEonKernelCityMirror } from '../../assets/js/ai-kernel/eon-city-event-bridge.js';
import { getCreatorSuite2SessionTruth } from '../../assets/js/creator-suite-2/creator-suite-2-workspace.js';
import { runW328W330CityManualHandoffGate } from '../../scripts/w328-w330-city-manual-handoff-gate.mjs';

function memoryStorage() {
  const map = new Map();
  return { getItem: (key) => map.has(key) ? map.get(key) : null, setItem: (key, value) => map.set(key, String(value)), removeItem: (key) => map.delete(key) };
}

test('W328 records an EON AI Kernel lifecycle cue without a prompt, output, model, or provider account', () => {
  const result = recordEonKernelCityMirror({ task: { taskId: 'eontask_abcdefghijklmnop', state: 'completed', createdAt: '2026-06-26T00:00:00.000Z', updatedAt: '2026-06-26T00:00:01.000Z' }, role: 'writer' }, { storage: memoryStorage() });
  assert.equal(result.ok, true);
  assert.equal(result.entry.source, 'eon-ai-kernel');
  assert.equal(result.entry.status, 'complete');
  for (const key of ['prompt', 'output', 'model', 'providerAccount', 'token', 'credential']) assert.equal(key in result.entry, false);
});

test('W329 routes a completed kernel result to Workspace review, not a City-side action', () => {
  const outcome = getAgentPresenceOutcome({ latest: { source: 'eon-ai-kernel', status: 'complete' } });
  assert.equal(outcome.visible, true);
  assert.equal(outcome.route, '/workspace#eon-kernel-review-inbox-title');
  assert.equal(outcome.nativeSurface, 'Workspace');
  assert.equal('prompt' in outcome, false);
  assert.equal('actionPacket' in outcome, false);
});

test('W330 keeps export and submission under a user action', () => {
  const truth = getCreatorSuite2SessionTruth();
  assert.equal(truth.currentPageMemory, true);
  assert.equal(truth.exportRequiresUserAction, true);
  assert.equal(truth.providerCall, false);
  assert.equal(truth.externalEffect, false);
});

test('W328–W330 source gate passes', () => {
  const report = runW328W330CityManualHandoffGate();
  assert.equal(report.ok, true, report.errors.join('\n'));
});

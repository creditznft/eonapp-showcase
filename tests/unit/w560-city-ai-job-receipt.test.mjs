import assert from 'node:assert/strict';
import test from 'node:test';
import { createEonbotJobFabric } from '../../assets/js/chat/eonbot-job-fabric.js';
import { createEonCityAiJobReceiptBridge, getEonCityAiJobReceiptTruth, projectEonCityAiJobReceipt } from '../../assets/js/city/eon-city-ai-job-receipt.js';
import { inspectW560CityAiJobReceipt } from '../../scripts/w560-city-ai-job-receipt-gate.mjs';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem(key) { return data.has(String(key)) ? data.get(String(key)) : null; },
    setItem(key, value) { data.set(String(key), String(value)); },
    removeItem(key) { data.delete(String(key)); },
    get length() { return data.size; },
    key(index) { return [...data.keys()][index] || null; }
  };
}

const NOW = Date.parse('2026-07-03T10:00:00.000Z');
function makeFabric(storage = memoryStorage()) { let tick = NOW; return createEonbotJobFabric({ storage, now: () => ++tick }); }

test('W560 projects only a current verified local receipt into a redacted City status card', () => {
  const fabric = makeFabric();
  const created = fabric.createAnswer({
    intentText: 'Prepare the private Atlas Studio client prompt and output bundle',
    safeLabel: 'Atlas Studio review'
  }, { explicitUserAction: true });
  const projected = projectEonCityAiJobReceipt(created.receipt);
  assert.equal(projected?.state, 'recorded');
  assert.equal(projected?.currentReceiptOnly, true);
  assert.equal(projected?.routeAvailable, false);
  assert.equal(projected?.jobReferenceVisible, false);
  assert.equal(projected?.rawPromptVisible, false);
  assert.equal(projected?.rawOutputVisible, false);
  assert.equal(JSON.stringify(projected).includes('Atlas Studio'), false);
  assert.equal(JSON.stringify(projected).includes('private Atlas'), false);
  assert.equal(JSON.stringify(projected).includes(created.receipt.eventId), false);
  assert.equal(projectEonCityAiJobReceipt({ ...created.receipt, localOnly: false }), null);
  assert.equal(projectEonCityAiJobReceipt({ ...created.receipt, rawContentStored: true }), null);
});

test('W560 bridge starts empty, accepts only current receipt callbacks, and never persists or replays history', () => {
  const fabric = makeFabric();
  const existing = fabric.createAnswer({ intentText: 'Old private item', safeLabel: 'Old item' }, { explicitUserAction: true }).receipt;
  let listener = null;
  let unsubscribed = false;
  const bridge = createEonCityAiJobReceiptBridge({
    subscribeReceipts(callback) { listener = callback; return () => { unsubscribed = true; listener = null; }; }
  });
  assert.equal(bridge.getSnapshot().currentReceipt, null, 'stored/pre-existing work must not seed City');
  assert.equal(bridge.start().ok, true);
  assert.equal(bridge.getSnapshot().currentReceipt, null);
  assert.equal(bridge.recordCurrentReceipt(existing).error, 'current-local-receipt-required');
  listener(existing);
  const snapshot = bridge.getSnapshot();
  assert.equal(snapshot.visibleCount, 1);
  assert.equal(snapshot.forwardedCurrentReceiptCount, 1);
  assert.equal(snapshot.persistedHistoryScanned, false);
  assert.equal(snapshot.browserStorageWritten, false);
  assert.equal(snapshot.currentReceipt?.title, 'Local EONBOT work recorded');
  listener(existing);
  assert.equal(bridge.getSnapshot().forwardedCurrentReceiptCount, 1, 'same current receipt must dedupe');
  bridge.stop();
  assert.equal(unsubscribed, true);
  assert.equal(bridge.getSnapshot().currentReceipt, null, 'City teardown clears ephemeral receipt state');
});

test('W560 source gate and truth remain fail-closed about routing, storage, provider execution, and private content', () => {
  const gate = inspectW560CityAiJobReceipt();
  const truth = getEonCityAiJobReceiptTruth();
  assert.equal(gate.status, 'pass');
  assert.ok(gate.checkCount >= 20);
  assert.equal(truth.currentReceiptOnly, true);
  assert.equal(truth.persistedHistoryScanned, false);
  assert.equal(truth.browserStorageWritten, false);
  assert.equal(truth.networkRequestCreated, false);
  assert.equal(truth.providerRequestCreated, false);
  assert.equal(truth.backgroundWorkStarted, false);
  assert.equal(truth.jobReferenceVisible, false);
  assert.equal(truth.promptVisible, false);
  assert.equal(truth.outputVisible, false);
  assert.equal(truth.liveProviderProof, false);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { createEonbotJobFabric, subscribeEonbotJobFabricReceipts } from '../../assets/js/chat/eonbot-job-fabric.js';
import { createEonNotificationCenter } from '../../assets/js/notifications/eon-notification-center.js';
import { createEonbotJobActivityBridge, getEonbotJobActivityBridgeTruth, getEonbotJobActivityMapping, recordEonbotJobReceiptActivity } from '../../assets/js/notifications/eonbot-job-activity-bridge.js';
import { inspectW460EonbotJobActivityBridge } from '../../scripts/w460-eonbot-job-activity-bridge-gate.mjs';

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

const NOW = Date.parse('2026-07-01T00:00:00.000Z');

function makeFabric(storage = memoryStorage()) {
  let tick = NOW;
  return createEonbotJobFabric({ storage, now: () => ++tick });
}

test('W460.1 forwards only a current W435 local receipt and never seeds stored history as new activity', () => {
  const jobFabric = makeFabric();
  const localReceipt = jobFabric.createAnswer({
    intentText: 'Prepare a private confidential internal product plan',
    safeLabel: 'Approved launch outline'
  }, { explicitUserAction: true }).receipt;
  assert.equal(localReceipt.schema, 'eonapp.eonbot-job-event.w435.v1');

  const center = createEonNotificationCenter({ storage: memoryStorage(), now: () => NOW });
  let listener = null;
  let subscriptionCount = 0;
  const bridge = createEonbotJobActivityBridge({
    subscribeReceipts(callback) { subscriptionCount += 1; listener = callback; return () => { listener = null; }; },
    recordActivity: center.recordActivity
  });

  assert.equal(bridge.getSnapshot().forwardedCurrentReceiptCount, 0);
  const started = bridge.start();
  assert.equal(started.ok, true);
  assert.equal(subscriptionCount, 1);
  assert.equal(center.getSnapshot().items.length, 0, 'startup must not replay saved job history');

  listener(localReceipt);
  const first = center.getSnapshot();
  assert.equal(first.items.length, 1);
  assert.equal(first.items[0].eventId, `eonbot-job:${localReceipt.eventId}`);
  assert.equal(first.items[0].title, 'EONBOT local work recorded');
  assert.equal(first.items[0].body.includes('private confidential internal product plan'), false);
  assert.equal(first.items[0].body.includes('Approved launch outline'), true);
  assert.equal(bridge.getSnapshot().forwardedCurrentReceiptCount, 1);

  listener(localReceipt);
  assert.equal(center.getSnapshot().items.length, 1, 'Activity Center event id deduplicates the same current receipt');
  assert.equal(bridge.getSnapshot().forwardedCurrentReceiptCount, 1);
  bridge.stop();
});

test('W460.1 accepts only a sanitized current local receipt and produces no external-action claim', () => {
  const jobFabric = makeFabric();
  const localReceipt = jobFabric.createAnswer({ intentText: 'Write a local outline', safeLabel: 'Local outline' }, { explicitUserAction: true }).receipt;
  const center = createEonNotificationCenter({ storage: memoryStorage(), now: () => NOW });

  assert.equal(recordEonbotJobReceiptActivity(localReceipt, { recordActivity: center.recordActivity }).error, 'current-local-receipt-required');
  const invalid = recordEonbotJobReceiptActivity({ ...localReceipt, localOnly: false }, { explicitCurrentReceipt: true, recordActivity: center.recordActivity });
  assert.equal(invalid.error, 'verified-local-job-receipt-required');
  assert.equal(center.getSnapshot().items.length, 0);

  const recorded = recordEonbotJobReceiptActivity(localReceipt, { explicitCurrentReceipt: true, recordActivity: center.recordActivity });
  assert.equal(recorded.ok, true);
  assert.equal(recorded.localOnly, true);
  assert.equal(recorded.networkRequestCreated, false);
  assert.equal(recorded.browserPermissionRequested, false);
  assert.equal(recorded.externalActionStarted, false);
  assert.equal(recorded.backgroundWorkStarted, false);
  assert.equal(getEonbotJobActivityMapping(localReceipt)?.rawContentIncluded, false);
});

test('W460.1 fabric receipt stream emits only a receipt from the current mutation', () => {
  const original = {
    addEventListener: globalThis.addEventListener,
    removeEventListener: globalThis.removeEventListener,
    dispatchEvent: globalThis.dispatchEvent,
    CustomEvent: globalThis.CustomEvent
  };
  const listeners = new Map();
  class TestCustomEvent {
    constructor(type, options = {}) { this.type = type; this.detail = options.detail; }
  }
  globalThis.addEventListener = (type, listener) => {
    const bucket = listeners.get(type) || new Set();
    bucket.add(listener);
    listeners.set(type, bucket);
  };
  globalThis.removeEventListener = (type, listener) => listeners.get(type)?.delete(listener);
  globalThis.dispatchEvent = (event) => {
    for (const listener of [...(listeners.get(event.type) || [])]) listener(event);
    return true;
  };
  globalThis.CustomEvent = TestCustomEvent;
  try {
    const jobFabric = makeFabric();
    const observed = [];
    const stop = subscribeEonbotJobFabricReceipts((receipt) => observed.push(receipt));
    const created = jobFabric.createAnswer({ intentText: 'Build a local checklist', safeLabel: 'Local checklist' }, { explicitUserAction: true });
    stop();
    assert.equal(created.ok, true);
    assert.equal(observed.length, 1);
    assert.equal(observed[0].eventId, created.receipt.eventId);
    assert.equal(observed[0].safeLabel, 'Local checklist');
  } finally {
    globalThis.addEventListener = original.addEventListener;
    globalThis.removeEventListener = original.removeEventListener;
    globalThis.dispatchEvent = original.dispatchEvent;
    globalThis.CustomEvent = original.CustomEvent;
  }
});

test('W460.1 contract, deterministic gate and truth remain fail-closed', () => {
  const gate = inspectW460EonbotJobActivityBridge();
  const truth = getEonbotJobActivityBridgeTruth();
  assert.equal(gate.status, 'pass');
  assert.ok(gate.checkCount >= 9);
  assert.equal(truth.currentReceiptOnly, true);
  assert.equal(truth.persistedHistoryScanned, false);
  assert.equal(truth.historicalReplay, false);
  assert.equal(truth.networkRequestCreated, false);
  assert.equal(truth.pushSubscriptionCreated, false);
  assert.equal(truth.externalActionStarted, false);
  assert.equal(truth.fabricatedCompletion, false);
  assert.equal(truth.liveDeliveryProof, false);
});

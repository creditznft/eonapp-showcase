import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  EON_CITY_W659G_REVEAL_THRESHOLD,
  openEonCityW659gVaultReveal,
  readEonCityW659gProgression,
  recordEonCityW659gVerifiedAction,
  selectEonCityW659gCosmetic,
  validateEonCityW659gProgressionState
} from '../../assets/js/contracts/city/w659g/eon-city-w659g-progression-ledger.js';
import { validateEonCityW659gFunctionalStations, getEonCityW659gActionsForDistrict } from '../../assets/js/city/w659g/eon-city-w659g-functional-station-registry.js';
import { validateEonCityW659gNpcOperators, getEonCityW659gNpcActionsForDistrict } from '../../assets/js/city/w659g/eon-city-w659g-npc-operator-registry.js';
import { getEonCityW659gCaptureCapability } from '../../assets/js/contracts/city/w659g/eon-city-w659g-creator-capture.js';
import { createEonCityW659gCheckout } from '../../assets/js/contracts/city/w659g/eon-city-w659g-membership-console.js';
import { getEonLiveVoiceCapability } from '../../assets/js/chat/eon-live-voice-realtime.js';
import { normalizeCheckoutRequest } from '../../assets/js/billing/eon-dodo-live-runtime.js';

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

const root = path.resolve(import.meta.dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W659G verified actions award local XP and deterministic Vault Reveals without EONKEY grants', () => {
  const storage = new MemoryStorage();
  const events = [
    ['city.orientation.completed', 'orientation:1', 1_000],
    ['city.real-work-receipt', 'work:1', 2_000],
    ['eonbot.real-reply', 'reply:1', 3_000],
    ['eonbot.real-reply', 'reply:2', 4_000]
  ];
  for (const [type, receiptId, now] of events) {
    const result = recordEonCityW659gVerifiedAction({ type, receiptId, verified: true, source: 'test' }, { storage, now });
    assert.equal(result.ok, true);
  }
  const before = readEonCityW659gProgression({ storage, now: 5_000 });
  assert.equal(before.pendingReveals, 1);
  assert.equal(before.revealProgress, 0);
  assert.equal(EON_CITY_W659G_REVEAL_THRESHOLD, 100);
  assert.equal(JSON.stringify(before).toLowerCase().includes('eonkey'), false);
  const duplicate = recordEonCityW659gVerifiedAction({ type: 'eonbot.real-reply', receiptId: 'reply:2', verified: true }, { storage, now: 6_000 });
  assert.equal(duplicate.reason, 'already-recorded');
  assert.deepEqual(duplicate.awarded, { xp: 0, reveal: 0 });
  const reveal = openEonCityW659gVaultReveal({ explicitUserAction: true }, { storage, now: 7_000 });
  assert.equal(reveal.ok, true);
  assert.equal(reveal.outcome.rewardId, 'signal-mist');
  assert.equal(reveal.outcome.duplicateProtected, true);
  const selected = selectEonCityW659gCosmetic('signal-mist', { explicitUserAction: true }, { storage, now: 8_000 });
  assert.equal(selected.ok, true);
  assert.equal(selected.state.selectedCosmetics.eonbotSkin, 'signal-mist');
  assert.equal(validateEonCityW659gProgressionState(selected.state).ok, true);
});

test('W659G refuses unverified reward claims and enforces daily caps', () => {
  const storage = new MemoryStorage();
  assert.equal(recordEonCityW659gVerifiedAction({ type: 'city.capture.saved-local', receiptId: 'clip:1', verified: false }, { storage, now: 1_000 }).reason, 'verified-receipt-required');
  assert.equal(openEonCityW659gVaultReveal({ explicitUserAction: false }, { storage, now: 1_000 }).reason, 'explicit-user-action-required');
  assert.equal(recordEonCityW659gVerifiedAction({ type: 'city.capture.saved-local', receiptId: 'clip:1', verified: true }, { storage, now: Date.UTC(2026, 6, 17) }).ok, true);
  assert.equal(recordEonCityW659gVerifiedAction({ type: 'city.capture.saved-local', receiptId: 'clip:2', verified: true }, { storage, now: Date.UTC(2026, 6, 17) + 1 }).ok, true);
  assert.equal(recordEonCityW659gVerifiedAction({ type: 'city.capture.saved-local', receiptId: 'clip:3', verified: true }, { storage, now: Date.UTC(2026, 6, 17) + 2 }).reason, 'daily-cap-reached');
});

test('all six optimized Meshy anchors have real review-first Productive City functions', () => {
  const validation = validateEonCityW659gFunctionalStations();
  assert.equal(validation.ok, true, validation.errors.join(', '));
  assert.equal(validation.stationCount, 6);
  const creator = getEonCityW659gActionsForDistrict('creator-atrium');
  assert.ok(creator.some((entry) => entry.panel === 'creator-capture'));
  assert.ok(creator.some((entry) => entry.panel === 'membership'));
  assert.ok(creator.some((entry) => entry.panel === 'eonbot'));
  const command = getEonCityW659gActionsForDistrict('command-centre');
  assert.ok(command.some((entry) => entry.panel === 'missions-rewards'));
  assert.ok(command.some((entry) => entry.panel === 'share-center'));
  assert.ok(command.some((entry) => entry.route === '/eon-keys'));
  assert.equal([...creator, ...command].some((entry) => entry.autoExecute || entry.autoNavigate), false);
});

test('NPC operator registry gives every named operator a bounded real function', () => {
  const validation = validateEonCityW659gNpcOperators();
  assert.equal(validation.ok, true, validation.errors.join(', '));
  assert.ok(validation.count >= 9);
  const vault = getEonCityW659gNpcActionsForDistrict('vault-station');
  const orientation = getEonCityW659gNpcActionsForDistrict('orientation-hall');
  assert.ok(vault.some((entry) => /vault reveal/i.test(entry.label)));
  assert.ok(orientation.some((entry) => entry.panel === 'membership'));
  assert.equal([...vault, ...orientation].some((entry) => entry.autoExecute || entry.privateDataRead), false);
});

test('Creator Capture capability remains explicit, local and non-uploading', () => {
  function Canvas() {}
  Canvas.prototype.captureStream = () => ({});
  const environment = {
    navigator: { mediaDevices: { getDisplayMedia() {}, getUserMedia() {} }, share() {} },
    MediaRecorder: function MediaRecorder() {},
    MediaStream: function MediaStream() {},
    Blob,
    URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} },
    document: { createElement() { return {}; } },
    HTMLCanvasElement: Canvas
  };
  const capability = getEonCityW659gCaptureCapability(environment);
  assert.equal(capability.ready, true);
  assert.equal(capability.uploadsToEonapp, false);
  assert.equal(capability.startsAutomatically, false);
});

test('Live Voice readiness requires WebRTC, paired bridge, selected OpenAI and a user key', () => {
  const environment = { RTCPeerConnection() {}, navigator: { mediaDevices: { getUserMedia() {} } } };
  const ready = getEonLiveVoiceCapability({ settings: { provider: 'openai' }, bridgeSession: { token: 'paired' }, providerApiKey: 'sk-test-key', environment });
  assert.equal(ready.ready, true);
  const localText = getEonLiveVoiceCapability({ settings: { provider: 'ollama' }, bridgeSession: { token: 'paired' }, providerApiKey: '', environment });
  assert.equal(localText.ready, false);
  assert.match(localText.reason, /Voice Conversation/);
});

test('City checkout uses only a trusted Dodo URL and safe EONCITY return paths', async () => {
  let requestBody = null;
  const environment = {
    fetch: async (_url, init) => {
      requestBody = JSON.parse(init.body);
      return { ok: true, status: 200, json: async () => ({ ok: true, checkoutUrl: 'https://checkout.dodopayments.com/session/test' }) };
    }
  };
  const result = await createEonCityW659gCheckout('studio', { explicitUserAction: true, environment });
  assert.equal(result.ok, true);
  assert.equal(requestBody.returnPath, '/eoncity?billing=return&station=plans');
  assert.equal(requestBody.cancelPath, '/eoncity?billing=cancelled&station=plans');
  assert.equal((await createEonCityW659gCheckout('studio', { explicitUserAction: false, environment })).ok, false);
  const normalized = normalizeCheckoutRequest({ tier: 'plus', idempotencyKey: 'checkout:plus:w659g', returnPath: 'https://evil.invalid', cancelPath: '//evil.invalid' }, { DODO_PRODUCT_PLUS: 'prod_plus' });
  assert.equal(normalized.returnPath, '/billing?checkout=return');
  assert.equal(normalized.cancelPath, '/billing?checkout=cancelled');
});

test('source integration keeps three voice modes, fixed bridge relay and Productive City panels', () => {
  const bridge = read('tools/eon-local-bridge/server.mjs');
  const gateway = read('assets/js/chat/eonbot-voice-capability-gateway.js');
  const core = read('assets/js/city/eon-city-play-core.js');
  const city = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
  const commandHub = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const workSurfaces = read('assets/js/contracts/work-surface/eon-work-surface-registry.js');
  const quick = read('assets/js/city/eon-city-eonbot-quick-work.js');
  assert.match(bridge, /\/v1\/realtime\/openai\/call/);
  assert.match(bridge, /https:\/\/api\.openai\.com\/v1\/realtime\/calls/);
  assert.doesNotMatch(bridge, /payload\?\.(?:targetUrl|upstreamUrl|proxyUrl)|payload\[['"](?:targetUrl|upstreamUrl|proxyUrl)['"]\]/);
  assert.match(gateway, /dictate/);
  assert.match(gateway, /conversation/);
  assert.match(gateway, /live/);
  assert.match(quick, /Dictate/);
  assert.match(quick, /Voice Conversation/);
  assert.match(quick, /Live Voice/);
  assert.match(core, /w731\/eon-city-w731-command-hub-runtime\.js/);
  assert.match(commandHub, /openSurfaceForStation/);
  assert.match(commandHub, /creator-capture/);
  assert.match(commandHub, /plans-access/);
  assert.match(workSurfaces, /id: 'creator-capture'/);
  assert.match(workSurfaces, /id: 'plans'/);
  assert.match(city, /bindEonCityW659gProgression/);
  assert.match(city, /bindEonCityW659gCreatorCapture/);
  assert.match(city, /bindEonCityW659gMembershipConsole/);
  assert.match(city, /bindEonCitySharingCenter/);
  assert.match(city, /createEonCityGenuineAgentTheatreController/);
  assert.doesNotMatch(city, /runRenderLoop/);
});

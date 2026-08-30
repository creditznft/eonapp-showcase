import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { ensureEonPwaProfileState, getEonPwaLocalProfileTruth } from '../../assets/js/eon-pwa-manager.js';
import { buildEonbotContextSlice, buildEonbotRoutePlan, inferEonbotCapability } from '../../assets/js/chat/eonbot-context-registry.js';
import { buildEonbotSystemContext } from '../../assets/js/chat/eonbot-context-pack.js';
import { buildOperatorActionPlan } from '../../assets/js/chat/eonbot-app-operator.js';

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] || null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('W191 PWA state is local-profile-only and never inventories secret values', () => {
  const storage = memoryStorage({
    'eon:chat:history:v1': 'safe',
    'eon:market:drop:v1': 'safe',
    'eon:api-key:openai': 'do-not-read',
    'eon:profile:secret': 'do-not-read'
  });
  const state = ensureEonPwaProfileState({ storage, now: 100 });
  assert.equal(state.crossDeviceSync, false);
  assert.equal(state.sync, 'local-browser-profile-only');
  assert.equal(state.safeStateKeyCount, 2);
  assert.match(getEonPwaLocalProfileTruth(), /Cross-device sync is not active/i);
  assert.equal(storage.getItem('eon:api-key:openai'), 'do-not-read');
});

test('W191 ships Chat-first PWA manifest and canonical service-worker shell', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  const sw = read('sw.js');
  assert.equal(manifest.start_url, '/?source=pwa');
  assert.ok(manifest.shortcuts.some((entry) => entry.url === '/local-ai'));
  assert.ok(manifest.shortcuts.some((entry) => entry.url === '/eoncity'));
  assert.match(sw, /Canonical generated Service Worker source/);
  assert.match(sw, /RELEASE_SOURCE_REVISION/);
  assert.match(sw, /'\/'/);
  assert.match(sw, /'\/automations'/);
  assert.doesNotMatch(sw, /WorkBench era/);
});

test('W192 routes EONBOT through current product truth instead of Sponsor Boost or legacy Cockpit links', () => {
  const local = buildEonbotRoutePlan('please install a Phi local model');
  assert.equal(local.route, '/local-ai');
  assert.equal(local.availability, 'device-dependent');
  assert.equal(inferEonbotCapability('open a research chart and scenario review').id, 'insights');
  const reward = buildEonbotRoutePlan('can I earn credits from a direct link');
  assert.equal(reward.route, '/profile');
  const context = buildEonbotContextSlice({ input: 'create an automation', currentPath: '/chat' });
  assert.match(context.prompt, /simulate and approve/i);
  assert.match(context.prompt, /Referral\/EONKEY availability is server-authoritative and rollout-controlled/i);
  assert.match(context.prompt, /sharing, clicks, impressions, posts and time never create referral value/i);
  const system = buildEonbotSystemContext('', { input: 'open EON City' });
  assert.match(system, /direct Babylon Command District/i);
  const operator = buildOperatorActionPlan('enable multitag extra earnings');
  assert.equal(operator.route, '/rewards');
  assert.match(operator.truthNote, /remain disabled pending separate payment/i);
  assert.equal(operator.approvalRequired, false);
});

test('W193 Chat-first active path has no legacy monetag/cockpit routing in operator modules', () => {
  const operator = read('assets/js/chat/eonbot-app-operator.js');
  const commander = read('assets/js/chat/eonbot-command-center.js');
  const assistant = read('assets/js/chat/eonbot-launch-assistant.js');
  assert.doesNotMatch(operator, /sponsor-boost\.js/);
  assert.doesNotMatch(operator, /realmworld\.html/);
  assert.doesNotMatch(commander, /reward-access\.html/);
  assert.doesNotMatch(commander, /eon-browser\.html/);
  assert.doesNotMatch(assistant, /Sponsor Boost/);
});

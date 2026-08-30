import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { resolveEonbotCapabilityMode } from '../../assets/js/chat/eonbot-capability-registry.js';
import {
  buildEonbotProactiveSuggestion,
  readEonbotProactiveSettings,
  setEonbotProactiveEnabled
} from '../../assets/js/utils/eonbot-proactive-suggestions.js';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

function createStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

test('W219 reports Guide unless local self-test or configured connected readiness proves otherwise', () => {
  const guide = resolveEonbotCapabilityMode({
    settings: { provider: 'guide', assistantMode: 'guide' },
    localRuntimeStatus: null,
    readiness: { ready: false, providerLabel: 'Guide' }
  });
  assert.equal(guide.activeId, 'guide');
  assert.equal(guide.localRuntimeReady, false);
  assert.equal(guide.connectedReady, false);

  const notTestedLocal = resolveEonbotCapabilityMode({
    settings: { provider: 'ollama', model: 'llama3.2' },
    localRuntimeStatus: { ok: false, runtime: 'Ollama', model: 'llama3.2' },
    readiness: { ready: true, providerLabel: 'Ollama' }
  });
  assert.equal(notTestedLocal.activeId, 'guide');
  assert.equal(notTestedLocal.modes.find((mode) => mode.id === 'local').status, 'setup-required');

  const testedLocal = resolveEonbotCapabilityMode({
    settings: { provider: 'ollama', model: 'llama3.2' },
    localRuntimeStatus: { ok: true, runtime: 'Ollama', model: 'llama3.2', checkedAt: '2026-06-24T00:00:00.000Z' },
    readiness: { ready: true, providerLabel: 'Ollama' }
  });
  assert.equal(testedLocal.activeId, 'local');
  assert.equal(testedLocal.providerId, null);

  const connected = resolveEonbotCapabilityMode({
    settings: { provider: 'groq', model: 'llama-3.3-70b' },
    localRuntimeStatus: null,
    readiness: { ready: true, providerLabel: 'Groq' }
  });
  assert.equal(connected.activeId, 'connected');
  assert.equal(connected.providerId, 'groq');
  assert.match(connected.truthNote, /never asks for, stores, or exposes credentials in chat/i);
});

test('W219 proactive reminders are local, opt-in, daily-capped, and never browser notifications', () => {
  const storage = createStorage();
  assert.equal(readEonbotProactiveSettings(storage).enabled, false);
  assert.equal(buildEonbotProactiveSuggestion({ settings: readEonbotProactiveSettings(storage), now: 1000 }), null);

  const enabled = setEonbotProactiveEnabled(true, storage);
  assert.equal(enabled.enabled, true);
  const first = buildEonbotProactiveSuggestion({ settings: enabled, localRuntimeStatus: null, now: 1000 });
  assert.equal(first.id, 'local-ai-check');
  assert.equal(first.url, '/local-ai#eonbot-local-ai-setup');

  const source = read('assets/js/utils/eonbot-proactive-suggestions.js');
  assert.match(source, /Browser notifications are intentionally out of scope/i);
  assert.doesNotMatch(source, /Notification\.requestPermission/);
});

test('W219 removes chat credential capture while preserving secure Vault configuration routing', () => {
  const chat = read('assets/js/chat-page.js');
  assert.match(chat, /containsRawCredentialValue/);
  assert.match(chat, /Sensitive credential removed before sending or saving/);
  assert.match(chat, /EONBOT never asks for or accepts API keys in chat/);
  assert.match(chat, /Credentials are managed in Vault/);
  assert.doesNotMatch(chat, /id="chat-api-key"/);
  assert.doesNotMatch(chat, /Paste your key in chat/);
  assert.doesNotMatch(chat, /paste it right here in chat/i);
  assert.doesNotMatch(chat, /setApiKey\(/);
  assert.doesNotMatch(chat, /clearApiKey\(/);
});

test('W219 positions Workspace as AI Cockpit and keeps Local AI truthful', () => {
  const workspace = read('workspace.html');
  const localAi = read('local-ai.html');
  const profile = read('profile.html');
  assert.match(workspace, /AI Cockpit/);
  assert.match(workspace, /Opened from EONBOT when you need tools/);
  assert.match(localAi, /<h1 class="eon-hub-title">Local AI setup<\/h1>/);
  assert.match(profile, /Allow optional in-app EONBOT reminders/);
  assert.match(profile, /Browser notifications and background push are not active/);
});

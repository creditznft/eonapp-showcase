import test from 'node:test';
import assert from 'node:assert/strict';

import {
  LOCAL_FIRST_RUNTIME_PREFERENCE,
  markLocalRuntimeAsChatRuntime,
  migrateLocalRuntimePreference,
  readLocalRuntimeChatSettings,
  saveLocalRuntimeStatus
} from '../../assets/js/local-ai/local-runtime-status.js';

class MemoryStorage {
  constructor(entries = {}) { this.map = new Map(Object.entries(entries)); }
  getItem(key) { return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
}

test('W476 Local AI canonical preference is local-first and migrates old local values', () => {
  assert.deepEqual(migrateLocalRuntimePreference({ runtimePreference: 'local', mode: 'local', runtimeMode: 'local' }), {
    runtimePreference: LOCAL_FIRST_RUNTIME_PREFERENCE,
    mode: LOCAL_FIRST_RUNTIME_PREFERENCE,
    runtimeMode: LOCAL_FIRST_RUNTIME_PREFERENCE
  });
});

test('W476 Local AI chat settings read migrates persisted old value', () => {
  const previous = globalThis.localStorage;
  const storage = new MemoryStorage({
    'eon:ai-chat-settings:v1': JSON.stringify({ provider: 'ollama', runtimePreference: 'local', mode: 'local', model: 'llama3' })
  });
  globalThis.localStorage = storage;
  try {
    const settings = readLocalRuntimeChatSettings();
    assert.equal(settings.runtimePreference, LOCAL_FIRST_RUNTIME_PREFERENCE);
    assert.equal(settings.mode, LOCAL_FIRST_RUNTIME_PREFERENCE);
    assert.match(storage.getItem('eon:ai-chat-settings:v1'), /local-first/);
  } finally {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  }
});

test('W476 Local AI mark chat runtime writes local-first and loopback only', () => {
  const previous = globalThis.localStorage;
  const storage = new MemoryStorage();
  globalThis.localStorage = storage;
  try {
    const denied = markLocalRuntimeAsChatRuntime({ runtimeName: 'Ollama', endpoint: 'http://192.168.1.12:11434', model: 'llama3' });
    assert.equal(denied.ok, false);
    const unproven = markLocalRuntimeAsChatRuntime({ runtimeName: 'Ollama', endpoint: 'http://127.0.0.1:11434', model: 'llama3' });
    assert.equal(unproven.ok, false);
    assert.equal(unproven.error, 'matching-self-test-required');
    saveLocalRuntimeStatus({
      ok: true,
      runtime: 'Ollama',
      runtimeId: 'ollama',
      endpoint: 'http://127.0.0.1:11434',
      model: 'llama3',
      transport: 'direct-browser',
      localityState: 'loopback-verified-offline-proof-pending'
    });
    const result = markLocalRuntimeAsChatRuntime({ runtimeName: 'Ollama', endpoint: 'http://127.0.0.1:11434', model: 'llama3' });
    assert.equal(result.ok, true);
    assert.equal(result.settings.runtimePreference, LOCAL_FIRST_RUNTIME_PREFERENCE);
    assert.equal(result.settings.mode, LOCAL_FIRST_RUNTIME_PREFERENCE);
    const stored = JSON.parse(storage.getItem('eon:ai-chat-settings:v1'));
    assert.equal(stored.runtimePreference, LOCAL_FIRST_RUNTIME_PREFERENCE);
    assert.equal(stored.mode, LOCAL_FIRST_RUNTIME_PREFERENCE);
  } finally {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ACTIVE_CHAT_THREAD_STORAGE_KEY,
  CHAT_THREADS_STORAGE_KEY,
  clearLegacyPlaintextChatThreads,
  createNewChatThread,
  getChatThreadStorageTruth,
  getLegacyPlaintextChatThreadStatus,
  resolveChatThread
} from '../../assets/js/utils/chat-threads.js';
import { runW331W334RuntimePrivacyGate } from '../../scripts/w331-w334-runtime-privacy-gate.mjs';
import { getEonKernelCommandIntakeTruth, parseEonKernelPlanCommand } from '../../assets/js/ai-kernel/eon-command-intake.js';

function memoryStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (key) => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    has: (key) => map.has(key)
  };
}

function installStorage(local, session) {
  const previousLocal = globalThis.localStorage;
  const previousSession = globalThis.sessionStorage;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: local });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: session });
  return () => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: previousLocal });
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: previousSession });
  };
}

test('W332 saves newly created raw Chat threads only for the current session by default', () => {
  const local = memoryStorage();
  const session = memoryStorage();
  const restore = installStorage(local, session);
  try {
    const resolved = resolveChatThread({ now: 1_770_200_000_000 });
    createNewChatThread({ now: 1_770_200_000_100, id: 'session_only' });
    assert.ok(resolved.thread.id);
    assert.equal(session.has(CHAT_THREADS_STORAGE_KEY), true);
    assert.equal(session.has(ACTIVE_CHAT_THREAD_STORAGE_KEY), true);
    assert.equal(local.has(CHAT_THREADS_STORAGE_KEY), false);
    assert.equal(local.has(ACTIVE_CHAT_THREAD_STORAGE_KEY), false);
    assert.deepEqual(getChatThreadStorageTruth(), {
      schema: 'eon.chat.threads.v1',
      defaultStorage: 'session-only',
      durablePlaintextChatStorage: false,
      encryptedBackupRequiredForRecovery: true,
      cloudSync: false,
      rawChatRelay: false
    });
  } finally {
    restore();
  }
});

test('W331 parses a plan request locally without creating an executor or external action', () => {
  const command = parseEonKernelPlanCommand('/agent prepare a Friday campaign');
  assert.deepEqual(command, {
    command: 'local-plan',
    payload: 'prepare a Friday campaign',
    foregroundOnly: true,
    externalExecution: false
  });
  assert.equal(parseEonKernelPlanCommand('normal chat message'), null);
  assert.deepEqual(getEonKernelCommandIntakeTruth(), {
    localOnly: true,
    foregroundOnly: true,
    executorImport: false,
    network: false,
    externalExecution: false,
    rawInputStored: false
  });
});

test('W332 detects and clears legacy plaintext Chat cache without reading, migrating, or uploading content', () => {
  const local = memoryStorage({
    [CHAT_THREADS_STORAGE_KEY]: JSON.stringify({ threads: [{ id: 'chat_old', messages: [{ role: 'user', text: 'PRIVATE_LEGACY_CONTENT' }] }] }),
    [ACTIVE_CHAT_THREAD_STORAGE_KEY]: 'chat_old'
  });
  const status = getLegacyPlaintextChatThreadStatus({ storage: local });
  assert.deepEqual(status, { present: true, key: CHAT_THREADS_STORAGE_KEY, contentLoaded: false });
  const result = clearLegacyPlaintextChatThreads({ storage: local });
  assert.deepEqual(result, { ok: true, contentUploaded: false, contentMigrated: false });
  assert.equal(local.has(CHAT_THREADS_STORAGE_KEY), false);
  assert.equal(local.has(ACTIVE_CHAT_THREAD_STORAGE_KEY), false);
});

test('W331–W334 source gate passes', () => {
  const report = runW331W334RuntimePrivacyGate();
  assert.equal(report.ok, true, report.errors.join('\n'));
});

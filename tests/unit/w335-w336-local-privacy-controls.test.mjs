import assert from 'node:assert/strict';
import test from 'node:test';
import { ACTIVE_CHAT_THREAD_STORAGE_KEY, CHAT_THREADS_STORAGE_KEY, LEGACY_CHAT_SESSION_STORAGE_KEY } from '../../assets/js/utils/chat-threads.js';
import { EON_KERNEL_SESSION_KEY } from '../../assets/js/ai-kernel/eon-ai-kernel-session-store.js';
import { clearEonTemporaryLocalWork, getEonLocalPrivacyDiagnosticsTruth, inspectEonLocalPrivacy } from '../../assets/js/local-first/eon-local-privacy-diagnostics.js';
import { runW335W336LocalPrivacyControlsGate } from '../../scripts/w335-w336-local-privacy-controls-gate.mjs';

function memoryStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (key) => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    has: (key) => map.has(key)
  };
}

test('W335 reports only local storage categories, not raw saved work', () => {
  const session = memoryStorage({
    [CHAT_THREADS_STORAGE_KEY]: 'PRIVATE_CHAT_TEXT_MUST_NOT_APPEAR',
    [ACTIVE_CHAT_THREAD_STORAGE_KEY]: 'chat_demo',
    [LEGACY_CHAT_SESSION_STORAGE_KEY]: 'PRIVATE_LEGACY_SESSION_TEXT',
    [EON_KERNEL_SESSION_KEY]: 'PRIVATE_KERNEL_STATE',
    'eon:discovered-models:v1': 'PRIVATE_MODEL_LIST'
  });
  const local = memoryStorage({ [CHAT_THREADS_STORAGE_KEY]: 'PRIVATE_OLD_CHAT_TEXT' });
  const report = inspectEonLocalPrivacy({ sessionStorage: session, localStorage: local });
  const encoded = JSON.stringify(report);
  assert.equal(report.temporary.chatThreads, true);
  assert.equal(report.temporary.kernelReviewState, true);
  assert.equal(report.legacyPlaintextChat.present, true);
  assert.equal(report.rawContentRead, false);
  assert.doesNotMatch(encoded, /PRIVATE_(CHAT|LEGACY|KERNEL|MODEL|OLD)/);
});

test('W336 clears only temporary session work after explicit confirmation', () => {
  const session = memoryStorage({
    [CHAT_THREADS_STORAGE_KEY]: 'private',
    [ACTIVE_CHAT_THREAD_STORAGE_KEY]: 'chat_demo',
    [LEGACY_CHAT_SESSION_STORAGE_KEY]: 'legacy',
    [EON_KERNEL_SESSION_KEY]: 'kernel',
    'eon:discovered-models:v1': 'models',
    'eon:ai-chat-session-keys:v1': 'provider-key-must-stay'
  });
  const rejected = clearEonTemporaryLocalWork({ confirmedByUser: false, sessionStorage: session });
  assert.equal(rejected.ok, false);
  assert.equal(session.has(CHAT_THREADS_STORAGE_KEY), true);
  const cleared = clearEonTemporaryLocalWork({ confirmedByUser: true, sessionStorage: session });
  assert.equal(cleared.ok, true);
  for (const key of [CHAT_THREADS_STORAGE_KEY, ACTIVE_CHAT_THREAD_STORAGE_KEY, LEGACY_CHAT_SESSION_STORAGE_KEY, EON_KERNEL_SESSION_KEY, 'eon:discovered-models:v1']) assert.equal(session.has(key), false);
  assert.equal(session.has('eon:ai-chat-session-keys:v1'), true);
  assert.equal(cleared.providerKeyChanged, false);
  assert.equal(cleared.encryptedVaultChanged, false);
  assert.equal(getEonLocalPrivacyDiagnosticsTruth().cloudSync, false);
});

test('W335–W336 source gate passes', () => {
  const report = runW335W336LocalPrivacyControlsGate();
  assert.equal(report.ok, true, report.errors.join('\n'));
});

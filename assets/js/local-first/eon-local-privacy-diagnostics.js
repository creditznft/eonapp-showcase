/**
 * W335–W336 — user-owned local privacy diagnostics.
 *
 * This module reports only boolean/key-category status. It never reads or
 * exports Chat text, task text, output, provider keys, vault ciphertext, or
 * any cloud data. Clearing temporary state needs an explicit user action.
 */
import {
  ACTIVE_CHAT_THREAD_STORAGE_KEY,
  CHAT_THREADS_STORAGE_KEY,
  LEGACY_CHAT_SESSION_STORAGE_KEY,
  getChatThreadStorageTruth,
  getLegacyPlaintextChatThreadStatus
} from '../utils/chat-threads.js';
import { EON_KERNEL_SESSION_KEY, getEonKernelSessionTruth } from '../ai-kernel/eon-ai-kernel-session-store.js';
import { getModelDiscoveryCacheTruth } from '../chat/ai-runtime.js';
import { getEncryptedPortableBackupTruth } from './eon-portable-backup.js';
import { getLocalVaultMetadataTruth } from './eon-local-vault-metadata-store.js';

export const EON_LOCAL_PRIVACY_DIAGNOSTICS_SCHEMA = 'eonapp.local-privacy-diagnostics.v1';
export const EON_TEMPORARY_LOCAL_WORK_KEYS = Object.freeze([
  CHAT_THREADS_STORAGE_KEY,
  ACTIVE_CHAT_THREAD_STORAGE_KEY,
  LEGACY_CHAT_SESSION_STORAGE_KEY,
  EON_KERNEL_SESSION_KEY,
  'eon:discovered-models:v1'
]);

function sessionFor(candidate = null) {
  if (candidate && typeof candidate.getItem === 'function' && typeof candidate.removeItem === 'function') return candidate;
  try { return globalThis.sessionStorage || null; } catch { return null; }
}

function localFor(candidate = null) {
  if (candidate && typeof candidate.getItem === 'function') return candidate;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function has(storage, key) {
  try { return Boolean(storage?.getItem(key)); } catch { return false; }
}

/** Returns a bounded status record without exposing saved content. */
export function inspectEonLocalPrivacy({ sessionStorage = null, localStorage = null } = {}) {
  const session = sessionFor(sessionStorage);
  const local = localFor(localStorage);
  const legacy = getLegacyPlaintextChatThreadStatus({ storage: local });
  const temporary = Object.freeze({
    chatThreads: has(session, CHAT_THREADS_STORAGE_KEY),
    activeChatReference: has(session, ACTIVE_CHAT_THREAD_STORAGE_KEY),
    legacySessionHistory: has(session, LEGACY_CHAT_SESSION_STORAGE_KEY),
    kernelReviewState: has(session, EON_KERNEL_SESSION_KEY),
    discoveredModelList: has(session, 'eon:discovered-models:v1')
  });
  return Object.freeze({
    schema: EON_LOCAL_PRIVACY_DIAGNOSTICS_SCHEMA,
    localOnly: true,
    directNetwork: false,
    cloudSync: false,
    rawContentRead: false,
    temporary,
    legacyPlaintextChat: legacy,
    chat: getChatThreadStorageTruth(),
    kernel: getEonKernelSessionTruth(),
    modelManifest: getModelDiscoveryCacheTruth(),
    encryptedVault: getLocalVaultMetadataTruth(),
    encryptedBackup: getEncryptedPortableBackupTruth()
  });
}

/** Clears only tab-lifetime work state after a visible user confirmation. */
export function clearEonTemporaryLocalWork({ confirmedByUser = false, sessionStorage = null } = {}) {
  if (confirmedByUser !== true) return Object.freeze({ ok: false, reason: 'explicit-user-confirmation-required', removed: Object.freeze([]), cloudSync: false });
  const session = sessionFor(sessionStorage);
  if (!session) return Object.freeze({ ok: false, reason: 'session-storage-unavailable', removed: Object.freeze([]), cloudSync: false });
  const removed = [];
  for (const key of EON_TEMPORARY_LOCAL_WORK_KEYS) {
    try {
      if (session.getItem(key)) removed.push(key);
      session.removeItem(key);
    } catch {}
  }
  return Object.freeze({ ok: true, reason: null, removed: Object.freeze(removed), cloudSync: false, encryptedVaultChanged: false, providerKeyChanged: false });
}

export function getEonLocalPrivacyDiagnosticsTruth() {
  return Object.freeze({
    schema: EON_LOCAL_PRIVACY_DIAGNOSTICS_SCHEMA,
    rawContentRead: false,
    rawContentExport: false,
    directNetwork: false,
    cloudSync: false,
    clearRequiresExplicitUserConfirmation: true,
    clearsOnlyTemporarySessionState: true,
    encryptedVaultChangedByTemporaryClear: false,
    providerKeyChangedByTemporaryClear: false
  });
}

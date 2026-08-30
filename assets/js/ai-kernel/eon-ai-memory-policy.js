/**
 * Institutional memory policy.
 *
 * The policy separates "memory enabled" from "raw chat capture". Even Safe
 * auto may persist only structured, non-secret signals produced by an
 * approved product control. It never turns arbitrary conversation text into
 * durable memory and never fine-tunes model weights.
 */
export const EON_AI_MEMORY_POLICY_SCHEMA = 'eonapp.ai-memory-policy.v1';
export const EON_AI_MEMORY_POLICY_KEY = 'eon:ai-memory-policy:v1';
export const EON_AI_MEMORY_MODES = Object.freeze(['off', 'ask', 'safe-auto']);

const SAFE_AUTO_SOURCES = new Set([
  'structured-preference-control',
  'project-setting',
  'creator-setting',
  'workflow-setting',
  'user-profile-control'
]);

function storageTarget(storage) {
  if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function') return storage;
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
}

export function normalizeEonAiMemoryMode(value = '') {
  const mode = String(value || '').trim().toLowerCase();
  return EON_AI_MEMORY_MODES.includes(mode) ? mode : 'ask';
}

export function readEonAiMemoryPolicy(options = {}) {
  const storage = storageTarget(options.storage);
  let raw = {};
  try { raw = JSON.parse(storage?.getItem(EON_AI_MEMORY_POLICY_KEY) || '{}'); } catch { raw = {}; }
  return Object.freeze({
    schema: EON_AI_MEMORY_POLICY_SCHEMA,
    mode: normalizeEonAiMemoryMode(raw.mode || 'ask'),
    rawChatCapture: false,
    fineTuning: false,
    cloudSync: false,
    updatedAt: Number(raw.updatedAt || 0)
  });
}

export function writeEonAiMemoryPolicy(mode = 'ask', options = {}) {
  if (options.explicitUserAction !== true) return Object.freeze({ ok: false, reason: 'explicit-user-action-required', policy: readEonAiMemoryPolicy(options) });
  const storage = storageTarget(options.storage);
  if (!storage) return Object.freeze({ ok: false, reason: 'storage-unavailable', policy: readEonAiMemoryPolicy(options) });
  const policy = {
    schema: EON_AI_MEMORY_POLICY_SCHEMA,
    mode: normalizeEonAiMemoryMode(mode),
    rawChatCapture: false,
    fineTuning: false,
    cloudSync: false,
    updatedAt: Number(options.now ?? Date.now())
  };
  try {
    storage.setItem(EON_AI_MEMORY_POLICY_KEY, JSON.stringify(policy));
    return Object.freeze({ ok: true, reason: null, policy: Object.freeze(policy) });
  } catch {
    return Object.freeze({ ok: false, reason: 'storage-unavailable', policy: readEonAiMemoryPolicy(options) });
  }
}

export function assessEonAiAutomaticMemoryCandidate(candidate = {}, options = {}) {
  const policy = options.policy?.schema === EON_AI_MEMORY_POLICY_SCHEMA ? options.policy : readEonAiMemoryPolicy(options);
  const sourceClass = String(candidate.sourceClass || candidate.source || 'raw-chat').trim().toLowerCase();
  if (policy.mode === 'off') return Object.freeze({ allowed: false, reason: 'memory-off', requiresConfirmation: true });
  if (policy.mode !== 'safe-auto') return Object.freeze({ allowed: false, reason: 'confirmation-required', requiresConfirmation: true });
  if (!SAFE_AUTO_SOURCES.has(sourceClass)) return Object.freeze({ allowed: false, reason: 'untrusted-or-raw-chat-source', requiresConfirmation: true });
  if (candidate.safe !== true) return Object.freeze({ allowed: false, reason: 'candidate-safety-not-proven', requiresConfirmation: true });
  return Object.freeze({ allowed: true, reason: 'safe-structured-signal', requiresConfirmation: false });
}

export function getEonAiMemoryPolicyTruth() {
  return Object.freeze({
    schema: EON_AI_MEMORY_POLICY_SCHEMA,
    defaultMode: 'ask',
    modes: EON_AI_MEMORY_MODES,
    rawChatAutoCapture: false,
    safeAutoStructuredSignalsOnly: true,
    explicitUserActionToChangePolicy: true,
    fineTuning: false,
    cloudSync: false
  });
}

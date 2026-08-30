/**
 * W287-A0 — small, explicit local preferences for EONBOT language-adjacent
 * interaction controls. This module stores no transcript, recording, provider
 * key, contact, device fingerprint, or remote identifier.
 */
export const EONBOT_INTERACTION_PREFERENCES_SCHEMA = 'eon.eonbot.interaction-preferences.v1';
export const EONBOT_INTERACTION_PREFERENCES_KEY = 'eon:eonbot:interaction-preferences:v1';

const DEFAULT_PREFERENCES = Object.freeze({
  schema: EONBOT_INTERACTION_PREFERENCES_SCHEMA,
  voiceOutputEnabled: false,
  continuousVoiceEnabled: false,
  personalizedGreetingEnabled: false
});

function storageFor(storage) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function emitPreferenceChange(next) {
  try {
    globalThis.window?.dispatchEvent?.(new CustomEvent('eon:eonbot-interaction-preferences-changed', {
      detail: Object.freeze({ ...next })
    }));
  } catch {}
}

function normalize(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return Object.freeze({
    schema: EONBOT_INTERACTION_PREFERENCES_SCHEMA,
    voiceOutputEnabled: source.voiceOutputEnabled === true,
    continuousVoiceEnabled: source.continuousVoiceEnabled === true,
    personalizedGreetingEnabled: source.personalizedGreetingEnabled === true
  });
}

export function readEonbotInteractionPreferences({ storage } = {}) {
  const resolved = storageFor(storage);
  try {
    return normalize(JSON.parse(String(resolved?.getItem(EONBOT_INTERACTION_PREFERENCES_KEY) || '{}')));
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function setEonbotInteractionPreferences(patch = {}, { storage } = {}) {
  const current = readEonbotInteractionPreferences({ storage });
  const next = normalize({ ...current, ...patch });
  try { storageFor(storage)?.setItem(EONBOT_INTERACTION_PREFERENCES_KEY, JSON.stringify(next)); } catch {}
  emitPreferenceChange(next);
  return next;
}

export function clearEonbotInteractionPreferences({ storage } = {}) {
  try { storageFor(storage)?.removeItem(EONBOT_INTERACTION_PREFERENCES_KEY); } catch {}
  emitPreferenceChange(DEFAULT_PREFERENCES);
  return DEFAULT_PREFERENCES;
}

export function getEonbotInteractionPreferenceTruth(preference = readEonbotInteractionPreferences()) {
  const next = normalize(preference);
  return Object.freeze({
    ...next,
    note: next.voiceOutputEnabled
      ? 'Voice output is enabled only in this browser profile. Microphone capture still requires a separate user tap and browser permission.'
      : 'Voice output is off. EONBOT will keep typed input and visual replies available.',
    boundary: 'These are small local controls only. A remembered preference never starts a microphone or grants Voice Conversation auto-send authority; that requires a separate per-session review. They do not enable background listening, hidden personalization, provider access, or a public profile.'
  });
}

export default Object.freeze({
  EONBOT_INTERACTION_PREFERENCES_SCHEMA,
  EONBOT_INTERACTION_PREFERENCES_KEY,
  readEonbotInteractionPreferences,
  setEonbotInteractionPreferences,
  clearEonbotInteractionPreferences,
  getEonbotInteractionPreferenceTruth
});

/**
 * W394B/W394C — local voice recognition language preference.
 *
 * This module stores only a language/locale choice. It never records audio,
 * sends transcription, or stores a separate transcript.
 */
import { EON_VOICE_LANGUAGE_MATRIX, getEonVoiceLanguage } from '../utils/language-matrix.js';

export const EON_VOICE_LANGUAGE_PREFERENCE_KEY = 'eon:chat:speech-language:v1';

export const VOICE_LANGUAGE_OPTIONS = Object.freeze([
  Object.freeze({ value: 'auto', language: 'auto', locale: '', label: 'Voice: Auto' }),
  ...EON_VOICE_LANGUAGE_MATRIX.map((entry) => Object.freeze({
    value: entry.speechLocale,
    language: entry.code,
    locale: entry.speechLocale,
    label: entry.voiceLabel
  }))
]);

function getStorage(storage = null) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function normalizeRaw(value = '') {
  return String(value || '').trim().replace(/_/g, '-').toLowerCase();
}

export function normalizeVoiceLanguagePreference(value = 'auto') {
  const raw = normalizeRaw(value);
  if (!raw || raw === 'auto') return 'auto';
  const language = getEonVoiceLanguage(raw);
  return language?.speechLocale || 'auto';
}

export function readVoiceLanguagePreference(options = {}) {
  try {
    return normalizeVoiceLanguagePreference(getStorage(options.storage)?.getItem(EON_VOICE_LANGUAGE_PREFERENCE_KEY) || 'auto');
  } catch {
    return 'auto';
  }
}

export function saveVoiceLanguagePreference(value = 'auto', options = {}) {
  const normalized = normalizeVoiceLanguagePreference(value);
  try {
    const storage = getStorage(options.storage);
    if (!storage) return normalized;
    if (normalized === 'auto') storage.removeItem(EON_VOICE_LANGUAGE_PREFERENCE_KEY);
    else storage.setItem(EON_VOICE_LANGUAGE_PREFERENCE_KEY, normalized);
  } catch {}
  return normalized;
}

export function getVoiceLanguageOption(value = 'auto') {
  const normalized = normalizeVoiceLanguagePreference(value);
  return VOICE_LANGUAGE_OPTIONS.find((entry) => entry.value === normalized) || VOICE_LANGUAGE_OPTIONS[0];
}

export function getVoiceLanguageBase(value = 'auto') {
  return String(getVoiceLanguageOption(value)?.language || 'auto');
}

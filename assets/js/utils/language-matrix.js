/**
 * A15 I24 — canonical language capability matrix.
 *
 * Product language is split into three independently certified capabilities:
 * - published full-interface language;
 * - Chat/Guide language;
 * - browser speech locale.
 *
 * A language is never published as a complete EONAPP interface merely because
 * Chat, Guide or browser speech can use it.
 */
export const EON_LANGUAGE_MATRIX_VERSION = '2026-08-05.a15-i24';

const rows = [
  { code: 'en', name: 'English', englishName: 'English', flag: 'GB', dir: 'ltr', script: 'latin', voiceOrder: 1, speechLocale: 'en-US', voiceLabel: 'English', publishedFullUi: true, chatGuide: true, browserSpeech: true },
  { code: 'es', name: 'Español', englishName: 'Spanish', flag: 'ES', dir: 'ltr', script: 'latin', voiceOrder: 3, speechLocale: 'es-ES', voiceLabel: 'Spanish', publishedFullUi: false, chatGuide: true, browserSpeech: true },
  { code: 'zh', name: '中文（简体）', englishName: 'Chinese (Simplified)', flag: 'CN', dir: 'ltr', script: 'cjk', voiceOrder: 9, speechLocale: 'zh-CN', voiceLabel: 'Chinese (Simplified)', publishedFullUi: false, chatGuide: true, browserSpeech: true },
  { code: 'ja', name: '日本語', englishName: 'Japanese', flag: 'JP', dir: 'ltr', script: 'cjk', voiceOrder: 10, speechLocale: 'ja-JP', voiceLabel: 'Japanese', publishedFullUi: false, chatGuide: true, browserSpeech: true },
  { code: 'ko', name: '한국어', englishName: 'Korean', flag: 'KR', dir: 'ltr', script: 'cjk', voiceOrder: 11, speechLocale: 'ko-KR', voiceLabel: 'Korean', publishedFullUi: false, chatGuide: true, browserSpeech: true },
  { code: 'fr', name: 'Français', englishName: 'French', flag: 'FR', dir: 'ltr', script: 'latin', voiceOrder: 5, speechLocale: 'fr-FR', voiceLabel: 'French', publishedFullUi: false, chatGuide: true, browserSpeech: true },
  { code: 'de', name: 'Deutsch', englishName: 'German', flag: 'DE', dir: 'ltr', script: 'latin', voiceOrder: 6, speechLocale: 'de-DE', voiceLabel: 'German', publishedFullUi: false, chatGuide: true, browserSpeech: true },
  { code: 'pt', name: 'Português (Brasil)', englishName: 'Portuguese (Brazil)', flag: 'BR', dir: 'ltr', script: 'latin', voiceOrder: 4, speechLocale: 'pt-BR', voiceLabel: 'Portuguese (Brazil)', publishedFullUi: false, chatGuide: true, browserSpeech: true },
  { code: 'ru', name: 'Русский', englishName: 'Russian', flag: 'RU', dir: 'ltr', script: 'cyrillic', voiceOrder: 8, speechLocale: 'ru-RU', voiceLabel: 'Russian', publishedFullUi: false, chatGuide: true, browserSpeech: true },
  { code: 'ar', name: 'العربية', englishName: 'Arabic', flag: 'SA', dir: 'rtl', script: 'arabic', voiceOrder: 7, speechLocale: 'ar-SA', voiceLabel: 'Arabic', publishedFullUi: false, chatGuide: true, browserSpeech: true },
  { code: 'hi', name: 'हिन्दी', englishName: 'Hindi', flag: 'IN', dir: 'ltr', script: 'devanagari', voiceOrder: 2, speechLocale: 'hi-IN', voiceLabel: 'Hindi', publishedFullUi: false, chatGuide: true, browserSpeech: true }
];

export const EON_LANGUAGE_CAPABILITY_MATRIX = Object.freeze(rows.map((entry) => Object.freeze({ ...entry })));
export const EON_FULL_PRODUCT_LANGUAGE_MATRIX = Object.freeze(EON_LANGUAGE_CAPABILITY_MATRIX.filter((entry) => entry.publishedFullUi));
export const EON_CHAT_GUIDE_LANGUAGE_MATRIX = Object.freeze(EON_LANGUAGE_CAPABILITY_MATRIX.filter((entry) => entry.chatGuide));
export const EON_FULL_PRODUCT_LANGUAGE_CODES = Object.freeze(EON_FULL_PRODUCT_LANGUAGE_MATRIX.map((entry) => entry.code));
export const EON_CHAT_GUIDE_LANGUAGE_CODES = Object.freeze(EON_CHAT_GUIDE_LANGUAGE_MATRIX.map((entry) => entry.code));
export const EON_VOICE_LANGUAGE_MATRIX = Object.freeze(EON_LANGUAGE_CAPABILITY_MATRIX.filter((entry) => entry.browserSpeech).sort((left, right) => left.voiceOrder - right.voiceOrder));
export const EON_VOICE_LANGUAGE_VALUES = Object.freeze(['auto', ...EON_VOICE_LANGUAGE_MATRIX.map((entry) => entry.speechLocale)]);

// Voice-only rows are intentionally not advertised as full EONAPP product languages
// until their UI and deterministic Guide coverage reaches the same release standard.
export const EON_DEFERRED_VOICE_ONLY_LANGUAGE_CODES = Object.freeze(['bn', 'id']);

function normalizeRaw(value = '') {
  return String(value || '').trim().replace(/_/g, '-').toLowerCase();
}

function normalizeAgainst(value, codes, fallback = '') {
  const base = normalizeRaw(value).split('-')[0];
  return codes.includes(base) ? base : fallback;
}

export function normalizeEonFullProductLanguage(value = '', fallback = '') {
  return normalizeAgainst(value, EON_FULL_PRODUCT_LANGUAGE_CODES, fallback);
}

export function normalizeEonChatGuideLanguage(value = '', fallback = '') {
  return normalizeAgainst(value, EON_CHAT_GUIDE_LANGUAGE_CODES, fallback);
}

export function isEonFullProductLanguage(value = '') {
  return Boolean(normalizeEonFullProductLanguage(value));
}

export function isEonChatGuideLanguage(value = '') {
  return Boolean(normalizeEonChatGuideLanguage(value));
}

export function getEonLanguageCapability(value = '', fallback = null) {
  const code = normalizeAgainst(value, EON_LANGUAGE_CAPABILITY_MATRIX.map((entry) => entry.code));
  return EON_LANGUAGE_CAPABILITY_MATRIX.find((entry) => entry.code === code) || fallback;
}

export function getEonFullProductLanguage(value = '', fallback = null) {
  const code = normalizeEonFullProductLanguage(value);
  return EON_FULL_PRODUCT_LANGUAGE_MATRIX.find((entry) => entry.code === code) || fallback;
}

export function getEonChatGuideLanguage(value = '', fallback = null) {
  const code = normalizeEonChatGuideLanguage(value);
  return EON_CHAT_GUIDE_LANGUAGE_MATRIX.find((entry) => entry.code === code) || fallback;
}

export function getEonVoiceLanguage(value = '', fallback = null) {
  const normalized = normalizeRaw(value);
  if (!normalized || normalized === 'auto') return fallback;
  return EON_VOICE_LANGUAGE_MATRIX.find((entry) => normalizeRaw(entry.speechLocale) === normalized || entry.code === normalized.split('-')[0]) || fallback;
}

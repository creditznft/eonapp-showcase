import { EON_VOICE_LANGUAGE_MATRIX } from './language-matrix.js';

/**
 * speech-locale.js
 * Shared speech locale + voice selection helpers for TTS/STT paths.
 */

const /** @type {any} */
LANGUAGE_TO_LOCALE = {
  en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', pt: 'pt-PT', it: 'it-IT',
  nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR', ar: 'ar-SA',
  hi: 'hi-IN', tr: 'tr-TR', pl: 'pl-PL', sv: 'sv-SE', da: 'da-DK', fi: 'fi-FI',
  no: 'nb-NO', he: 'he-IL', bn: 'bn-BD', ur: 'ur-PK', ta: 'ta-IN', te: 'te-IN',
  vi: 'vi-VN', th: 'th-TH', id: 'id-ID', uk: 'uk-UA', cs: 'cs-CZ', ro: 'ro-RO',
  hu: 'hu-HU', el: 'el-GR', sk: 'sk-SK', bg: 'bg-BG', hr: 'hr-HR', sl: 'sl-SI',
  ms: 'ms-MY', fil: 'fil-PH',
  'en-in': 'en-IN', 'en-gb': 'en-GB', 'es-mx': 'es-MX', 'es-419': 'es-419',
  'pt-br': 'pt-BR', 'fr-ca': 'fr-CA', 'zh-tw': 'zh-TW', 'ar-eg': 'ar-EG',
  ...Object.fromEntries(EON_VOICE_LANGUAGE_MATRIX.map((entry) => [entry.code, entry.speechLocale]))
};

function normalizeLocale(/** @type {any} */ value = '') {
  return String(value || '').trim().replace('_', '-');
}

function normalizeLanguage(/** @type {any} */ value = '') {
  return normalizeLocale(value).toLowerCase();
}

function unique(/** @type {any} */ list = []) {
  return Array.from(new Set(list.filter(Boolean)));
}

export function resolveSpeechLocale(/** @type {any} */ options = {}) {
  const explicitSpeechLocale = normalizeLocale(options.explicitSpeechLocale || '');
  if (explicitSpeechLocale && normalizeLanguage(explicitSpeechLocale) !== 'auto') return explicitSpeechLocale;

  const appLanguage = normalizeLanguage(options.appLanguage || '');
  const preferredLanguage = normalizeLanguage(options.preferredLanguage || '');
  const browserLocales = Array.isArray(options.browserLocales) && options.browserLocales.length
    ? options.browserLocales.map((/** @type {any} */ item) => normalizeLocale(item)).filter(Boolean)
    : (Array.isArray(navigator.languages) ? navigator.languages : []);

  const source = appLanguage && appLanguage !== 'auto'
    ? appLanguage
    : (preferredLanguage && preferredLanguage !== 'auto' ? preferredLanguage : '');

  if (source.includes('-')) {
    return source;
  }

  if (source && LANGUAGE_TO_LOCALE[source]) {
    return LANGUAGE_TO_LOCALE[source];
  }

  if (source) {
    const matchingBrowser = browserLocales.find((/** @type {any} */ entry) => normalizeLanguage(entry).startsWith(`${source}-`) || normalizeLanguage(entry) === source);
    if (matchingBrowser) return matchingBrowser;
    return `${source}-${source.toUpperCase()}`;
  }

  return normalizeLocale(browserLocales[0] || navigator.language || 'en-US');
}

export function buildRecognitionLocaleCandidates(/** @type {any} */ locale, /** @type {any} */ browserLocales = [], /** @type {any} */ options = {}) {
  const normalizedLocale = normalizeLocale(locale || 'en-US');
  const langBase = normalizeLanguage(normalizedLocale).split('-')[0] || 'en';
  const browser = Array.isArray(browserLocales) && browserLocales.length
    ? browserLocales.map((/** @type {any} */ entry) => normalizeLocale(entry)).filter(Boolean)
    : (Array.isArray(navigator.languages) ? navigator.languages.map((/** @type {any} */ entry) => normalizeLocale(entry)).filter(Boolean) : []);

  const browserMatches = browser.filter((/** @type {any} */ entry) => normalizeLanguage(entry).startsWith(`${langBase}-`) || normalizeLanguage(entry) === langBase);
  const mapped = LANGUAGE_TO_LOCALE[langBase] || '';
  const baseOnly = langBase;
  const includeEnglishFallback = options.includeEnglishFallback !== false;
  const browserPrimary = normalizeLocale(navigator.language || '');
  const browserPrimaryMatches = normalizeLanguage(browserPrimary).startsWith(`${langBase}-`) || normalizeLanguage(browserPrimary) === langBase;
  const englishRegionalFallback = includeEnglishFallback && langBase === 'en' ? 'en-GB' : '';

  return unique([
    normalizedLocale,
    mapped,
    baseOnly,
    ...browserMatches,
    includeEnglishFallback || browserPrimaryMatches ? browserPrimary : '',
    englishRegionalFallback,
    includeEnglishFallback ? 'en-US' : ''
  ]);
}

export function findSpeechVoice(/** @type {any} */ locale, /** @type {any} */ voices = []) {
  const list = Array.isArray(voices) ? voices : [];
  if (!list.length) return null;

  const normalizedLocale = normalizeLanguage(locale || 'en-US');
  const langBase = normalizedLocale.split('-')[0] || 'en';

  const exact = list.find((/** @type {any} */ voice) => normalizeLanguage(voice?.lang || '') === normalizedLocale);
  if (exact) return exact;

  const prefix = list.find((/** @type {any} */ voice) => normalizeLanguage(voice?.lang || '').startsWith(`${langBase}-`));
  if (prefix) return prefix;

  const browserLocale = normalizeLanguage(navigator.language || '');
  const browserVoice = list.find((/** @type {any} */ voice) => normalizeLanguage(voice?.lang || '') === browserLocale);
  if (browserVoice) return browserVoice;

  const englishVoice = list.find((/** @type {any} */ voice) => normalizeLanguage(voice?.lang || '').startsWith('en-'));
  return englishVoice || list[0] || null;
}

export function applySpeechVoice(/** @type {any} */ utterance, /** @type {any} */ locale) {
  if (!utterance) return;
  const targetLocale = normalizeLocale(locale || 'en-US');
  utterance.lang = targetLocale;

  try {
    const synth = window.speechSynthesis;
    const voice = findSpeechVoice(targetLocale, synth?.getVoices?.() || []);
    if (voice) utterance.voice = voice;
  } catch {
    // ignore voice selection failures
  }
}

import assert from 'node:assert/strict';
import test from 'node:test';
import { W394B_MULTILINGUAL_VOICE_CONTRACT, validateW394BMultilingualVoiceContract } from '../../config/w394b-multilingual-voice-contract.mjs';
import { EON_CHAT_GUIDE_LANGUAGE_CODES, EON_FULL_PRODUCT_LANGUAGE_CODES, EON_VOICE_LANGUAGE_VALUES } from '../../assets/js/utils/language-matrix.js';
import { EON_VOICE_LANGUAGE_PREFERENCE_KEY, VOICE_LANGUAGE_OPTIONS, getVoiceLanguageOption, normalizeVoiceLanguagePreference, readVoiceLanguagePreference, saveVoiceLanguagePreference } from '../../assets/js/chat/voice-language-preferences.js';
import { buildRecognitionLocaleCandidates, resolveSpeechLocale } from '../../assets/js/utils/speech-locale.js';
import { inspectW394BMultilingualVoice } from '../../scripts/w394b-multilingual-voice-gate.mjs';

function memoryStorage() {
  const rows = new Map();
  return { getItem: (key) => rows.get(String(key)) ?? null, setItem: (key, value) => rows.set(String(key), String(value)), removeItem: (key) => rows.delete(String(key)), rows };
}

test('W394B keeps language choice local and normalizes to known release recognition locales', () => {
  const storage = memoryStorage();
  assert.equal(readVoiceLanguagePreference({ storage }), 'auto');
  assert.equal(saveVoiceLanguagePreference('HI_in', { storage }), 'hi-IN');
  assert.equal(storage.getItem(EON_VOICE_LANGUAGE_PREFERENCE_KEY), 'hi-IN');
  assert.equal(getVoiceLanguageOption('hi-IN').language, 'hi');
  assert.equal(saveVoiceLanguagePreference('unsupported-locale', { storage }), 'auto');
  assert.equal(storage.getItem(EON_VOICE_LANGUAGE_PREFERENCE_KEY), null);
  assert.equal(normalizeVoiceLanguagePreference('zh_cn'), 'zh-CN');
  assert.equal(normalizeVoiceLanguagePreference('bn-BD'), 'auto');
  assert.equal(VOICE_LANGUAGE_OPTIONS[0].value, 'auto');
});

test('W394B manual recognition locale does not add unrelated English fallback', () => {
  assert.equal(resolveSpeechLocale({ explicitSpeechLocale: 'zh-CN', appLanguage: 'en', browserLocales: ['en-US'] }), 'zh-CN');
  const manual = buildRecognitionLocaleCandidates('hi-IN', ['en-US', 'hi-IN'], { includeEnglishFallback: false });
  assert.ok(manual.includes('hi-IN'));
  assert.ok(!manual.includes('en-US'));
  const automatic = buildRecognitionLocaleCandidates('hi-IN', ['hi-IN'], { includeEnglishFallback: true });
  assert.ok(automatic.includes('en-US'));
});

test('W394B contract and static privacy/capability gate pass', () => {
  assert.deepEqual(validateW394BMultilingualVoiceContract(), []);
  assert.deepEqual(VOICE_LANGUAGE_OPTIONS.map((entry) => entry.value), W394B_MULTILINGUAL_VOICE_CONTRACT.supported);
  assert.deepEqual(W394B_MULTILINGUAL_VOICE_CONTRACT.publishedFullProductLanguages, EON_FULL_PRODUCT_LANGUAGE_CODES);
  assert.deepEqual(W394B_MULTILINGUAL_VOICE_CONTRACT.chatGuideLanguages, EON_CHAT_GUIDE_LANGUAGE_CODES);
  assert.deepEqual(W394B_MULTILINGUAL_VOICE_CONTRACT.supported, EON_VOICE_LANGUAGE_VALUES);
  const report = inspectW394BMultilingualVoice();
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 8);
  assert.match(report.limitations.join(' '), /manual/i);
});

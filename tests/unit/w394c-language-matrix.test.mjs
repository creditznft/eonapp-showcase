import assert from 'node:assert/strict';
import test from 'node:test';
import { W394C_LANGUAGE_MATRIX_CONTRACT, validateW394CLanguageMatrixContract } from '../../config/w394c-language-matrix-contract.mjs';
import { EON_CHAT_GUIDE_LANGUAGE_CODES, EON_CHAT_GUIDE_LANGUAGE_MATRIX, EON_FULL_PRODUCT_LANGUAGE_CODES, EON_FULL_PRODUCT_LANGUAGE_MATRIX, EON_VOICE_LANGUAGE_MATRIX, EON_VOICE_LANGUAGE_VALUES, getEonChatGuideLanguage, getEonFullProductLanguage, getEonVoiceLanguage, normalizeEonFullProductLanguage } from '../../assets/js/utils/language-matrix.js';
import { RC_LANGUAGE_CODES } from '../../assets/js/utils/i18n-rc-registry.js';
import { resolveSpeechLocale } from '../../assets/js/utils/speech-locale.js';
import { inspectW394CLanguageMatrix } from '../../scripts/w394c-language-matrix-gate.mjs';

test('W394C separates one published interface from eleven Chat/Guide and speech capabilities', () => {
  assert.equal(EON_FULL_PRODUCT_LANGUAGE_MATRIX.length, 1);
  assert.equal(EON_CHAT_GUIDE_LANGUAGE_MATRIX.length, 11);
  assert.deepEqual(EON_FULL_PRODUCT_LANGUAGE_CODES, RC_LANGUAGE_CODES);
  assert.equal(getEonFullProductLanguage('pt-BR'), null);
  assert.equal(getEonChatGuideLanguage('pt-BR')?.speechLocale, 'pt-BR');
  assert.equal(getEonVoiceLanguage('zh_cn')?.code, 'zh');
  assert.equal(normalizeEonFullProductLanguage('bn-BD'), '');
  assert.deepEqual(EON_VOICE_LANGUAGE_VALUES, ['auto', ...EON_VOICE_LANGUAGE_MATRIX.map((entry) => entry.speechLocale)]);
});

test('W394C maps deterministic guide/speech language bases to the release speech locales', () => {
  assert.equal(resolveSpeechLocale({ appLanguage: 'pt', browserLocales: ['en-US'] }), 'pt-BR');
  assert.equal(resolveSpeechLocale({ appLanguage: 'zh', browserLocales: ['en-US'] }), 'zh-CN');
  assert.equal(resolveSpeechLocale({ explicitSpeechLocale: 'ja-JP', appLanguage: 'en', browserLocales: ['en-US'] }), 'ja-JP');
});

test('W394C contract and static matrix/voice fallback gate pass', () => {
  assert.deepEqual(validateW394CLanguageMatrixContract(), []);
  assert.deepEqual(W394C_LANGUAGE_MATRIX_CONTRACT.publishedFullProductLanguages, EON_FULL_PRODUCT_LANGUAGE_CODES);
  assert.deepEqual(W394C_LANGUAGE_MATRIX_CONTRACT.chatGuideLanguages, EON_CHAT_GUIDE_LANGUAGE_CODES);
  const report = inspectW394CLanguageMatrix();
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 10);
  assert.match(report.limitations.join(' '), /manual/i);
});

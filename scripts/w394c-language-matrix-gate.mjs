#!/usr/bin/env node
/** W394C source gate: shared product language matrix and truthful browser voice fallback. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W394C_LANGUAGE_MATRIX_CONTRACT, validateW394CLanguageMatrixContract } from '../config/w394c-language-matrix-contract.mjs';
import { EON_CHAT_GUIDE_LANGUAGE_CODES, EON_FULL_PRODUCT_LANGUAGE_CODES, EON_VOICE_LANGUAGE_VALUES } from '../assets/js/utils/language-matrix.js';
import { VOICE_LANGUAGE_OPTIONS } from '../assets/js/chat/voice-language-preferences.js';
import { RC_LANGUAGE_CODES } from '../assets/js/utils/i18n-rc-registry.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW394CLanguageMatrix() {
  const matrix = read('assets/js/utils/language-matrix.js');
  const registry = read('assets/js/utils/i18n-rc-registry.js');
  const appLanguage = read('assets/js/utils/app-language.js');
  const preference = read('assets/js/chat/voice-language-preferences.js');
  const locale = read('assets/js/utils/speech-locale.js');
  const chat = read('assets/js/chat-page.js');
  const html = read('index.html');
  const profileHtml = read('profile.html');
  const profilePage = read('assets/js/profile-page.js');
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };

  check('contract-valid', validateW394CLanguageMatrixContract().length === 0, 'W394C contract has no internal violations');
  check('matrix-versioned', /EON_LANGUAGE_MATRIX_VERSION/.test(matrix) && /EON_FULL_PRODUCT_LANGUAGE_MATRIX/.test(matrix), 'versioned language matrix exists');
  check('matrix-capability-sets', JSON.stringify(EON_FULL_PRODUCT_LANGUAGE_CODES) === JSON.stringify(['en']) && EON_CHAT_GUIDE_LANGUAGE_CODES.length === 11 && EON_CHAT_GUIDE_LANGUAGE_CODES.includes('zh') && EON_CHAT_GUIDE_LANGUAGE_CODES.includes('hi'), 'English is the only published interface while eleven Chat/Guide languages remain available');
  check('ui-uses-matrix', /from '\.\/language-matrix\.js'/.test(registry) && JSON.stringify(RC_LANGUAGE_CODES) === JSON.stringify(EON_FULL_PRODUCT_LANGUAGE_CODES), 'public UI registry derives from the shared matrix');
  check('guide-uses-matrix', /isEonChatGuideLanguage/.test(appLanguage) && /resolveChatLanguage\(\)/.test(chat) && /translateChatUi/.test(chat), 'Guide language resolves through the Chat/Guide capability set');
  check('speech-uses-matrix', /EON_VOICE_LANGUAGE_MATRIX/.test(preference) && /EON_VOICE_LANGUAGE_MATRIX/.test(locale) && JSON.stringify(VOICE_LANGUAGE_OPTIONS.map((entry) => entry.value)) === JSON.stringify(EON_VOICE_LANGUAGE_VALUES), 'speech preferences and locale helpers derive from the browser-speech matrix');
  check('selector-release-set', JSON.stringify(VOICE_LANGUAGE_OPTIONS.map((entry) => entry.value)) === JSON.stringify(EON_VOICE_LANGUAGE_VALUES) && !VOICE_LANGUAGE_OPTIONS.some((entry) => /^(?:bn-BD|id-ID)$/.test(entry.value)), 'the hidden Profile speech selector uses exactly the launch matrix and does not overclaim deferred languages');
  check('runtime-selector-sync', /VOICE_LANGUAGE_OPTIONS/.test(profilePage) && /speechSelect\.appendChild\(option\)/.test(profilePage) && /VOICE_LANGUAGE_OPTIONS/.test(chat) && /select\.replaceChildren\(\)/.test(chat), 'Profile renders from the shared matrix and the compatibility chat selector repairs from the same source when present');
  check('manual-choice-preserved', /if \(next !== 'auto' && option\.language/.test(chat) && /setChatLanguagePreference\(option\.language\)/.test(chat) && !/if \(next === 'auto'[^\n]*setChatLanguagePreference/.test(chat), 'manual voice choice changes the chat language only when deliberately selected');
  check('visible-unsupported-fallback', /dictateBtn\.hidden = !voice\.showDictate/.test(chat) && /dictateBtn\.disabled = !voice\.dictationReady/.test(chat) && /speechLanguageWrap\.hidden = true/.test(chat) && /const show = voice\.activeAi && !voice\.dictationReady/.test(chat) && /speechSupportNote\.hidden = !show/.test(chat) && /Browser speech is not supported here\. You can keep typing/.test(chat) && /id="chat-speech-support-note"/.test(html), 'voice controls fail clearly when unsupported while the language override stays out of the main header');
  check('profile-language-settings', /id="eon-profile-speech-language"/.test(profileHtml) && /VOICE_LANGUAGE_OPTIONS/.test(profilePage) && /Auto — follow chat or device language/.test(profilePage), 'Profile owns the speech language override and Auto follows the current chat or device language');
  check('privacy-boundaries', !/\b(?:audioBlob|recording|mediaRecorder|audioData|transcriptStore)\b/i.test(`${matrix}\n${preference}\n${chat}`) && !/fetch\(['"]\/api\/(?:speech|voice)/.test(chat), 'the matrix/voice wave does not add audio storage or remote speech transport');

  return Object.freeze({ schema: 'eonapp.w394c.language-matrix-gate.v1', wave: 'W394C', status: 'pass', checkCount: checks.length, checks, limitations: Object.freeze(['Static source verification only.', 'Browser speech recognition support, microphone permission and actual language recognition require target-device manual proof.']) });
}

export function runW394CLanguageMatrixGate({ writeArtifact = true } = {}) {
  const result = inspectW394CLanguageMatrix();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w394c-language-matrix-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW394CLanguageMatrixGate();
  process.stdout.write(`W394C language matrix gate passed (${result.checkCount}/${result.checkCount}).\n`);
}

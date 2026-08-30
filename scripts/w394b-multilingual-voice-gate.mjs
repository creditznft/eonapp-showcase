#!/usr/bin/env node
/** W394B source gate: language selector, manual locale behavior, and no audio/transcript retention. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W394B_MULTILINGUAL_VOICE_CONTRACT, validateW394BMultilingualVoiceContract } from '../config/w394b-multilingual-voice-contract.mjs';
import { VOICE_LANGUAGE_OPTIONS, normalizeVoiceLanguagePreference } from '../assets/js/chat/voice-language-preferences.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW394BMultilingualVoice() {
  const chat = read('assets/js/chat-page.js');
  const html = read('index.html');
  const profileHtml = read('profile.html');
  const profilePage = read('assets/js/profile-page.js');
  const locale = read('assets/js/utils/speech-locale.js');
  const preference = read('assets/js/chat/voice-language-preferences.js');
  const threads = read('assets/js/utils/chat-threads.js');
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };

  check('contract-valid', validateW394BMultilingualVoiceContract().length === 0, 'W394B contract has no internal violations');
  check('settings-ui', !/id="chat-speech-language"/.test(html) && /id="eon-profile-speech-language"/.test(profileHtml) && /VOICE_LANGUAGE_OPTIONS/.test(profilePage) && /readVoiceLanguagePreference/.test(profilePage), 'speech language overrides use the matrix-backed Profile settings and stay out of the main chat header');
  check('local-preference-only', /EON_VOICE_LANGUAGE_PREFERENCE_KEY/.test(preference) && !/\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource)\s*\(/.test(preference), 'voice language preference is local and has no transport');
  check('manual-locale', /explicitSpeechLocale/.test(locale) && /includeEnglishFallback/.test(locale) && /languageFallbackMustRespectManualChoice|includeEnglishFallback: !isManualSpeechLanguage/.test(chat), 'manual voice selection feeds explicit recognition locale without forced English fallback');
  check('browser-capability-truth', /recognitionSupported/.test(chat) && /dictateBtn\.hidden = !voice\.showDictate/.test(chat) && /dictateBtn\.disabled = !voice\.dictationReady/.test(chat) && /speechLanguageWrap\.hidden = true/.test(chat) && /speechSupportNote\.hidden = !show/.test(chat), 'voice controls are capability-gated while language selection stays in Profile');
  check('user-tap-and-metadata', /function startVoiceInput\(session = 'dictate', \{ explicitUserAction = false \} = \{\}\)/.test(chat) && /handleSend\(finalText, \{/.test(chat) && /speech: \{ locale: String\(_voiceRecognition/.test(chat), 'voice starts from explicit control and retains only selected locale metadata on a sent message');
  check('no-audio-or-transcript-store', !/\b(?:audioBlob|recording|mediaRecorder|audioData|transcriptStore)\b/i.test(`${preference}\n${threads}`) && /sanitizeSpeechMetadata/.test(threads), 'thread store sanitizes only locale/preference and has no audio or separate transcript store');
  check('supported-set', JSON.stringify(VOICE_LANGUAGE_OPTIONS.map((entry) => entry.value)) === JSON.stringify(W394B_MULTILINGUAL_VOICE_CONTRACT.supported), 'preference options and W394B contract stay aligned');
  check('preference-normalization', normalizeVoiceLanguagePreference('HI_in') === 'hi-IN' && normalizeVoiceLanguagePreference('unexpected') === 'auto', 'voice preference accepts known locales and fails closed');

  return Object.freeze({ schema: 'eonapp.w394b.multilingual-voice-gate.v1', wave: 'W394B', status: 'pass', checkCount: checks.length, checks, limitations: Object.freeze(['Static source verification only.', 'Browser speech recognition support, microphone permission, and actual language recognition must be manually tested on target devices.']) });
}

export function runW394BMultilingualVoiceGate({ writeArtifact = true } = {}) {
  const result = inspectW394BMultilingualVoice();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w394b-multilingual-voice-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW394BMultilingualVoiceGate();
  process.stdout.write(`W394B multilingual voice gate passed (${result.checkCount}/${result.checkCount}).\n`);
}

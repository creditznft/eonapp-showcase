#!/usr/bin/env node
/** W562 source gate — explicit City microphone/dictation consent, captions-first review. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const required = Object.freeze([
  'assets/js/voice/eon-voice-consent.js',
  'assets/js/city/eon-city-voice-consent.js',
  'assets/js/eon-city-play-station.js',
  'tests/unit/w562-city-voice-consent.test.mjs',
  'scripts/run-current-unit-suite.mjs'
]);
const errors = [];
for (const relative of required) if (!exists(relative)) errors.push(`missing:${relative}`);
const files = Object.fromEntries(required.map((relative) => [relative, exists(relative) ? read(relative) : '']));
const need = (text, expression, code) => { if (!expression.test(text)) errors.push(code); };
const forbid = (text, expression, code) => { if (expression.test(text)) errors.push(code); };

const voice = files['assets/js/voice/eon-voice-consent.js'];
const cityCompatibility = files['assets/js/city/eon-city-voice-consent.js'];
const station = files['assets/js/eon-city-play-station.js'];
const unit = files['tests/unit/w562-city-voice-consent.test.mjs'];
const runner = files['scripts/run-current-unit-suite.mjs'];

need(cityCompatibility, /export \* from '\.\.\/voice\/eon-voice-consent\.js'/, 'city-voice-compatibility-reexport-missing');
need(voice, /EON_CITY_VOICE_CONSENT_SCHEMA\s*=\s*'eon\.city\.voice-consent\.w562\.v1'/, 'voice-schema-missing');
need(voice, /getEonCityVoiceCapability/, 'voice-capability-receipt-missing');
need(voice, /createEonCityVoiceConsentController/, 'voice-controller-missing');
need(voice, /captionsFirst:\s*true/, 'captions-first-boundary-missing');
need(voice, /explicitMicrophoneActionRequired:\s*true/, 'explicit-microphone-boundary-missing');
need(voice, /explicitDictationActionRequired:\s*true/, 'explicit-dictation-boundary-missing');
need(voice, /continuousListening:\s*false/, 'continuous-listening-boundary-missing');
need(voice, /backgroundListening:\s*false/, 'background-listening-boundary-missing');
need(voice, /audioPersisted:\s*false/, 'audio-persistence-boundary-missing');
need(voice, /transcriptPersisted:\s*false/, 'transcript-persistence-boundary-missing');
need(voice, /automaticChatSend:\s*false/, 'auto-send-boundary-missing');
need(voice, /automaticRoute:\s*false/, 'auto-route-boundary-missing');
need(voice, /automaticToolExecution:\s*false/, 'auto-tool-boundary-missing');
need(voice, /providerRequestCreated:\s*false/, 'provider-boundary-missing');
need(voice, /localSpeechModelClaimed:\s*false/, 'local-model-claim-boundary-missing');
need(voice, /physicalDeviceProven:\s*false/, 'device-proof-boundary-missing');
need(voice, /languageDeviceProven:\s*false/, 'language-proof-boundary-missing');
need(voice, /instance\.continuous\s*=\s*false/, 'single-utterance-dictation-missing');
need(voice, /instance\.interimResults\s*=\s*true/, 'caption-interim-results-missing');
need(voice, /track\?\.stop\?\./, 'permission-check-track-stop-missing');
forbid(voice, /(?:localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|WebSocket|EventSource|MediaRecorder)\s*[.(]/i, 'voice-consent-must-not-store-record-or-network');
need(station, /bindEonbotVoiceConsentPanel/, 'station-voice-panel-binder-missing');
need(station, /data-eon-play-open-voice-consent/, 'station-voice-open-control-missing');
need(station, /data-eon-play-voice-consent-panel/, 'station-voice-panel-missing');
need(station, /Check microphone permission/, 'station-explicit-permission-copy-missing');
need(station, /Start Dictation/, 'station-explicit-dictation-copy-missing');
need(station, /never transfers text automatically/, 'station-no-auto-transfer-copy-missing');
need(unit, /W562 requires explicit microphone check/, 'w562-explicit-consent-unit-missing');
need(unit, /W562 keeps browser dictation review text memory-only/, 'w562-memory-only-unit-missing');
need(runner, /w562-city-voice-consent\.test\.mjs/, 'w562-current-suite-registration-missing');

const CHECK_COUNT = 31;
export function inspectW562CityVoiceConsent() {
  return Object.freeze({ wave: 'W562', status: errors.length ? 'fail' : 'pass', checkCount: CHECK_COUNT - errors.length, requiredCount: required.length, errors: Object.freeze([...errors]) });
}
const report = inspectW562CityVoiceConsent();
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w562-city-voice-consent-gate.json'), `${JSON.stringify(report, null, 2)}\n`);
if (report.status !== 'pass') {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}

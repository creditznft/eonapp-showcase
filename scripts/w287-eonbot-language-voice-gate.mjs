#!/usr/bin/env node
/** W287-A0 — source-only EONBOT language/voice/personalization boundary gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W287_EONBOT_LANGUAGE_VOICE_SCHEMA,
  validateW287EonbotLanguageVoiceBoard
} from '../config/w287-eonbot-language-voice-contract.mjs';
import {
  clearEonbotInteractionPreferences,
  readEonbotInteractionPreferences,
  setEonbotInteractionPreferences
} from '../assets/js/chat/eonbot-interaction-preferences.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOARD_PATH = 'release-evidence/W287_EONBOT_LANGUAGE_VOICE_SOURCE_READINESS_2026-06-25/W287_BOARD.json';

function read(root, relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function memoryStorage() {
  const rows = new Map();
  return {
    getItem(key) { return rows.get(String(key)) ?? null; },
    setItem(key, value) { rows.set(String(key), String(value)); },
    removeItem(key) { rows.delete(String(key)); }
  };
}

function noRemoteEffectPattern(source = '') {
  return !/\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource)\s*\(/.test(source);
}

export function runW287EonbotLanguageVoiceGate(root = ROOT) {
  const errors = [];
  const board = JSON.parse(read(root, BOARD_PATH));
  errors.push(...validateW287EonbotLanguageVoiceBoard(board).errors);
  const preferencesSource = read(root, 'assets/js/chat/eonbot-interaction-preferences.js');
  const chatSource = read(root, 'assets/js/chat-page.js');
  const profileSource = read(root, 'assets/js/profile-page.js');
  const profileHtml = read(root, 'profile.html');
  const plan = read(root, 'docs/W260_R3_W255_W290_CANONICAL_CONTINUATION_PLAN_2026-06-25.md');
  const packageJson = JSON.parse(read(root, 'package.json'));
  const storage = memoryStorage();

  const initial = readEonbotInteractionPreferences({ storage });
  if (initial.voiceOutputEnabled || initial.continuousVoiceEnabled || initial.personalizedGreetingEnabled) errors.push('W287 local interaction preferences must default off.');
  const enabled = setEonbotInteractionPreferences({ voiceOutputEnabled: true, continuousVoiceEnabled: true, personalizedGreetingEnabled: true, ignored: 'nope' }, { storage });
  if (!enabled.voiceOutputEnabled || !enabled.continuousVoiceEnabled || !enabled.personalizedGreetingEnabled || Object.hasOwn(enabled, 'ignored')) errors.push('W287 preference normalization drifted.');
  const cleared = clearEonbotInteractionPreferences({ storage });
  if (cleared.voiceOutputEnabled || cleared.continuousVoiceEnabled || cleared.personalizedGreetingEnabled) errors.push('W287 preference reset must return every control to opt-in/off.');

  if (board.schema !== W287_EONBOT_LANGUAGE_VOICE_SCHEMA) errors.push('W287 board schema drifted.');
  if (!/voiceOutputEnabled:\s*false/.test(preferencesSource) || !/continuousVoiceEnabled:\s*false/.test(preferencesSource) || !/personalizedGreetingEnabled:\s*false/.test(preferencesSource)) errors.push('W287 source lost its default-off interaction controls.');
  if (!noRemoteEffectPattern(preferencesSource) || /(?:transcript|recording|providerKey|contactId)\s*:/.test(preferencesSource)) errors.push('W287 preference store must not add remote transport or payload retention.');
  if (!/readEonbotInteractionPreferences/.test(chatSource) || !/setEonbotInteractionPreferences/.test(chatSource) || /ttsEnabled:\s*true/.test(chatSource)) errors.push('Chat must read explicit W287 preferences and must not default voice output on.');
  if (!/personalizedGreetingEnabled/.test(chatSource) || !/Voice output stays off until you enable it/.test(chatSource)) errors.push('Chat must keep the W287 reviewed greeting and default-off voice-output truth boundary.');
  if (!/eon-profile-eonbot-language/.test(profileSource) || !/eon-profile-eonbot-voice-toggle/.test(profileSource) || !/eon-profile-eonbot-clear-preferences/.test(profileSource)) errors.push('Profile must bind W287 language, voice and reset controls.');
  if (!/eon-profile-eonbot-language/.test(profileHtml) || !/Microphone input never starts here/.test(profileHtml) || !/Allow spoken replies on this browser/.test(profileHtml)) errors.push('Profile must expose truthful W287 controls, a separate microphone action and default-off spoken replies.');
  if (!/W287 \| EONBOT language\/voice\/personalization accessibility \| \*\*W287-A0 source baseline complete/.test(plan)) errors.push('Canonical plan must retain W287-A0 source baseline and pending-evidence boundary.');
  if (!packageJson.scripts?.['qa:w287-eonbot-language-voice']) errors.push('package.json is missing the W287 QA script.');

  const report = {
    schema: 'eonapp.w287.eonbot-language-voice-source-gate-report.v1',
    wave: 'W287-A0',
    ok: errors.length === 0,
    interpretation: 'PASS proves local default-off interaction preferences and typed fallback boundaries in source. It is not a browser, microphone, voice, language, accessibility, privacy, beta or launch result.',
    errors
  };
  const artifactDir = path.join(root, 'artifacts', 'w287-eonbot-language-voice-gate');
  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(path.join(artifactDir, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

function main() {
  const report = runW287EonbotLanguageVoiceGate();
  if (!report.ok) {
    console.error(JSON.stringify(report, null, 2));
    return 1;
  }
  console.log('W287 EONBOT language/voice source gate passed: explicit local opt-ins and typed fallback boundaries preserved.');
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();

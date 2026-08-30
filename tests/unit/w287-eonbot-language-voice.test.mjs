import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EONBOT_INTERACTION_PREFERENCES_KEY,
  clearEonbotInteractionPreferences,
  readEonbotInteractionPreferences,
  setEonbotInteractionPreferences
} from '../../assets/js/chat/eonbot-interaction-preferences.js';
import { runW287EonbotLanguageVoiceGate } from '../../scripts/w287-eonbot-language-voice-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const gate = path.join(root, 'scripts', 'w287-eonbot-language-voice-gate.mjs');
const preferencesPath = path.join(root, 'assets', 'js', 'chat', 'eonbot-interaction-preferences.js');

function memoryStorage() {
  const rows = new Map();
  return {
    getItem(key) { return rows.get(String(key)) ?? null; },
    setItem(key, value) { rows.set(String(key), String(value)); },
    removeItem(key) { rows.delete(String(key)); }
  };
}

test('W287 defaults EONBOT voice, continuous listening and personalized greeting off', () => {
  const storage = memoryStorage();
  const initial = readEonbotInteractionPreferences({ storage });
  assert.equal(initial.voiceOutputEnabled, false);
  assert.equal(initial.continuousVoiceEnabled, false);
  assert.equal(initial.personalizedGreetingEnabled, false);
  const enabled = setEonbotInteractionPreferences({ voiceOutputEnabled: true, continuousVoiceEnabled: true, personalizedGreetingEnabled: true, transcript: 'do not persist' }, { storage });
  assert.equal(enabled.voiceOutputEnabled, true);
  assert.equal(enabled.continuousVoiceEnabled, true);
  assert.equal(enabled.personalizedGreetingEnabled, true);
  assert.equal(Object.hasOwn(enabled, 'transcript'), false);
  assert.doesNotMatch(String(storage.getItem(EONBOT_INTERACTION_PREFERENCES_KEY)), /transcript/i);
  const cleared = clearEonbotInteractionPreferences({ storage });
  assert.equal(cleared.voiceOutputEnabled, false);
  assert.equal(cleared.continuousVoiceEnabled, false);
  assert.equal(cleared.personalizedGreetingEnabled, false);
});

test('W287 source gate passes and fails closed if voice output default becomes on', () => {
  const report = runW287EonbotLanguageVoiceGate(root);
  assert.equal(report.ok, true, report.errors.join('\n'));
  const original = fs.readFileSync(preferencesPath, 'utf8');
  try {
    fs.writeFileSync(preferencesPath, original.replace('voiceOutputEnabled: false', 'voiceOutputEnabled: true'));
    const result = spawnSync(process.execPath, [gate], { cwd: root, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /default-off|opt-in\/off/);
  } finally {
    fs.writeFileSync(preferencesPath, original);
  }
});

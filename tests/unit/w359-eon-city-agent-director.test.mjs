import assert from 'node:assert/strict';
import test from 'node:test';
import { W359_EON_CITY_AGENT_DIRECTOR_CONTRACT, validateW359EonCityAgentDirectorContract } from '../../config/w359-eon-city-agent-director-contract.mjs';
import { getCityAgentDirectorTruth, resolveCityAgentVisual } from '../../assets/js/city/eon-city-agent-director.js';
import { getAgentPresenceProviderLabel, recordAgentPresence, saveAgentPresencePreferences } from '../../assets/js/operator/agent-presence.js';
import { runW359EonCityAgentDirectorGate } from '../../scripts/w359-eon-city-agent-director-gate.mjs';

function memoryStorage() { const values = new Map(); return { getItem: (key) => values.get(String(key)) ?? null, setItem: (key, value) => values.set(String(key), String(value)), removeItem: (key) => values.delete(String(key)) }; }

test('W359 retains original City character direction and requires local opt-in before provider identity appears', () => {
  const storage = memoryStorage();
  const result = recordAgentPresence({ source: 'eon-ai-kernel', workRef: 'task-w359', action: 'code', role: 'builder', status: 'active', providerId: 'groq', prompt: 'do-not-save', output: 'do-not-save', model: 'do-not-save', apiKey: 'do-not-save' }, { storage });
  assert.equal(result.ok, true);
  assert.equal(result.entry.providerId, 'groq');
  assert.equal(getAgentPresenceProviderLabel(result.entry.providerId), 'Groq');
  const hidden = resolveCityAgentVisual(result.entry, saveAgentPresencePreferences({ enabled: true, detailLevel: 'summary' }, { storage }));
  const shown = resolveCityAgentVisual(result.entry, saveAgentPresencePreferences({ enabled: true, detailLevel: 'provider-identity' }, { storage }));
  assert.equal(hidden.providerVisible, false);
  assert.equal(shown.providerVisible, true);
  assert.match(shown.title, /Groq/);
  assert.equal(shown.providerOfficialCharacter, false);
  assert.equal(shown.foregroundOnly, true);
  assert.equal(shown.promptVisible, false);
  assert.equal(shown.modelVisible, false);
  assert.equal(shown.credentialVisible, false);
  assert.doesNotMatch(storage.getItem('eon:agent:presence:v1') || '', /do-not-save/);
});

test('W359 rejects arbitrary provider identifiers and keeps the City director bounded', () => {
  const storage = memoryStorage();
  const result = recordAgentPresence({ source: 'eon-ai-kernel', workRef: 'task-w359-unknown', action: 'chat', status: 'active', providerId: 'https://unsafe.example?key=nope' }, { storage });
  assert.equal(result.entry.providerId, 'guide');
  assert.equal(result.entry.providerLabel, 'Guide only');
  assert.doesNotMatch(storage.getItem('eon:agent:presence:v1') || '', /unsafe|nope/);
  assert.equal(validateW359EonCityAgentDirectorContract().ok, true);
  assert.equal(W359_EON_CITY_AGENT_DIRECTOR_CONTRACT.snapshot.maxZipBytes, 20 * 1024 * 1024);
  assert.equal(getCityAgentDirectorTruth().providerCalls, false);
  assert.equal(runW359EonCityAgentDirectorGate().ok, true);
});

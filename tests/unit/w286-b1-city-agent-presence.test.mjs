import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { W286_B1_AGENT_PRESENCE_CONTRACT, validateW286B1AgentPresenceContract } from '../../config/w286-b1-agent-presence-contract.mjs';
import { AGENT_PRESENCE_MAX_VISIBLE, clearAgentPresence, describeAgentPresence, getAgentPresenceSummary, listAgentPresence, readAgentPresencePreferences, recordAgentPresence, recordAgentPresenceFromOperatorActivity, saveAgentPresencePreferences } from '../../assets/js/operator/agent-presence.js';

function memoryStorage() { const rows = new Map(); return { getItem: (key) => rows.get(String(key)) ?? null, setItem: (key, value) => rows.set(String(key), String(value)), removeItem: (key) => rows.delete(String(key)) }; }
const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W286-B1 accepts only bounded local lifecycle projections and strips sensitive fields', () => {
  const storage = memoryStorage();
  const result = recordAgentPresence({ source: 'mission-engine', workRef: 'mission-1', action: 'hive', status: 'active', phase: 'working', providerId: 'groq', prompt: 'secret prompt', response: 'secret response', model: 'model-x', apiKey: 'secret' }, { storage });
  assert.equal(result.ok, true);
  assert.equal(result.entry.providerKind, 'cloud');
  assert.equal(Object.hasOwn(result.entry, 'prompt'), false);
  assert.equal(Object.hasOwn(result.entry, 'response'), false);
  assert.equal(Object.hasOwn(result.entry, 'model'), false);
  assert.equal(Object.hasOwn(result.entry, 'apiKey'), false);
  assert.doesNotMatch(storage.getItem('eon:agent:presence:v1') || '', /secret prompt|secret response|model-x|secret/);
  assert.equal(recordAgentPresenceFromOperatorActivity({ id: 'city', source: 'city', status: 'active' }, { storage }).reason, 'activity-not-agent-eligible');
});

test('W286-B1 remains bounded and gives users local visibility/detail controls', () => {
  const storage = memoryStorage();
  clearAgentPresence({ storage });
  for (let index = 0; index < 7; index += 1) recordAgentPresence({ source: 'agent-executor', workRef: `job-${index}`, action: index % 2 ? 'code' : 'research', status: 'active', phase: 'working', providerId: index % 2 ? 'local' : 'cloud' }, { storage });
  const summary = getAgentPresenceSummary({ storage });
  assert.equal(summary.active.length, AGENT_PRESENCE_MAX_VISIBLE);
  assert.equal(listAgentPresence({ storage, activeOnly: true }).length, 7);
  assert.equal(readAgentPresencePreferences({ storage }).detailLevel, 'summary');
  const prefs = saveAgentPresencePreferences({ enabled: false, detailLevel: 'provider-category' }, { storage });
  assert.equal(prefs.enabled, false);
  assert.equal(prefs.detailLevel, 'provider-category');
  const cue = describeAgentPresence(summary.active[0], { enabled: true, detailLevel: 'provider-category' });
  assert.match(cue.bubble, /cloud provider|local runtime|guide/);
});

test('W286-B1 wires City Lite, Three.js Visual Tour and Babylon City Play without a second agent runtime', () => {
  assert.equal(validateW286B1AgentPresenceContract().ok, true);
  assert.equal(W286_B1_AGENT_PRESENCE_CONTRACT.cityPlay.autonomousAgentRuntime, false);
  const sources = ['assets/js/eon-operator-map.js', 'assets/js/eon-city-3d-station.js', 'assets/js/city/eon-city-3d-renderer.js', 'assets/js/eon-city-play-station.js', 'assets/js/city/eon-city-play-babylon.js'].map(read).join('\n');
  assert.match(sources, /drawAgentPresence/);
  assert.match(sources, /setAgentPresence/);
  assert.match(sources, /bindAgentPresencePanel/);
  assert.doesNotMatch(sources, /\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource)\s*\(/);
  assert.doesNotMatch(sources, /location\.assign|window\.location\s*=/);
});

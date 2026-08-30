import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { W286_B3_CITY_OUTCOME_RELAY_CONTRACT, validateW286B3CityOutcomeRelayContract } from '../../config/w286-b3-city-outcome-relay-contract.mjs';
import { getAgentPresenceOutcome, getAgentPresenceSummary, recordAgentPresence } from '../../assets/js/operator/agent-presence.js';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
function memoryStorage() { const rows = new Map(); return { getItem: (key) => rows.get(String(key)) ?? null, setItem: (key, value) => rows.set(String(key), String(value)), removeItem: (key) => rows.delete(String(key)) }; }

test('W286-B3 relays only a finite, status-only outcome', () => {
  const storage = memoryStorage();
  recordAgentPresence({ source: 'agent-executor', workRef: 'job-1', action: 'code', status: 'complete', phase: 'complete', prompt: 'private prompt', response: 'private answer', providerLabel: 'private model' }, { storage });
  const relay = getAgentPresenceOutcome(getAgentPresenceSummary({ storage }));
  assert.equal(relay.mode, 'result-ready');
  assert.equal(relay.visible, true);
  assert.equal(relay.localOnly, true);
  assert.equal(relay.externalEffect, false);
  assert.equal(Object.hasOwn(relay, 'workRef'), false);
  assert.doesNotMatch(JSON.stringify(relay), /private prompt|private answer|private model/);
  recordAgentPresence({ source: 'agent-executor', workRef: 'job-1', action: 'code', status: 'waiting', phase: 'waiting-approval' }, { storage });
  assert.equal(getAgentPresenceOutcome(getAgentPresenceSummary({ storage })).mode, 'review');
  recordAgentPresence({ source: 'agent-executor', workRef: 'job-1', action: 'code', status: 'failed', phase: 'failed' }, { storage });
  assert.equal(getAgentPresenceOutcome(getAgentPresenceSummary({ storage })).mode, 'attention');
  recordAgentPresence({ source: 'agent-executor', workRef: 'job-1', action: 'code', status: 'active', phase: 'working' }, { storage });
  assert.equal(getAgentPresenceOutcome(getAgentPresenceSummary({ storage })).mode, 'none');
});

test('W286-B3 keeps City status-only and native review user-controlled', () => {
  assert.equal(validateW286B3CityOutcomeRelayContract().ok, true);
  assert.equal(W286_B3_CITY_OUTCOME_RELAY_CONTRACT.outcome.rawOutput, false);
  assert.equal(W286_B3_CITY_OUTCOME_RELAY_CONTRACT.commandLoop.cityResultStorage, false);
  const sources = ['assets/js/eon-operator-map.js', 'assets/js/eon-city-3d-station.js', 'assets/js/city/eon-city-3d-renderer.js', 'assets/js/eon-city-play-station.js', 'assets/js/city/eon-city-play-babylon.js'].map(read).join('\n');
  assert.match(sources, /drawAgentOutcomeBeacon/);
  assert.match(sources, /makeAgentPresenceOutcomeBeacon/);
  assert.match(sources, /Review in Chat/);
  assert.doesNotMatch(sources, /resultText|outputPreview|transcriptPreview|promptPreview/i);
  assert.doesNotMatch(sources, /\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource)\s*\(/);
  assert.doesNotMatch(sources, /location\.assign|window\.location\s*=/);
});

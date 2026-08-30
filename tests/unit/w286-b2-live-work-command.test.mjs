import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { W286_B2_LIVE_WORK_COMMAND_CONTRACT, validateW286B2LiveWorkCommandContract } from '../../config/w286-b2-live-work-command-contract.mjs';
import { getAgentPresenceCollaboration, getAgentPresenceSummary, recordAgentPresence } from '../../assets/js/operator/agent-presence.js';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
function memoryStorage() { const rows = new Map(); return { getItem: (key) => rows.get(String(key)) ?? null, setItem: (key, value) => rows.set(String(key), String(value)), removeItem: (key) => rows.delete(String(key)) }; }

test('W286-B2 derives a truthful huddle from bounded recorded status only', () => {
  const storage = memoryStorage();
  recordAgentPresence({ source: 'agent-executor', workRef: 'build-1', action: 'code', status: 'active', phase: 'working', prompt: 'do-not-store' }, { storage });
  recordAgentPresence({ source: 'agent-executor', workRef: 'research-1', action: 'research', status: 'active', phase: 'working', response: 'do-not-store' }, { storage });
  const parallel = getAgentPresenceCollaboration(getAgentPresenceSummary({ storage }).active);
  assert.equal(parallel.mode, 'parallel');
  assert.equal(parallel.activeCount, 2);
  assert.equal(parallel.externalEffect, false);
  assert.equal(parallel.localOnly, true);
  assert.doesNotMatch(JSON.stringify(parallel), /do-not-store/);
  recordAgentPresence({ source: 'agent-executor', workRef: 'build-1', action: 'code', status: 'handoff', phase: 'review' }, { storage });
  assert.equal(getAgentPresenceSummary({ storage }).collaboration.mode, 'handoff');
});

test('W286-B2 keeps City as a visual command layer and Chat as the native control surface', () => {
  assert.equal(validateW286B2LiveWorkCommandContract().ok, true);
  assert.equal(W286_B2_LIVE_WORK_COMMAND_CONTRACT.commandLoop.nativeChatControl, true);
  assert.equal(W286_B2_LIVE_WORK_COMMAND_CONTRACT.commandLoop.cityTaskInitiation, false);
  const sources = ['assets/js/eon-operator-map.js', 'assets/js/city/eon-city-3d-renderer.js', 'assets/js/eon-city-play-station.js', 'assets/js/city/eon-city-play-babylon.js'].map(read).join('\n');
  assert.match(sources, /getAgentPresenceCollaboration/);
  assert.match(sources, /makeAgentPresenceHuddle/);
  assert.match(sources, /Live crew/);
  assert.match(sources, /Manage in Chat/);
  assert.doesNotMatch(sources, /\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource)\s*\(/);
  assert.doesNotMatch(sources, /location\.assign|window\.location\s*=/);
});

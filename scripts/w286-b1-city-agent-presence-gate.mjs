#!/usr/bin/env node
/** W286-B1 — truthful local Agent Presence bridge source gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W286_B1_AGENT_PRESENCE_CONTRACT, validateW286B1AgentPresenceContract } from '../config/w286-b1-agent-presence-contract.mjs';
import { AGENT_PRESENCE_MAX_VISIBLE, getAgentPresenceSummary, recordAgentPresence, recordAgentPresenceFromOperatorActivity } from '../assets/js/operator/agent-presence.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const memoryStorage = () => { const rows = new Map(); return { getItem: (key) => rows.get(String(key)) ?? null, setItem: (key, value) => rows.set(String(key), String(value)), removeItem: (key) => rows.delete(String(key)) }; };

export function runW286B1CityAgentPresenceGate(root = ROOT) {
  const errors = [];
  const assert = (condition, message) => { if (!condition) errors.push(message); };
  const contract = validateW286B1AgentPresenceContract();
  errors.push(...contract.errors);
  assert(AGENT_PRESENCE_MAX_VISIBLE === W286_B1_AGENT_PRESENCE_CONTRACT.visibility.maxVisibleAgents, 'Agent Presence visible actor cap drifted.');
  const presence = read('assets/js/operator/agent-presence.js');
  const activity = read('assets/js/operator/operator-activity.js');
  const mission = read('assets/js/utils/mission-engine.js');
  const executor = read('assets/js/utils/agent-executor.js');
  const lite = read('assets/js/eon-operator-map.js');
  const tourStation = read('assets/js/eon-city-3d-station.js');
  const tourRenderer = read('assets/js/city/eon-city-3d-renderer.js');
  const playStation = read('assets/js/eon-city-play-station.js');
  const play = read('assets/js/city/eon-city-play-babylon.js');
  const packageJson = JSON.parse(read('package.json'));
  const inspected = `${presence}\n${activity}\n${mission}\n${executor}\n${lite}\n${tourStation}\n${tourRenderer}\n${playStation}\n${play}`;
  assert(/AGENT_PRESENCE_MAX_VISIBLE\s*=\s*4/.test(presence), 'Presence module must keep its hard actor cap.');
  assert(/recordAgentPresenceFromOperatorActivity/.test(activity), 'Operator activity must project only eligible lifecycle facts into Agent Presence.');
  assert(/recordAgentPresence/.test(mission) && /recordAgentPresence/.test(executor), 'Mission engine and executor must record lifecycle presence facts.');
  assert(/drawAgentPresence/.test(lite) && /getAgentPresenceSummary/.test(lite), 'City Lite must render truthful Agent Presence cues.');
  assert(/setAgentPresence/.test(tourRenderer) && /subscribeAgentPresence/.test(tourStation), 'Three.js Visual Tour must receive live local presence updates.');
  assert(/setAgentPresence/.test(play) && /bindAgentPresencePanel/.test(playStation), 'Babylon City Play must receive presence updates with a visible boundary panel.');
  assert(!/\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource)\s*\(/.test(inspected), 'W286-B1 Agent Presence must not add remote transport.');
  assert(!/location\.assign|window\.location\s*=|location\.href\s*=/.test(inspected), 'W286-B1 Agent Presence must not auto-open app routes.');
  assert(/a prompt, reply, key, model name, transcript, wallet, or provider account/i.test(playStation), 'City Play must disclose the data-minimization boundary.');
  assert(packageJson.scripts?.['qa:w286-b1-city-agent-presence'], 'package.json is missing the W286-B1 QA script.');
  const storage = memoryStorage();
  const saved = recordAgentPresence({ source: 'mission-engine', workRef: 'gate-work', action: 'hive', status: 'active', phase: 'working', providerId: 'provider-name-ignored', prompt: 'never-save-me', result: 'never-save-me', model: 'never-save-me' }, { storage });
  assert(saved.ok, 'Agent Presence must accept a valid local lifecycle fact.');
  const raw = storage.getItem('eon:agent:presence:v1') || '';
  assert(!raw.includes('never-save-me') && !raw.includes('provider-name-ignored'), 'Agent Presence storage must exclude raw prompt/result/model/provider identifiers.');
  recordAgentPresenceFromOperatorActivity({ id: 'city-fake', source: 'city', status: 'active' }, { storage });
  assert(getAgentPresenceSummary({ storage }).activeCount === 1, 'City activity must not fabricate Agent Presence.');
  const report = { schema: 'eonapp.w286-b1.city-agent-presence-gate-report.v1', wave: 'W286-B1', ok: errors.length === 0, interpretation: 'PASS proves source-level bounded local visualization wiring. It is not task-success, visual, accessibility, performance, provider, privacy, security, beta, deployment or launch evidence.', contractStatus: W286_B1_AGENT_PRESENCE_CONTRACT.status, errors };
  const artifactDir = path.join(root, 'artifacts', 'w286-b1-city-agent-presence-gate');
  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(path.join(artifactDir, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW286B1CityAgentPresenceGate();
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

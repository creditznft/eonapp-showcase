#!/usr/bin/env node
/** W286-B2 — truthful local work-huddle and command-loop source gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W286_B2_LIVE_WORK_COMMAND_CONTRACT, validateW286B2LiveWorkCommandContract } from '../config/w286-b2-live-work-command-contract.mjs';
import { AGENT_PRESENCE_MAX_VISIBLE, getAgentPresenceCollaboration, getAgentPresenceSummary, recordAgentPresence } from '../assets/js/operator/agent-presence.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const memoryStorage = () => { const rows = new Map(); return { getItem: (key) => rows.get(String(key)) ?? null, setItem: (key, value) => rows.set(String(key), String(value)), removeItem: (key) => rows.delete(String(key)) }; };

export function runW286B2LiveWorkCommandGate(root = ROOT) {
  const errors = [];
  const assert = (condition, message) => { if (!condition) errors.push(message); };
  errors.push(...validateW286B2LiveWorkCommandContract().errors);
  const presence = read('assets/js/operator/agent-presence.js');
  const lite = read('assets/js/eon-operator-map.js');
  const tour = read('assets/js/city/eon-city-3d-renderer.js');
  const playStation = read('assets/js/eon-city-play-station.js');
  const play = read('assets/js/city/eon-city-play-babylon.js');
  const packageJson = JSON.parse(read('package.json'));
  const inspected = `${presence}\n${lite}\n${tour}\n${playStation}\n${play}`;
  assert(AGENT_PRESENCE_MAX_VISIBLE === W286_B2_LIVE_WORK_COMMAND_CONTRACT.collaboration.maxVisibleAgents, 'W286-B2 must retain the shared four-agent cap.');
  assert(/getAgentPresenceCollaboration/.test(presence), 'Presence bridge must derive a bounded collaboration summary.');
  assert(/drawAgentPresence/.test(lite) && /getAgentPresenceCollaboration/.test(lite), 'City Lite must render a local collaboration huddle.');
  assert(/makeAgentPresenceHuddle/.test(tour) && /agentPresenceHuddleVisible/.test(tour), 'Three.js must render and report a local huddle.');
  assert(/makeAgentPresenceHuddle/.test(play) && /agentPresenceHuddleVisible/.test(play), 'Babylon must render and report a local huddle.');
  assert(/data-eon-play-live-crew/.test(playStation) && /Manage in Chat/.test(playStation), 'Babylon station must expose a status-only live-crew line and native Chat control.');
  assert(!/\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource)\s*\(/.test(inspected), 'W286-B2 must not add remote transport.');
  assert(!/location\.assign|window\.location\s*=|location\.href\s*=/.test(inspected), 'W286-B2 must not auto-open routes.');
  assert(/does not invent a busy team|does not create a busy NPC/i.test(inspected), 'W286-B2 must disclose that City does not fabricate work.');
  assert(packageJson.scripts?.['qa:w286-b2-live-work-command'], 'package.json is missing the W286-B2 QA script.');
  const storage = memoryStorage();
  recordAgentPresence({ source: 'agent-executor', workRef: 'job-handoff', action: 'code', status: 'handoff', phase: 'review', prompt: 'never-store-me' }, { storage });
  recordAgentPresence({ source: 'agent-executor', workRef: 'job-research', action: 'research', status: 'active', phase: 'working', response: 'never-store-me' }, { storage });
  const summary = getAgentPresenceSummary({ storage });
  const collaboration = getAgentPresenceCollaboration(summary.active);
  assert(collaboration.mode === 'handoff', 'Recorded handoff must take precedence in the visual collaboration state.');
  assert(collaboration.localOnly && collaboration.externalEffect === false, 'Collaboration summary must remain local-only with no external effect.');
  assert(!JSON.stringify(collaboration).includes('never-store-me'), 'Collaboration summary must not carry prompt/output content.');
  const report = { schema: 'eonapp.w286-b2.live-work-command-gate-report.v1', wave: 'W286-B2', ok: errors.length === 0, interpretation: 'PASS proves only source-level local work-huddle wiring and command-loop boundaries. It is not live provider, visual, accessibility, performance, privacy, security, beta, deployment or launch evidence.', errors };
  const artifactDir = path.join(root, 'artifacts', 'w286-b2-live-work-command-gate');
  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(path.join(artifactDir, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW286B2LiveWorkCommandGate();
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

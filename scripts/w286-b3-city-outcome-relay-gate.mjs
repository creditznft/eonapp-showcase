#!/usr/bin/env node
/** W286-B3 — status-only City outcome relay source gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W286_B3_CITY_OUTCOME_RELAY_CONTRACT, validateW286B3CityOutcomeRelayContract } from '../config/w286-b3-city-outcome-relay-contract.mjs';
import { getAgentPresenceOutcome, getAgentPresenceSummary, recordAgentPresence } from '../assets/js/operator/agent-presence.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const memoryStorage = () => { const rows = new Map(); return { getItem: (key) => rows.get(String(key)) ?? null, setItem: (key, value) => rows.set(String(key), String(value)), removeItem: (key) => rows.delete(String(key)) }; };

export function runW286B3CityOutcomeRelayGate(root = ROOT) {
  const errors = [];
  const assert = (condition, message) => { if (!condition) errors.push(message); };
  errors.push(...validateW286B3CityOutcomeRelayContract().errors);
  const presence = read('assets/js/operator/agent-presence.js');
  const lite = read('assets/js/eon-operator-map.js');
  const tourStation = read('assets/js/eon-city-3d-station.js');
  const tourRenderer = read('assets/js/city/eon-city-3d-renderer.js');
  const playStation = read('assets/js/eon-city-play-station.js');
  const playRenderer = read('assets/js/city/eon-city-play-babylon.js');
  const packageJson = JSON.parse(read('package.json'));
  const inspected = `${presence}\n${lite}\n${tourStation}\n${tourRenderer}\n${playStation}\n${playRenderer}`;
  assert(/getAgentPresenceOutcome/.test(presence), 'W286-B3 requires a bounded status-only outcome helper.');
  assert(/drawAgentOutcomeBeacon/.test(lite) && /data-city-review-result/.test(lite), 'City Lite must render a status-only outcome beacon and user-tap review path.');
  assert(/makeAgentPresenceOutcomeBeacon/.test(tourRenderer) && /agentPresenceOutcomeVisible/.test(tourRenderer), 'Three.js must render and report a local outcome beacon.');
  assert(/data-eon3-agent-review/.test(tourStation) && /Review in Chat/.test(tourStation), 'Three.js station must provide a generic native review path.');
  assert(/makeAgentPresenceOutcomeBeacon/.test(playRenderer) && /agentPresenceOutcomeVisible/.test(playRenderer), 'Babylon must render and report a local outcome beacon.');
  assert(/data-eon-play-result-relay/.test(playStation) && /Review in Chat/.test(playStation), 'Babylon station must expose a status-only result relay and native review path.');
  assert(!/resultText|outputPreview|workRef\s*:\s*latest|promptPreview|transcriptPreview/i.test(inspected), 'W286-B3 must not expose raw result content, work references, prompts, or transcripts.');
  assert(!/\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource)\s*\(/.test(inspected), 'W286-B3 must not add remote transport.');
  assert(!/location\.assign|window\.location\s*=|location\.href\s*=/.test(inspected), 'W286-B3 must not auto-open routes.');
  assert(packageJson.scripts?.['qa:w286-b3-city-outcome-relay'], 'package.json is missing the W286-B3 QA script.');
  const storage = memoryStorage();
  recordAgentPresence({ source: 'agent-executor', workRef: 'result-1', action: 'code', status: 'complete', phase: 'complete', prompt: 'never-store', response: 'never-store' }, { storage });
  const result = getAgentPresenceOutcome(getAgentPresenceSummary({ storage }));
  assert(result.mode === 'result-ready' && result.visible, 'Completed local work must produce a result-ready status relay.');
  assert(result.localOnly && result.externalEffect === false, 'Outcome relay must remain local-only with no external effect.');
  assert(!JSON.stringify(result).includes('never-store'), 'Outcome relay must not carry prompt/output content.');
  recordAgentPresence({ source: 'agent-executor', workRef: 'result-1', action: 'code', status: 'failed', phase: 'failed' }, { storage });
  assert(getAgentPresenceOutcome(getAgentPresenceSummary({ storage })).mode === 'attention', 'Failed local work must produce an attention status relay.');
  recordAgentPresence({ source: 'agent-executor', workRef: 'result-1', action: 'code', status: 'waiting', phase: 'waiting-approval' }, { storage });
  assert(getAgentPresenceOutcome(getAgentPresenceSummary({ storage })).mode === 'review', 'Waiting local work must produce a review status relay.');
  const report = { schema: 'eonapp.w286-b3.city-outcome-relay-gate-report.v1', wave: 'W286-B3', ok: errors.length === 0, interpretation: 'PASS proves only source-level, local status-relay wiring. It is not real provider, work-result, visual, accessibility, performance, privacy, security, beta, deployment or launch evidence.', errors };
  const artifactDir = path.join(root, 'artifacts', 'w286-b3-city-outcome-relay-gate');
  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(path.join(artifactDir, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW286B3CityOutcomeRelayGate();
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

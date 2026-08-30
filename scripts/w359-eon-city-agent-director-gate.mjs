#!/usr/bin/env node
/** W359 — bounded provider-presence / original City-character source gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W359_EON_CITY_AGENT_DIRECTOR_CONTRACT, validateW359EonCityAgentDirectorContract } from '../config/w359-eon-city-agent-director-contract.mjs';
import { getCityAgentDirectorTruth, resolveCityAgentVisual } from '../assets/js/city/eon-city-agent-director.js';
import { recordAgentPresence, saveAgentPresencePreferences } from '../assets/js/operator/agent-presence.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const memoryStorage = () => { const data = new Map(); return { getItem: (key) => data.get(String(key)) ?? null, setItem: (key, value) => data.set(String(key), String(value)), removeItem: (key) => data.delete(String(key)) }; };

export function runW359EonCityAgentDirectorGate(root = ROOT) {
  const errors = [];
  const assert = (condition, message) => { if (!condition) errors.push(message); };
  errors.push(...validateW359EonCityAgentDirectorContract().errors);
  const director = read('assets/js/city/eon-city-agent-director.js');
  const presence = read('assets/js/operator/agent-presence.js');
  const kernel = read('assets/js/ai-kernel/eon-ai-kernel-bridge.js');
  const chat = read('assets/js/chat-page.js');
  const visualTour = read('assets/js/city/eon-city-3d-renderer.js');
  const babylon = read('assets/js/city/eon-city-play-babylon.js');
  const sources = `${director}\n${presence}\n${kernel}\n${chat}\n${visualTour}\n${babylon}`;
  assert(/CITY_AGENT_DIRECTOR_SCHEMA/.test(director), 'Agent Director schema is missing.');
  assert(/provider-identity/.test(presence), 'Provider identity must be an explicit opt-in preference level.');
  assert(/SAFE_PROVIDER_IDS/.test(presence), 'Provider metadata must be bounded to an allowlist.');
  assert(/resolveCityAgentVisual/.test(visualTour) && /resolveCityAgentVisual/.test(babylon), 'Both 3D renderers must use the shared Agent Director.');
  assert(/providerId:\s*String\(result\?\.response\?\.meta\?\.providerId/.test(chat), 'Chat must update the City cue from the actual completed foreground provider when available.');
  assert(!/\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource)\s*\(/.test(director), 'Agent Director must not introduce remote transport.');
  assert(!/location\.assign|window\.location\s*=|location\.href\s*=/.test(director), 'Agent Director must not auto-open routes.');
  const storage = memoryStorage();
  const saved = recordAgentPresence({ source: 'eon-ai-kernel', workRef: 'w359-groq', action: 'code', status: 'active', providerId: 'groq', prompt: 'never-persist', model: 'never-persist', apiKey: 'never-persist' }, { storage });
  const hidden = resolveCityAgentVisual(saved.entry, saveAgentPresencePreferences({ enabled: true, detailLevel: 'summary' }, { storage }));
  const visible = resolveCityAgentVisual(saved.entry, saveAgentPresencePreferences({ enabled: true, detailLevel: 'provider-identity' }, { storage }));
  assert(hidden.providerVisible === false && !/Groq/i.test(hidden.title), 'Provider identity must be hidden by default.');
  assert(visible.providerVisible === true && /Groq/i.test(visible.title), 'A bounded known provider may appear only after local opt-in.');
  assert(visible.providerOfficialCharacter === false && visible.promptVisible === false && visible.outputVisible === false && visible.modelVisible === false && visible.credentialVisible === false, 'Provider visual must remain an original redacted EON City character.');
  const raw = storage.getItem('eon:agent:presence:v1') || '';
  assert(!raw.includes('never-persist'), 'Presence storage must not contain prompt/model/key input.');
  const truth = getCityAgentDirectorTruth();
  assert(truth.backgroundAgentRuntime === false && truth.providerCalls === false && truth.providerIdentityRequiresLocalOptIn === true, 'Agent Director truth contract drifted.');
  const report = Object.freeze({ schema: 'eonapp.w359.agent-director-gate.v1', wave: W359_EON_CITY_AGENT_DIRECTOR_CONTRACT.wave, ok: errors.length === 0, errors: Object.freeze(errors), interpretation: 'PASS proves only bounded source wiring for optional local City visuals. It does not prove a provider call, background agent, visual quality, asset licensing, accessibility, performance, live device behavior, deployment, or launch readiness.' });
  const artifactDir = path.join(root, 'artifacts', 'w359-eon-city-agent-director-gate');
  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(path.join(artifactDir, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW359EonCityAgentDirectorGate();
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

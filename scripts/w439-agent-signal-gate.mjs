#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { getEonCityAgentSignalTruth } from '../assets/js/city/eon-city-agent-signal.js';
import { W439_AGENT_SIGNAL_CONTRACT, validateW439AgentSignalContract } from '../config/w439-agent-signal-contract.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const read = (file) => readFileSync(path.join(root, file), 'utf8'); const ensure = (value, message) => assert.equal(Boolean(value), true, message);
export function inspectW439AgentSignal() {
  const checks = []; const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const signal = read('assets/js/city/eon-city-agent-signal.js'); const fabric = read('assets/js/chat/eonbot-job-fabric.js'); const station = read('assets/js/eon-city-play-station.js'); const truth = getEonCityAgentSignalTruth();
  check('required-files', ['assets/js/city/eon-city-agent-signal.js', 'config/w439-agent-signal-contract.mjs', 'tests/unit/w439-agent-signal.test.mjs'].every((file) => existsSync(path.join(root, file))), 'AgentSignal bridge, contract and test exist');
  check('contract-valid', validateW439AgentSignalContract().length === 0 && W439_AGENT_SIGNAL_CONTRACT.wave === 'W439', 'contract requires receipt-backed local signals only');
  check('receipt-source-only', /EONBOT_JOB_FABRIC_SCHEMA/.test(signal) && /eventsByJob/.test(signal) && /receiptVerified: true/.test(signal) && /subscribeEonbotJobFabric/.test(signal), 'signals are derived only from W435 receipts/events');
  check('safe-bubble-boundary', /rawPromptVisible: false/.test(signal) && /rawOutputVisible: false/.test(signal) && /credentialVisible: false/.test(signal) && /providerVisible: false/.test(signal), 'City bubbles expose only bounded lifecycle text');
  check('city-wiring', /getEonCityAgentSignalSnapshot/.test(station) && /subscribeEonCityAgentSignals/.test(station) && /EONBOT_JOB_FABRIC_EVENT/.test(fabric), 'City reads and refreshes receipt-driven signals');
  check('no-network-or-autonomy', !/\bfetch\s*\(|XMLHttpRequest|WebSocket|navigator\.serviceWorker|setInterval/.test(signal) && /npcAutonomyClaimed: false/.test(signal), 'bridge polls nothing, starts nothing and claims no autonomous NPC');
  check('truth-boundary', truth.receiptBackedOnly === true && truth.providerExecutionStarted === false && truth.externalActionStarted === false && truth.productionAgentSignalProof === false, 'source integration is not a production agent or City proof');
  return Object.freeze({ schema: 'eonapp.w439.agent-signal-gate.v1', wave: 'W439', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze(['No provider work, autonomous NPC, project text, raw output or external action is shown.', 'No device/City production run was performed.']) });
}
export function runW439AgentSignalGate({ writeArtifact = true } = {}) { const result = inspectW439AgentSignal(); if (writeArtifact) { const dir = path.join(root, 'artifacts', 'w439-agent-signal-gate'); mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`); } return result; }
if (import.meta.url === `file://${process.argv[1]}`) { const result = runW439AgentSignalGate(); process.stdout.write(`W439 receipt-driven AgentSignal gate passed (${result.checkCount}/${result.checkCount}). No agent was executed.\n`); }

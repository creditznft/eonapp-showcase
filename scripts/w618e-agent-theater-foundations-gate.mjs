#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildEonCityAgentTheater, validateEonCityAgentTheater } from '../assets/js/city/eon-city-agent-theater.js';
import { EON_CITY_AGENT_SIGNAL_SCHEMA } from '../assets/js/city/eon-city-agent-signal.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const receiptSnapshot = Object.freeze({
  schema: EON_CITY_AGENT_SIGNAL_SCHEMA,
  visibleSignals: Object.freeze([Object.freeze({
    schema: EON_CITY_AGENT_SIGNAL_SCHEMA,
    signalId: 'signal_test_builder',
    state: 'needs-approval',
    title: 'Needs your approval',
    bubble: 'A local draft is waiting for review.',
    route: '/projects',
    receiptVerified: true,
    presenceEntry: Object.freeze({ role: 'builder' }),
    rawPromptVisible: false,
    rawOutputVisible: false,
    credentialVisible: false,
    providerVisible: false,
    externalEffect: false
  })])
});

export function inspectW618eAgentTheaterFoundationsGate() {
  const errors = [];
  const dormant = buildEonCityAgentTheater();
  const active = buildEonCityAgentTheater({ agentSignalSnapshot: receiptSnapshot });
  const dormantValidation = validateEonCityAgentTheater(dormant);
  const activeValidation = validateEonCityAgentTheater(active);
  const station = read('assets/js/eon-city-play-station.js');
  const theater = read('assets/js/city/eon-city-agent-theater.js');
  const room = read('assets/js/city/eon-city-command-room.js');

  if (!dormantValidation.ok) errors.push(...dormantValidation.errors);
  if (!activeValidation.ok) errors.push(...activeValidation.errors);
  if (dormant.mode !== 'dormant-foundation' || dormant.receiptCount !== 0) errors.push('Agent Theater must be dormant without receipts.');
  if (active.mode !== 'receipt-backed-active' || active.receiptCount !== 1) errors.push('Agent Theater must show active mode only from receipt-backed signals.');
  if (!active.visibleAgents.every((agent) => !agent.rawPromptVisible && !agent.rawOutputVisible && !agent.credentialVisible && !agent.providerVisible && !agent.externalEffect)) errors.push('Agent Theater leaked raw/private/provider/external data.');
  if (!dormant.receiptBackedOnlyForActive || !dormant.dormantWhenNoReceipt) errors.push('Agent Theater truth boundaries are missing.');
  if (active.startsProvider || active.startsAutomation || active.opensCheckout || active.grantsReward || active.fakeAgentActivity || active.remoteTelemetry) errors.push('Agent Theater violates launch safety boundaries.');

  if (!station.includes('buildEonCityAgentTheater')) errors.push('City station does not build W618E Agent Theater.');
  if (!station.includes('renderEonCityAgentTheaterAgents')) errors.push('City station does not render Agent Theater agents into Command Room.');
  if (!station.includes('agentTheaterSnapshot')) errors.push('City station missing Agent Theater snapshot.');
  if (!theater.includes('receiptBackedOnlyForActive: true')) errors.push('Agent Theater source missing receipt-backed active boundary.');
  if (!theater.includes('dormantWhenNoReceipt: true')) errors.push('Agent Theater source missing dormant-without-receipt boundary.');
  if (!room.includes('dormantAgents: dormantAgentOverrides')) errors.push('Command Room does not accept Agent Theater overrides.');

  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), schema: 'eonapp.w618e.agent-theater-foundations-gate.v1', checks: 18 });
}

const report = inspectW618eAgentTheaterFoundationsGate();
if (!report.ok) {
  console.error(`[W618E] Agent Theater foundations gate failed:\n- ${report.errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`[W618E] Agent Theater foundations gate passed (${report.checks}/18).`);

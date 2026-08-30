import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { EON_CITY_AGENT_SIGNAL_SCHEMA } from '../../assets/js/city/eon-city-agent-signal.js';
import { buildEonCityAgentTheater, renderEonCityAgentTheaterAgents, validateEonCityAgentTheater } from '../../assets/js/city/eon-city-agent-theater.js';
import { inspectW618eAgentTheaterFoundationsGate } from '../../scripts/w618e-agent-theater-foundations-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const receiptSnapshot = Object.freeze({
  schema: EON_CITY_AGENT_SIGNAL_SCHEMA,
  visibleSignals: Object.freeze([Object.freeze({
    schema: EON_CITY_AGENT_SIGNAL_SCHEMA,
    signalId: 'signal_test_research',
    state: 'completed',
    title: 'Completed',
    bubble: 'A local review record is complete.',
    route: '/library',
    receiptVerified: true,
    presenceEntry: Object.freeze({ role: 'researcher' }),
    rawPromptVisible: false,
    rawOutputVisible: false,
    credentialVisible: false,
    providerVisible: false,
    externalEffect: false
  })])
});

test('W618E shows dormant agents by default without pretending work is happening', () => {
  const theater = buildEonCityAgentTheater();
  assert.equal(theater.schema, 'eon.city.agent-theater.w618e.v1');
  assert.equal(theater.mode, 'dormant-foundation');
  assert.equal(theater.receiptCount, 0);
  assert.ok(theater.visibleAgents.length >= 5);
  assert.equal(theater.dormantWhenNoReceipt, true);
  assert.equal(validateEonCityAgentTheater(theater).ok, true);
});

test('W618E activates agents only from receipt-backed sanitized signals', () => {
  const theater = buildEonCityAgentTheater({ agentSignalSnapshot: receiptSnapshot });
  assert.equal(theater.mode, 'receipt-backed-active');
  assert.equal(theater.receiptCount, 1);
  assert.equal(theater.visibleAgents[0].receiptVerified, true);
  assert.equal(theater.visibleAgents[0].role, 'researcher');
  assert.equal(theater.visibleAgents[0].districtId, 'archive');
  assert.equal(theater.visibleAgents[0].rawPromptVisible, false);
  assert.equal(theater.visibleAgents[0].rawOutputVisible, false);
});

test('W618E never starts providers, automation, rewards, checkout or telemetry', () => {
  const theater = buildEonCityAgentTheater({ agentSignalSnapshot: receiptSnapshot });
  assert.equal(theater.startsProvider, false);
  assert.equal(theater.startsAutomation, false);
  assert.equal(theater.opensCheckout, false);
  assert.equal(theater.grantsReward, false);
  assert.equal(theater.fakeAgentActivity, false);
  assert.equal(theater.remoteTelemetry, false);
  assert.equal(validateEonCityAgentTheater(theater).ok, true);
});

test('W618E renders safe Agent Theater entries for Command Room', () => {
  const rendered = renderEonCityAgentTheaterAgents(buildEonCityAgentTheater({ agentSignalSnapshot: receiptSnapshot }));
  assert.equal(rendered.length, 1);
  assert.equal(rendered[0].receiptVerified, true);
  assert.equal(rendered[0].state, 'receipt-completed');
});

test('W618E is wired into City station and Command Room overrides', () => {
  const station = read('assets/js/eon-city-play-station.js');
  const room = read('assets/js/city/eon-city-command-room.js');
  assert.match(station, /buildEonCityAgentTheater/);
  assert.match(station, /renderEonCityAgentTheaterAgents/);
  assert.match(station, /agentTheaterSnapshot/);
  assert.match(room, /dormantAgentOverrides/);
});

test('W618E standalone gate passes', () => {
  const report = inspectW618eAgentTheaterFoundationsGate();
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.checks, 18);
});

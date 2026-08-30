import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_COMMAND_ROOM_SCHEMA,
  getEonCityCommandRoomModel,
  renderEonCityCommandRoomMarkup,
  validateEonCityCommandRoomModel
} from '../../assets/js/city/eon-city-command-room.js';
import { decideNextEonCityWave } from '../../assets/js/city/eon-city-command-world-plan.js';
import { inspectW618cEonCommandRoomDefaultGate } from '../../scripts/w618c-eon-command-room-default-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W618C defines the Command Room as the default usable City cockpit', () => {
  const model = getEonCityCommandRoomModel();
  assert.equal(model.schema, EON_CITY_COMMAND_ROOM_SCHEMA);
  assert.equal(model.defaultMode, true);
  assert.equal(model.defaultVisibleInDirectCity, true);
  assert.equal(model.optionalExploreMode, true);
  assert.deepEqual(model.layers, ['command-room', 'living-dashboard', 'agent-theater']);
  assert.ok(model.screens.length >= 9);
  assert.deepEqual(model.screens.filter((screen) => screen.tier === 'primary').map((screen) => screen.id), ['eonbot', 'projects', 'create', 'forge', 'library', 'research', 'automations']);
});

test('W618C carries Living Dashboard and dormant Agent Theater without fake activity', () => {
  const model = getEonCityCommandRoomModel();
  assert.ok(model.dashboardSignals.some((signal) => signal.id === 'share' && signal.state === 'server-proof-required'));
  assert.ok(model.dashboardSignals.some((signal) => signal.id === 'local-ai' && signal.state === 'review-required'));
  assert.ok(model.dormantAgents.some((agent) => agent.id === 'builder-orb' && agent.state === 'dormant-until-job-receipt'));
  assert.equal(model.startsProvider, false);
  assert.equal(model.startsAutomation, false);
  assert.equal(model.opensCheckout, false);
  assert.equal(model.grantsReward, false);
  assert.equal(model.fakeAgentActivity, false);
});

test('W618C renders large clickable screens, shortcuts, signals and agents', () => {
  const html = renderEonCityCommandRoomMarkup(getEonCityCommandRoomModel());
  assert.match(html, /data-eon-command-room-panel/);
  assert.match(html, /data-eon-command-room-route="\/projects"/);
  assert.match(html, /data-eon-command-room-share/);
  assert.match(html, /data-eon-command-room-shortcut="P"/);
  assert.match(html, /Living dashboard/);
  assert.match(html, /Agent Theater/);
  assert.match(html, /fake work for atmosphere/);
});

test('W618C integrates the Command Room with the live City station and CSS', () => {
  const station = read('assets/js/eon-city-play-station.js');
  const css = read('assets/css/eon-city-play.css');
  assert.match(station, /renderEonCityCommandRoomMarkup/);
  assert.match(station, /const cityFirstRunVisible = false/);
  assert.match(station, /data-eon-play-open-command-room/);
  assert.match(station, /const bindCommandRoom = \(\) =>/);
  assert.match(station, /eonCommandRoomShortcut/);
  assert.match(css, /\.eon-command-room-grid/);
  assert.match(css, /\.eon-command-room-agents/);
});

test('W618C validates and keeps billing blocked until browser proof', () => {
  const validation = validateEonCityCommandRoomModel();
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  const next = decideNextEonCityWave({ cityUsabilityPassed: true, globalSharePassed: true, commandRoomPassed: false, browserProofPassed: false });
  assert.equal(next.next, 'w618c');
  assert.equal(next.billingAllowed, false);
  const report = inspectW618cEonCommandRoomDefaultGate();
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.checks, 25);
});

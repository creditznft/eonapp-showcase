import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildEonCityLivingDashboard, renderEonCityLivingDashboardSignals, validateEonCityLivingDashboard } from '../../assets/js/city/eon-city-living-dashboard.js';
import { inspectW618dLivingDashboardSignalsGate } from '../../scripts/w618d-living-dashboard-signals-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W618D builds truthful Living Dashboard signals from safe state only', () => {
  const snapshot = buildEonCityLivingDashboard({ localAiSelfTestPassed: true, projectPortalCount: 3, automationDraftCount: 2, shareLedgerLive: false });
  assert.equal(snapshot.schema, 'eon.city.living-dashboard.w618d.v1');
  assert.equal(snapshot.panelCount, 6);
  assert.ok(snapshot.panels.some((panel) => panel.id === 'local-ai' && panel.state === 'ready'));
  assert.ok(snapshot.panels.some((panel) => panel.id === 'projects' && panel.headline.includes('3 project portals')));
  assert.ok(snapshot.panels.some((panel) => panel.id === 'share' && panel.state === 'not-live'));
  assert.ok(snapshot.panels.some((panel) => panel.id === 'automation' && panel.state === 'attention'));
});

test('W618D never starts providers, automation, rewards or telemetry', () => {
  const snapshot = buildEonCityLivingDashboard();
  assert.equal(snapshot.truthfulOnly, true);
  assert.equal(snapshot.noFakeActivity, true);
  assert.equal(snapshot.startsProvider, false);
  assert.equal(snapshot.startsAutomation, false);
  assert.equal(snapshot.opensCheckout, false);
  assert.equal(snapshot.grantsReward, false);
  assert.equal(snapshot.readsPrivateWork, false);
  assert.equal(snapshot.remoteTelemetry, false);
  assert.equal(validateEonCityLivingDashboard(snapshot).ok, true);
});

test('W618D maps dashboard panels into Command Room render signals', () => {
  const rendered = renderEonCityLivingDashboardSignals(buildEonCityLivingDashboard({ projectPortalCount: 1 }));
  assert.ok(rendered.some((signal) => signal.id === 'projects' && signal.state === 'ready'));
  assert.ok(rendered.some((signal) => signal.id === 'agent-signals'));
  assert.ok(rendered.every((signal) => signal.districtId));
});

test('W618D is wired into City station and Command Room overrides', () => {
  const station = read('assets/js/eon-city-play-station.js');
  const room = read('assets/js/city/eon-city-command-room.js');
  assert.match(station, /buildEonCityLivingDashboard/);
  assert.match(station, /renderEonCityLivingDashboardSignals/);
  assert.match(station, /projectPortalCount: projectDistrictSnapshot\.activeCount/);
  assert.match(room, /dashboardSignalOverrides/);
});

test('W618D standalone gate passes', () => {
  const report = inspectW618dLivingDashboardSignalsGate();
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.checks, 16);
});

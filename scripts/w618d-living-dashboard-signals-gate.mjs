#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildEonCityLivingDashboard, validateEonCityLivingDashboard } from '../assets/js/city/eon-city-living-dashboard.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export function inspectW618dLivingDashboardSignalsGate() {
  const errors = [];
  const snapshot = buildEonCityLivingDashboard({ projectPortalCount: 2, automationDraftCount: 1, agentSignalSnapshot: { activeCount: 0, attentionCount: 0, completedCount: 0 } });
  const validation = validateEonCityLivingDashboard(snapshot);
  const station = read('assets/js/eon-city-play-station.js');
  const room = read('assets/js/city/eon-city-command-room.js');

  if (!validation.ok) errors.push(...validation.errors);
  if (snapshot.panelCount < 6) errors.push('Living Dashboard must expose at least six panels.');
  for (const required of ['local-ai', 'projects', 'vault', 'share', 'automation', 'agent-signals']) {
    if (!snapshot.panels.some((panel) => panel.id === required)) errors.push(`Missing Living Dashboard panel: ${required}`);
  }
  if (!snapshot.panels.some((panel) => panel.id === 'share' && panel.state === 'not-live')) errors.push('Share Tower must remain not-live in W618D.');
  if (!snapshot.panels.some((panel) => panel.id === 'automation' && panel.state === 'attention')) errors.push('Automation Relay must show attention when review drafts exist.');
  if (!snapshot.panels.some((panel) => panel.id === 'projects' && panel.state === 'ready')) errors.push('Project District must reflect project portal count.');
  if (!snapshot.truthfulOnly || !snapshot.noFakeActivity) errors.push('Living Dashboard must be truthful-only and no-fake-activity.');
  if (snapshot.startsProvider || snapshot.startsAutomation || snapshot.opensCheckout || snapshot.grantsReward || snapshot.remoteTelemetry) errors.push('Living Dashboard violates safety boundaries.');

  if (!station.includes('buildEonCityLivingDashboard')) errors.push('City station does not build W618D Living Dashboard.');
  if (!station.includes('renderEonCityLivingDashboardSignals')) errors.push('City station does not render Living Dashboard signals into Command Room.');
  if (!station.includes('projectPortalCount: projectDistrictSnapshot.activeCount')) errors.push('Living Dashboard is not wired to project portal count.');
  if (!station.includes('shareLedgerLive: false')) errors.push('Living Dashboard must keep share ledger not live until server proof.');
  if (!room.includes('dashboardSignals: dashboardSignalOverrides')) errors.push('Command Room does not accept dynamic Living Dashboard signal overrides.');

  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), schema: 'eonapp.w618d.living-dashboard-signals-gate.v1', checks: 16 });
}

const report = inspectW618dLivingDashboardSignalsGate();
if (!report.ok) {
  console.error(`[W618D] Living Dashboard signals gate failed:\n- ${report.errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`[W618D] Living Dashboard signals gate passed (${report.checks}/16).`);

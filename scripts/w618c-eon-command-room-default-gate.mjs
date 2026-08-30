#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonCityCommandRoomModel, validateEonCityCommandRoomModel } from '../assets/js/city/eon-city-command-room.js';
import { decideNextEonCityWave } from '../assets/js/city/eon-city-command-world-plan.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export function inspectW618cEonCommandRoomDefaultGate() {
  const errors = [];
  const model = getEonCityCommandRoomModel();
  const validation = validateEonCityCommandRoomModel(model);
  const station = read('assets/js/eon-city-play-station.js');
  const cityCss = read('assets/css/eon-city-play.css');
  const commandRoomSource = read('assets/js/city/eon-city-command-room.js');

  if (!validation.ok) errors.push(...validation.errors);
  if (model.screens.length !== 11) errors.push('Command Room must expose seven primary work screens and four systems screens.');
  for (const required of ['eonbot','projects','create','forge','library','research','automations','workspace','local-ai','vault','realm-studio']) {
    if (!model.screens.some((screen) => screen.id === required)) errors.push(`Missing Command Room screen: ${required}`);
  }
  if (!model.layers.includes('command-room') || !model.layers.includes('living-dashboard') || !model.layers.includes('agent-theater')) errors.push('Command Room model must carry all three approved EON City layers.');
  if (!model.dashboardSignals.some((signal) => signal.id === 'share' && signal.state === 'server-proof-required')) errors.push('Command Room must show truthful Share/EON Keys proof-required state.');
  if (!model.dormantAgents.every((agent) => /dormant|local|server-proof|ready-on-request/.test(String(agent.state || '')))) errors.push('Agent Theater must stay dormant, local, request-bound or proof-bound.');
  if (model.startsProvider || model.startsAutomation || model.opensCheckout || model.grantsReward || model.fakeAgentActivity || model.autoNavigation) errors.push('Command Room model violates launch safety boundaries.');

  if (!station.includes("from './city/eon-city-command-room.js'")) errors.push('City station does not import the Command Room contract.');
  if (!station.includes('const commandRoomMarkup = directEntry ? renderEonCityCommandRoomMarkup(commandRoomModel) :')) errors.push('City station does not render Command Room for direct EON City entry.');
  if (!station.includes('const cityFirstRunVisible = false')) errors.push('Older first-run overlay still covers the Command Room default.');
  if (!station.includes('data-eon-play-open-command-room')) errors.push('City station missing Command Room open controls.');
  if (!station.includes('const bindCommandRoom = () =>')) errors.push('City station missing Command Room click/keyboard binding.');
  if (!commandRoomSource.includes('data-eon-command-room-route')) errors.push('Command Room route review metadata is missing.');
  if (!commandRoomSource.includes('data-eon-command-room-shortcut')) errors.push('Command Room keyboard shortcuts are not wired.');
  if (!commandRoomSource.includes('<button type="button" class="eon-command-room-screen')) errors.push('Command Room first-click screens must be semantic buttons.');
  if (!station.includes('data-eon-command-room-confirm-route')) errors.push('Command Room second-click same-origin confirmation is missing.');
  if (station.includes('window.location.assign(route)')) errors.push('Command Room must not imperatively navigate after a reviewed choice.');
  if (!station.includes("runLocalAction('share-command-center')")) errors.push('Command Room share action is not connected to the City share center.');
  if (!station.includes("runLocalAction('district-map')")) errors.push('Command Room district map action is not connected.');
  if (!station.includes('No City content, provider output, entitlement, reward, or hidden action was transferred')) errors.push('Command Room route confirmation lacks safety receipt text.');

  if (!cityCss.includes('W618C — EON City Command Room default cockpit')) errors.push('City CSS missing Command Room base marker.');
  if (!cityCss.includes('.eon-command-room-grid')) errors.push('City CSS missing Command Room screen grid.');
  if (!cityCss.includes('.eon-command-room-agents')) errors.push('City CSS missing dormant Agent Theater styling.');
  if (!cityCss.includes('.eon-command-room-signals')) errors.push('City CSS missing Living Dashboard signal styling.');
  if (!cityCss.includes('.eon-command-room-review')) errors.push('City CSS missing review-first destination styling.');

  const next = decideNextEonCityWave({ cityUsabilityPassed: true, globalSharePassed: true, commandRoomPassed: false, browserProofPassed: false });
  if (next.next !== 'w618c' || next.billingAllowed !== false) errors.push('Command World decision logic must select W618C before browser proof and billing.');

  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), schema: 'eonapp.w618c.eon-command-room-default-gate.v2', checks: 25 });
}

const report = inspectW618cEonCommandRoomDefaultGate();
if (!report.ok) { console.error(`[W618C] EON Command Room default gate failed:\n- ${report.errors.join('\n- ')}`); process.exit(1); }
console.log(`[W618C] EON Command Room default gate passed (${report.checks}/25).`);

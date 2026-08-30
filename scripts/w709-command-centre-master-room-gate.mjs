#!/usr/bin/env node
import fs from 'node:fs';
import { buildEonCityW709MasterRoomPlan, getEonCityW709MasterRoomTruth, getEonCityW709MasterStationReview, validateEonCityW709MasterRoomPlan } from '../assets/js/city/w709/eon-city-w709-command-centre-master-room.js';
import { getEonCityCommandRoomModel, renderEonCityCommandRoomMarkup, validateEonCityCommandRoomModel } from '../assets/js/city/eon-city-command-room.js';
const station = fs.readFileSync(new URL('../assets/js/eon-city-play-station.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../assets/css/eon-city-play.css', import.meta.url), 'utf8');
const plan = buildEonCityW709MasterRoomPlan({ districtCount: 9 });
const model = getEonCityCommandRoomModel();
const markup = renderEonCityCommandRoomMarkup(model);
const truth = getEonCityW709MasterRoomTruth();
const checks = [
  ['eight-master-stations', plan.stations.length === 8 && validateEonCityW709MasterRoomPlan(plan).ok],
  ['all-in-one-functions', ['living-nexus','projects','approvals','atlas','providers','eonbot-dock','city-monitor','vault'].every((id) => plan.stations.some((entry) => entry.id === id))],
  ['review-first-targets', plan.stations.every((entry) => getEonCityW709MasterStationReview(entry.id).ok && entry.reviewFirst && !entry.autoNavigate)],
  ['command-room-integration', validateEonCityCommandRoomModel(model).ok && (markup.match(/data-eon-command-room-master-station=/g) || []).length === 8],
  ['working-event-binding', /renderMasterStationReview/.test(station) && /living-nexus-panel/.test(station) && /data-eon-play-open-living-nexus/.test(station)],
  ['responsive-presentation', /eon-command-room-master-grid/.test(css) && /repeat\(4,minmax\(0,1fr\)\)/.test(css) && /max-width: 640px/.test(css)],
  ['truth-boundaries', truth.allInOneCommandCentre && truth.oneEonbotIdentity && truth.oneNexusState && !truth.readsPrivateWork && !truth.startsAiWork && !truth.autoNavigate]
];
for (const [id, pass] of checks) console.log(`[W709] ${pass ? 'PASS' : 'FAIL'} ${id}`);
const ok = checks.every(([, pass]) => pass);
console.log(`[W709] ${ok ? 'PASS' : 'FAIL'} ${checks.filter(([, pass]) => pass).length}/${checks.length}`);
if (!ok) process.exitCode = 1;

#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_CITY_W731_STATIONS } from '../assets/js/city/w731/eon-city-w731-command-hub-contract.js';
import { projectEonCityW751ProductiveStations, validateEonCityW751ProductiveStations } from '../assets/js/city/w751/eon-city-w751-productive-stations.js';
import { getEonCityWorkHandoffTruth, listEonCityWorkDestinations, resolveEonCityWorkDestination } from '../assets/js/contracts/city/eon-city-work-handoff.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const checks = [];
const check = (id, pass, detail = '') => checks.push(Object.freeze({ id, pass: Boolean(pass), detail: String(detail) }));
const truth = getEonCityWorkHandoffTruth();
const destinations = listEonCityWorkDestinations();
const view = projectEonCityW751ProductiveStations({ productivePlan: { missions: [] }, missionView: [], activity: { schema: 'eon.city.productive-stations.activity.w751.v1', stations: {} }, shareReceipt: null });
const validation = validateEonCityW751ProductiveStations(view);
const contract = read('assets/js/contracts/city/eon-city-work-handoff.js');
const workLoop = read('assets/js/city/eon-city-work-loop.js');
const productive = read('assets/js/city/w751/eon-city-w751-productive-stations.js');
const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
const destination = read('assets/js/contracts/navigation/eon-destination-registry.js');

check('ten-command-hub-stations', EON_CITY_W731_STATIONS.length === 10 && destinations.length === 10, `${EON_CITY_W731_STATIONS.length}/${destinations.length}`);
check('station-destination-coverage', EON_CITY_W731_STATIONS.every((station) => resolveEonCityWorkDestination({ stationId: station.id, surface: station.surface }).ok), 'all ten stations resolve');
check('productive-projection-valid', validation.ok && view.stations.every((station) => station.handoffRequired && station.receiverId), validation.errors.join(','));
check('versioned-expiring-single-consume', /EON_CITY_WORK_HANDOFF_SCHEMA/.test(contract) && /consumeEonHandoff/.test(contract) && /handoff-expired/.test(read('assets/js/contracts/navigation/eon-handoff-authority.js')), 'I04 authority wrapped');
check('return-receipt-single-consume', /return-receipt-already-exists/.test(contract) && /return-receipt-already-consumed/.test(contract) && /cityConsumedAt/.test(contract), 'return receipt bounded');
check('private-content-blocked', /containsPrivateContent: false/.test(contract) && /FORBIDDEN_SERIALIZED/.test(contract), 'redacted context only');
check('no-progress-from-navigation', truth.openingRouteGrantsXp === false && truth.returningToCityGrantsXp === false && truth.verifiedOutcomeAuthority === false, 'C05 remains separate');
check('no-auto-navigation-execution', truth.automaticNavigation === false && truth.automaticExecution === false && truth.explicitUserActionRequired === true, 'review first');
check('legacy-loop-upgraded', /writeCityWorkLoopHandoff/.test(workLoop) && /writeCityWorkLoopReturnReceipt/.test(workLoop), 'W368 adapter');
check('productive-controller-upgraded', /prepareHandoff/.test(productive) && /writeEonCityWorkHandoff/.test(productive), 'W751 adapter');
check('runtime-api-exposed', /prepareProductiveStationHandoff/.test(runtime), 'runtime can prepare route handoff');
check('return-query-allowlisted', /returnReceipt/.test(destination), 'exact City return context');
check('no-sensitive-fields-in-contract', !/(localStorage|fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|location\.assign|window\.location)/.test(contract), 'session-only and non-networked');

const receipt = Object.freeze({
  schema: 'eonapp.a15.c04.city-work-handoff-gate.v1',
  wave: 'C04',
  ok: checks.every((entry) => entry.pass),
  passed: checks.filter((entry) => entry.pass).length,
  total: checks.length,
  generatedAt: new Date().toISOString(),
  stationCount: destinations.length,
  checks: Object.freeze(checks),
  limitations: Object.freeze(['Source-only certification.', 'No authenticated browser navigation evidence.', 'No Core outcome, XP or reward authority is created by C04.'])
});
for (const entry of checks) console.log(`${entry.pass ? 'PASS' : 'FAIL'} ${entry.id} — ${entry.detail}`);
console.log(`\nA15 C04 City Work Handoff: ${receipt.passed}/${receipt.total}`);
fs.mkdirSync(path.join(ROOT, 'artifacts', 'a15'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts', 'a15', 'A15_C04_CITY_WORK_HANDOFF_GATE.json'), `${JSON.stringify(receipt, null, 2)}\n`);
if (!receipt.ok) process.exitCode = 1;

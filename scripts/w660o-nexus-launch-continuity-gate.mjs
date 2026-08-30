#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_NEXUS_PAGE_CONTEXTS,
  getEonNexusAppShellTruth,
  shouldInstallEonNexusAppShell
} from '../assets/js/nexus/eon-nexus-app-shell.js';
import {
  EON_CITY_W660_NEXUS_STATIONS,
  validateEonCityW660NexusStations
} from '../assets/js/city/w660/eon-city-w660-nexus-stations.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const add = (id, pass, detail = '') => checks.push({ id, pass: Boolean(pass), detail });

const appShell = read('assets/js/nexus/eon-nexus-app-shell.js');
const pageBootstrap = read('assets/js/nexus/eon-nexus-page-bootstrap.js');
const hologram = read('assets/js/city/w660/eon-city-w660-nexus-hologram.js');
const pulseCss = read('assets/css/eon-nexus-pulse.css');
const billing = read('billing.html');
const support = read('help.html');
const buildProduction = read('scripts/build-production.mjs');
const truth = getEonNexusAppShellTruth();
const stationTruth = validateEonCityW660NexusStations();

add('billing-context', EON_NEXUS_PAGE_CONTEXTS.billing?.presentation === 'restrained' && EON_NEXUS_PAGE_CONTEXTS.billing?.allowLiveNexus === false);
add('support-context', EON_NEXUS_PAGE_CONTEXTS.support?.presentation === 'restrained' && EON_NEXUS_PAGE_CONTEXTS.support?.allowLiveNexus === false);
add('standalone-installer-contract', /eonNexusShell/.test(appShell) && truth.standaloneSupportedPages === true);
add('standalone-bootstrap-review-first', /installEonNexusAppShell/.test(pageBootstrap) && !/location\.(?:assign|replace)|getUserMedia|SpeechRecognition|\.click\s*\(/.test(pageBootstrap));
add('billing-mounted', /data-eon-nexus-shell="1"/.test(billing) && /data-eon-app-page="billing"/.test(billing) && /eon-nexus-page-bootstrap\.js/.test(billing));
add('support-mounted', /data-eon-nexus-shell="1"/.test(support) && /data-eon-app-page="support"/.test(support) && /eon-nexus-page-bootstrap\.js/.test(support));
add('restrained-label-remains-discoverable', /data-eon-nexus-presentation='restrained'[\s\S]*?eon-nexus-pulse__toggle-label[\s\S]*?position:\s*static/.test(pulseCss) && /clip-path:\s*none/.test(pulseCss));
add('standalone-billing-resolves', shouldInstallEonNexusAppShell({ page: 'billing', document: { body: { dataset: { eonNexusShell: '1', eonAppPage: 'billing' } } } }));
add('standalone-support-resolves', shouldInstallEonNexusAppShell({ page: 'support', document: { body: { dataset: { eonNexusShell: '1', eonAppPage: 'support' } } } }));
add('unknown-standalone-refused', !shouldInstallEonNexusAppShell({ page: 'unknown', document: { body: { dataset: { eonNexusShell: '1', eonAppPage: 'unknown' } } } }));
add('nine-stations-preserved', stationTruth.ok && stationTruth.count === 9 && EON_CITY_W660_NEXUS_STATIONS.length === 9, stationTruth.errors.join(','));
add('overhead-beacon-source', /w660-nexus-beacon-/.test(hologram) && /w660-nexus-beacon-ring-/.test(hologram) && /overheadBeacon:\s*true/.test(hologram));
add('beacon-state-colour', /beaconMaterial\.emissiveColor\s*=\s*color/.test(hologram));
add('reduced-motion-static', /if \(reducedMotion\)/.test(hologram) && /beaconRing\.scaling\.setAll\(1\)/.test(hologram));
add('no-second-render-owner', !/runRenderLoop|new Engine|new Scene|createElement\(['"]canvas/.test(`${appShell}\n${pageBootstrap}\n${hologram}`));
add('no-autonomous-side-effects', !/autoApprove|autoExecute\s*:\s*true|getUserMedia|SpeechRecognition\s*\(/.test(`${appShell}\n${pageBootstrap}\n${hologram}`));
add('production-emission-is-mandatory', /EONNexusPageSurface/.test(buildProduction) && /w660-nexus-beacon-ring-/.test(buildProduction) && /Standalone Nexus page contract is missing/.test(buildProduction));

const failed = checks.filter((entry) => !entry.pass);
const report = {
  wave: 'W660O',
  scope: 'nexus-launch-continuity',
  ok: failed.length === 0,
  passed: checks.length - failed.length,
  total: checks.length,
  pageContextCount: Object.keys(EON_NEXUS_PAGE_CONTEXTS).length,
  stationCount: EON_CITY_W660_NEXUS_STATIONS.length,
  checks
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failed.length) process.exitCode = 1;

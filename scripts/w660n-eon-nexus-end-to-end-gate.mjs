#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_W660_NEXUS_STATIONS,
  validateEonCityW660NexusStations
} from '../assets/js/city/w660/eon-city-w660-nexus-stations.js';
import {
  EON_CITY_W660_NEXUS_VISIBILITY_RADIUS
} from '../assets/js/city/w660/eon-city-w660-nexus-hologram.js';
import {
  getEonCityW660nNexusContinuityTruth
} from '../assets/js/city/w660n/eon-city-w660n-nexus-continuity.js';
import {
  EON_NEXUS_APP_SHELL_EXCLUDED_PAGES,
  EON_NEXUS_PAGE_CONTEXTS,
  getEonNexusAppShellTruth,
  shouldInstallEonNexusAppShell
} from '../assets/js/nexus/eon-nexus-app-shell.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const checks = [];
const add = (id, pass, detail = '') => checks.push({ id, pass: Boolean(pass), detail });
const required = [
  'assets/js/city/w660n/eon-city-w660n-nexus-continuity.js',
  'assets/js/city/w660/eon-city-w660-nexus-hologram.js',
  'assets/js/city/w660/eon-city-w660-nexus-stations.js',
  'assets/js/city/w659n/eon-city-w659n-product-layer.js',
  'assets/js/nexus/eon-nexus-app-shell.js',
  'assets/css/eon-city-product-layer.css',
  'assets/css/eon-nexus-pulse.css',
  'tests/unit/w660n-eon-nexus-end-to-end.test.mjs'
];
for (const relative of required) add(`required:${relative}`, exists(relative));

const continuity = read(required[0]);
const hologram = read(required[1]);
const product = read(required[3]);
const appShell = read(required[4]);
const director = read('assets/js/city/w660m/eon-city-w660m-experience-director.js');
const playCore = read('assets/js/city/eon-city-play-core.js');
const cityCss = read(required[5]);
const pulseCss = read(required[6]);
const executable = `${continuity}\n${hologram}\n${product}\n${appShell}`.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const stationValidation = validateEonCityW660NexusStations();
const cityTruth = getEonCityW660nNexusContinuityTruth();
const appTruth = getEonNexusAppShellTruth();

add('nine-district-stations', stationValidation.ok && stationValidation.count === 9 && stationValidation.districtCount === 9, stationValidation.errors.join(','));
add('landmark-visibility', EON_CITY_W660_NEXUS_VISIBILITY_RADIUS >= 10 && EON_CITY_W660_NEXUS_STATIONS.every((entry) => entry.interactionRadius < EON_CITY_W660_NEXUS_VISIBILITY_RADIUS), `${EON_CITY_W660_NEXUS_VISIBILITY_RADIUS}m`);
add('state-aware-hologram', /approvalRing/.test(hologram) && /private-shield/.test(hologram) && /cross-ring/.test(hologram) && /beaconRing/.test(hologram) && /overheadBeacon/.test(hologram) && /resultCount/.test(hologram) && /projectSelected/.test(hologram));
add('maintained-render-owner', !/runRenderLoop|new Engine|new Scene|createElement\(['"]canvas/.test(executable));
add('city-dedicated-nexus-panel', /data-eon-w659n-panel="nexus"/.test(product) && /data-eon-w660n-nexus-content/.test(product) && /renderNexusPanel/.test(product));
add('city-same-state-continuity', /projectEonCityW660nNexusView/.test(product) && /nexusLayer\.getSnapshot/.test(product) && /selected project, task stage, approvals and results/i.test(product));
add('proximity-station-actions', /stationActionsAvailable:\s*nearest\?\.inRange === true/.test(product) && /source:\s*'physical-city-station'/.test(continuity));
add('review-first-actions', /reviewRequired:\s*true/.test(continuity) && /explicitUserAction:\s*true/.test(continuity) && /autoExecute:\s*false/.test(continuity) && /autoNavigate:\s*false/.test(continuity));
add('same-chat-project-results', /nexus-continue-chat/.test(continuity) && /nexus-current-project/.test(continuity) && /nexus-review-approval/.test(continuity) && /nexus-open-results/.test(continuity));
add('eonbot-shared-state-response', /nexusApprovalPending === true/.test(director) && /companionIntent = 'observe'/.test(director) && /nexusState: livingContext\?\.nexusState/.test(playCore));
add('city-nexus-visual-system', /eon-city-nexus-orb-mark/.test(cityCss) && /eon-city-nexus-metrics/.test(cityCss) && /eon-city-nexus-boundary/.test(cityCss) && /prefers-reduced-motion:reduce/.test(cityCss));
add('explicit-page-matrix', Object.keys(EON_NEXUS_PAGE_CONTEXTS).length >= 20 && appTruth.intentionalPlacementMatrix && appTruth.unknownShellRoutesDoNotAutoMount);
add('restrained-pages', ['settings', 'billing', 'profile', 'eon-keys', 'capsule', 'help', 'support', 'install', 'retired-campaigns'].every((id) => EON_NEXUS_PAGE_CONTEXTS[id]?.allowLiveNexus === false));
add('standalone-page-support', /eonNexusShell/.test(appShell) && appTruth.standaloneSupportedPages === true);
add('unknown-route-refused', !shouldInstallEonNexusAppShell({ page: 'unknown-product', document: { body: { dataset: { eonAppShell: '1', eonAppPage: 'unknown-product' } } } }));
add('chat-city-not-duplicated', EON_NEXUS_APP_SHELL_EXCLUDED_PAGES.includes('chat') && EON_NEXUS_APP_SHELL_EXCLUDED_PAGES.includes('eoncity'));
add('page-specific-presentation', /dataset\.eonNexusPresentation/.test(appShell) && /dataset\.eonNexusLiveAllowed/.test(appShell) && /pageSpecific:\s*true/.test(appShell));
add('restrained-pulse-css', /data-eon-nexus-presentation=['"]restrained['"]/.test(pulseCss) && /data-eon-nexus-live-allowed=['"]false['"]/.test(pulseCss));
add('privacy-boundaries', cityTruth.privacyProjected && cityTruth.rawConversationTextRead === false && cityTruth.rawProjectContentRead === false && appTruth.samePrivacyProjectedAdapter);
add('no-autonomous-side-effects', !/getUserMedia|SpeechRecognition\s*\(|location\.(?:assign|replace)|\.click\s*\(|autoApprove|autoExecute\s*:\s*true/.test(executable));
add('no-second-state-store', !/createEonNexusStore|localStorage\.setItem|sessionStorage\.setItem|indexedDB/.test(executable));

const shellPages = [];
for (const name of fs.readdirSync(root).filter((name) => name.endsWith('.html'))) {
  const html = read(name);
  if (!/data-eon-app-shell="1"/.test(html)) continue;
  const match = html.match(/data-eon-app-page="([^"]+)"/);
  if (match) shellPages.push(match[1]);
}
const uncovered = [...new Set(shellPages)].filter((page) => !EON_NEXUS_APP_SHELL_EXCLUDED_PAGES.includes(page) && !EON_NEXUS_PAGE_CONTEXTS[page]);
add('all-current-app-shell-pages-covered', uncovered.length === 0, uncovered.join(','));

const standalonePages = [];
for (const name of fs.readdirSync(root).filter((name) => name.endsWith('.html'))) {
  const html = read(name);
  if (!/data-eon-nexus-shell="1"/.test(html)) continue;
  const match = html.match(/data-eon-app-page="([^"]+)"/);
  if (match) standalonePages.push(match[1]);
}
const uncoveredStandalone = [...new Set(standalonePages)].filter((page) => !EON_NEXUS_PAGE_CONTEXTS[page]);
add('all-current-standalone-nexus-pages-covered', uncoveredStandalone.length === 0, uncoveredStandalone.join(','));

const failed = checks.filter((entry) => !entry.pass);
const report = {
  wave: 'W660N',
  scope: 'eon-nexus-end-to-end-continuity',
  ok: failed.length === 0,
  passed: checks.length - failed.length,
  total: checks.length,
  stationCount: EON_CITY_W660_NEXUS_STATIONS.length,
  pageContextCount: Object.keys(EON_NEXUS_PAGE_CONTEXTS).length,
  shellPages: [...new Set(shellPages)].sort(),
  standalonePages: [...new Set(standalonePages)].sort(),
  checks,
  claims: {
    sourceImplemented: failed.length === 0,
    nineDistrictLandmarks: stationValidation.ok,
    sameConversationAndProjectState: cityTruth.sameConversation && cityTruth.sameSelectedProject,
    headedBrowserCertified: false,
    productionChanged: false
  }
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failed.length) process.exitCode = 1;

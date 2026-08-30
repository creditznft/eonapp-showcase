#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_CITY_W660I_DISTRICTS, validateEonCityW660iDistrictConfigs } from '../assets/js/city/w660i/eon-city-w660i-district-config.js';
import { getEonCityInputContractTruth } from '../assets/js/city/eon-city-input-contract.js';
import { EON_CITY_W660I_TERMINALS, validateEonCityW660iTerminals } from '../assets/js/city/w660i/eon-city-w660i-terminal-registry.js';
import { EON_CITY_W659F_DESTINATIONS } from '../assets/js/city/w659f/eon-city-w659f-transport-runtime.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requireDist = process.argv.includes('--require-dist');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const listFiles = (directory, predicate, result = []) => {
  if (!fs.existsSync(directory)) return result;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) listFiles(absolute, predicate, result);
    else if (predicate(absolute)) result.push(absolute);
  }
  return result;
};
const distSources = requireDist
  ? listFiles(path.join(root, 'dist', 'assets'), (absolute) => /\.(?:js|css)$/.test(absolute)).map((absolute) => fs.readFileSync(absolute, 'utf8'))
  : [];
const distContains = (...tokens) => !requireDist || tokens.every((token) => distSources.some((source) => source.includes(token)));
const required = [
  'assets/js/city/eon-city-input-contract.js',
  'assets/js/city/w660i/eon-city-w660i-district-config.js',
  'assets/js/city/w660i/eon-city-w660i-district-composition.js',
  'assets/js/city/w660i/eon-city-w660i-terminal-registry.js',
  'assets/js/city/w659f/eon-city-w659f-transport-runtime.js',
  'assets/js/city/w659n/eon-city-w659n-product-layer.js',
  'assets/js/nexus/eon-nexus-pulse.js',
  'assets/css/eon-nexus-pulse.css',
  'tests/unit/w660i-eoncity-visual-rescue.test.mjs',
  'docs/W660I_EONCITY_VISUAL_RESCUE_SOURCE_RECEIPT_2026-07-20.md'
];
const checks = [];
const add = (id, pass, detail = '') => checks.push({ id, pass: Boolean(pass), detail });
for (const relative of required) add(`required:${relative}`, fs.existsSync(path.join(root, relative)));
const validation = validateEonCityW660iDistrictConfigs();
const inputTruth = getEonCityInputContractTruth();
const terminalValidation = validateEonCityW660iTerminals();
const product = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
const composition = read('assets/js/city/w660i/eon-city-w660i-district-composition.js');
const pulse = read('assets/js/nexus/eon-nexus-pulse.js');
const pulseCss = read('assets/css/eon-nexus-pulse.css');
const shell = read('assets/js/eon-app-shell.js');
const shellCss = read('assets/css/eon-app-shell.css');
const accessStation = read('assets/js/city/eon-city-access-station.js');
const chatDeferred = read('assets/js/chat-page-deferred.js');
const workSurfaceRegistry = read('assets/js/contracts/work-surface/eon-work-surface-registry.js');
const cityContract = read('assets/js/city/w731/eon-city-w731-command-hub-contract.js');
add('district-config-valid', validation.ok, validation.errors.join(','));
add('district-count-nine', validation.count === 9);
add('productive-terminal-contract', terminalValidation.ok && EON_CITY_W660I_TERMINALS.length === 24 && Object.values(terminalValidation.districtCounts).every((count) => count >= 2), terminalValidation.errors.join(','));
add('distinct-landmarks-and-groups', new Set(EON_CITY_W660I_DISTRICTS.map((entry) => entry.signatureLandmarkId)).size === 9 && new Set(EON_CITY_W660I_DISTRICTS.map((entry) => entry.activeAssetGroupId)).size === 9);
add('canonical-product-names', EON_CITY_W659F_DESTINATIONS.some((entry) => /Knowledge Archive|Local AI Observatory/.test(entry.label)) === false);
add('touch-route-boundary', inputTruth.explicitButtonType && inputTruth.preventsDefaultNavigation && inputTruth.stopsShellPropagation && inputTruth.pressAndHold && inputTruth.capturePhaseDefaultGuard && inputTruth.immediatePropagationGuard);
add('touch-hud-hit-test-isolation', /eon-play-session eon-city-reduced-session eon-city-full-session/.test(accessStation) && /eon-play-touch-controls eon-city-reduced-(?:touch|dpad)/.test(accessStation) && /data-eon-city-exit/.test(accessStation) && /loadingOverlay\.style\.pointerEvents = 'none'/.test(accessStation) && /zIndex:\s*'20'/.test(accessStation) && /data-eon-app-page=eoncity[^}]+eon-app-sidebar\.is-collapsed[^}]+eon-app-collapsed-width/s.test(shellCss) && /eonCityHoverExpand = 'disabled'/.test(shell) && /currentPage === 'eoncity'[\s\S]*\? \(\) => \{\}/.test(shell));
add('travel-awaits-residency', /await activateDistrictAssets\(destinationId/.test(product));
add('arrival-after-world-ready', product.indexOf('await activateDistrictAssets(destinationId') < product.indexOf('Arrived at ${result.destination.label}'));
add('district-identity-visible', /data-eon-w660i-district-identity/.test(product));
add('district-terminals-are-real-actions', /getNearestEonCityW660iTerminal/.test(product) && /interactionType:\s*'terminal'/.test(product));
add('one-owner-composition', !/new\s+(?:Engine|NullEngine|WebGPUEngine)\s*\(/.test(composition) && /ownsRenderLoop:\s*false/.test(composition) && /ownsCanvas:\s*false/.test(composition));
add('nexus-visible-open-control', /eonNexusOpenControl\s*=\s*'1'/.test(pulse) && /eon-nexus-pulse__toggle-label/.test(pulse) && /z-index:\s*320/.test(pulseCss));
// Release policy W759: W736A and the later Command Core supersede only the
// retired automatic chat-pulse mount. Living Nexus remains reachable through
// the maintained City station and full-screen work-surface authority.
add('w736a-maintained-living-nexus-authority',
  !/eon-nexus-chat-pulse|installEonNexusChatPulse|installDeferredEonNexusPulse/.test(chatDeferred)
    && /installEonQuickCommandSurface/.test(shell)
    && /id: 'nexus', label: 'Living Nexus'/.test(workSurfaceRegistry)
    && /id: 'eonbot-nexus'[\s\S]*?kind: 'nexus'/.test(cityContract)
);
add('dist-directory-present', !requireDist || fs.existsSync(path.join(root, 'dist', 'assets')));
add('dist-w660i-district-runtime', distContains('eon.city.w660i.district-composition.v1', 'eon.city.w660i.district-config.v1'));
add('dist-w660i-terminal-runtime', distContains('eon.city.w660i.terminal-registry.v1'));
add('dist-w660i-input-contract', distContains('eon.city.input-contract.w660i.v1', 'capturePhaseDefaultGuard'));
add('dist-w660j-touch-hud', distContains('data-eon-city-touch-controls', 'eon-app-sidebar-collapsed', 'eonCityHoverExpand'));
add('dist-visible-nexus-control', distContains('eonNexusOpenControl', 'EON NEXUS'));
const failed = checks.filter((entry) => !entry.pass);
const report = {
  wave: 'W660I',
  scope: 'eoncity-input-district-visual-rescue-and-nexus-discoverability',
  ok: failed.length === 0,
  passed: checks.length - failed.length,
  total: checks.length,
  checks,
  claims: {
    sourceImplemented: failed.length === 0,
    unitCertified: false,
    headedBrowserCertified: false,
    nineDistrictPhysicalAcceptance: false,
    mobilePhysicalAcceptance: false,
    previewCertified: false,
    productionCertified: false
  }
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failed.length) process.exitCode = 1;

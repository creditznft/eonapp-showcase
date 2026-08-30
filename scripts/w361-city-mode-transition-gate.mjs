#!/usr/bin/env node
/** W361 source gate: shared CityWorldState mode-transition contract and route graph. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getRouteRow, renderCloudflareRedirects } from '../config/route-contract.mjs';
import { CITY_MODE_IDS, CITY_MODE_ROUTES, getCityModeTransitionTruth } from '../assets/js/contracts/city/city-mode-transition.js';
import { CITY_NAVIGATION_MODE_IDS } from '../assets/js/contracts/city/city-world-state.js';
import {
  W361_CITYWORLDSTATE_MODE_TRANSITION_CONTRACT,
  validateW361CityWorldStateModeTransitionContract
} from '../config/w361-cityworldstate-mode-transition-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (condition, message) => assert.equal(Boolean(condition), true, message);

const surfaces = Object.freeze([
  ['portal', 'assets/js/eon-city-portal.js'],
  ['overview', 'assets/js/eon-operator-map.js'],
  ['command-space', 'assets/js/eon-city-3d-station.js'],
  ['immersive-work', 'assets/js/eon-city-play-station.js'],
  ['chat', 'assets/js/chat-page.js'],
  ['workspace', 'assets/js/eon-workspace-pages.js'],
  ['automations', 'assets/js/eon-automations-page.js'],
  ['apps', 'assets/js/apps/eon-app-deck-page.js'],
  ['local-ai', 'assets/js/local-ai/local-ai-page.js'],
  ['realm-studio', 'assets/js/realm-studio-page.js']
]);

export function inspectW361CityModeTransition() {
  const stateSource = read('assets/js/contracts/city/city-world-state.js');
  const transitionSource = read('assets/js/contracts/city/city-mode-transition.js');
  const redirects = read('_redirects');
  const publicRedirects = read('public/_redirects');
  const checks = [];
  const check = (id, condition, detail) => {
    checks.push({ id, pass: Boolean(condition), detail });
    ensure(condition, `${id}: ${detail}`);
  };

  check('contract-valid', validateW361CityWorldStateModeTransitionContract().length === 0, 'W361 contract has no internal violations');
  check('mode-set-equal', JSON.stringify([...CITY_MODE_IDS]) === JSON.stringify([...CITY_NAVIGATION_MODE_IDS]), 'transition and state modules share the same finite mode identifiers');
  check('state-navigation-bounded', /navigation:\s*\{/.test(stateSource) && /MAX_CITY_TRANSITIONS\s*=\s*12/.test(stateSource) && /normalizeCityNavigation/.test(stateSource), 'CityWorldState persists bounded local navigation receipts');
  check('state-no-private-copy', ['Vault secrets', 'API credentials', 'chat content', 'wallet recovery material', 'payment/affiliate state'].every((token) => stateSource.includes(token)), 'CityWorldState documents the private-data boundary');
  check('transition-no-network-or-execution', !/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|navigator\.sendBeacon)\b/.test(transitionSource) && /execution:\s*'none'/.test(transitionSource), 'transition module neither transports data nor starts work');
  check('transition-ordinary-links', transitionSource.includes('not intercept navigation') && /root\.addEventListener\('click'/.test(transitionSource), 'mode tracking observes ordinary user-tap links only');
  check('transition-safe-fields', /neverStores/.test(transitionSource) && /payment data/.test(transitionSource) && /credentials/.test(transitionSource), 'transition truth contract excludes private and commercial data');

  for (const mode of CITY_MODE_IDS) {
    const route = CITY_MODE_ROUTES[mode];
    check(`route-${mode}`, Boolean(route && getRouteRow(route)), `${mode} maps to a canonical route row`);
  }
  for (const [mode, file] of surfaces) {
    const source = read(file);
    const hasEntry = mode === 'workspace'
      ? /enterCityMode\(cityMode/.test(source) && /\['workspace', 'projects', 'library'\]/.test(source)
      : new RegExp(`enterCityMode\\('${mode}'`).test(source);
    check(`surface-entry-${mode}`, hasEntry, `${mode} surface records a truthful local entry`);
    check(`surface-link-tracking-${mode}`, /bindCityModeLinkTracking/.test(source), `${mode} surface tracks safe same-origin mode links`);
  }
  check('route-files-sync', redirects === renderCloudflareRedirects() && publicRedirects === renderCloudflareRedirects(), 'Cloudflare redirect files remain generated from the single route contract');
  check('automation-route-present', getRouteRow('/automations')?.file === 'automations.html', 'Automations remains a direct canonical route, not an alias loop');
  check('apps-route-present', getRouteRow('/apps')?.file === 'apps.html', 'Apps remains a direct canonical route, not an alias or dashboard redirect');
  check('city-links-to-automation', /href="\/automations"/.test(read('assets/js/eon-operator-map.js')) && /href="\/automations"/.test(read('assets/js/eon-workspace-pages.js')), 'City Overview and Workspace expose the canonical Automations route');

  const truth = getCityModeTransitionTruth();
  check('runtime-truth-aligns', truth.execution === 'none' && truth.localOnly === true, 'runtime truth object remains local-only and non-executing');

  return Object.freeze({
    wave: W361_CITYWORLDSTATE_MODE_TRANSITION_CONTRACT.wave,
    status: 'pass',
    checkCount: checks.length,
    checks,
    modes: [...CITY_MODE_IDS],
    routes: { ...CITY_MODE_ROUTES },
    limitations: Object.freeze([
      'Static source verification only.',
      'No Cloudflare deployment, production HTTP request, browser storage export, provider request, automation execution, or live account connection was performed.'
    ])
  });
}

export function runW361CityModeTransitionGate({ writeArtifact = true } = {}) {
  const result = inspectW361CityModeTransition();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w361-city-mode-transition-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW361CityModeTransitionGate();
  process.stdout.write(`W361 City mode-transition gate passed (${result.checkCount}/${result.checkCount}).\n`);
}

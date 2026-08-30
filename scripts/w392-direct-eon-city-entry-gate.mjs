#!/usr/bin/env node
/** W423/W554/W660 source gate: one authenticated full Babylon City with same-route recovery. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getRouteRow, renderCloudflareRedirects } from '../config/route-contract.mjs';
import {
  W392_DIRECT_EON_CITY_ENTRY_CONTRACT,
  validateW392DirectEonCityEntryContract
} from '../config/w392-direct-eon-city-entry-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW392DirectEonCityEntry() {
  const city = read('eoncity.html');
  const station = read('assets/js/eon-city-play-station.js');
  const accessStation = read('assets/js/city/eon-city-access-station.js');
  const capability = read('assets/js/city/eon-city-play-capability.js');
  const redirects = read('_redirects');
  const publicRedirects = read('public/_redirects');
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };

  check('contract-valid', validateW392DirectEonCityEntryContract().length === 0, 'W423/W554/W660 one-City contract has no internal violations');
  check('direct-route', getRouteRow('/eoncity')?.file === 'eoncity.html' && getRouteRow('/eoncity')?.lifecycle === 'direct-babylon-city', 'canonical City route remains the sole direct Babylon destination');
  check('access-root', /data-eon-city-direct-entry/.test(city) && /Checking City access/.test(city) && /eon-city-access-station\.js/.test(city), 'City page mounts a clear lightweight access state before any heavy renderer');
  const authorizedBootBlock = accessStation.indexOf("if (view.kind === 'boot')");
  const corePreloader = accessStation.indexOf('const preloadCore = () =>', authorizedBootBlock);
  const automaticEntry = accessStation.indexOf('const automaticEntry = enter()', corePreloader);
  const coreImportCount = (accessStation.match(/import\('\.\/eon-city-play-core\.js'\)/g) || []).length;
  const authenticatedAutomaticBoot = authorizedBootBlock >= 0
    && corePreloader > authorizedBootBlock
    && automaticEntry > corePreloader
    && coreImportCount === 1;
  const fullProgressiveRuntime = /mountProgressiveCityNow\(root/.test(accessStation)
    && /EON City · Command Hub/.test(accessStation)
    && /mountBabylonCityProof/.test(accessStation)
    && /data-eon-city-quality-badge/.test(accessStation);
  check('identity-gated-boot', !/<script[^>]+eon-city-play-station\.js/.test(city) && fullProgressiveRuntime && authenticatedAutomaticBoot && !/eon-city-runtime-owner\.js/.test(accessStation) && /isEonCityHeavyBootAllowed\(access\)/.test(accessStation), 'signed-in automatic entry mounts the full progressive City through the proven core inside the authorized boot block and never imports the legacy owner');
  check('no-public-portal-runtime', !/<script[^>]+eon-city-portal\.js/.test(city) && !/data-eon-city-portal-page/.test(city), 'public City route does not mount the retired portal runtime');
  check('direct-station', /root\.hasAttribute\('data-eon-city-direct-entry'\)/.test(station) && /entryMode: 'direct'/.test(station), 'station detects and starts the direct City path');
  check('no-auto-fullscreen', /requestFullscreen: false/.test(station) && /data-eon-play-enter-fullscreen/.test(station), 'direct entry leaves fullscreen behind an explicit in-world action');
  check('no-auto-audio', /direct-entry-no-audio/.test(station) && /soundscape\.activateFromUserGesture\(\)/.test(station), 'direct entry keeps audio behind an explicit gesture');
  check('in-world-settings', /data-eon-play-open-settings/.test(station) && /data-eon-play-settings-save/.test(station) && /Visual changes are saved locally and apply on your next City entry/.test(station), 'City settings live inside the world and do not require a portal page');
  check('same-route-recovery', /EON City needs a lighter start/.test(station) && /Start low-detail City/.test(station) && !/href="\/eoncity\/lite"/.test(station), 'renderer recovery stays on the canonical City route and never makes the map the normal fallback');
  check('legacy-aliases-retired', /\/eoncity\/lite \/eoncity 301/.test(redirects) && /\/eoncity\/tour \/eoncity 301/.test(redirects) && /\/eoncity\/play \/eoncity 301/.test(redirects), 'legacy map, tour and play aliases redirect to the one City route');
  check('local-boundary', !/\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(/.test(station), 'City station has no remote transport');
  check('no-direct-navigation-execution', !/location\.assign|window\.location/.test(station), 'City station does not execute app navigation programmatically');
  check('capability-remains-hint', /eligible: webgl/.test(capability) && /never a lockout/i.test(capability), 'WebGL capability remains a local hint and not a device lockout');
  check('redirects-sync', redirects === renderCloudflareRedirects() && publicRedirects === renderCloudflareRedirects(), 'redirect files remain route-contract derived');

  return Object.freeze({
    schema: 'eonapp.w423-w554-w660.identity-gated-full-eon-city-entry-gate.v4',
    wave: W392_DIRECT_EON_CITY_ENTRY_CONTRACT.wave,
    status: 'pass',
    checkCount: checks.length,
    checks,
    limitations: Object.freeze([
      'Static source verification only.',
      'No real desktop or mobile device run, Babylon screenshot, fullscreen/orientation proof, City gameplay assessment, account action, provider request, social connector, reward or commercial action was performed.'
    ])
  });
}

export function runW392DirectEonCityEntryGate({ writeArtifact = true } = {}) {
  const result = inspectW392DirectEonCityEntry();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w392-direct-eon-city-entry-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW392DirectEonCityEntryGate();
  process.stdout.write(`W423-W554-W660 identity-gated full EON City entry gate passed (${result.checkCount}/${result.checkCount}).\n`);
}

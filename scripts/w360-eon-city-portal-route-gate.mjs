#!/usr/bin/env node
/** W360 historical source gate: former portal is retired; W392 owns direct City entry. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDevRouteRewrites, getRouteRow, renderCloudflareRedirects } from '../config/route-contract.mjs';
import { W360_EON_CITY_PORTAL_ROUTE_CONTRACT, validateW360EonCityPortalRouteContract } from '../config/w360-eon-city-portal-route-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (condition, message) => assert.equal(Boolean(condition), true, message);

export function inspectW360EonCityPortalRoute() {
  const city = read('eoncity.html');
  const overview = read('eoncity-lite.html');
  const tour = read('eoncity-3d.html');
  const play = read('eoncity-play.html');
  const portalRuntime = read('assets/js/eon-city-portal.js');
  const portalCss = read('assets/css/eon-city-portal.css');
  const mapRuntime = read('assets/js/eon-operator-map.js');
  const tourRuntime = read('assets/js/eon-city-3d-station.js');
  const playRuntime = read('assets/js/eon-city-play-station.js');
  const commandHub = read('assets/js/chat/eonbot-command-hub.js');
  const contextRegistry = read('assets/js/chat/eonbot-context-registry.js');
  const sponsoredPolicy = read('config/sponsored-discovery-policy.mjs');
  const redirects = read('_redirects');
  const publicRedirects = read('public/_redirects');
  const rewrites = createDevRouteRewrites();
  const checks = [];
  const check = (id, condition, detail) => { checks.push({ id, pass: Boolean(condition), detail }); ensure(condition, `${id}: ${detail}`); };

  check('contract-valid', validateW360EonCityPortalRouteContract().length === 0, 'W360 retirement record has no internal violations');
  for (const [route, file] of [['/eoncity', 'eoncity.html'], ['/eoncity/lite', 'eoncity-lite.html'], ['/eoncity/tour', 'eoncity-3d.html'], ['/eoncity/3d', 'eoncity-3d.html'], ['/eoncity/play', 'eoncity-play.html']]) {
    check(`route-${route}`, getRouteRow(route)?.file === file && rewrites.get(route) === `/${file}`, `${route} resolves to ${file}`);
  }
  check('direct-city-entry', /data-eon-city-direct-entry/.test(city) && /eon-city-play-station\.js/.test(city), 'EON City uses direct Babylon entry');
  check('portal-retired-from-public-route', !/<script[^>]+eon-city-portal\.js/.test(city) && !/data-eon-city-portal-page/.test(city), 'former portal runtime is not mounted publicly');
  check('legacy-portal-inert', /data-eon-city-portal/.test(portalRuntime) && /ENTER EON CITY/.test(portalRuntime) && !/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\b/.test(portalRuntime), 'retired portal source remains local-only and inert');
  check('legacy-portal-style-retained', /prefers-reduced-motion/.test(portalCss) && /eon-city-portal-entry/.test(portalCss), 'retired portal styling remains source-compatible');
  check('overview-moved', /EON City Overview/.test(overview) && /eon-operator-map\.js/.test(overview), 'City Map fallback keeps its local map runtime');
  check('overview-links-new-modes', /\/eoncity\/tour/.test(mapRuntime) && /\/eoncity\/play/.test(mapRuntime), 'City Map preserves compatibility mode links');
  check('tour-canonical', /canonical" href="https:\/\/eonapp\.ch\/eoncity\/tour"/.test(tour) && /Spatial Command Space/.test(tour), 'Three.js preview remains isolated at /eoncity/tour');
  check('tour-fallback-and-copy', /City Overview/.test(tour) && /Spatial Command Space/.test(tourRuntime), 'Three.js preview retains fallback copy');
  check('play-copy', /Immersive Work Mode/.test(play) && /Immersive Work Mode/.test(playRuntime), 'compatibility Play route retains its review wording');
  check('command-routing', /open-eon-city-tour/.test(commandHub) && /\/eoncity\/tour/.test(commandHub) && /\/eoncity\/lite/.test(commandHub), 'EONBOT retains safe City route choices');
  check('context-routing', /\/eoncity\/tour/.test(contextRegistry) && /\/eoncity\/lite/.test(contextRegistry), 'EONBOT context manifest exposes compatibility City routes');
  check('sponsor-boundary', ['/eoncity', '/eoncity/lite', '/eoncity/tour', '/eoncity/3d', '/eoncity/play'].every((route) => sponsoredPolicy.includes(`'${route}'`)), 'all City routes remain sponsor-protected');
  check('redirect-contract', redirects === renderCloudflareRedirects() && publicRedirects === renderCloudflareRedirects(), 'redirect files are route-contract derived');

  return Object.freeze({
    wave: W360_EON_CITY_PORTAL_ROUTE_CONTRACT.wave,
    status: 'pass',
    checkCount: checks.length,
    checks,
    routes: Object.freeze({ city: '/eoncity', overview: '/eoncity/lite', tour: '/eoncity/tour', compatibility3d: '/eoncity/3d', immersiveWork: '/eoncity/play' }),
    limitations: Object.freeze(['Static source verification only.', 'No live Cloudflare request, full build, art asset, provider call, fullscreen request, wallet, reward, or background task was executed.'])
  });
}

export function runW360EonCityPortalRouteGate({ writeArtifact = true } = {}) {
  const result = inspectW360EonCityPortalRoute();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w360-eon-city-portal-route-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW360EonCityPortalRouteGate();
  process.stdout.write(`W360 retired-portal route gate passed (${result.checkCount}/${result.checkCount}).\n`);
}

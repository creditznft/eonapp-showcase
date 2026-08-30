#!/usr/bin/env node
/** W363 source gate: City Lite illustrated 2.5D detail, safety and accessibility. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getRouteRow, renderCloudflareRedirects } from '../config/route-contract.mjs';
import {
  EON_CITY_LITE_ART_DIRECTION_SCHEMA,
  EON_CITY_LITE_VISUAL_QUALITY_IDS,
  getCityLiteDistrictArt,
  listCityLiteDistrictArt,
  resolveCityLiteVisualProfile,
  validateCityLiteArtDirection
} from '../assets/js/city/eon-city-lite-art-direction.js';
import {
  W363_CITY_LITE_ART_CONTRACT,
  validateW363CityLiteArtContract
} from '../config/w363-city-lite-art-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (condition, message) => assert.equal(Boolean(condition), true, message);

export function inspectW363CityLiteArt() {
  const checks = [];
  const check = (id, condition, detail) => {
    checks.push({ id, pass: Boolean(condition), detail });
    ensure(condition, `${id}: ${detail}`);
  };
  const map = read('assets/js/eon-operator-map.js');
  const art = read('assets/js/city/eon-city-lite-art-direction.js');
  const html = read('eoncity-lite.html');
  const css = read('assets/css/eon-operator-map.css');
  const redirects = read('_redirects');
  const publicRedirects = read('public/_redirects');

  check('contract-valid', validateW363CityLiteArtContract().length === 0, 'W363 contract contains no internal boundary violation');
  check('art-valid', validateCityLiteArtDirection().length === 0, 'all canonical district art definitions and accessibility overrides are valid');
  check('schema-versioned', EON_CITY_LITE_ART_DIRECTION_SCHEMA === 'eon.city.lite-art-direction.v1', 'art direction metadata is versioned');
  check('quality-choices', JSON.stringify(EON_CITY_LITE_VISUAL_QUALITY_IDS) === JSON.stringify(['auto', 'high', 'conserve']), 'only Auto, High and Conserve are public choices');
  check('canonical-route', getRouteRow('/eoncity/lite')?.file === 'eoncity-lite.html', 'City Lite remains a direct canonical route');
  check('page-title-and-copy', /EON City Overview/.test(html) && /illustrated 2\.5D/.test(html), 'City Lite is clearly labelled as illustrated overview, not Immersive Work Mode');
  check('district-art-count', listCityLiteDistrictArt().length === 8, 'all eight canonical districts have art metadata');
  for (const districtId of ['command', 'workspace', 'market', 'realm', 'library', 'trade', 'vault', 'orientation']) {
    const district = getCityLiteDistrictArt(districtId);
    check(`district-${districtId}`, Boolean(district.silhouette && district.accent && district.transitStop), `${districtId} has deterministic landmark treatment`);
  }
  const reduced = resolveCityLiteVisualProfile({ quality: 'high', reducedMotion: true, deviceMemory: 16 });
  const saver = resolveCityLiteVisualProfile({ quality: 'high', saveData: true, deviceMemory: 16 });
  const constrained = resolveCityLiteVisualProfile({ quality: 'high', deviceMemory: 2 });
  check('reduced-motion-wins', reduced.quality === 'conserve' && reduced.rain === false, 'reduced motion overrides High detail');
  check('save-data-wins', saver.quality === 'conserve' && saver.transitLights === 0, 'data saver overrides High detail');
  check('low-memory-wins', constrained.quality === 'conserve' && constrained.particles === 0, 'low memory overrides High detail');
  check('no-art-network', !/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|navigator\.sendBeacon)\b/.test(art), 'art direction module has no network or telemetry client');
  check('renderer-wiring', ['drawSkylineHorizon', 'drawTransitCircuit', 'drawAtmosphericDetails', 'drawDistrictCallouts', 'getCityLiteDistrictArt', 'data-city-visual-quality'].every((token) => map.includes(token)), 'renderer exposes skyline, transit, atmosphere, landmark and visual-detail wiring');
  check('hover-and-preference-ui', /pointermove/.test(map) && /saveCityLiteVisualPreferences/.test(map) && /updateVisualDetailUi/.test(map), 'City Lite offers visible local hover and preference interaction');
  check('style-support', /W363/.test(css) && /eon-city-visual-choice/.test(css) && /prefers-reduced-motion/.test(css), 'visual controls include responsive and reduced-motion styling');
  check('truth-boundary', /not the Babylon experience/.test(map) && /No fake crowd/.test(map), 'City Lite copy does not imply a fake simulated City or replace Babylon');
  check('redirects-sync', redirects === renderCloudflareRedirects() && publicRedirects === renderCloudflareRedirects(), 'Cloudflare redirect files remain generated from route contract');

  return Object.freeze({
    wave: W363_CITY_LITE_ART_CONTRACT.wave,
    status: 'pass',
    checkCount: checks.length,
    checks,
    limitations: Object.freeze([
      'Static source and unit verification only.',
      'No GLB assets, browser screenshot, GPU benchmark, Cloudflare deployment, live route probe, account connection, provider call, payment flow, or external automation execution was performed.'
    ])
  });
}

export function runW363CityLiteArtGate({ writeArtifact = true } = {}) {
  const result = inspectW363CityLiteArt();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w363-city-lite-art-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW363CityLiteArtGate();
  process.stdout.write(`W363 City Lite art gate passed (${result.checkCount}/${result.checkCount}).\n`);
}

#!/usr/bin/env node
/** W428 static gate: aliases, caches and active command surfaces choose one City. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCloudflareRedirects } from '../config/route-contract.mjs';
import { CITY_MODE_ROUTES, RETIRED_CITY_MODE_PATHS } from '../assets/js/contracts/city/city-mode-transition.js';
import { W428_ONE_PUBLIC_CITY_RETIREMENT_CONTRACT, validateW428OnePublicCityRetirementContract } from '../config/w428-one-public-city-retirement-contract.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (condition, message) => assert.equal(Boolean(condition), true, message);
export function inspectW428OnePublicCityRetirement() {
  const checks=[]; const check=(id, condition, detail)=>{ checks.push({id, pass:Boolean(condition), detail}); ensure(condition, `${id}: ${detail}`); };
  const station=read('assets/js/eon-city-play-station.js'); const hub=read('assets/js/chat/eonbot-command-hub.js'); const registry=read('assets/js/chat/eonbot-context-registry.js'); const capability=read('assets/js/capabilities/capability-truth-registry.js'); const lighthouse=read('scripts/w107-main-lighthouse-direct.mjs'); const sw=read('sw.js'); const publicSw=read('public/sw.js'); const redirects=read('_redirects'); const publicRedirects=read('public/_redirects');
  check('contract-valid', validateW428OnePublicCityRetirementContract().length===0, 'W428 contract has no internal violation');
  check('aliases-retired', W428_ONE_PUBLIC_CITY_RETIREMENT_CONTRACT.aliases.every((alias)=>RETIRED_CITY_MODE_PATHS.has(alias)), 'Every legacy City alias is recognized as retired');
  check('mode-canonicalized', ['portal','overview','command-space','immersive-work'].every((mode)=>CITY_MODE_ROUTES[mode]==='/eoncity'), 'Legacy mode identifiers resolve to canonical City only');
  check('sw-cache-boundary', /const RELEASE_ID = '[a-z0-9._-]+'/i.test(sw)&&/const RELEASE_ID = '[a-z0-9._-]+'/i.test(publicSw)&&/LEGACY_CITY_NAVIGATION_PATHS/.test(sw)&&/Response\.redirect\(new URL\('\/eoncity'/.test(sw), 'Both service workers redirect stale City navigation to canonical City');
  check('generated-redirects', redirects===renderCloudflareRedirects()&&publicRedirects===renderCloudflareRedirects(), 'Redirect files remain generated from route contract');
  check('active-command-hub-clean', !/\/eoncity\/(lite|tour|3d|play)/.test(hub)&&/direct Babylon Command District/.test(hub), 'EONBOT command routes do not expose legacy City destinations');
  check('context-registry-clean', !/\/eoncity\/(lite|tour|3d|play)/.test(registry)&&/direct Babylon Command District/.test(registry), 'EONBOT context exposes only canonical City');
  check('capability-retired', /id: 'eon-city-spatial-command-space'.*lifecycle: 'retired'/s.test(capability)&&/routes: \['\/eoncity'\]/.test(capability), 'Alternate renderer capability is retired rather than shipped');
  check('city-station-clean', !/href="\/eoncity\/(lite|tour|3d|play)/.test(station), 'City station recovery does not link to a second public City page');
  check('lighthouse-canonical', !/eoncity-3d/.test(lighthouse)&&/\['eoncity', '\/eoncity'\]/.test(lighthouse), 'Future Lighthouse route list measures direct City only');
  return Object.freeze({schema:'eonapp.w428.one-public-city-retirement-gate.v1',wave:'W428',status:'pass',checkCount:checks.length,checks,limitations:Object.freeze(['Static source verification only.','No deployed redirect request, Service Worker activation, real browser cache migration, device City boot, or Lighthouse score was performed.'])});
}
export function runW428OnePublicCityRetirementGate({writeArtifact=true}={}) { const result=inspectW428OnePublicCityRetirement(); if(writeArtifact){const directory=path.join(root,'artifacts','w428-one-public-city-retirement-gate');mkdirSync(directory,{recursive:true});writeFileSync(path.join(directory,'stats.json'),`${JSON.stringify(result,null,2)}\n`);} return result; }
if(import.meta.url===`file://${process.argv[1]}`){const result=runW428OnePublicCityRetirementGate();process.stdout.write(`W428 one-public-City gate passed (${result.checkCount}/${result.checkCount}).\n`);}

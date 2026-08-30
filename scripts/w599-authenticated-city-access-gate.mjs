#!/usr/bin/env node
/**
 * W599 source gate — protects the authenticated City entry/cache contract.
 * It is source-only. It does not contact Google, create an account, inject a
 * cookie, read a browser profile, or certify a live release.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
function check(condition, message) { if (!condition) failures.push(message); }
async function text(relative) { return readFile(path.join(ROOT, relative), 'utf8'); }

const [contract, access, rootWorker, publicWorker, cityDocument, accessStation] = await Promise.all([
  text('config/w554-eon-city-access-project-portals-contract.mjs'),
  text('functions/api/city/access.js'),
  text('sw.js'),
  text('public/sw.js'),
  text('eoncity.html'),
  text('assets/js/city/eon-city-access-station.js')
]);

check(contract.includes("EON_CITY_DEFAULT_ACCESS_MODE = 'authenticated-play'"), 'missing authenticated default access mode');
check(/if \(!mode\) return EON_CITY_DEFAULT_ACCESS_MODE/.test(contract), 'blank deployment mode does not fail closed to authenticated play');
check(/mode = EON_CITY_DEFAULT_ACCESS_MODE/.test(contract), 'default decision still silently chooses public preview');
check(access.includes("{ vary: 'Cookie' }"), 'City access endpoint must vary by session cookie');
check(rootWorker === publicWorker, 'root and public service workers differ');
check(rootWorker.includes("RELEASE_ID = 'w599-2026-07-04-authenticated-city-network'"), 'service worker release id not bumped');
const precacheBlock = rootWorker.match(/PRECACHE\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\);/);
check(Boolean(precacheBlock), 'service worker PRECACHE block missing');
check(!precacheBlock?.[1]?.includes("'/eoncity'"), 'City document remains precached');
check(/NO_STORE_NAVIGATION_PREFIXES[\s\S]*?'\/eoncity'/.test(rootWorker), 'City navigation is not network-only');
check(rootWorker.includes('CITY_RUNTIME_RELEASE_CACHE_PREFIXES'), 'City runtime release-cache policy missing');
check(rootWorker.includes("'/assets/js/city/'"), 'City module directory is cache-first');
check(rootWorker.includes('isCityRuntimeReleaseCachePath(url.pathname)'), 'City runtime release-cache policy is not active in fetch handler');
check(cityDocument.includes('assets/js/city/eon-city-access-station.js'), 'City page no longer mounts server-verified access station');
check(!cityDocument.includes('assets/js/eon-city-play-station.js'), 'City document directly imports the heavy renderer');
check(accessStation.includes("cache: 'no-store'"), 'City access client fetch may reuse cached authorization');
check(accessStation.includes("return import('../eon-city-play-station.js')"), 'City heavy boot is not deferred behind access station');

if (failures.length) {
  console.error(JSON.stringify({ ok: false, gate: 'W599_AUTHENTICATED_CITY_ACCESS_GATE', failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, gate: 'W599_AUTHENTICATED_CITY_ACCESS_GATE', checks: 15 }, null, 2));

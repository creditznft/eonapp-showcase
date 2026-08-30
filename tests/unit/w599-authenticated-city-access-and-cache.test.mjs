import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_DEFAULT_ACCESS_MODE,
  EON_CITY_ACCESS_SCHEMA,
  buildEonCityAccessDecision,
  normalizeEonCityAccessMode
} from '../../config/w554-eon-city-access-project-portals-contract.mjs';
import { onRequestGet as cityAccess } from '../../functions/api/city/access.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('W599 defaults a missing City deployment mode to authenticated play without enabling guest Babylon boot', async () => {
  assert.equal(EON_CITY_DEFAULT_ACCESS_MODE, 'authenticated-play');
  assert.equal(normalizeEonCityAccessMode(''), 'authenticated-play');
  assert.equal(normalizeEonCityAccessMode(undefined), 'authenticated-play');
  assert.equal(normalizeEonCityAccessMode('public-preview'), 'authenticated-play');
  assert.equal(normalizeEonCityAccessMode('unrecognized'), 'authenticated-play');

  const guest = buildEonCityAccessDecision({ identityAvailable: true, signedIn: false });
  assert.equal(guest.schema, EON_CITY_ACCESS_SCHEMA);
  assert.equal(guest.mode, 'authenticated-play');
  assert.equal(guest.requiresIdentity, true);
  assert.equal(guest.canBootFullCity, false);
  assert.equal(guest.heavyRuntimeImportAllowed, false);

  const signedIn = buildEonCityAccessDecision({ identityAvailable: true, signedIn: true });
  assert.equal(signedIn.mode, 'authenticated-play');
  assert.equal(signedIn.canBootFullCity, true);
  assert.equal(signedIn.heavyRuntimeImportAllowed, true);
});

test('W599 City access endpoint varies by the session cookie and never silently returns guest play when mode is unset', async () => {
  const response = await cityAccess({
    request: new Request('https://eonapp.ch/api/city/access'),
    env: {}
  });
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
  assert.match(response.headers.get('vary') || '', /Cookie/i);
  assert.equal(payload.schema, EON_CITY_ACCESS_SCHEMA);
  assert.equal(payload.mode, 'authenticated-play');
  assert.equal(payload.requiresIdentity, true);
  assert.equal(payload.canBootFullCity, false);
  assert.equal(payload.heavyRuntimeImportAllowed, false);
  assert.doesNotMatch(JSON.stringify(payload), /(?:account_id|accountId|email|access_token|refresh_token|client_secret|promptText|projectId)\s*[:=]/i);
});

test('W649B retires public preview and never lets a legacy mode bypass identity', () => {
  const preview = buildEonCityAccessDecision({ mode: 'public-preview', identityAvailable: true, signedIn: false });
  assert.equal(preview.mode, 'authenticated-play');
  assert.equal(preview.requiresIdentity, true);
  assert.equal(preview.canBootFullCity, false);
  assert.equal(preview.heavyRuntimeImportAllowed, false);
  assert.equal(preview.publicPreviewAvailable, false);
});

test('W766IR2-E keeps City out of generic caches and permits it only through an explicit signed offline pack', async () => {
  const rootWorker = await readFile(path.join(ROOT, 'sw.js'), 'utf8');
  const publicWorker = await readFile(path.join(ROOT, 'public', 'sw.js'), 'utf8');
  assert.equal(rootWorker, publicWorker, 'root and public service workers must remain byte-identical');
  assert.match(rootWorker, /RELEASE_ID = 'w765-2026-07-31-release-identity-source-template'/);
  const precache = rootWorker.match(/const\s+\/\*\*[^]*?\*\/\s*PRECACHE\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\);/);
  assert.ok(precache, 'PRECACHE block missing');
  assert.doesNotMatch(precache[1], /['"]\/eoncity['"]/);
  assert.match(rootWorker, /NO_STORE_NAVIGATION_PREFIXES[\s\S]*?['"]\/eoncity['"]/);
  assert.match(rootWorker, /CITY_RUNTIME_RELEASE_CACHE_PREFIXES/);
  assert.match(rootWorker, /['"]\/assets\/js\/city\/['"]/);
  assert.match(rootWorker, /isCityRuntimeReleaseCachePath\(url\.pathname\)/);
  assert.match(rootWorker, /OFFLINE_CITY_CAPABILITY_SCHEMA/);
  assert.match(rootWorker, /issueOfflineCapability\(\{ installationId, manifestDigest: manifest\.digest, packs \}\)/);
  assert.match(rootWorker, /explicitUserAction !== true/);
  assert.match(rootWorker, /matchActiveOfflinePack\(event\.request, \{ navigation: false, requirePack: 'city' \}\)/);
});

test('W599 evidence scripts match the bundled access shell and signed-in session contract', async () => {
  const preflight = await readFile(path.join(ROOT, 'scripts', 'w599-live-city-access-preflight.mjs'), 'utf8');
  const runner = await readFile(path.join(ROOT, 'scripts', 'w599-run-authenticated-eoncity.mjs'), 'utf8');
  assert.match(preflight, /hasAccessShell: documentText\.includes\('Checking City access'\)/);
  assert.doesNotMatch(preflight, /eon-city-access-station\.js/);
  assert.match(runner, /available: body\?\.available === true/);
  assert.doesNotMatch(runner, /configured: body\?\.configured === true/);
  assert.match(runner, /inspectPointerOwnership/);
  assert.match(runner, /CITY_OVERLAY_POINTER_INTERCEPT/);
  assert.match(runner, /data-eon-play-interact/);
  for (const selector of ['data-eon-play-open-start-here', 'data-eon-play-open-eonbot', 'data-eon-play-open-voice-consent', 'data-eon-play-open-chat', 'data-eon-play-open-travel-map', 'data-eon-play-open-command-room', 'data-eon-play-share-city', 'data-eon-play-open-controls']) {
    assert.match(runner, new RegExp(selector));
  }
});

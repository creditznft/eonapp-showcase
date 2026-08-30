#!/usr/bin/env node
/**
 * W599 anonymous production/preview preflight.
 * Safe: no credentials, cookies, storage state or browser automation.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = String(process.env.EON_CITY_PUBLIC_URL || 'https://eonapp.ch').replace(/\/$/, '');
const outputDir = path.join(ROOT, 'reports', 'w599-live-city-access-preflight');
function fail(code, message) { const error = new Error(message); error.code = code; throw error; }
function assert(condition, code, message) { if (!condition) fail(code, message); }
function safeUrl(value = '') { try { const url = new URL(value); url.search = ''; url.hash = ''; return url.toString(); } catch { return String(value).slice(0, 240); } }

const result = { schema: 'eon.city.live-access-preflight.w599.v1', createdAt: new Date().toISOString(), baseUrl: safeUrl(baseUrl), outcome: 'BLOCKED' };
try {
  const base = new URL(baseUrl);
  assert(base.protocol === 'https:', 'INVALID_TARGET', 'City preflight requires an HTTPS target.');
  const response = await fetch(`${baseUrl}/api/city/access`, { headers: { accept: 'application/json', 'cache-control': 'no-store' }, cache: 'no-store', redirect: 'error' });
  const payload = await response.json().catch(() => ({}));
  result.access = {
    status: response.status,
    cacheControl: response.headers.get('cache-control') || '',
    vary: response.headers.get('vary') || '',
    mode: String(payload?.mode || ''),
    requiresIdentity: payload?.requiresIdentity === true,
    identityAvailable: payload?.identityAvailable === true,
    signedIn: payload?.signedIn === true,
    canBootFullCity: payload?.canBootFullCity === true,
    heavyRuntimeImportAllowed: payload?.heavyRuntimeImportAllowed === true,
    reason: String(payload?.reason || '').slice(0, 220)
  };
  assert(response.ok, 'CITY_ACCESS_ENDPOINT_FAILED', 'The City access endpoint did not return 200.');
  assert(result.access.mode === 'authenticated-play' && result.access.requiresIdentity, 'CITY_MODE_NOT_AUTHENTICATED', 'Production is still configured as public preview. Set EON_CITY_ACCESS_MODE=authenticated-play and redeploy.');
  assert(!result.access.signedIn && !result.access.canBootFullCity && !result.access.heavyRuntimeImportAllowed, 'GUEST_RENDERER_EXPOSED', 'An anonymous endpoint call can authorize the City renderer.');
  assert(/no-store/i.test(result.access.cacheControl) && /cookie/i.test(result.access.vary), 'CITY_ACCESS_CACHE_UNSAFE', 'City access response lacks no-store and Vary: Cookie.');
  assert(result.access.identityAvailable, 'GOOGLE_IDENTITY_NOT_CONFIGURED', 'Google identity is not configured on this deployment; signed-in City cannot be tested yet.');
  const documentResponse = await fetch(`${baseUrl}/eoncity`, { headers: { accept: 'text/html', 'cache-control': 'no-store' }, cache: 'no-store' });
  const documentText = await documentResponse.text();
  result.document = {
    status: documentResponse.status,
    hasCityRoot: documentText.includes('data-eon-city-play-root'),
    hasAccessShell: documentText.includes('Checking City access') && documentText.includes('The full renderer stays off until private City access is confirmed.'),
    directHeavyModule: documentText.includes('assets/js/eon-city-play-station.js') || documentText.includes('eon-play-canvas')
  };
  assert(documentResponse.ok && result.document.hasCityRoot && result.document.hasAccessShell && !result.document.directHeavyModule, 'CITY_DOCUMENT_GATE_INVALID', 'City document does not mount the access shell safely.');
  result.outcome = 'GUEST_ACCESS_POLICY_PROVEN';
} catch (error) {
  result.outcome = String(error?.code || 'W599_PREFLIGHT_FAILURE');
  result.error = String(error?.message || error).slice(0, 420);
}
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'summary.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(result, null, 2));
if (result.outcome !== 'GUEST_ACCESS_POLICY_PROVEN') process.exit(1);

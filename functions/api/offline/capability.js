/** W766IR2-E — privacy-safe offline capability receipt.
 *
 * This endpoint never returns an account id, email, cookie, bearer token,
 * provider key, prompt, project, file or City progress. It only proves that an
 * authenticated browser explicitly installed a bounded offline pack.
 */
import {
  enforceSameOriginMutation,
  getIdentityConfig,
  hmacBase64Url,
  jsonResponse,
  readSession
} from '../../_shared/eon-auth.js';

export const EON_OFFLINE_CAPABILITY_SCHEMA = 'eonapp.offline-capability.w766ir2.v1';
export const EON_OFFLINE_CAPABILITY_SECONDS = 60 * 60 * 24 * 180;
const ALLOWED_PACKS = new Set(['core', 'city']);

function cleanInstallationId(value = '') {
  const clean = String(value || '').trim().toLowerCase();
  return /^[a-z0-9][a-z0-9._-]{15,95}$/.test(clean) ? clean : '';
}

function cleanDigest(value = '') {
  const clean = String(value || '').trim().toLowerCase();
  return /^[a-f0-9]{64}$/.test(clean) ? clean : '';
}

function cleanPacks(value = []) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || '').trim().toLowerCase()).filter((item) => ALLOWED_PACKS.has(item)))].sort();
}


async function readDeployedOfflineManifest(context) {
  const url = new URL('/offline/eonapp-offline-pack-manifest.json', context.request.url);
  const request = new Request(url.toString(), { method: 'GET', headers: { accept: 'application/json' }, cache: 'no-store' });
  const response = context.env?.ASSETS?.fetch
    ? await context.env.ASSETS.fetch(request)
    : await fetch(request);
  if (!response?.ok) return null;
  try {
    const manifest = await response.json();
    if (manifest?.schema !== 'eonapp.offline-pack-manifest.w766ir2.v1') return null;
    if (!/^[a-f0-9]{64}$/.test(String(manifest?.digest || ''))) return null;
    return manifest;
  } catch {
    return null;
  }
}

function encodeBase64Url(value = '') {
  const bytes = new TextEncoder().encode(String(value || ''));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function onRequestPost(context) {
  const config = getIdentityConfig(context.request, context.env);
  if (!config.configured) return jsonResponse({ ok: false, error: 'identity_unavailable' }, 503);
  if (!enforceSameOriginMutation(context.request, config)) return jsonResponse({ ok: false, error: 'same_origin_required' }, 403);
  const session = await readSession(config, context.request);
  if (!session) return jsonResponse({ ok: false, error: 'signed_in_required' }, 401);

  let body = null;
  try { body = await context.request.json(); } catch { return jsonResponse({ ok: false, error: 'invalid_json' }, 400); }
  const installationId = cleanInstallationId(body?.installationId);
  const manifestDigest = cleanDigest(body?.manifestDigest);
  const packs = cleanPacks(body?.packs);
  if (!installationId || !manifestDigest || !packs.length || !packs.includes('city')) {
    return jsonResponse({ ok: false, error: 'offline_capability_request_invalid' }, 400);
  }
  const deployedManifest = await readDeployedOfflineManifest(context);
  if (!deployedManifest) return jsonResponse({ ok: false, error: 'offline_manifest_unavailable' }, 503);
  if (String(deployedManifest.digest) !== manifestDigest || Number(deployedManifest?.packs?.city?.entries || 0) < 1) {
    return jsonResponse({ ok: false, error: 'offline_manifest_mismatch' }, 409);
  }

  const now = Date.now();
  void session;
  const payload = Object.freeze({
    schema: EON_OFFLINE_CAPABILITY_SCHEMA,
    installationId,
    entitlementClass: 'identity-session-local-offline',
    packs: Object.freeze(packs),
    manifestDigest,
    issuedAt: now,
    expiresAt: now + (EON_OFFLINE_CAPABILITY_SECONDS * 1000),
    requiresOnlineRenewalAfterExpiry: true,
    automaticCloudSync: false,
    privateContentIncluded: false
  });
  const encoded = encodeBase64Url(JSON.stringify(payload));
  const signature = await hmacBase64Url(encoded, config.sessionKey);
  return jsonResponse({ ok: true, receipt: Object.freeze({ ...payload, signature: `hmac-sha256.${signature}` }) }, 200, { vary: 'Cookie' });
}

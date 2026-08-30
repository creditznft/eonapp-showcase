/**
 * W554B — protected EON City asset namespace experiment.
 *
 * This middleware sits in front of `/city-private/*`. It deliberately reuses
 * only the existing EONAPP identity-only session. It returns no account data,
 * project data, Google data, City state, token or secret.
 *
 * Initial policy: private/no-store. This is intentionally conservative while
 * the real-device cache and throughput benchmark is pending. The namespace
 * must not carry production GLB/KTX2 packs until that benchmark is approved.
 *
 * W554C supersedes this namespace as an art-delivery choice: production City
 * binary art must use direct static client delivery plus an edge access policy,
 * not a Pages Function body relay. Keep this file only as a synthetic gate
 * fixture until the experiment is retired after the edge path is proven.
 */
import { getIdentityConfig, readSession } from '../_shared/eon-auth.js';

const PRIVATE_ASSET_SCHEMA = 'eon.city.private-asset.w554b.v1';
const ALLOWED_METHODS = new Set(['GET', 'HEAD']);

function denied(status = 401, code = 'city_sign_in_required') {
  return new Response(JSON.stringify({
    ok: false,
    schema: PRIVATE_ASSET_SCHEMA,
    error: code,
    detail: status === 503
      ? 'EON City private assets are unavailable until identity is configured.'
      : 'Sign in with Google through EONAPP before requesting private City assets.'
  }), {
    status,
    headers: {
      'cache-control': 'no-store, max-age=0',
      'content-type': 'application/json; charset=utf-8',
      'referrer-policy': 'no-referrer',
      'x-content-type-options': 'nosniff',
      'x-eon-city-asset-gate': 'denied'
    }
  });
}

function gatedHeaders(response) {
  const headers = new Headers(response?.headers || {});
  // Do not allow shared-cache reuse across an authenticated/unauthenticated
  // boundary during the W554B experiment. Future caching requires measured
  // proof and an explicit edge-ticket design.
  headers.set('cache-control', 'private, no-store, max-age=0');
  headers.set('referrer-policy', 'no-referrer');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('x-eon-city-asset-gate', 'identity-session');
  const vary = String(headers.get('vary') || '').split(',').map((entry) => entry.trim()).filter(Boolean);
  if (!vary.some((entry) => entry.toLowerCase() === 'cookie')) vary.push('Cookie');
  headers.set('vary', vary.join(', '));
  return headers;
}

export async function onRequest(context) {
  const request = context?.request;
  if (!request || !ALLOWED_METHODS.has(String(request.method || 'GET').toUpperCase())) return denied(405, 'method_not_allowed');
  const config = getIdentityConfig(request, context?.env || {});
  if (!config.configured) return denied(503, 'identity_not_ready');
  let session = null;
  try { session = await readSession(config, request); } catch { return denied(503, 'identity_session_unavailable'); }
  if (!session) return denied(401, 'city_sign_in_required');
  const response = await context.next();
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: gatedHeaders(response) });
}

export const EON_CITY_PRIVATE_ASSET_GATE_SCHEMA = PRIVATE_ASSET_SCHEMA;

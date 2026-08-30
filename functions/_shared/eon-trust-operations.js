/** A15 I20 — Pages Functions trust/support request helpers. */
import { getIdentityConfig, jsonResponse, readSession } from './eon-auth.js';

const encoder = new TextEncoder();
function clean(value = '', limit = 300) { return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, limit); }
function constantTimeEqual(left = '', right = '') {
  const a = encoder.encode(String(left || ''));
  const b = encoder.encode(String(right || ''));
  let mismatch = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) mismatch |= (a[index] || 0) ^ (b[index] || 0);
  return mismatch === 0;
}

export function enforceTrustSameOrigin(request) {
  let requestOrigin = '';
  try { requestOrigin = new URL(request.url).origin; } catch { return false; }
  const origin = clean(request.headers.get('origin'), 300);
  const site = clean(request.headers.get('sec-fetch-site'), 40).toLowerCase();
  return Boolean(origin && origin === requestOrigin && (!site || site === 'same-origin'));
}

export async function readOptionalTrustSession(request, env = {}) {
  try {
    const config = getIdentityConfig(request, env);
    if (!config.configured) return null;
    return await readSession(config, request);
  } catch { return null; }
}

export function readCaseToken(request) {
  const header = clean(request.headers.get('x-eon-case-token'), 200);
  if (header) return header;
  const authorization = clean(request.headers.get('authorization'), 260);
  const match = authorization.match(/^EonCase\s+(.+)$/i);
  return match ? clean(match[1], 200) : '';
}

export function requireOperator(request, env = {}) {
  const expected = String(env.EON_TRUST_OPERATOR_TOKEN || '');
  const authorization = clean(request.headers.get('authorization'), 500);
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const supplied = match ? match[1] : '';
  return Boolean(expected.length >= 32 && supplied && constantTimeEqual(supplied, expected));
}

export function trustJson(body, status = 200, headers = {}) {
  return jsonResponse(body, status, { 'cache-control': 'no-store, max-age=0', ...headers });
}

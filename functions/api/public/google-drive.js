/**
 * Public, non-secret configuration for the optional browser-only Drive snapshot adapter.
 * The OAuth client ID is intentionally public. A client secret is never accepted here.
 */
import { EON_GOOGLE_DRIVE_SNAPSHOT_SCOPE } from '../../../config/w536-google-drive-snapshot-contract.mjs';

const CLIENT_ID_RE = /^\d{6,}-[A-Za-z0-9_-]{12,}\.apps\.googleusercontent\.com$/;

function safeClientId(value = '') {
  const clientId = String(value || '').trim().slice(0, 320);
  return CLIENT_ID_RE.test(clientId) ? clientId : '';
}

export async function onRequestGet({ env }) {
  const clientId = safeClientId(env?.EON_GOOGLE_DRIVE_OAUTH_CLIENT_ID);
  return new Response(JSON.stringify({
    provider: 'google-drive',
    configured: Boolean(clientId),
    clientId,
    scope: EON_GOOGLE_DRIVE_SNAPSHOT_SCOPE,
    reason: clientId ? null : 'owner-configuration-required'
  }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer'
    }
  });
}

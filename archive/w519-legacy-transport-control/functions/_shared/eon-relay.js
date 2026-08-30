/**
 * W391D — direct-invite attribution helpers.
 *
 * This module is intentionally fail-closed. It can only run when the operator
 * explicitly enables a dedicated relay database and matching rollout state.
 * It never reads or writes legacy referral bindings, emails, IP addresses,
 * device fingerprints, local work, payment data, or reward entitlements.
 */
import {
  enforceSameOriginMutation,
  getIdentityConfig,
  hmacBase64Url,
  jsonResponse,
  readSession
} from './eon-auth.js';

export const EON_RELAY_SCHEMA = 'eonapp.relay.tracking.v1';
export const EON_RELAY_TRACKING_ROLLOUTS = new Set(['tracking', 'pilot']);
export const EON_RELAY_ALLOWED_SOURCES = new Set(['profile', 'share-pack', 'remix-card', 'creator-atrium', 'manual']);

function clean(value = '', max = 160) {
  let output = '';
  for (const character of String(value || '').trim()) {
    const code = character.codePointAt(0) || 0;
    if (code < 32 || code === 127) continue;
    output += character;
    if (output.length >= max) break;
  }
  return output;
}

function randomBase64Url(bytes = 24) {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  let binary = '';
  for (const byte of buffer) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function normalizeRelaySource(value = '') {
  const source = clean(value, 32).toLowerCase();
  return EON_RELAY_ALLOWED_SOURCES.has(source) ? source : 'manual';
}

export function normalizeRelayInviteCode(value = '') {
  const code = clean(value, 192);
  return /^[A-Za-z0-9_-]{32,160}$/.test(code) ? code : '';
}

export function getRelayConfig(request, env = {}) {
  const identity = getIdentityConfig(request, env);
  const rollout = clean(env.EON_RELAY_ROLLOUT || '', 16).toLowerCase();
  const database = env.EON_RELAY_DB || null;
  const tokenPepper = String(env.EON_RELAY_TOKEN_PEPPER || '');
  const rolloutEnabled = EON_RELAY_TRACKING_ROLLOUTS.has(rollout);
  const configured = Boolean(identity.configured && rolloutEnabled && database && tokenPepper);
  return Object.freeze({
    schema: EON_RELAY_SCHEMA,
    configured,
    rollout: rolloutEnabled ? rollout : 'disabled',
    identity,
    database: configured ? database : null,
    tokenPepper: configured ? tokenPepper : '',
    guestUseAvailable: true,
    grantsEnabled: false,
    financialValue: false
  });
}

export async function relayInviteCodeHash(config, code = '') {
  const normalized = normalizeRelayInviteCode(code);
  if (!normalized || !config?.tokenPepper) throw new Error('relay_invite_code_invalid');
  return hmacBase64Url(`eon-relay-invite\u001f${normalized}`, config.tokenPepper);
}

export function relayTrackingUnavailable() {
  return jsonResponse({
    ok: false,
    enabled: false,
    trackingEnabled: false,
    grantsEnabled: false,
    guestUseAvailable: true,
    error: 'eon-relay-tracking-not-configured'
  }, 503);
}

export async function requireRelayTracking(context) {
  const { request, env } = context;
  const config = getRelayConfig(request, env);
  if (!config.configured) return Object.freeze({ ok: false, response: relayTrackingUnavailable() });
  if (!enforceSameOriginMutation(request, config.identity)) {
    return Object.freeze({ ok: false, response: jsonResponse({ ok: false, error: 'origin_check_failed' }, 403) });
  }
  const session = await readSession(config.identity, request);
  if (!session) return Object.freeze({ ok: false, response: jsonResponse({ ok: false, error: 'sign_in_required', guestUseAvailable: true }, 401) });
  try {
    const state = await config.database.prepare('SELECT rollout FROM eon_relay_program_state WHERE singleton_id = ? LIMIT 1').bind('relay').first();
    const databaseRollout = clean(state?.rollout || '', 16).toLowerCase();
    if (databaseRollout !== config.rollout || !EON_RELAY_TRACKING_ROLLOUTS.has(databaseRollout)) {
      return Object.freeze({ ok: false, response: relayTrackingUnavailable() });
    }
  } catch {
    return Object.freeze({ ok: false, response: relayTrackingUnavailable() });
  }
  return Object.freeze({ ok: true, config, session });
}

export async function readBoundedJson(request, maxBytes = 2048) {
  if (!String(request.headers.get('content-type') || '').includes('application/json')) throw new Error('unsupported_media_type');
  const length = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(length) && length > maxBytes) throw new Error('request_too_large');
  const text = await request.text();
  if (text.length > maxBytes) throw new Error('request_too_large');
  try {
    const parsed = JSON.parse(text || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    throw new Error('invalid_json');
  }
}

export function relayJsonError(error = '') {
  const code = String(error || 'invalid_request');
  const status = code === 'unsupported_media_type' ? 415 : (code === 'request_too_large' ? 413 : 400);
  return jsonResponse({ ok: false, error: code }, status);
}

export function makeRelayInviteCode() {
  return randomBase64Url(32);
}

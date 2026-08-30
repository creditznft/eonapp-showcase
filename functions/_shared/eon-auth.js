import { assertD1SchemaAuthority } from '../../assets/js/infrastructure/eon-d1-schema-authority.js';
/**
 * EONAPP W373–W374 identity-only server helpers.
 *
 * This module is imported only by Cloudflare Pages Functions. It intentionally
 * holds no credentials, no user workspace data, no provider keys, no raw email
 * persistence, no refresh-token storage and no cloud-backup behavior.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const EON_AUTH_SCHEMA = 'eonapp.identity-only.v1';
export const EON_AUTH_CONSENT_VERSION = 'local-first-no-cloud-backup-2026-06-26';
export const EON_AUTH_SESSION_SECONDS = 60 * 60 * 24 * 7;
export const EON_AUTH_FLOW_SECONDS = 60 * 10;
export const EON_AUTH_ROLLOUT_VALUES = new Set(['testing', 'public']);
export const GOOGLE_ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com']);
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_JWKS_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/certs';
const OAUTH_FLOW_COOKIE = 'eon_oauth_flow';
const SESSION_COOKIE = '__Host-eon_session';

let jwksMemoryCache = Object.freeze({ expiresAt: 0, keys: Object.freeze([]) });

function cleanText(value = '', max = 512) {
  let output = '';
  for (const character of String(value || '').trim()) {
    const code = character.codePointAt(0) || 0;
    if (code < 32 || code === 127) continue;
    output += character;
    if (output.length >= max) break;
  }
  return output;
}

function toBase64Url(bytes) {
  let binary = '';
  const source = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  for (const byte of source) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value = '') {
  const compact = String(value || '').trim();
  if (!compact || !/^[A-Za-z0-9_-]+$/.test(compact)) throw new Error('invalid_base64url');
  const normalized = compact.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function encodeJson(value) {
  return toBase64Url(encoder.encode(JSON.stringify(value)));
}

function decodeJson(value) {
  return JSON.parse(decoder.decode(fromBase64Url(value)));
}

function randomToken(bytes = 32) {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return toBase64Url(buffer);
}

async function importHmacKey(secret = '') {
  return crypto.subtle.importKey('raw', encoder.encode(String(secret || '')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

export async function hmacBase64Url(value = '', secret = '') {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(String(value || '')));
  return toBase64Url(new Uint8Array(signature));
}

function equalText(left = '', right = '') {
  const a = String(left || '');
  const b = String(right || '');
  const length = Math.max(a.length, b.length);
  let mismatch = a.length ^ b.length;
  for (let index = 0; index < length; index += 1) mismatch |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  return mismatch === 0;
}

async function sha256Base64Url(value = '') {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(String(value || '')));
  return toBase64Url(new Uint8Array(digest));
}

function splitCookies(header = '') {
  const output = Object.create(null);
  for (const entry of String(header || '').split(';')) {
    const separator = entry.indexOf('=');
    if (separator <= 0) continue;
    const key = entry.slice(0, separator).trim();
    const value = entry.slice(separator + 1).trim();
    if (key && value) output[key] = value;
  }
  return output;
}

function cookie(name, value, options = {}) {
  const parts = [`${name}=${value}`, `Path=${options.path || '/'}`, 'Secure'];
  if (options.httpOnly !== false) parts.push('HttpOnly');
  parts.push(`SameSite=${options.sameSite || 'Lax'}`);
  if (Number.isFinite(options.maxAge)) parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  return parts.join('; ');
}

export function securityHeaders(extra = {}) {
  return {
    'cache-control': 'no-store, max-age=0',
    'content-type': 'application/json; charset=utf-8',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'cross-origin-resource-policy': 'same-origin',
    'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'referrer-policy': 'no-referrer',
    ...extra
  };
}

export function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), { status, headers: securityHeaders(extraHeaders) });
}

export function safeReturnTo(value = '') {
  const raw = cleanText(value, 240);
  // Identity can return only to a small, public EONAPP surface. Root is the
  // canonical chat home, so a person who signs in there returns to the same
  // workspace instead of being sent to a confusing Profile error page.
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\') || raw.includes('\u0000')) return '/';
  try {
    const parsed = new URL(raw, 'https://eonapp.invalid');
    if (parsed.origin !== 'https://eonapp.invalid') return '/';
    const allowed = new Set([
      '/',
      '/profile',
      '/chat',
      '/apps',
      '/forge',
      '/workspace',
      '/projects',
      '/library',
      '/vault',
      '/local-ai',
      '/automations',
      '/eoncity',
      '/eoncity/play',
      '/realm-studio'
    ]);
    return allowed.has(parsed.pathname) ? `${parsed.pathname}${parsed.search}` : '/';
  } catch {
    return '/';
  }
}

export function redirectResponse(origin, path = '/', extraHeaders = {}) {
  const target = new URL(safeReturnTo(path), origin);
  return new Response(null, {
    status: 302,
    headers: {
      location: target.toString(),
      'cache-control': 'no-store, max-age=0',
      'referrer-policy': 'no-referrer',
      ...extraHeaders
    }
  });
}

function safeAccountCode(value = '') {
  return cleanText(value, 40).replace(/[^a-z0-9_-]/gi, '').slice(0, 40);
}

function appendIdentityStatus(target, status = 'error', accountCode = '') {
  target.searchParams.set('account', cleanText(status, 32) || 'error');
  const code = safeAccountCode(accountCode);
  if (code) target.searchParams.set('accountCode', code);
}

function applyIdentityHeaders(target, extraHeaders = {}) {
  const headers = new Headers({
    location: target.toString(),
    'cache-control': 'no-store, max-age=0',
    'referrer-policy': 'no-referrer'
  });
  const setCookies = Array.isArray(extraHeaders.setCookies) ? extraHeaders.setCookies : [];
  for (const [key, value] of Object.entries(extraHeaders)) {
    if (key === 'setCookies' || key === 'returnTo' || key === 'accountCode') continue;
    headers.set(key, value);
  }
  for (const value of setCookies) if (value) headers.append('set-cookie', value);
  return headers;
}

export function authStatusRedirect(origin, status = 'error', extraHeaders = {}) {
  // Identity failures return to the verified local surface, never a generic
  // Profile error page. A tiny redacted code is safe for support triage.
  const target = new URL(safeReturnTo(extraHeaders.returnTo || '/'), origin);
  appendIdentityStatus(target, status, extraHeaders.accountCode);
  return new Response(null, { status: 302, headers: applyIdentityHeaders(target, extraHeaders) });
}

/** Redirects a completed identity action only to an explicitly allowlisted EONAPP route. */
export function authStatusReturnRedirect(origin, returnTo = '/', status = 'error', extraHeaders = {}) {
  const target = new URL(safeReturnTo(returnTo), origin);
  appendIdentityStatus(target, status, extraHeaders.accountCode);
  return new Response(null, { status: 302, headers: applyIdentityHeaders(target, extraHeaders) });
}

function parseExactHttpsOrigin(value = '') {
  try {
    const parsed = new URL(String(value || ''));
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function validRedirectUri(value = '', expectedOrigin = '') {
  try {
    const parsed = new URL(String(value || ''));
    return parsed.protocol === 'https:'
      && parsed.origin === expectedOrigin
      && parsed.pathname === '/api/auth/google/callback'
      && !parsed.search
      && !parsed.hash
      && !parsed.username
      && !parsed.password;
  } catch {
    return false;
  }
}

export function getIdentityConfig(request, env = {}) {
  const requestOrigin = (() => { try { return new URL(request.url).origin; } catch { return ''; } })();
  const appOrigin = parseExactHttpsOrigin(env.APP_ORIGIN);
  const rollout = cleanText(env.EON_AUTH_ROLLOUT || '', 16).toLowerCase();
  const redirectUri = cleanText(env.GOOGLE_REDIRECT_URI || '', 260);
  const clientId = cleanText(env.GOOGLE_OAUTH_CLIENT_ID || '', 320);
  const clientSecret = String(env.GOOGLE_OAUTH_CLIENT_SECRET || '');
  const subjectPepper = String(env.EON_AUTH_SUBJECT_PEPPER || '');
  const sessionKey = String(env.EON_SESSION_SIGNING_KEY || '');
  const flowKey = String(env.EON_OAUTH_FLOW_SIGNING_KEY || '');
  const database = env.EON_IDENTITY_DB || null;
  const originMatches = Boolean(appOrigin && requestOrigin && appOrigin === requestOrigin);
  const configured = Boolean(
    originMatches
    && EON_AUTH_ROLLOUT_VALUES.has(rollout)
    && validRedirectUri(redirectUri, appOrigin)
    && clientId
    && clientSecret
    && subjectPepper
    && sessionKey
    && flowKey
    && database
  );
  return Object.freeze({
    configured,
    rollout: EON_AUTH_ROLLOUT_VALUES.has(rollout) ? rollout : 'disabled',
    appOrigin: appOrigin || '',
    redirectUri: validRedirectUri(redirectUri, appOrigin || '') ? redirectUri : '',
    clientId: configured ? clientId : '',
    clientSecret: configured ? clientSecret : '',
    subjectPepper: configured ? subjectPepper : '',
    sessionKey: configured ? sessionKey : '',
    flowKey: configured ? flowKey : '',
    database: configured ? database : null,
    status: configured ? 'ready' : 'not_configured'
  });
}

export async function makeOauthFlow(config, returnTo = '/') {
  const verifier = randomToken(48);
  return Object.freeze({
    version: 1,
    state: randomToken(32),
    nonce: randomToken(32),
    verifier,
    challenge: await sha256Base64Url(verifier),
    returnTo: safeReturnTo(returnTo),
    signInNoticeVersion: 'local-work-v1',
    issuedAt: Date.now(),
    expiresAt: Date.now() + (EON_AUTH_FLOW_SECONDS * 1000)
  });
}

export async function sealOauthFlow(flow, secret = '') {
  const payload = encodeJson(flow);
  const signature = await hmacBase64Url(payload, secret);
  return `${payload}.${signature}`;
}

export async function openOauthFlow(serialized = '', secret = '') {
  const [payload, signature, ...rest] = String(serialized || '').split('.');
  if (!payload || !signature || rest.length) throw new Error('oauth_flow_invalid');
  const expected = await hmacBase64Url(payload, secret);
  if (!equalText(signature, expected)) throw new Error('oauth_flow_signature_invalid');
  const parsed = decodeJson(payload);
  if (!parsed || parsed.version !== 1 || !parsed.state || !parsed.nonce || !parsed.verifier) throw new Error('oauth_flow_shape_invalid');
  if (!Number.isFinite(parsed.expiresAt) || parsed.expiresAt < Date.now()) throw new Error('oauth_flow_expired');
  return Object.freeze({
    version: 1,
    state: cleanText(parsed.state, 160),
    nonce: cleanText(parsed.nonce, 160),
    verifier: cleanText(parsed.verifier, 240),
    returnTo: safeReturnTo(parsed.returnTo),
    signInNoticeVersion: cleanText(parsed.signInNoticeVersion, 48) || 'local-work-v1',
    issuedAt: Number(parsed.issuedAt || 0),
    expiresAt: Number(parsed.expiresAt || 0)
  });
}

export function oauthFlowCookie(value = '', maxAge = EON_AUTH_FLOW_SECONDS) {
  return cookie(OAUTH_FLOW_COOKIE, value, { path: '/api/auth/google', maxAge, sameSite: 'Lax', httpOnly: true });
}

export function clearOauthFlowCookie() {
  return cookie(OAUTH_FLOW_COOKIE, '', { path: '/api/auth/google', maxAge: 0, sameSite: 'Lax', httpOnly: true });
}

export function sessionCookie(value = '', maxAge = EON_AUTH_SESSION_SECONDS) {
  return cookie(SESSION_COOKIE, value, { path: '/', maxAge, sameSite: 'Lax', httpOnly: true });
}

export function clearSessionCookie() {
  return cookie(SESSION_COOKIE, '', { path: '/', maxAge: 0, sameSite: 'Lax', httpOnly: true });
}

export function readCookie(request, name = '') {
  return splitCookies(request.headers.get('cookie') || '')[name] || '';
}

export function enforceSameOriginMutation(request, config) {
  const origin = request.headers.get('origin') || '';
  const site = String(request.headers.get('sec-fetch-site') || '').toLowerCase();
  return Boolean(config?.configured && origin === config.appOrigin && (!site || site === 'same-origin'));
}

export async function exchangeGoogleCode(config, code = '', flow = {}) {
  const safeCode = cleanText(code, 4096);
  if (!safeCode || !flow?.verifier) throw new Error('oauth_code_invalid');
  const body = new URLSearchParams({
    code: safeCode,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
    code_verifier: flow.verifier
  });
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: body.toString()
  });
  if (!response.ok) throw new Error('oauth_code_exchange_failed');
  const payload = await response.json();
  const idToken = String(payload?.id_token || '');
  if (!idToken || idToken.length > 8192) throw new Error('oauth_id_token_missing');
  return idToken;
}

function parseJwt(value = '') {
  const parts = String(value || '').split('.');
  if (parts.length !== 3 || parts.some((part) => !part || part.length > 8192)) throw new Error('id_token_shape_invalid');
  return Object.freeze({
    header: decodeJson(parts[0]),
    payload: decodeJson(parts[1]),
    signed: `${parts[0]}.${parts[1]}`,
    signature: fromBase64Url(parts[2])
  });
}

async function getGoogleJwks() {
  if (jwksMemoryCache.expiresAt > Date.now() && Array.isArray(jwksMemoryCache.keys) && jwksMemoryCache.keys.length) return jwksMemoryCache.keys;
  const response = await fetch(GOOGLE_JWKS_ENDPOINT, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error('google_jwks_unavailable');
  const body = await response.json();
  const keys = Array.isArray(body?.keys) ? body.keys.filter((key) => key?.kty === 'RSA' && key?.kid && key?.n && key?.e) : [];
  if (!keys.length) throw new Error('google_jwks_invalid');
  jwksMemoryCache = Object.freeze({ expiresAt: Date.now() + (60 * 60 * 1000), keys: Object.freeze(keys) });
  return keys;
}

async function verifyRsaSignature(jwt, jwk) {
  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
  return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, jwt.signature, encoder.encode(jwt.signed));
}

function validAudience(audience, clientId, authorizedParty) {
  if (typeof audience === 'string') return audience === clientId;
  if (!Array.isArray(audience) || !audience.includes(clientId)) return false;
  return authorizedParty === clientId;
}

export async function verifyGoogleIdToken(config, token = '', expectedNonce = '') {
  const jwt = parseJwt(token);
  const header = jwt.header && typeof jwt.header === 'object' ? jwt.header : {};
  const payload = jwt.payload && typeof jwt.payload === 'object' ? jwt.payload : {};
  if (header.alg !== 'RS256' || !cleanText(header.kid, 160)) throw new Error('id_token_header_invalid');
  const jwks = await getGoogleJwks();
  const key = jwks.find((candidate) => candidate.kid === header.kid);
  if (!key || !(await verifyRsaSignature(jwt, key))) throw new Error('id_token_signature_invalid');
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiry = Number(payload.exp || 0);
  const issuedAt = Number(payload.iat || 0);
  if (!GOOGLE_ISSUERS.has(String(payload.iss || ''))) throw new Error('id_token_issuer_invalid');
  if (!validAudience(payload.aud, config.clientId, payload.azp)) throw new Error('id_token_audience_invalid');
  if (!Number.isFinite(expiry) || expiry <= nowSeconds - 30) throw new Error('id_token_expired');
  if (!Number.isFinite(issuedAt) || issuedAt > nowSeconds + 300) throw new Error('id_token_issued_at_invalid');
  if (!equalText(cleanText(payload.nonce, 160), cleanText(expectedNonce, 160))) throw new Error('id_token_nonce_invalid');
  if (!cleanText(payload.sub, 255)) throw new Error('id_token_subject_invalid');
  if (!(payload.email_verified === true || payload.email_verified === 'true') || !cleanText(payload.email, 320)) throw new Error('id_token_email_not_verified');
  return Object.freeze({
    issuer: String(payload.iss),
    subject: cleanText(payload.sub, 255),
    emailVerified: true
  });
}

async function purgeExpiredSessions(database, now = Date.now()) {
  try {
    await database.prepare('DELETE FROM eon_identity_sessions WHERE expires_at <= ?').bind(now).run();
  } catch {
    // A purge failure must not turn a valid login into a sensitive error.
  }
}

export async function ensureMinimalAccount(config, identity) {
  await assertD1SchemaAuthority(config.database, 'identity');
  const now = Date.now();
  const identityRef = await hmacBase64Url(`${identity.issuer}\u001f${identity.subject}`, config.subjectPepper);
  await purgeExpiredSessions(config.database, now);
  const accountId = crypto.randomUUID();
  await config.database.prepare(`
    INSERT INTO eon_identity_accounts (
      account_id, identity_ref_hmac, email_verified, consent_version,
      created_at, last_login_at, consent_at
    ) VALUES (?, ?, 1, ?, ?, ?, ?)
    ON CONFLICT(identity_ref_hmac) DO UPDATE SET
      email_verified = 1,
      consent_version = excluded.consent_version,
      last_login_at = excluded.last_login_at,
      consent_at = excluded.consent_at
  `).bind(accountId, identityRef, EON_AUTH_CONSENT_VERSION, now, now, now).run();
  const stored = await config.database.prepare('SELECT account_id FROM eon_identity_accounts WHERE identity_ref_hmac = ? LIMIT 1').bind(identityRef).first();
  const storedAccountId = cleanText(stored?.account_id, 80);
  if (!storedAccountId) throw new Error('account_upsert_failed');
  return Object.freeze({ accountId: storedAccountId });
}

export async function createSession(config, accountId = '') {
  await assertD1SchemaAuthority(config.database, 'identity');
  const now = Date.now();
  const sessionId = randomToken(48);
  const sessionHash = await hmacBase64Url(sessionId, config.sessionKey);
  const expiresAt = now + (EON_AUTH_SESSION_SECONDS * 1000);
  await purgeExpiredSessions(config.database, now);
  await config.database.prepare(`
    INSERT INTO eon_identity_sessions (session_id_hmac, account_id, issued_at, expires_at)
    VALUES (?, ?, ?, ?)
  `).bind(sessionHash, accountId, now, expiresAt).run();
  return Object.freeze({ sessionId, expiresAt });
}

export async function readSession(config, request) {
  if (!config?.configured) return null;
  await assertD1SchemaAuthority(config.database, 'identity');
  const sessionId = readCookie(request, SESSION_COOKIE);
  if (!sessionId || sessionId.length > 256) return null;
  const sessionHash = await hmacBase64Url(sessionId, config.sessionKey);
  const now = Date.now();
  await purgeExpiredSessions(config.database, now);
  const row = await config.database.prepare(`
    SELECT session_id_hmac, account_id, expires_at
    FROM eon_identity_sessions
    WHERE session_id_hmac = ?
    LIMIT 1
  `).bind(sessionHash).first();
  if (!row || Number(row.expires_at || 0) <= now || !cleanText(row.account_id, 80)) return null;
  return Object.freeze({ accountId: cleanText(row.account_id, 80), expiresAt: Number(row.expires_at) });
}

export async function endSession(config, request) {
  if (!config?.configured) return;
  await assertD1SchemaAuthority(config.database, 'identity');
  const sessionId = readCookie(request, SESSION_COOKIE);
  if (!sessionId) return;
  const sessionHash = await hmacBase64Url(sessionId, config.sessionKey);
  await config.database.prepare('DELETE FROM eon_identity_sessions WHERE session_id_hmac = ?').bind(sessionHash).run();
}

export async function deleteAuthenticatedAccount(config, session) {
  await assertD1SchemaAuthority(config.database, 'identity');
  const accountId = cleanText(session?.accountId, 80);
  if (!accountId) throw new Error('account_delete_session_invalid');
  await config.database.batch([
    config.database.prepare('DELETE FROM eon_push_reminders WHERE account_id = ?').bind(accountId),
    config.database.prepare('DELETE FROM eon_push_subscriptions WHERE account_id = ?').bind(accountId),
    config.database.prepare('DELETE FROM eon_identity_sessions WHERE account_id = ?').bind(accountId),
    config.database.prepare('DELETE FROM eon_identity_accounts WHERE account_id = ?').bind(accountId)
  ]);
}

export function publicAuthStatus(config, session = null) {
  return Object.freeze({
    schema: EON_AUTH_SCHEMA,
    available: Boolean(config?.configured),
    rollout: config?.configured ? config.rollout : 'disabled',
    guestUseAvailable: true,
    signedIn: Boolean(session),
    accountDataOnly: Boolean(session),
    automaticCloudBackup: false,
    automaticCrossDeviceSync: false,
    identityOnlyScopes: Object.freeze(['openid', 'email', 'profile']),
    googleServicesConnected: false,
    dataCustodyNotice: 'Google Login does not back up local Chat, Vault, projects, files, Realm setup, City progress, provider keys, or settings. Create and keep an encrypted backup for work you cannot lose.'
  });
}

export function authErrorResponse() {
  return jsonResponse({ ok: false, error: 'identity_unavailable', guestUseAvailable: true }, 503);
}

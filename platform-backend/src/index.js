// @ts-nocheck
const /** @type {any} */
JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  pragma: 'no-cache',
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  'cross-origin-resource-policy': 'same-origin',
  'cross-origin-opener-policy': 'same-origin',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'geolocation=(), microphone=(), camera=()'
};
const MAX_JSON_BODY_BYTES = 65_536;
const SAFE_UID_RE = /^(g_[0-9a-f]{48}|eon_[0-9a-f]{12}|[a-z0-9][a-z0-9_-]{3,79})$/i;
const DOMAIN_RE = /^[a-z0-9._:-]{1,96}$/i;
const DECIMAL_AMOUNT_RE = /^\d+(?:\.\d+)?$/;
const /** @type {any} */
POOL_DOMAINS = new Set(['gamer-pool', 'tool-pool', 'creator-pool', 'referral-pool', 'nft-holder-pool']);
const /** @type {any} */
POOL_DOMAIN_WEIGHTS = {
  'gamer-pool': 0.24,
  'tool-pool': 0.19,
  'creator-pool': 0.18,
  'referral-pool': 0.09,
  'nft-holder-pool': 0.30
};
const HEX_ROOT_RE = /^0x[a-f0-9]{64}$/i;
const WALLET_RE = /^0x[a-f0-9]{40}$/i;
const MAX_CLAIMS_PER_EPOCH = 5000;
const CLIENT_NONCE_RE = /^[a-z0-9_-]{16,120}$/i;
const SWAP_OFFER_ID_RE = /^offer-[a-z0-9]{8,40}$/i;
const SWAP_RECEIPT_ID_RE = /^receipt-[a-z0-9]{8,40}$/i;
const AGENT_JOB_ID_RE = /^agent-job-[a-z0-9]{8,40}$/i;
const /** @type {any} */
AGENT_APPROVAL_DECISIONS = new Set(['pending', 'approved', 'rejected']);
const /** @type {any} */
AGENT_JOB_STATUSES = new Set(['queued', 'awaiting_approval', 'ready', 'retrying', 'completed', 'failed', 'dead_letter']);
const /** @type {any} */
AGENT_HIGH_RISK_ACTIONS = new Set(['publish', 'live_trade_execute', 'fund_transfer']);
const MAX_AGENT_JOB_ATTEMPTS = 8;
const MAX_AGENT_JOB_BATCH = 100;

function json(/** @type {any} */ data, /** @type {any} */ init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      ...JSON_HEADERS,
      ...(init.headers || {})
    }
  });
}

function errorResponse(/** @type {any} */ status, /** @type {any} */ code, /** @type {any} */ message) {
  const fallbackMessage = typeof code === 'string' && !message ? code : 'Request failed.';
  const normalizedMessage = normalizeText(message || fallbackMessage || 'Request failed.', 280) || 'Request failed.';
  if (status >= 500) {
    logInternalError('api_error_response', new Error(`status=${status}; code=${String(code || 'unknown')}`));
  }
  return json({ error: status >= 500 ? 'Internal server error.' : normalizedMessage }, { status });
}

function serviceUnavailableResponse() {
  return json({ error: 'Service temporarily unavailable' }, { status: 503 });
}

function isD1Error(/** @type {any} */ error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('d1') || message.includes('sqlite') || message.includes('database');
}

function normalizeUid(/** @type {any} */ value = '') {
  const normalized = String(value || '').trim().toLowerCase().slice(0, 80);
  return SAFE_UID_RE.test(normalized) ? normalized : '';
}

function normalizeText(/** @type {any} */ value = '', /** @type {any} */ maxLength = 160) {
  return String(value || '').trim().slice(0, maxLength);
}

function parseBoundedString(/** @type {any} */ value, /** @type {any} */ fieldName, /** @type {any} */ maxLength, /** @type {any} */ required = false) {
  const raw = String(value || '').trim();
  if (required && !raw) {
    const fieldError = new Error(`Missing required field: ${fieldName}`);
    fieldError.code = 'invalid_string';
    fieldError.status = 400;
    throw fieldError;
  }
  if (!raw) return '';
  if (raw.length > maxLength) {
    const lengthError = new Error(`${fieldName} exceeds maximum length ${maxLength}.`);
    lengthError.code = 'invalid_string_length';
    lengthError.status = 400;
    throw lengthError;
  }
  return raw;
}

function parseDecimalAmount(/** @type {any} */ value, /** @type {any} */ fieldName, /** @type {any} */ options = {}) {
  const { min = 0, max = 1_000_000_000_000, required = false, fallback = '0' } = options;
  if (value === null || value === undefined || value === '') {
    if (required) {
      const missingError = new Error(`${fieldName} is required.`);
      missingError.code = 'invalid_number';
      missingError.status = 400;
      throw missingError;
    }
    return { normalized: fallback, number: Number.parseFloat(fallback || '0') };
  }
  const normalized = parseBoundedString(value, fieldName, 80, required);
  if (!DECIMAL_AMOUNT_RE.test(normalized)) {
    const numberError = new Error(`${fieldName} must be a decimal number.`);
    numberError.code = 'invalid_number';
    numberError.status = 400;
    throw numberError;
  }
  const numeric = Number.parseFloat(normalized);
  if (!Number.isFinite(numeric) || numeric < min || numeric > max) {
    const rangeError = new Error(`${fieldName} is out of range.`);
    rangeError.code = 'invalid_number';
    rangeError.status = 400;
    throw rangeError;
  }
  return { normalized, number: numeric };
}

function normalizeAmountString(/** @type {any} */ value, /** @type {any} */ fallback = '0') {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const normalized = String(value).trim().slice(0, 80);
  return DECIMAL_AMOUNT_RE.test(normalized) ? normalized : fallback;
}

function normalizeDomain(/** @type {any} */ value = '') {
  const normalized = String(value || '').trim().toLowerCase().slice(0, 96);
  return DOMAIN_RE.test(normalized) ? normalized : '';
}

function normalizeOrigin(/** @type {any} */ value = '') {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9:_-]+/g, '-').slice(0, 64) || 'api-bridge';
}

function normalizeMerkleRoot(/** @type {any} */ value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  return HEX_ROOT_RE.test(normalized) ? normalized : '';
}

function normalizeWalletAddress(/** @type {any} */ value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  return WALLET_RE.test(normalized) ? normalized : '';
}

function normalizeHexBytes32(/** @type {any} */ value = '') {
  const normalized = String(value || '').trim().toLowerCase().slice(0, 66);
  return HEX_ROOT_RE.test(normalized) ? normalized : '';
}

function parseAddressField(/** @type {any} */ value = '', /** @type {any} */ fieldName = 'address') {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return '';
  if (!WALLET_RE.test(normalized)) {
    const addressError = new Error(`${fieldName} must be a 42-character 0x-prefixed hex address.`);
    addressError.code = 'invalid_address';
    addressError.status = 400;
    throw addressError;
  }
  return normalized;
}

function normalizeNonce(/** @type {any} */ value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  return CLIENT_NONCE_RE.test(normalized) ? normalized : '';
}

function normalizeSwapOfferId(/** @type {any} */ value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  return SWAP_OFFER_ID_RE.test(normalized) ? normalized : '';
}

function normalizeSwapReceiptId(/** @type {any} */ value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  return SWAP_RECEIPT_ID_RE.test(normalized) ? normalized : '';
}

function normalizeAgentJobId(/** @type {any} */ value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  return AGENT_JOB_ID_RE.test(normalized) ? normalized : '';
}

function normalizeAgentStatus(/** @type {any} */ value = '', /** @type {any} */ fallback = 'queued') {
  const normalized = String(value || '').trim().toLowerCase();
  return AGENT_JOB_STATUSES.has(normalized) ? normalized : fallback;
}

function normalizeApprovalDecision(/** @type {any} */ value = '', /** @type {any} */ fallback = 'pending') {
  const normalized = String(value || '').trim().toLowerCase();
  return AGENT_APPROVAL_DECISIONS.has(normalized) ? normalized : fallback;
}

function normalizeLifecycleStatus(/** @type {any} */ value = '', /** @type {any} */ fallback = 'published') {
  const normalized = String(value || '').trim().toLowerCase();
  return ['published', 'expired', 'swept', 'invalidated'].includes(normalized) ? normalized : fallback;
}

function normalizeIsoTime(/** @type {any} */ value, /** @type {any} */ fallback = null) {
  if (!value) {
    return fallback;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

const /** @type {any} */
ENTITLEMENT_TIERS = new Set(['free', 'spark', 'builder', 'pro', 'operator']);
const /** @type {any} */
ENTITLEMENT_STATUS = new Set(['inactive', 'active', 'past_due', 'canceled']);
const /** @type {any} */
ENTITLEMENT_ASSETS = new Set(['stable', 'eonl']);
const MAX_ENTITLEMENT_CENTS = 1_000_000_000;
const MAX_BULK_ENTRIES = 1000;

function normalizeTier(/** @type {any} */ value = 'free') {
  const normalized = String(value || '').trim().toLowerCase();
  return ENTITLEMENT_TIERS.has(normalized) ? normalized : 'free';
}

function normalizeEntitlementStatus(/** @type {any} */ value = 'inactive') {
  const normalized = String(value || '').trim().toLowerCase();
  return ENTITLEMENT_STATUS.has(normalized) ? normalized : 'inactive';
}

function normalizePaymentAsset(/** @type {any} */ value = 'stable') {
  const normalized = String(value || '').trim().toLowerCase();
  return ENTITLEMENT_ASSETS.has(normalized) ? normalized : 'stable';
}

function normalizeInteger(/** @type {any} */ value, /** @type {any} */ min = 0, /** @type {any} */ max = MAX_ENTITLEMENT_CENTS) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, Math.floor(number)));
}

function normalizeFeatureList(/** @type {any} */ value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((/** @type {any} */ entry) => String(entry || '').trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 80);
}

async function shortChecksum(/** @type {any} */ payload) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(payload || '')));
  return [...new Uint8Array(digest)].slice(0, 4).map((/** @type {any} */ byte) => byte.toString(16).padStart(2, '0')).join('');
}

function fromBase64Url(/** @type {any} */ value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLength);
  return atob(padded);
}

function decodeUtf8Binary(/** @type {any} */ binary) {
  const bytes = Uint8Array.from(binary, (/** @type {any} */ char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function decodeSignedPayload(/** @type {any} */ kind, /** @type {any} */ code) {
  const value = String(code || '').trim();
  const parts = value.split('.');
  if (parts.length !== 4 || parts[0] !== kind || parts[1] !== 'v1') {
    throw new Error('Invalid code format.');
  }
  const payloadString = decodeUtf8Binary(fromBase64Url(parts[2]));
  if (await shortChecksum(payloadString) !== String(parts[3] || '').toLowerCase()) {
    throw new Error('Code checksum failed.');
  }
  const payload = safeParse(payloadString, null);
  if (!payload || typeof payload !== 'object') {
    throw new Error('Code payload invalid.');
  }
  return payload;
}

async function sha256Hex(/** @type {any} */ value = '') {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value || '')));
  return [...new Uint8Array(digest)].map((/** @type {any} */ byte) => byte.toString(16).padStart(2, '0')).join('');
}

function normalizeStorageKey(/** @type {any} */ value = '', /** @type {any} */ fallback = 'anonymous') {
  const normalized = String(value || '').trim().toLowerCase().replace(/[^a-z0-9:._-]+/g, '-').slice(0, 120);
  return normalized || fallback;
}

function getRequestSubject(/** @type {any} */ request) {
  const forwarded = String(request.headers.get('x-forwarded-for') || '').split(',')[0];
  return normalizeStorageKey(
    request.headers.get('cf-connecting-ip')
      || forwarded
      || request.headers.get('cf-ray')
      || request.headers.get('user-agent')
      || 'anonymous'
  );
}

async function enforceRateLimit(/** @type {any} */ request, /** @type {any} */ env, /** @type {any} */ bucket, /** @type {any} */ limit, /** @type {any} */ windowSeconds = 60) {
  if (!hasDatabase(env)) {
    return { enforced: false, allowed: true };
  }
  const subject = getRequestSubject(request);
  const normalizedBucket = normalizeStorageKey(bucket, 'default');
  const windowStart = Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds;
  try {
    await env.DB.prepare(`
      INSERT INTO request_rate_limits (bucket, subject, window_start, request_count, updated_at)
      VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(bucket, subject, window_start) DO UPDATE SET
        request_count = request_count + 1,
        updated_at = CURRENT_TIMESTAMP
    `).bind(normalizedBucket, subject, windowStart).run();
    const row = await env.DB.prepare(`
      SELECT request_count
      FROM request_rate_limits
      WHERE bucket = ? AND subject = ? AND window_start = ?
      LIMIT 1
    `).bind(normalizedBucket, subject, windowStart).first();
    return {
      enforced: true,
      allowed: Number(row?.request_count || 0) <= limit
    };
  } catch (/** @type {any} */
error) {
    logInternalError('rate_limit_enforcement', error);
    // Fail closed: if we cannot enforce rate limits due to a DB error, reject the request
    // to prevent abuse during outages. Only excepted when DB is not configured at all (above).
    return { enforced: false, allowed: false };
  }
}

function mergeVaryValue(/** @type {any} */ headers, /** @type {any} */ value) {
  if (!value) return;
  const existing = String(headers.get('vary') || '');
  const /** @type {any} */
parts = new Set(existing.split(',').map((/** @type {any} */ entry) => entry.trim()).filter(Boolean));
  for (const /** @type {any} */
entry of String(value).split(',').map((/** @type {any} */ part) => part.trim()).filter(Boolean)) {
    parts.add(entry);
  }
  if (parts.size) {
    headers.set('vary', [...parts].join(', '));
  }
}

function buildCorsHeaders(/** @type {any} */ request, /** @type {any} */ env) {
  const pathname = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
  if (pathname.startsWith('/api/v1/admin/')) {
    return {};
  }
  const origin = String(request.headers.get('origin') || '').trim();
  if (!origin) {
    return {};
  }
  const allowedOrigins = String(env?.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((/** @type {any} */ entry) => entry.trim())
    .filter(Boolean);
  if (!allowedOrigins.length || allowedOrigins.includes('*')) {
    const /** @type {any} */
defaultOrigins = ['https://eonapp.ch', 'https://www.eonapp.ch'];
    const matched = defaultOrigins.includes(origin) ? origin : '';
    if (!matched) return {};
    return {
      'access-control-allow-origin': matched,
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'content-type, x-eon-signature, x-eon-ts, x-eon-nonce, x-eon-role, x-eon-cmd-signature, x-eon-cmd-ts, x-eon-cmd-nonce, x-eon-cmd-channel',
      'access-control-max-age': '86400',
      vary: 'Origin, Access-Control-Request-Headers, Access-Control-Request-Method'
    };
  }
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : '';
  if (!allowedOrigin) {
    return {};
  }
  return {
    'access-control-allow-origin': allowedOrigin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type, x-eon-signature, x-eon-ts, x-eon-nonce, x-eon-role, x-eon-cmd-signature, x-eon-cmd-ts, x-eon-cmd-nonce, x-eon-cmd-channel',
    'access-control-max-age': '86400',
    vary: 'Origin, Access-Control-Request-Headers, Access-Control-Request-Method'
  };
}

function finalizeResponse(/** @type {any} */ response, /** @type {any} */ request, /** @type {any} */ env) {
  const headers = new Headers(response.headers);
  const pathname = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
  headers.set('x-content-type-options', 'nosniff');
  headers.set('x-frame-options', 'DENY');
  headers.set('strict-transport-security', 'max-age=63072000; includeSubDomains; preload');
  headers.set('referrer-policy', 'no-referrer');
  if (pathname.startsWith('/api/')) {
    headers.set('cache-control', 'no-store');
  }
  const corsHeaders = buildCorsHeaders(request, env);
  for (const [name, value] of Object.entries(corsHeaders)) {
    if (name === 'vary') {
      mergeVaryValue(headers, value);
    } else {
      headers.set(name, value);
    }
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function logInternalError(/** @type {any} */ context, /** @type {any} */ error) {
  console.error(`[${context}]`, error?.stack || error?.message || String(error || 'unknown error'));
}

async function consumeSwapNonce(/** @type {any} */ env, /** @type {any} */ uid, /** @type {any} */ nonce) {
  const normalizedNonce = normalizeNonce(nonce);
  if (!normalizedNonce) {
    throw new Error('Missing or invalid swap client nonce.');
  }
  if (!env?.SWAP_NONCE_KV) {
    return { enforced: false, nonce: normalizedNonce };
  }
  const nonceKey = `swap-nonce:${uid}:${normalizedNonce}`;
  const seen = await env.SWAP_NONCE_KV.get(nonceKey);
  if (seen) {
    throw new Error('Swap nonce already used.');
  }
  await env.SWAP_NONCE_KV.put(nonceKey, '1', { expirationTtl: 20 * 60 });
  return { enforced: true, nonce: normalizedNonce };
}

function parseBooleanField(/** @type {any} */ value) {
  if (typeof value === 'boolean') return value;
  const normalized = String(value || '').trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'verified'].includes(normalized);
}

function normalizeFingerprint(/** @type {any} */ value = '') {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9:_-]+/g, '').slice(0, 128);
}

function dayBucketUtc() {
  return new Date().toISOString().slice(0, 10);
}

function scoreReferralQualificationRisk(/** @type {any} */ context = {}) {
  const /** @type {any} */
reasons = [];
  let score = 0;

  if (!context.emailVerified) {
    score += 55;
    reasons.push('email_not_verified');
  }
  if (context.seenIpToday) {
    score += 35;
    reasons.push('ip_day_limit_exceeded');
  }
  if (context.reusedNonce) {
    score += 45;
    reasons.push('nonce_replay_detected');
  }
  if (!context.deviceFingerprint) {
    score += 25;
    reasons.push('missing_device_fingerprint');
  }
  if (context.velocity10m > 12) {
    score += 30;
    reasons.push('velocity_anomaly');
  }
  if (context.sharedFingerprint) {
    score += 40;
    reasons.push('multi_account_fingerprint_overlap');
  }

  const decision = score >= 80 ? 'quarantine' : score >= 50 ? 'review' : 'eligible';
  return { score, reasons, decision };
}

function scoreClaimPayoutRisk(/** @type {any} */ context = {}) {
  const /** @type {any} */
reasons = [];
  let score = 0;

  if (!context.emailVerified) {
    score += 50;
    reasons.push('email_not_verified');
  }
  if (context.amount > 5000) {
    score += 25;
    reasons.push('large_claim_amount');
  }
  if (context.velocity10m > 10) {
    score += 30;
    reasons.push('high_claim_velocity');
  }
  if (context.reusedNonce) {
    score += 45;
    reasons.push('nonce_replay_detected');
  }
  if (context.sharedFingerprint) {
    score += 35;
    reasons.push('multi_account_fingerprint_overlap');
  }

  const decision = score >= 85 ? 'quarantine' : score >= 55 ? 'manual_review' : 'payout_ready';
  return { score, reasons, decision };
}

async function handleReferralQualification(/** @type {any} */ request, /** @type {any} */ env) {
  let /** @type {any} */
data;
  try {
    ensureJsonRequest(request);
    ({ data } = await readJson(request));
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_json', error.message || 'Invalid request body');
  }

  const uid = normalizeUid(data.uid);
  let referralCode = '';
  try {
    referralCode = parseBoundedString(data.referralCode, 'referralCode', 64, true).toUpperCase();
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_string', error.message || 'Invalid referral code.');
  }
  const deviceFingerprint = normalizeFingerprint(data.deviceFingerprint || data.fp || '');
  const nonce = normalizeNonce(data.clientNonce || data.nonce || '');
  const emailVerified = parseBooleanField(data.emailVerified);

  if (!uid) return errorResponse(400, 'invalid_uid', 'A valid uid is required.');
  if (!referralCode) return errorResponse(400, 'invalid_referral_code', 'Referral code is required.');
  if (!nonce) return errorResponse(400, 'invalid_nonce', 'A valid client nonce is required.');

  const subject = getRequestSubject(request);
  const dayKey = dayBucketUtc();
  const kv = env?.REWARD_ABUSE_KV;

  let seenIpToday = false;
  let reusedNonce = false;
  let sharedFingerprint = false;
  let velocity10m = 0;

  if (kv) {
    const ipKey = `refqual:ip:${dayKey}:${subject}`;
    const nonceKey = `refqual:nonce:${uid}:${nonce}`;
    const fpUserKey = deviceFingerprint ? `refqual:fp-user:${deviceFingerprint}` : '';
    const velocityKey = `refqual:velocity10m:${Math.floor(Date.now() / 600000)}:${subject}`;

    const [ipSeen, nonceSeen, existingFpUsers, velocityRaw] = await Promise.all([
      kv.get(ipKey),
      kv.get(nonceKey),
      fpUserKey ? kv.get(fpUserKey) : Promise.resolve(''),
      kv.get(velocityKey)
    ]);

    seenIpToday = Boolean(ipSeen);
    reusedNonce = Boolean(nonceSeen);
    velocity10m = Number(velocityRaw || 0) + 1;

    if (existingFpUsers) {
      const /** @type {any} */
users = new Set(String(existingFpUsers).split(',').map((/** @type {any} */ entry) => normalizeUid(entry)).filter(Boolean));
      sharedFingerprint = users.size > 0 && !users.has(uid);
      users.add(uid);
      await kv.put(fpUserKey, [...users].join(','), { expirationTtl: 14 * 24 * 60 * 60 });
    } else if (fpUserKey) {
      await kv.put(fpUserKey, uid, { expirationTtl: 14 * 24 * 60 * 60 });
    }

    await Promise.all([
      kv.put(ipKey, uid, { expirationTtl: 24 * 60 * 60 }),
      kv.put(nonceKey, '1', { expirationTtl: 24 * 60 * 60 }),
      kv.put(velocityKey, String(velocity10m), { expirationTtl: 10 * 60 })
    ]);
  }

  const risk = scoreReferralQualificationRisk({
    emailVerified,
    seenIpToday,
    reusedNonce,
    deviceFingerprint,
    velocity10m,
    sharedFingerprint
  });

  if (kv) {
    const auditId = `${uid}:${Date.now()}`;
    await kv.put(`refqual:audit:${auditId}`, JSON.stringify({
      uid,
      referralCode,
      subject,
      ts: new Date().toISOString(),
      risk,
      emailVerified,
      velocity10m,
      sharedFingerprint
    }), { expirationTtl: 30 * 24 * 60 * 60 });
  }

  return json({
    ok: true,
    status: risk.decision,
    quarantineBucket: risk.decision === 'quarantine' ? 'reward-claims-hold' : null,
    riskScore: risk.score,
    reasons: risk.reasons,
    enforcement: {
      ipDayGate: true,
      nonceReplayProtection: true,
      emailVerificationRequired: true,
      fingerprintScoring: true,
      velocityWindowMinutes: 10
    }
  }, { status: risk.decision === 'eligible' ? 200 : 202 });
}

async function handleRewardClaimRiskEval(/** @type {any} */ request, /** @type {any} */ env) {
  let /** @type {any} */
data;
  try {
    ensureJsonRequest(request);
    ({ data } = await readJson(request));
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_json', error.message || 'Invalid request body');
  }

  const uid = normalizeUid(data.uid);
  let claimId = '';
  try {
    claimId = parseBoundedString(data.claimId, 'claimId', 96, true);
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_string', error.message || 'Invalid claim id.');
  }
  const deviceFingerprint = normalizeFingerprint(data.deviceFingerprint || data.fp || '');
  const nonce = normalizeNonce(data.clientNonce || data.nonce || '');
  const emailVerified = parseBooleanField(data.emailVerified);
  const amount = normalizeInteger(data.amount, 0, 1_000_000_000);

  if (!uid) return errorResponse(400, 'invalid_uid', 'A valid uid is required.');
  if (!nonce) return errorResponse(400, 'invalid_nonce', 'A valid client nonce is required.');

  const kv = env?.REWARD_ABUSE_KV;
  const subject = getRequestSubject(request);
  let reusedNonce = false;
  let sharedFingerprint = false;
  let velocity10m = 0;

  if (kv) {
    const nonceKey = `claimrisk:nonce:${uid}:${nonce}`;
    const fpUserKey = deviceFingerprint ? `claimrisk:fp-user:${deviceFingerprint}` : '';
    const velocityKey = `claimrisk:velocity10m:${Math.floor(Date.now() / 600000)}:${subject}`;

    const [nonceSeen, existingFpUsers, velocityRaw] = await Promise.all([
      kv.get(nonceKey),
      fpUserKey ? kv.get(fpUserKey) : Promise.resolve(''),
      kv.get(velocityKey)
    ]);

    reusedNonce = Boolean(nonceSeen);
    velocity10m = Number(velocityRaw || 0) + 1;

    if (existingFpUsers) {
      const /** @type {any} */
users = new Set(String(existingFpUsers).split(',').map((/** @type {any} */ entry) => normalizeUid(entry)).filter(Boolean));
      sharedFingerprint = users.size > 0 && !users.has(uid);
      users.add(uid);
      await kv.put(fpUserKey, [...users].join(','), { expirationTtl: 14 * 24 * 60 * 60 });
    } else if (fpUserKey) {
      await kv.put(fpUserKey, uid, { expirationTtl: 14 * 24 * 60 * 60 });
    }

    await Promise.all([
      kv.put(nonceKey, '1', { expirationTtl: 24 * 60 * 60 }),
      kv.put(velocityKey, String(velocity10m), { expirationTtl: 10 * 60 })
    ]);
  }

  const risk = scoreClaimPayoutRisk({
    amount,
    emailVerified,
    velocity10m,
    reusedNonce,
    sharedFingerprint
  });

  const quarantineUntil = risk.decision === 'quarantine'
    ? new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
    : null;

  if (kv) {
    await kv.put(`claimrisk:audit:${claimId}`, JSON.stringify({
      uid,
      claimId,
      amount,
      ts: new Date().toISOString(),
      risk,
      velocity10m,
      subject,
      quarantineUntil
    }), { expirationTtl: 30 * 24 * 60 * 60 });
  }

  return json({
    ok: true,
    claimId,
    status: risk.decision,
    payoutReady: risk.decision === 'payout_ready',
    quarantineBucket: risk.decision === 'quarantine' ? 'reward-claims-hold' : null,
    quarantineUntil,
    riskScore: risk.score,
    reasons: risk.reasons
  }, { status: risk.decision === 'payout_ready' ? 200 : 202 });
}

async function parseSwapOfferCode(/** @type {any} */ code) {
  const payload = await decodeSignedPayload('eonoffer', code);
  const offerId = normalizeSwapOfferId(payload.offerId);
  const expiresAt = normalizeIsoTime(payload.expiresAt, null);
  if (!offerId || !expiresAt) {
    throw new Error('Offer payload is missing required fields.');
  }
  return {
    offerId,
    createdAt: normalizeIsoTime(payload.createdAt, new Date().toISOString()),
    expiresAt,
    offeredItem: payload.offeredItem || {},
    offeredValue: normalizeInteger(payload.offeredValue, 0, 1_000_000_000),
    wanted: payload.wanted || {},
    priceEon: normalizeInteger(payload.priceEon, 0, 1_000_000_000),
    payload
  };
}

async function parseSwapReceiptCode(/** @type {any} */ code) {
  const payload = await decodeSignedPayload('eonreceipt', code);
  const receiptId = normalizeSwapReceiptId(payload.receiptId);
  const offerId = normalizeSwapOfferId(payload.offerId);
  const expiresAt = normalizeIsoTime(payload.expiresAt, null);
  if (!receiptId || !offerId || !expiresAt) {
    throw new Error('Receipt payload is missing required fields.');
  }
  return {
    receiptId,
    offerId,
    createdAt: normalizeIsoTime(payload.createdAt, new Date().toISOString()),
    expiresAt,
    claimItem: payload.claimItem || {},
    eonCredit: normalizeInteger(payload.eonCredit, 0, 1_000_000_000),
    payload
  };
}

async function readJson(/** @type {any} */ request) {
  const contentLength = Number(request.headers.get('content-length') || '0');
  if (Number.isFinite(contentLength) && contentLength >= MAX_JSON_BODY_BYTES) {
    const payloadError = new Error(`JSON payload exceeds ${MAX_JSON_BODY_BYTES} bytes.`);
    payloadError.code = 'payload_too_large';
    payloadError.status = 413;
    throw payloadError;
  }
  const text = await request.text();
  const payloadBytes = new TextEncoder().encode(text).byteLength;
  if (payloadBytes >= MAX_JSON_BODY_BYTES) {
    const payloadError = new Error(`JSON payload exceeds ${MAX_JSON_BODY_BYTES} bytes.`);
    payloadError.code = 'payload_too_large';
    payloadError.status = 413;
    throw payloadError;
  }
  let /** @type {any} */
data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    const parseError = new Error('Invalid request body');
    parseError.code = 'invalid_json';
    parseError.status = 400;
    throw parseError;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    const shapeError = new Error('JSON body must be an object.');
    shapeError.code = 'invalid_json_shape';
    shapeError.status = 400;
    throw shapeError;
  }
  return {
    raw: text,
    data
  };
}

function ensureJsonRequest(/** @type {any} */ request) {
  const contentType = String(request.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    const typeError = new Error('Content-Type must be application/json.');
    typeError.code = 'invalid_content_type';
    typeError.status = 415;
    throw typeError;
  }
}

function hasDatabase(/** @type {any} */ env) {
  return Boolean(env?.DB);
}

async function verifyAdminRequest(/** @type {any} */ request, /** @type {any} */ env, /** @type {any} */ rawBody) {
  const secret = env.ADMIN_HMAC_SECRET;
  if (!secret) {
    throw new Error('ADMIN_HMAC_SECRET is not configured.');
  }

  const signatureHeader = (env.ADMIN_HMAC_HEADER || 'x-eon-signature').toLowerCase();
  const timestampHeader = (env.ADMIN_TIMESTAMP_HEADER || 'x-eon-ts').toLowerCase();
  const nonceHeader = (env.ADMIN_NONCE_HEADER || 'x-eon-nonce').toLowerCase();
  const roleHeader = (env.ADMIN_ROLE_HEADER || 'x-eon-role').toLowerCase();
  const timestamp = request.headers.get(timestampHeader);
  const signature = request.headers.get(signatureHeader);
  const nonce = request.headers.get(nonceHeader);
  const role = String(request.headers.get(roleHeader) || '').trim().toLowerCase().slice(0, 32);
  const allowedRoles = String(env.ADMIN_ALLOWED_ROLES || 'admin')
    .split(',')
    .map((/** @type {any} */ entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (!timestamp || !signature) {
    throw new Error('Missing admin signature headers.');
  }
  if (!role || !allowedRoles.includes(role)) {
    throw new Error('Admin role is invalid.');
  }

  const timestampMs = Number(timestamp);
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    throw new Error('Admin request timestamp is outside the accepted window.');
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signedPayload = `${timestamp}.${rawBody}`;
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const expected = [...new Uint8Array(digest)].map((/** @type {any} */ byte) => byte.toString(16).padStart(2, '0')).join('');
  const provided = String(signature || '').trim().toLowerCase();
  const isHex = /^[a-f0-9]{64}$/i.test(provided);

  if (!isHex) {
    throw new Error('Admin signature format is invalid.');
  }
  let mismatch = expected.length ^ provided.length;
  for (let i = 0; i < expected.length && i < provided.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }

  if (mismatch !== 0) {
    throw new Error('Admin signature verification failed.');
  }

  if (!nonce || !/^[a-z0-9_-]{16,120}$/i.test(String(nonce).trim())) {
    throw new Error('Missing or invalid admin nonce header.');
  }
  const normalizedNonce = String(nonce).trim().toLowerCase();

  if (env.ADMIN_NONCE_KV) {
    const nonceKey = `admin-nonce:${normalizedNonce}`;
    const signatureKey = `admin-signature:${provided}`;
    const [seenNonce, seenSignature] = await Promise.all([
      env.ADMIN_NONCE_KV.get(nonceKey),
      env.ADMIN_NONCE_KV.get(signatureKey)
    ]);
    if (seenNonce || seenSignature) {
      throw new Error('Admin request nonce already used.');
    }
    await Promise.all([
      env.ADMIN_NONCE_KV.put(nonceKey, '1', { expirationTtl: 10 * 60 }),
      env.ADMIN_NONCE_KV.put(signatureKey, '1', { expirationTtl: 10 * 60 })
    ]);
  }
}

async function getLatestEpoch(/** @type {any} */ env) {
  const row = await env.DB.prepare(`
    SELECT sequence, domain, merkle_root, metrics_hash, emission_amount, total_points, claim_window_start, claim_window_end, status, closed_reason, closed_at, closed_by, remainder_receiver, remainder_amount, snapshot_json, created_at
    FROM epoch_snapshots
    ORDER BY sequence DESC, id DESC
    LIMIT 1
  `).first();
  return row || null;
}

async function getClaimRows(/** @type {any} */ env, /** @type {any} */ uid) {
  const result = await env.DB.prepare(`
    SELECT sequence, domain, wallet_address, points, claim_amount, proof_root, status, payload_json, updated_at
    FROM claim_previews
    WHERE uid = ?
    ORDER BY sequence DESC, id DESC
    LIMIT 8
  `).bind(uid).all();
  return result.results || [];
}

async function getEntitlement(/** @type {any} */ env, /** @type {any} */ uid) {
  return env.DB.prepare(`
    SELECT uid, tier, status, payment_asset, stable_price_cents, eonl_amount, renews_at, features_json, updated_at
    FROM user_entitlements
    WHERE uid = ?
    LIMIT 1
  `).bind(uid).first();
}

async function getSwapOfferRow(/** @type {any} */ env, /** @type {any} */ offerId) {
  return env.DB.prepare(`
    SELECT offer_id, offer_code_hash, offer_payload_json, owner_uid, owner_wallet, status, expires_at, accepted_uid, accepted_wallet,
           accepted_item_fingerprint, receipt_code_hash, receipt_payload_json, redeemed_uid, redeemed_wallet, created_at, accepted_at, redeemed_at, updated_at
    FROM swap_offer_reconciliations
    WHERE offer_id = ?
    LIMIT 1
  `).bind(offerId).first();
}

function isExpiredIso(/** @type {any} */ isoTime) {
  const parsed = Date.parse(isoTime || '');
  return Number.isFinite(parsed) ? parsed <= Date.now() : true;
}

async function handleSwapPublish(/** @type {any} */ request, /** @type {any} */ env) {
  if (!hasDatabase(env)) {
    return errorResponse(503, 'd1_unavailable', 'D1 binding is required for swap reconciliation.');
  }

  let /** @type {any} */
data;
  try {
    ensureJsonRequest(request);
    ({ data } = await readJson(request));
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_json', error.message || 'Invalid request body');
  }

  const uid = normalizeUid(data.uid);
  let walletAddress = '';
  try {
    walletAddress = parseAddressField(data.walletAddress || '', 'walletAddress');
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_address', error.message);
  }
  if (!uid) {
    return errorResponse(400, 'invalid_uid', 'A valid uid is required.');
  }
  let offerCode = '';
  try {
    offerCode = parseBoundedString(data.offerCode, 'offerCode', 8192, true);
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_string', error.message);
  }

  let /** @type {any} */
offer;
  try {
    offer = await parseSwapOfferCode(offerCode);
  } catch (/** @type {any} */
error) {
    return errorResponse(400, 'invalid_offer', error.message);
  }
  if (isExpiredIso(offer.expiresAt)) {
    return errorResponse(400, 'offer_expired', 'Offer code is already expired.');
  }
  try {
    await consumeSwapNonce(env, uid, data.clientNonce);
  } catch (/** @type {any} */
error) {
    return errorResponse(409, 'swap_nonce_rejected', error.message);
  }

  const offerHash = await sha256Hex(offerCode);

  let /** @type {any} */
row;
  try {
    row = await getSwapOfferRow(env, offer.offerId);
  } catch (/** @type {any} */
error) {
    logInternalError('swap_publish_schema', error);
    return errorResponse(503, 'swap_schema_missing', 'Swap reconciliation schema is not available.');
  }

  if (!row) {
    await env.DB.prepare(`
      INSERT INTO swap_offer_reconciliations (
        offer_id, offer_code_hash, offer_payload_json, owner_uid, owner_wallet, status, expires_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'open', ?, CURRENT_TIMESTAMP)
    `).bind(
      offer.offerId,
      offerHash,
      JSON.stringify(offer.payload),
      uid,
      walletAddress,
      offer.expiresAt
    ).run();
    return json({
      ok: true,
      offerId: offer.offerId,
      status: 'open',
      trustMode: env?.SWAP_NONCE_KV ? 'nonce-enforced' : 'best-effort',
      expiresAt: offer.expiresAt
    });
  }

  if (row.offer_code_hash !== offerHash) {
    return errorResponse(409, 'offer_conflict', 'An offer with this id already exists with different payload.');
  }

  if (row.status !== 'open') {
    return json({
      ok: true,
      offerId: offer.offerId,
      status: row.status,
      trustMode: env?.SWAP_NONCE_KV ? 'nonce-enforced' : 'best-effort',
      expiresAt: row.expires_at
    });
  }

  await env.DB.prepare(`
    UPDATE swap_offer_reconciliations
    SET owner_uid = ?, owner_wallet = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE offer_id = ?
  `).bind(uid, walletAddress, offer.expiresAt, offer.offerId).run();

  return json({
    ok: true,
    offerId: offer.offerId,
    status: 'open',
    trustMode: env?.SWAP_NONCE_KV ? 'nonce-enforced' : 'best-effort',
    expiresAt: offer.expiresAt
  });
}

async function handleSwapVerify(/** @type {any} */ request, /** @type {any} */ env) {
  if (!hasDatabase(env)) {
    return errorResponse(503, 'd1_unavailable', 'D1 binding is required for swap verification.');
  }

  let /** @type {any} */
data;
  try {
    ensureJsonRequest(request);
    ({ data } = await readJson(request));
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_json', error.message || 'Invalid request body');
  }
  let offerCode = '';
  try {
    offerCode = parseBoundedString(data.offerCode, 'offerCode', 8192, true);
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_string', error.message);
  }

  let /** @type {any} */
offer;
  try {
    offer = await parseSwapOfferCode(offerCode);
  } catch (/** @type {any} */
error) {
    return errorResponse(400, 'invalid_offer', error.message);
  }

  let /** @type {any} */
row;
  try {
    row = await getSwapOfferRow(env, offer.offerId);
  } catch (/** @type {any} */
error) {
    logInternalError('swap_verify_schema', error);
    return errorResponse(503, 'swap_schema_missing', 'Swap reconciliation schema is not available.');
  }
  const status = !row
    ? 'untracked'
    : row.status === 'open' && isExpiredIso(row.expires_at)
      ? 'expired'
      : row.status;

  return json({
    ok: true,
    offerId: offer.offerId,
    status,
    tracked: Boolean(row),
    expiresAt: row?.expires_at || offer.expiresAt
  });
}

async function handleSwapReconcile(/** @type {any} */ request, /** @type {any} */ env) {
  if (!hasDatabase(env)) {
    return errorResponse(503, 'd1_unavailable', 'D1 binding is required for swap reconciliation.');
  }

  let /** @type {any} */
data;
  try {
    ensureJsonRequest(request);
    ({ data } = await readJson(request));
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_json', error.message || 'Invalid request body');
  }

  const uid = normalizeUid(data.uid);
  if (!uid) {
    return errorResponse(400, 'invalid_uid', 'A valid uid is required.');
  }
  let walletAddress = '';
  try {
    walletAddress = parseAddressField(data.walletAddress || '', 'walletAddress');
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_address', error.message);
  }
  const bidderFingerprint = normalizeText(data.bidderFingerprint || '', 120);
  let offerCode = '';
  let receiptCode = '';
  try {
    offerCode = parseBoundedString(data.offerCode, 'offerCode', 8192, true);
    receiptCode = parseBoundedString(data.receiptCode, 'receiptCode', 8192, true);
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_string', error.message);
  }

  let /** @type {any} */
offer;
  let /** @type {any} */
receipt;
  try {
    offer = await parseSwapOfferCode(offerCode);
    receipt = await parseSwapReceiptCode(receiptCode);
  } catch (/** @type {any} */
error) {
    return errorResponse(400, 'invalid_swap_payload', error.message);
  }
  if (offer.offerId !== receipt.offerId) {
    return errorResponse(400, 'offer_receipt_mismatch', 'Receipt does not belong to provided offer.');
  }
  try {
    await consumeSwapNonce(env, uid, data.clientNonce);
  } catch (/** @type {any} */
error) {
    return errorResponse(409, 'swap_nonce_rejected', error.message);
  }

  let /** @type {any} */
row;
  try {
    row = await getSwapOfferRow(env, offer.offerId);
  } catch (/** @type {any} */
error) {
    logInternalError('swap_reconcile_schema', error);
    return errorResponse(503, 'swap_schema_missing', 'Swap reconciliation schema is not available.');
  }
  if (!row) {
    return errorResponse(404, 'offer_not_published', 'Offer must be published before reconciliation.');
  }
  if (row.status === 'open' && isExpiredIso(row.expires_at)) {
    await env.DB.prepare(`
      UPDATE swap_offer_reconciliations
      SET status = 'expired', updated_at = CURRENT_TIMESTAMP
      WHERE offer_id = ?
    `).bind(offer.offerId).run();
    return errorResponse(409, 'offer_expired', 'Offer is expired and cannot be reconciled.');
  }

  const receiptHash = await sha256Hex(receiptCode);

  if (row.status === 'accepted' || row.status === 'redeemed') {
    if (row.receipt_code_hash === receiptHash) {
      return json({
        ok: true,
        offerId: offer.offerId,
        status: row.status,
        trustMode: env?.SWAP_NONCE_KV ? 'nonce-enforced' : 'best-effort',
        acceptedBy: row.accepted_uid || uid
      });
    }
    return errorResponse(409, 'swap_already_reconciled', 'Offer already reconciled with a different receipt.');
  }

  if (row.status !== 'open') {
    return errorResponse(409, 'invalid_swap_status', `Offer status ${row.status} cannot be reconciled.`);
  }

  await env.DB.prepare(`
    UPDATE swap_offer_reconciliations
    SET status = 'accepted',
        accepted_uid = ?,
        accepted_wallet = ?,
        accepted_item_fingerprint = ?,
        receipt_code_hash = ?,
        receipt_payload_json = ?,
        accepted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE offer_id = ?
  `).bind(
    uid,
    walletAddress,
    bidderFingerprint,
    receiptHash,
    JSON.stringify(receipt.payload),
    offer.offerId
  ).run();

  return json({
    ok: true,
    offerId: offer.offerId,
    status: 'accepted',
    trustMode: env?.SWAP_NONCE_KV ? 'nonce-enforced' : 'best-effort',
    acceptedBy: uid
  });
}

async function handleSwapRedeem(/** @type {any} */ request, /** @type {any} */ env) {
  if (!hasDatabase(env)) {
    return errorResponse(503, 'd1_unavailable', 'D1 binding is required for swap redemption reconciliation.');
  }

  let /** @type {any} */
data;
  try {
    ensureJsonRequest(request);
    ({ data } = await readJson(request));
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_json', error.message || 'Invalid request body');
  }

  const uid = normalizeUid(data.uid);
  if (!uid) {
    return errorResponse(400, 'invalid_uid', 'A valid uid is required.');
  }
  let walletAddress = '';
  try {
    walletAddress = parseAddressField(data.walletAddress || '', 'walletAddress');
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_address', error.message);
  }
  let receiptCode = '';
  try {
    receiptCode = parseBoundedString(data.receiptCode, 'receiptCode', 8192, true);
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_string', error.message);
  }

  let /** @type {any} */
receipt;
  try {
    receipt = await parseSwapReceiptCode(receiptCode);
  } catch (/** @type {any} */
error) {
    return errorResponse(400, 'invalid_receipt', error.message);
  }
  try {
    await consumeSwapNonce(env, uid, data.clientNonce);
  } catch (/** @type {any} */
error) {
    return errorResponse(409, 'swap_nonce_rejected', error.message);
  }

  let /** @type {any} */
row;
  try {
    row = await getSwapOfferRow(env, receipt.offerId);
  } catch (/** @type {any} */
error) {
    logInternalError('swap_redeem_schema', error);
    return errorResponse(503, 'swap_schema_missing', 'Swap reconciliation schema is not available.');
  }
  if (!row) {
    return errorResponse(404, 'offer_not_found', 'Published offer reconciliation record was not found.');
  }

  const receiptHash = await sha256Hex(receiptCode);
  if (row.receipt_code_hash && row.receipt_code_hash !== receiptHash) {
    return errorResponse(409, 'receipt_mismatch', 'Receipt does not match reconciled offer acceptance.');
  }

  if (row.status === 'redeemed') {
    return json({
      ok: true,
      offerId: receipt.offerId,
      status: 'redeemed',
      trustMode: env?.SWAP_NONCE_KV ? 'nonce-enforced' : 'best-effort',
      redeemedBy: row.redeemed_uid || uid
    });
  }

  if (row.status !== 'accepted') {
    return errorResponse(409, 'swap_not_accepted', `Offer status ${row.status} cannot be redeemed.`);
  }

  await env.DB.prepare(`
    UPDATE swap_offer_reconciliations
    SET status = 'redeemed',
        redeemed_uid = ?,
        redeemed_wallet = ?,
        redeemed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE offer_id = ?
  `).bind(uid, walletAddress, receipt.offerId).run();

  return json({
    ok: true,
    offerId: receipt.offerId,
    status: 'redeemed',
    trustMode: env?.SWAP_NONCE_KV ? 'nonce-enforced' : 'best-effort',
    redeemedBy: uid
  });
}

async function handleHealth(/** @type {any} */ env) {
  return json({
    ok: true,
    runtime: 'cloudflare-worker',
    database: hasDatabase(env) ? 'd1-configured' : 'd1-missing',
    swapNonceKv: env?.SWAP_NONCE_KV ? 'configured' : 'not-configured',
    durableServer: false,
    decentralizationMode: 'static-site + edge state'
  });
}

async function handleVaultSummary(/** @type {any} */ request, /** @type {any} */ env, /** @type {any} */ uid) {
  if (!hasDatabase(env)) {
    return json({
      ok: true,
      mode: 'stateless-fallback',
      uid,
      latestEpoch: null,
      claims: [],
      entitlement: null
    });
  }

  const [latestEpoch, claims, entitlement] = await Promise.all([
    getLatestEpoch(env),
    getClaimRows(env, uid),
    getEntitlement(env, uid)
  ]);

  return json({
    ok: true,
    mode: 'd1',
    uid,
    latestEpoch: latestEpoch
      ? {
          sequence: latestEpoch.sequence,
          domain: latestEpoch.domain,
          merkle_root: latestEpoch.merkle_root,
          metrics_hash: latestEpoch.metrics_hash,
          emission_amount: latestEpoch.emission_amount,
          total_points: latestEpoch.total_points,
          claim_window_start: latestEpoch.claim_window_start,
          claim_window_end: latestEpoch.claim_window_end,
          status: latestEpoch.status,
          closed_reason: latestEpoch.closed_reason,
          closed_at: latestEpoch.closed_at,
          closed_by: latestEpoch.closed_by,
          remainder_receiver: latestEpoch.remainder_receiver,
          remainder_amount: latestEpoch.remainder_amount,
          created_at: latestEpoch.created_at,
          snapshot: safeParse(latestEpoch.snapshot_json, {})
        }
      : null,
    claims: claims.map((/** @type {any} */ entry) => ({
      sequence: entry.sequence,
      domain: entry.domain,
      wallet_address: entry.wallet_address,
      points: entry.points,
      claim_amount: entry.claim_amount,
      proof_root: entry.proof_root,
      status: entry.status,
      updated_at: entry.updated_at,
      payload: safeParse(entry.payload_json)
    })),
    entitlement: entitlement
      ? {
          uid: entitlement.uid,
          tier: entitlement.tier,
          status: entitlement.status,
          payment_asset: entitlement.payment_asset,
          stable_price_cents: entitlement.stable_price_cents,
          eonl_amount: entitlement.eonl_amount,
          renews_at: entitlement.renews_at,
          updated_at: entitlement.updated_at,
          features: safeParse(entitlement.features_json, [])
        }
      : null
  });
}

function safeParse(/** @type {any} */ value, /** @type {any} */ fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

async function readEpochSnapshot(/** @type {any} */ env, /** @type {any} */ sequence, /** @type {any} */ domain) {
  return env.DB.prepare(`
    SELECT id, sequence, domain, merkle_root, claim_window_end, status, remainder_receiver, remainder_amount
    FROM epoch_snapshots
    WHERE sequence = ? AND domain = ?
    LIMIT 1
  `).bind(sequence, domain).first();
}

async function handlePublishEpoch(/** @type {any} */ request, /** @type {any} */ env) {
  if (!hasDatabase(env)) {
    return errorResponse(503, 'd1_unavailable', 'D1 binding is required to publish epochs.');
  }

  let /** @type {any} */
raw;
  let /** @type {any} */
data;
  try {
    ensureJsonRequest(request);
    ({ raw, data } = await readJson(request));
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_json', error.message || 'Invalid request body');
  }
  try {
    await verifyAdminRequest(request, env, raw);
  } catch (/** @type {any} */
error) {
    return errorResponse(401, 'admin_auth_failed', 'Admin authorization failed.');
  }

  const sequence = Number(data.sequence);
  const domain = normalizeDomain(data.domain);
  const merkleRoot = normalizeMerkleRoot(data.merkleRoot);
  if (!Number.isInteger(sequence) || sequence <= 0 || !domain || !merkleRoot) {
    return errorResponse(400, 'invalid_epoch', 'sequence, domain, and valid merkleRoot are required.');
  }
  const metricsHashRaw = String(data.metricsHash || '').trim();
  const metricsHash = metricsHashRaw ? normalizeHexBytes32(metricsHashRaw) : '';
  if (metricsHashRaw && !metricsHash) {
    return errorResponse(400, 'invalid_metrics_hash', 'metricsHash must be a 66-character 0x-prefixed hex value.');
  }

  const isPoolDomain = POOL_DOMAINS.has(domain);
  let emissionAmount = '0';
  let emissionValue = 0;
  let epochTotalEmission = '';
  let epochTotalEmissionValue = 0;
  let totalPoints = '0';
  try {
    const emissionParsed = parseDecimalAmount(data.emissionAmount, 'emissionAmount', { min: 0, max: 1_000_000_000_000, fallback: '0' });
    emissionAmount = emissionParsed.normalized;
    emissionValue = emissionParsed.number;
    const epochTotalParsed = parseDecimalAmount(data.epochTotalEmission, 'epochTotalEmission', { min: 0, max: 1_000_000_000_000, fallback: '' });
    epochTotalEmission = epochTotalParsed.normalized;
    epochTotalEmissionValue = epochTotalEmission ? epochTotalParsed.number : 0;
    totalPoints = parseDecimalAmount(data.totalPoints, 'totalPoints', { min: 0, max: 1_000_000_000_000, fallback: '0' }).normalized;
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_number', error.message);
  }
  if (isPoolDomain) {
    if (!epochTotalEmission || !Number.isFinite(epochTotalEmissionValue) || epochTotalEmissionValue <= 0) {
      return errorResponse(400, 'pool_total_required', 'epochTotalEmission is required for pool domains.');
    }
    const weightedLimit = epochTotalEmissionValue * POOL_DOMAIN_WEIGHTS[domain] * 1.02;
    if (!Number.isFinite(emissionValue) || emissionValue > weightedLimit) {
      return errorResponse(400, 'pool_emission_exceeds_share', 'Pool emission exceeds the allowed weighted share.');
    }
  }

  const lifecycleStatus = normalizeLifecycleStatus(data.status, 'published');
  const closedReason = normalizeText(data.closedReason || '', 240);
  const closedAt = normalizeIsoTime(data.closedAt, null);
  const closedBy = normalizeText(data.closedBy || '', 120);
  let remainderReceiver = '';
  try {
    remainderReceiver = parseAddressField(data.remainderReceiver || '', 'remainderReceiver');
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_address', error.message);
  }
  let remainderAmount = '0';
  try {
    remainderAmount = parseDecimalAmount(data.remainderAmount, 'remainderAmount', { min: 0, max: 1_000_000_000_000, fallback: '0' }).normalized;
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_number', error.message);
  }
  const claimWindowStart = normalizeIsoTime(data.claimWindowStart, new Date().toISOString());
  const claimWindowEnd = normalizeIsoTime(data.claimWindowEnd, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
  if (Date.parse(claimWindowEnd) <= Date.parse(claimWindowStart)) {
    return errorResponse(400, 'invalid_claim_window', 'claimWindowEnd must be later than claimWindowStart.');
  }
  const snapshotPayload = data.snapshot && typeof data.snapshot === 'object' && !Array.isArray(data.snapshot)
    ? { ...data.snapshot }
    : {};
  if (epochTotalEmission) {
    snapshotPayload.epochTotalEmission = epochTotalEmission;
  }
  const snapshotJson = JSON.stringify(snapshotPayload);
  const previousPoolEpoch = isPoolDomain
    ? await env.DB.prepare(`
      SELECT merkle_root, metrics_hash, emission_amount, total_points, claim_window_start, claim_window_end, status,
             closed_reason, closed_at, closed_by, remainder_receiver, remainder_amount, snapshot_json, created_at
      FROM epoch_snapshots
      WHERE sequence = ? AND domain = ?
    `).bind(sequence, domain).first()
    : null;
  await env.DB.prepare(`
    INSERT INTO epoch_snapshots (
      sequence, domain, merkle_root, metrics_hash, emission_amount, total_points, claim_window_start, claim_window_end, status, closed_reason, closed_at, closed_by, remainder_receiver, remainder_amount, snapshot_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(sequence, domain) DO UPDATE SET
      merkle_root = excluded.merkle_root,
      metrics_hash = excluded.metrics_hash,
      emission_amount = excluded.emission_amount,
      total_points = excluded.total_points,
      claim_window_start = excluded.claim_window_start,
      claim_window_end = excluded.claim_window_end,
      status = excluded.status,
      closed_reason = excluded.closed_reason,
      closed_at = excluded.closed_at,
      closed_by = excluded.closed_by,
      remainder_receiver = excluded.remainder_receiver,
      remainder_amount = excluded.remainder_amount,
      snapshot_json = excluded.snapshot_json
  `).bind(
    sequence,
    domain,
    merkleRoot,
    metricsHash,
    emissionAmount,
    totalPoints,
    claimWindowStart,
    claimWindowEnd,
    lifecycleStatus,
    closedReason,
    closedAt,
    closedBy,
    remainderReceiver,
    remainderAmount,
    snapshotJson
  ).run();

  if (isPoolDomain) {
    const otherPoolTotals = await env.DB.prepare(`
      SELECT SUM(CAST(emission_amount AS REAL)) AS total
      FROM epoch_snapshots
      WHERE sequence = ?
        AND domain IN (?, ?, ?, ?, ?)
        AND domain != ?
    `).bind(sequence, ...POOL_DOMAINS, domain).first();
    const runningTotal = emissionValue + Number.parseFloat(otherPoolTotals?.total || '0');
    if (runningTotal > epochTotalEmissionValue * 1.02) {
      if (previousPoolEpoch) {
        await env.DB.prepare(`
          UPDATE epoch_snapshots
          SET merkle_root = ?, metrics_hash = ?, emission_amount = ?, total_points = ?, claim_window_start = ?,
              claim_window_end = ?, status = ?, closed_reason = ?, closed_at = ?, closed_by = ?,
              remainder_receiver = ?, remainder_amount = ?, snapshot_json = ?, created_at = ?
          WHERE sequence = ? AND domain = ?
        `).bind(
          previousPoolEpoch.merkle_root,
          previousPoolEpoch.metrics_hash,
          previousPoolEpoch.emission_amount,
          previousPoolEpoch.total_points,
          previousPoolEpoch.claim_window_start,
          previousPoolEpoch.claim_window_end,
          previousPoolEpoch.status,
          previousPoolEpoch.closed_reason,
          previousPoolEpoch.closed_at,
          previousPoolEpoch.closed_by,
          previousPoolEpoch.remainder_receiver,
          previousPoolEpoch.remainder_amount,
          previousPoolEpoch.snapshot_json,
          previousPoolEpoch.created_at,
          sequence,
          domain
        ).run();
      } else {
        await env.DB.prepare(`
          DELETE FROM epoch_snapshots
          WHERE sequence = ? AND domain = ?
        `).bind(sequence, domain).run();
      }
      return errorResponse(400, 'pool_total_exceeded', 'Pool epoch total exceeds the epoch-wide emission budget.');
    }
  }

  const claims = Array.isArray(data.claims) ? data.claims : [];
  if (claims.length > MAX_CLAIMS_PER_EPOCH) {
    return errorResponse(400, 'too_many_claims', `Maximum ${MAX_CLAIMS_PER_EPOCH} claims per epoch publish.`);
  }
  if (claims.length) {
    const /** @type {any} */
statements = [];
    for (const /** @type {any} */
entry of claims) {
      const claimUid = normalizeUid(entry.uid);
      if (!claimUid) {
        continue;
      }
      let claimWallet = '';
      let claimPoints = '0';
      let claimAmount = '0';
      try {
        claimWallet = parseAddressField(entry.walletAddress || '', 'claims.walletAddress');
        claimPoints = parseDecimalAmount(entry.points, 'claims.points', { min: 0, max: 1_000_000_000_000, fallback: '0' }).normalized;
        claimAmount = parseDecimalAmount(entry.claimAmount, 'claims.claimAmount', { min: 0, max: 1_000_000_000_000, fallback: '0' }).normalized;
      } catch (/** @type {any} */
error) {
        return errorResponse(error.status || 400, error.code || 'invalid_claim', error.message);
      }
      statements.push(env.DB.prepare(`
        INSERT INTO claim_previews (
          uid, sequence, domain, wallet_address, points, claim_amount, proof_root, status, payload_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(uid, sequence, domain) DO UPDATE SET
          wallet_address = excluded.wallet_address,
          points = excluded.points,
          claim_amount = excluded.claim_amount,
          proof_root = excluded.proof_root,
          status = excluded.status,
          payload_json = excluded.payload_json,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        claimUid,
        sequence,
        domain,
        claimWallet,
        claimPoints,
        claimAmount,
        merkleRoot,
        normalizeLifecycleStatus(entry.status, lifecycleStatus),
        JSON.stringify(entry)
      ));
    }
    if (statements.length) {
      await env.DB.batch(statements);
    }
  }

  return json({
    ok: true,
    sequence,
    domain,
    publishedClaims: claims.length
  });
}

async function handleCloseEpoch(/** @type {any} */ request, /** @type {any} */ env) {
  if (!hasDatabase(env)) {
    return errorResponse(503, 'd1_unavailable', 'D1 binding is required to close epochs.');
  }

  let /** @type {any} */
raw;
  let /** @type {any} */
data;
  try {
    ensureJsonRequest(request);
    ({ raw, data } = await readJson(request));
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_json', error.message || 'Invalid request body');
  }
  try {
    await verifyAdminRequest(request, env, raw);
  } catch (/** @type {any} */
error) {
    return errorResponse(401, 'admin_auth_failed', 'Admin authorization failed.');
  }

  const sequence = Number(data.sequence);
  const domain = normalizeDomain(data.domain);
  if (!Number.isInteger(sequence) || sequence <= 0 || !domain) {
    return errorResponse(400, 'invalid_epoch', 'sequence and domain are required.');
  }

  const epoch = await readEpochSnapshot(env, sequence, domain);
  if (!epoch) {
    return errorResponse(404, 'epoch_not_found', 'Published epoch snapshot was not found.');
  }

  const lifecycleStatus = normalizeLifecycleStatus(data.status, 'swept');
  const closedReason = normalizeText(data.closedReason || data.reason || '', 240);
  const closedAt = normalizeIsoTime(data.closedAt, new Date().toISOString());
  const closedBy = normalizeText(data.closedBy || 'backend-admin', 120);
  let remainderReceiver = '';
  try {
    remainderReceiver = parseAddressField(data.remainderReceiver || epoch.remainder_receiver || '', 'remainderReceiver');
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_address', error.message);
  }
  let remainderAmount = epoch.remainder_amount || '0';
  try {
    remainderAmount = parseDecimalAmount(data.remainderAmount, 'remainderAmount', { min: 0, max: 1_000_000_000_000, fallback: epoch.remainder_amount || '0' }).normalized;
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_number', error.message);
  }
  const claimStatus = normalizeLifecycleStatus(data.claimStatus, lifecycleStatus);

  await env.DB.prepare(`
    UPDATE epoch_snapshots
    SET status = ?, closed_reason = ?, closed_at = ?, closed_by = ?, remainder_receiver = ?, remainder_amount = ?
    WHERE sequence = ? AND domain = ?
  `).bind(
    lifecycleStatus,
    closedReason,
    closedAt,
    closedBy,
    remainderReceiver,
    remainderAmount,
    sequence,
    domain
  ).run();

  await env.DB.prepare(`
    UPDATE claim_previews
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE sequence = ? AND domain = ?
  `).bind(claimStatus, sequence, domain).run();

  return json({
    ok: true,
    sequence,
    domain,
    status: lifecycleStatus,
    claimStatus,
    remainderReceiver,
    remainderAmount
  });
}

async function handleSyncEntitlement(/** @type {any} */ request, /** @type {any} */ env) {
  if (!hasDatabase(env)) {
    return errorResponse(503, 'd1_unavailable', 'D1 binding is required to sync entitlements.');
  }

  let /** @type {any} */
raw;
  let /** @type {any} */
data;
  try {
    ensureJsonRequest(request);
    ({ raw, data } = await readJson(request));
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_json', error.message || 'Invalid request body');
  }
  try {
    await verifyAdminRequest(request, env, raw);
  } catch (/** @type {any} */
error) {
    return errorResponse(401, 'admin_auth_failed', 'Admin authorization failed.');
  }

  const entries = Array.isArray(data.entries) ? data.entries : [data];
  if (entries.length > MAX_BULK_ENTRIES) {
    return errorResponse(400, 'too_many_entries', `Maximum ${MAX_BULK_ENTRIES} entitlement entries per request.`);
  }
  const /** @type {any} */
statements = [];

  for (const /** @type {any} */
entry of entries) {
    const uid = normalizeUid(entry.uid);
    if (!uid) {
      return errorResponse(400, 'invalid_entitlement', 'Every entitlement entry must include a uid.');
    }
    statements.push(env.DB.prepare(`
      INSERT INTO user_entitlements (
        uid, tier, status, payment_asset, stable_price_cents, eonl_amount, renews_at, features_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(uid) DO UPDATE SET
        tier = excluded.tier,
        status = excluded.status,
        payment_asset = excluded.payment_asset,
        stable_price_cents = excluded.stable_price_cents,
        eonl_amount = excluded.eonl_amount,
        renews_at = excluded.renews_at,
        features_json = excluded.features_json,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      uid,
      normalizeTier(entry.tier),
      normalizeEntitlementStatus(entry.status),
      normalizePaymentAsset(entry.paymentAsset),
      normalizeInteger(entry.stablePriceCents, 0, MAX_ENTITLEMENT_CENTS),
      String(normalizeInteger(entry.eonlAmount, 0, MAX_ENTITLEMENT_CENTS)),
      normalizeIsoTime(entry.renewsAt, null),
      JSON.stringify(normalizeFeatureList(entry.features))
    ));
  }

  if (statements.length) {
    await env.DB.batch(statements);
  }

  return json({
    ok: true,
    synced: statements.length
  });
}

function buildAgentJobId() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const tail = Array.from(bytes).map((/** @type {any} */ byte) => byte.toString(16).padStart(2, '0')).join('');
  return `agent-job-${tail}${Date.now().toString(36).slice(-8)}`;
}

async function ensureAgentOpsTables(/** @type {any} */ env) {
  if (!hasDatabase(env)) {
    throw new Error('D1 binding is required for agent orchestration endpoints.');
  }
  await env.DB.batch([
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS agent_jobs (
        job_id TEXT NOT NULL PRIMARY KEY,
        origin TEXT NOT NULL,
        action TEXT NOT NULL,
        intent_text TEXT,
        payload_json TEXT,
        status TEXT NOT NULL DEFAULT 'queued',
        approval_status TEXT NOT NULL DEFAULT 'pending',
        requires_approval INTEGER NOT NULL DEFAULT 0,
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 3,
        priority INTEGER NOT NULL DEFAULT 50,
        next_attempt_at TEXT,
        created_by TEXT,
        approved_by TEXT,
        approved_at TEXT,
        last_error TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS agent_job_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        event_data_json TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_agent_jobs_status_next
      ON agent_jobs(status, next_attempt_at)
    `),
    env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_agent_jobs_approval_status
      ON agent_jobs(approval_status, requires_approval, status)
    `),
    env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_agent_job_events_job
      ON agent_job_events(job_id, created_at)
    `)
  ]);
}

async function appendAgentJobEvent(/** @type {any} */ env, /** @type {any} */ jobId, /** @type {any} */ eventType, /** @type {any} */ eventData = {}) {
  await env.DB.prepare(`
    INSERT INTO agent_job_events (job_id, event_type, event_data_json, created_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(
    normalizeAgentJobId(jobId),
    normalizeStorageKey(eventType || 'event'),
    JSON.stringify(eventData || {})
  ).run();
}

async function verifyRemoteCommandRequest(/** @type {any} */ request, /** @type {any} */ env, /** @type {any} */ rawBody) {
  const secret = String(env.REMOTE_COMMAND_HMAC_SECRET || '').trim();
  if (!secret) {
    throw new Error('REMOTE_COMMAND_HMAC_SECRET is not configured.');
  }

  const signatureHeader = (env.REMOTE_COMMAND_SIGNATURE_HEADER || 'x-eon-cmd-signature').toLowerCase();
  const timestampHeader = (env.REMOTE_COMMAND_TIMESTAMP_HEADER || 'x-eon-cmd-ts').toLowerCase();
  const nonceHeader = (env.REMOTE_COMMAND_NONCE_HEADER || 'x-eon-cmd-nonce').toLowerCase();
  const channelHeader = (env.REMOTE_COMMAND_CHANNEL_HEADER || 'x-eon-cmd-channel').toLowerCase();

  const signature = String(request.headers.get(signatureHeader) || '').trim().toLowerCase();
  const timestamp = String(request.headers.get(timestampHeader) || '').trim();
  const nonce = normalizeNonce(request.headers.get(nonceHeader) || '');
  const channel = normalizeOrigin(request.headers.get(channelHeader) || 'api-bridge');

  if (!signature || !timestamp || !nonce) {
    throw new Error('Missing remote command signature headers.');
  }
  if (!/^[a-f0-9]{64}$/i.test(signature)) {
    throw new Error('Remote command signature format is invalid.');
  }

  const timestampMs = Number(timestamp);
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    throw new Error('Remote command timestamp is outside the accepted window.');
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signedPayload = `${timestamp}.${rawBody}`;
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const expected = [...new Uint8Array(digest)].map((/** @type {any} */ byte) => byte.toString(16).padStart(2, '0')).join('');

  let mismatch = expected.length ^ signature.length;
  for (let i = 0; i < expected.length && i < signature.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  if (mismatch !== 0) {
    throw new Error('Remote command signature verification failed.');
  }

  if (env.COMMAND_NONCE_KV) {
    const nonceKey = `remote-cmd:${nonce}`;
    const seen = await env.COMMAND_NONCE_KV.get(nonceKey);
    if (seen) {
      throw new Error('Remote command nonce already used.');
    }
    await env.COMMAND_NONCE_KV.put(nonceKey, '1', { expirationTtl: 10 * 60 });
  }

  return { channel, nonce };
}

async function handleRemoteCommandIngest(/** @type {any} */ request, /** @type {any} */ env) {
  if (!hasDatabase(env)) {
    return errorResponse(503, 'd1_unavailable', 'D1 binding is required for command ingest.');
  }

  let /** @type {any} */
raw;
  let /** @type {any} */
data;
  try {
    ensureJsonRequest(request);
    ({ raw, data } = await readJson(request));
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_json', error.message || 'Invalid request body');
  }

  let auth = null;
  try {
    auth = await verifyRemoteCommandRequest(request, env, raw);
  } catch (/** @type {any} */
error) {
    return errorResponse(401, 'remote_command_auth_failed', 'Remote command authorization failed.');
  }

  try {
    await ensureAgentOpsTables(env);
  } catch (/** @type {any} */
error) {
    return errorResponse(503, 'agent_ops_unavailable', 'Agent operations storage unavailable.');
  }

  const action = normalizeAction(data.action || data.command || 'plan');
  const intentText = normalizeText(data.intentText || data.intent || '', 1200);
  const origin = normalizeOrigin(data.origin || auth.channel || 'api-bridge');
  const createdBy = normalizeText(data.createdBy || data.requestId || 'remote-command', 120);

  if (!action) {
    return errorResponse(400, 'invalid_action', 'action is required.');
  }

  const maxAttempts = Math.max(1, Math.min(MAX_AGENT_JOB_ATTEMPTS, Number(data.maxAttempts) || 3));
  const priority = Math.max(1, Math.min(100, Number(data.priority) || 50));
  const requestedApproval = parseBooleanField(data.requiresApproval);
  const requiresApproval = requestedApproval || AGENT_HIGH_RISK_ACTIONS.has(action);
  const approvalStatus = requiresApproval ? 'pending' : 'approved';
  const status = requiresApproval ? 'awaiting_approval' : 'queued';
  const jobId = buildAgentJobId();
  const payload = data.payload && typeof data.payload === 'object' ? data.payload : {};

  await env.DB.prepare(`
    INSERT INTO agent_jobs (
      job_id, origin, action, intent_text, payload_json, status, approval_status,
      requires_approval, attempts, max_attempts, priority, next_attempt_at,
      created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    jobId,
    origin,
    action,
    intentText,
    JSON.stringify(payload),
    status,
    approvalStatus,
    requiresApproval ? 1 : 0,
    0,
    maxAttempts,
    priority,
    createdBy
  ).run();

  await appendAgentJobEvent(env, jobId, 'ingested', {
    source: origin,
    action,
    requiresApproval,
    nonce: auth?.nonce || ''
  });

  return json({
    ok: true,
    jobId,
    status,
    approvalStatus,
    requiresApproval
  }, { status: 202 });
}

async function handleOperatorApprovalsList(/** @type {any} */ request, /** @type {any} */ env) {
  if (!hasDatabase(env)) {
    return errorResponse(503, 'd1_unavailable', 'D1 binding is required for operator inbox.');
  }
  try {
    await verifyAdminRequest(request, env, '');
    await ensureAgentOpsTables(env);
  } catch (/** @type {any} */
error) {
    return errorResponse(401, 'operator_auth_failed', 'Operator authorization failed.');
  }

  const url = new URL(request.url);
  const status = normalizeApprovalDecision(url.searchParams.get('status') || 'pending', 'pending');
  const limit = Math.max(1, Math.min(MAX_AGENT_JOB_BATCH, Number(url.searchParams.get('limit') || 25)));

  const rows = await env.DB.prepare(`
    SELECT job_id, origin, action, intent_text, payload_json, status, approval_status, requires_approval,
           attempts, max_attempts, priority, next_attempt_at, created_by, approved_by, approved_at,
           last_error, created_at, updated_at
    FROM agent_jobs
    WHERE requires_approval = 1 AND approval_status = ?
    ORDER BY priority ASC, created_at DESC
    LIMIT ?
  `).bind(status, limit).all();

  return json({
    ok: true,
    count: (rows.results || []).length,
    approvals: rows.results || []
  });
}

async function handleOperatorApprovalDecision(/** @type {any} */ request, /** @type {any} */ env, /** @type {any} */ jobId, /** @type {any} */ decision) {
  if (!hasDatabase(env)) {
    return errorResponse(503, 'd1_unavailable', 'D1 binding is required for operator approvals.');
  }

  const normalizedJobId = normalizeAgentJobId(jobId);
  if (!normalizedJobId) {
    return errorResponse(400, 'invalid_job_id', 'A valid agent job id is required.');
  }

  let /** @type {any} */
raw;
  let /** @type {any} */
data;
  try {
    ensureJsonRequest(request);
    ({ raw, data } = await readJson(request));
    await verifyAdminRequest(request, env, raw);
    await ensureAgentOpsTables(env);
  } catch (/** @type {any} */
error) {
    return errorResponse(401, 'operator_auth_failed', 'Operator authorization failed.');
  }

  const approvedBy = normalizeText(data.approvedBy || data.operator || 'operator', 120);
  const note = normalizeText(data.note || data.reason || '', 320);
  const normalizedDecision = normalizeApprovalDecision(decision, 'pending');
  if (normalizedDecision === 'pending') {
    return errorResponse(400, 'invalid_decision', 'Decision must be approve or reject.');
  }

  const nextStatus = normalizedDecision === 'approved' ? 'ready' : 'failed';
  const lastError = normalizedDecision === 'rejected' ? (note || 'Rejected by operator.') : '';

  const existing = await env.DB.prepare(`
    SELECT job_id, approval_status, status
    FROM agent_jobs
    WHERE job_id = ?
    LIMIT 1
  `).bind(normalizedJobId).first();
  if (!existing) {
    return errorResponse(404, 'job_not_found', 'Agent job not found.');
  }

  await env.DB.prepare(`
    UPDATE agent_jobs
    SET approval_status = ?, status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP,
        last_error = ?, updated_at = CURRENT_TIMESTAMP
    WHERE job_id = ?
  `).bind(normalizedDecision, nextStatus, approvedBy, lastError, normalizedJobId).run();

  await appendAgentJobEvent(env, normalizedJobId, `approval_${normalizedDecision}`, {
    approvedBy,
    note
  });

  return json({
    ok: true,
    jobId: normalizedJobId,
    decision: normalizedDecision,
    status: nextStatus
  });
}

async function handleOperatorJobsList(/** @type {any} */ request, /** @type {any} */ env) {
  if (!hasDatabase(env)) {
    return errorResponse(503, 'd1_unavailable', 'D1 binding is required for operator jobs list.');
  }
  try {
    await verifyAdminRequest(request, env, '');
    await ensureAgentOpsTables(env);
  } catch (/** @type {any} */
error) {
    return errorResponse(401, 'operator_auth_failed', 'Operator authorization failed.');
  }

  const url = new URL(request.url);
  const status = normalizeAgentStatus(url.searchParams.get('status') || 'queued', 'queued');
  const limit = Math.max(1, Math.min(MAX_AGENT_JOB_BATCH, Number(url.searchParams.get('limit') || 25)));

  const rows = await env.DB.prepare(`
    SELECT job_id, origin, action, intent_text, payload_json, status, approval_status, requires_approval,
           attempts, max_attempts, priority, next_attempt_at, created_by, approved_by, approved_at,
           last_error, created_at, updated_at
    FROM agent_jobs
    WHERE status = ?
    ORDER BY updated_at DESC
    LIMIT ?
  `).bind(status, limit).all();

  return json({
    ok: true,
    count: (rows.results || []).length,
    jobs: rows.results || []
  });
}

async function handleOperatorRetrySweep(/** @type {any} */ request, /** @type {any} */ env) {
  if (!hasDatabase(env)) {
    return errorResponse(503, 'd1_unavailable', 'D1 binding is required for retry sweep.');
  }

  let /** @type {any} */
raw;
  let /** @type {any} */
data;
  try {
    ensureJsonRequest(request);
    ({ raw, data } = await readJson(request));
    await verifyAdminRequest(request, env, raw);
    await ensureAgentOpsTables(env);
  } catch (/** @type {any} */
error) {
    return errorResponse(401, 'operator_auth_failed', 'Operator authorization failed.');
  }

  const limit = Math.max(1, Math.min(MAX_AGENT_JOB_BATCH, Number(data.limit) || 25));
  const nowIso = new Date().toISOString();

  const dueRows = await env.DB.prepare(`
    SELECT job_id, attempts, max_attempts, status
    FROM agent_jobs
    WHERE (status = 'retrying' OR status = 'failed')
      AND attempts < max_attempts
      AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
    ORDER BY priority ASC, updated_at ASC
    LIMIT ?
  `).bind(nowIso, limit).all();

  const rows = dueRows.results || [];
  if (!rows.length) {
    return json({ ok: true, swept: 0, queued: 0, deadLettered: 0 });
  }

  let queued = 0;
  let deadLettered = 0;
  const /** @type {any} */
statements = [];

  for (const /** @type {any} */
row of rows) {
    const attempts = Number(row.attempts || 0) + 1;
    const maxAttempts = Number(row.max_attempts || 1);
    const willDeadLetter = attempts >= maxAttempts;
    const status = willDeadLetter ? 'dead_letter' : 'queued';
    if (willDeadLetter) deadLettered += 1;
    else queued += 1;

    statements.push(env.DB.prepare(`
      UPDATE agent_jobs
      SET attempts = ?, status = ?, next_attempt_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE job_id = ?
    `).bind(attempts, status, row.job_id));
  }

  await env.DB.batch(statements);
  await Promise.all(rows.map((/** @type {any} */ row) => appendAgentJobEvent(env, row.job_id, 'retry_sweep', {
    previousStatus: row.status,
    queuedAt: nowIso
  })));

  return json({
    ok: true,
    swept: rows.length,
    queued,
    deadLettered
  });
}

const /** @type {any} */
SOCIAL_PLATFORMS = new Set(['youtube', 'linkedin', 'tiktok', 'instagram', 'facebook']);
const /** @type {any} */
SOCIAL_UPLOAD_PLATFORMS = new Set(['youtube', 'linkedin', 'tiktok', 'instagram', 'facebook']);
let socialTablesReady = false;
/** @type {Promise<CryptoKey> | undefined} */
let socialEncryptionKeyPromise = undefined;

/**
 * @param {any} payload
 */
function encodeState(/** @type {any} */ payload) {
  return btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/**
 * @param {any} value
 */
function decodeState(/** @type {any} */ value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return JSON.parse(atob(padded));
}

function bytesToBase64Url(/** @type {any} */ bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(/** @type {any} */ value) {
  const padded = String(value || '').replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(String(value || '').length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (/** @type {any} */ char) => char.charCodeAt(0));
}

async function ensureSocialTables(/** @type {any} */ env) {
  if (socialTablesReady) return;
  if (!hasDatabase(env)) {
    throw new Error('Database not configured for social OAuth token storage.');
  }
  await env.DB.batch([
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS social_oauth_tokens (
        uid TEXT NOT NULL,
        platform TEXT NOT NULL,
        cipher_b64 TEXT NOT NULL,
        iv_b64 TEXT NOT NULL,
        scope TEXT,
        token_type TEXT,
        expires_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (uid, platform)
      )
    `),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS social_upload_jobs (
        job_id TEXT NOT NULL PRIMARY KEY,
        uid TEXT NOT NULL,
        platform TEXT NOT NULL,
        status TEXT NOT NULL,
        request_json TEXT,
        response_json TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
  ]);
  socialTablesReady = true;
}

async function getSocialEncryptionKey(/** @type {any} */ env) {
  const secret = String(env.SOCIAL_TOKEN_ENCRYPTION_KEY || '').trim();
  if (!secret) {
    throw new Error('SOCIAL_TOKEN_ENCRYPTION_KEY is not configured.');
  }
  if (!socialEncryptionKeyPromise) {
    socialEncryptionKeyPromise = (async () => {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
      return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    })();
  }
  return socialEncryptionKeyPromise;
}

async function encryptSocialPayload(/** @type {any} */ env, /** @type {any} */ payload) {
  const key = await getSocialEncryptionKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify(payload || {}));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
  return {
    cipherB64: bytesToBase64Url(cipher),
    ivB64: bytesToBase64Url(iv)
  };
}

async function decryptSocialPayload(/** @type {any} */ env, /** @type {any} */ row) {
  if (!row?.cipher_b64 || !row?.iv_b64) return null;
  const key = await getSocialEncryptionKey(env);
  const iv = base64UrlToBytes(row.iv_b64);
  const cipher = base64UrlToBytes(row.cipher_b64);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return safeParse(new TextDecoder().decode(plain), null);
}

async function getStoredSocialToken(/** @type {any} */ env, /** @type {any} */ uid, /** @type {any} */ platform) {
  await ensureSocialTables(env);
  const row = await env.DB.prepare(`
    SELECT uid, platform, cipher_b64, iv_b64, scope, token_type, expires_at, created_at, updated_at
    FROM social_oauth_tokens
    WHERE uid = ? AND platform = ?
    LIMIT 1
  `).bind(uid, platform).first();
  if (!row) return null;
  const payload = await decryptSocialPayload(env, row).catch(() => null);
  if (!payload) return null;
  return {
    uid,
    platform,
    accessToken: String(payload.accessToken || ''),
    refreshToken: String(payload.refreshToken || ''),
    tokenType: String(row.token_type || payload.tokenType || 'Bearer'),
    scope: String(row.scope || payload.scope || ''),
    expiresAt: normalizeIsoTime(row.expires_at || payload.expiresAt, null),
    updatedAt: row.updated_at || null
  };
}

async function upsertSocialToken(/** @type {any} */ env, /** @type {any} */ uid, /** @type {any} */ platform, /** @type {any} */ tokenData) {
  await ensureSocialTables(env);
  const existing = await getStoredSocialToken(env, uid, platform).catch(() => null);
  const refreshToken = String(tokenData.refreshToken || existing?.refreshToken || '');
  const accessToken = String(tokenData.accessToken || existing?.accessToken || '');
  const tokenType = String(tokenData.tokenType || existing?.tokenType || 'Bearer');
  const scope = String(tokenData.scope || existing?.scope || '');
  const expiresAt = normalizeIsoTime(tokenData.expiresAt || existing?.expiresAt, null);
  const /** @type {any} */
payload = {
    accessToken,
    refreshToken,
    tokenType,
    scope,
    expiresAt,
    updatedAt: new Date().toISOString()
  };
  const encrypted = await encryptSocialPayload(env, payload);

  await env.DB.prepare(`
    INSERT INTO social_oauth_tokens (uid, platform, cipher_b64, iv_b64, scope, token_type, expires_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(uid, platform) DO UPDATE SET
      cipher_b64 = excluded.cipher_b64,
      iv_b64 = excluded.iv_b64,
      scope = excluded.scope,
      token_type = excluded.token_type,
      expires_at = excluded.expires_at,
      updated_at = CURRENT_TIMESTAMP
  `).bind(uid, platform, encrypted.cipherB64, encrypted.ivB64, scope, tokenType, expiresAt).run();

  return payload;
}

async function saveSocialUploadJob(/** @type {any} */ env, /** @type {any} */ job) {
  if (!hasDatabase(env)) return;
  await ensureSocialTables(env);
  await env.DB.prepare(`
    INSERT INTO social_upload_jobs (job_id, uid, platform, status, request_json, response_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(job_id) DO UPDATE SET
      status = excluded.status,
      request_json = excluded.request_json,
      response_json = excluded.response_json,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    normalizeStorageKey(job.jobId || `job-${Date.now()}`),
    normalizeUid(job.uid),
    String(job.platform || '').trim().toLowerCase(),
    normalizeStorageKey(job.status || 'created'),
    JSON.stringify(job.request || {}),
    JSON.stringify(job.response || {})
  ).run();
}

/**
 * @param {any} nextPath
 * @param {any} params
 */
function buildSocialRedirectUrl(/** @type {any} */ nextPath, /** @type {any} */ params = {}) {
  const destination = String(nextPath || '/create').trim() || '/create';
  const url = new URL(destination, 'https://eonapp.ch');
  Object.entries(params).forEach((/** @type {any} */ [key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return `${url.pathname}${url.search}${url.hash}`;
}

async function refreshYouTubeTokenIfNeeded(/** @type {any} */ env, /** @type {any} */ uid) {
  const token = await getStoredSocialToken(env, uid, 'youtube');
  if (!token) return null;
  const expiresAtTs = Date.parse(token.expiresAt || '');
  if (Number.isFinite(expiresAtTs) && expiresAtTs > Date.now() + 60_000) {
    return token;
  }
  if (!token.refreshToken) {
    return token;
  }
  if (!socialProviderReady('youtube', env)) {
    throw new Error('YouTube OAuth provider is not configured.');
  }

  const cfg = socialProviderConfig('youtube', env);
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: token.refreshToken,
      grant_type: 'refresh_token'
    }).toString()
  });
  const tokenBody = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok) {
    throw new Error(tokenBody.error_description || tokenBody.error || 'Failed to refresh YouTube token.');
  }

  const expiresAt = tokenBody.expires_in
    ? new Date(Date.now() + (Number(tokenBody.expires_in) * 1000)).toISOString()
    : token.expiresAt;

  await upsertSocialToken(env, uid, 'youtube', {
    accessToken: tokenBody.access_token,
    refreshToken: token.refreshToken,
    tokenType: tokenBody.token_type || token.tokenType,
    scope: tokenBody.scope || token.scope,
    expiresAt
  });

  return getStoredSocialToken(env, uid, 'youtube');
}

/**
 * @param {any} platform
 * @param {any} env
 */
function socialProviderConfig(/** @type {any} */ platform, /** @type {any} */ env) {
  const key = platform.toUpperCase();
  return {
    clientId: String(env[`${key}_CLIENT_ID`] || '').trim(),
    clientSecret: String(env[`${key}_CLIENT_SECRET`] || '').trim(),
    redirectUri: String(env[`${key}_REDIRECT_URI`] || '').trim()
  };
}

/**
 * @param {any} platform
 * @param {any} env
 */
function socialProviderReady(/** @type {any} */ platform, /** @type {any} */ env) {
  const cfg = socialProviderConfig(platform, env);
  return !!(cfg.clientId && cfg.clientSecret && cfg.redirectUri);
}

/**
 * @param {any} platform
 * @param {any} env
 */
function oauthScaffoldResponse(/** @type {any} */ platform, /** @type {any} */ env) {
  const cfg = socialProviderConfig(platform, env);
  return json({
    ok: false,
    platform,
    scaffold: true,
    status: 'not_configured',
    missing: {
      clientId: !cfg.clientId,
      clientSecret: !cfg.clientSecret,
      redirectUri: !cfg.redirectUri
    },
    nextSteps: [
      `Set ${platform.toUpperCase()}_CLIENT_ID in worker env`,
      `Set ${platform.toUpperCase()}_CLIENT_SECRET in worker env`,
      `Set ${platform.toUpperCase()}_REDIRECT_URI and match it in app console`
    ]
  }, 200);
}

/**
 * @param {any} request
 * @param {any} env
 * @param {any} platform
 */
async function handleSocialOauthStart(/** @type {any} */ request, /** @type {any} */ env, /** @type {any} */ platform) {
  if (!SOCIAL_PLATFORMS.has(platform)) {
    return errorResponse(404, 'platform_not_supported', 'Unsupported social platform.');
  }
  const url = new URL(request.url);
  const uid = normalizeUid(url.searchParams.get('uid'));
  if (!uid) {
    return errorResponse(400, 'invalid_uid', 'A valid uid query parameter is required.');
  }

  const next = url.searchParams.get('next') || '/create';

  if (platform !== 'youtube') {
    const scaffold = oauthScaffoldResponse(platform, env);
    const payload = await scaffold.json().catch(() => ({}));
    return json({
      ...payload,
      uid,
      routeContract: {
        start: `/api/v1/social/oauth/${platform}/start`,
        callback: `/api/v1/social/oauth/${platform}/callback`,
        status: `/api/v1/social/oauth/${platform}/status`,
        upload: `/api/v1/social/upload/${platform}`
      }
    }, { status: scaffold.status });
  }
  if (!socialProviderReady('youtube', env)) {
    return oauthScaffoldResponse('youtube', env);
  }

  const cfg = socialProviderConfig('youtube', env);
  const state = encodeState({ platform: 'youtube', uid, next, ts: Date.now() });

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', cfg.clientId);
  authUrl.searchParams.set('redirect_uri', cfg.redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly');
  authUrl.searchParams.set('state', state);

  return json({
    ok: true,
    platform: 'youtube',
    authUrl: authUrl.toString(),
    routeContract: {
      start: '/api/v1/social/oauth/youtube/start',
      callback: '/api/v1/social/oauth/youtube/callback',
      token: '/api/v1/social/oauth/youtube/token',
      status: '/api/v1/social/oauth/youtube/status',
      upload: '/api/v1/social/upload/youtube'
    }
  });
}

/**
 * @param {any} request
 * @param {any} env
 * @param {any} platform
 */
async function handleSocialOauthCallback(/** @type {any} */ request, /** @type {any} */ env, /** @type {any} */ platform) {
  if (!SOCIAL_PLATFORMS.has(platform)) {
    return errorResponse(404, 'platform_not_supported', 'Unsupported social platform.');
  }

  if (platform !== 'youtube') {
    return oauthScaffoldResponse(platform, env);
  }
  if (!socialProviderReady('youtube', env)) {
    return oauthScaffoldResponse('youtube', env);
  }

  const cfg = socialProviderConfig('youtube', env);
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const stateRaw = url.searchParams.get('state') || '';
  const oauthError = url.searchParams.get('error');

  let state = null;
  try { state = stateRaw ? decodeState(stateRaw) : null; } catch { state = null; }
  const uid = normalizeUid(state?.uid);
  const next = buildSocialRedirectUrl(state?.next || '/create', {
    platform: 'youtube',
    uid
  });

  if (oauthError) {
    return new Response(null, {
      status: 302,
      headers: { location: buildSocialRedirectUrl(next, { social_oauth: 'failed', reason: oauthError }) }
    });
  }
  if (!code || !uid) {
    return new Response(null, {
      status: 302,
      headers: { location: buildSocialRedirectUrl(next, { social_oauth: 'failed', reason: 'missing_code_or_uid' }) }
    });
  }

  await ensureSocialTables(env);

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: cfg.redirectUri,
      grant_type: 'authorization_code'
    }).toString()
  });
  const tokenBody = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok) {
    return new Response(null, {
      status: 302,
      headers: { location: buildSocialRedirectUrl(next, { social_oauth: 'failed', reason: tokenBody.error || 'token_exchange_failed' }) }
    });
  }

  const expiresAt = tokenBody.expires_in
    ? new Date(Date.now() + Number(tokenBody.expires_in) * 1000).toISOString()
    : null;

  await upsertSocialToken(env, uid, 'youtube', {
    accessToken: tokenBody.access_token,
    refreshToken: tokenBody.refresh_token,
    tokenType: tokenBody.token_type || 'Bearer',
    scope: tokenBody.scope || '',
    expiresAt
  });

  return new Response(null, {
    status: 302,
    headers: {
      location: buildSocialRedirectUrl(next, { social_oauth: 'success' })
    }
  });
}

/**
 * @param {any} request
 * @param {any} env
 * @param {any} platform
 */
async function handleSocialOauthStatus(/** @type {any} */ request, /** @type {any} */ env, /** @type {any} */ platform) {
  if (!SOCIAL_PLATFORMS.has(platform)) {
    return errorResponse(404, 'platform_not_supported', 'Unsupported social platform.');
  }
  const uid = normalizeUid(new URL(request.url).searchParams.get('uid'));
  if (!uid) {
    return errorResponse(400, 'invalid_uid', 'A valid uid query parameter is required.');
  }
  const token = await getStoredSocialToken(env, uid, platform).catch(() => null);
  return json({
    ok: true,
    platform,
    uid,
    connected: !!token,
    expiresAt: token?.expiresAt || null,
    scope: token?.scope || null,
    tokenType: token?.tokenType || null,
    updatedAt: token?.updatedAt || null
  });
}

/**
 * @param {any} request
 * @param {any} env
 * @param {any} platform
 */
async function handleSocialOauthToken(/** @type {any} */ request, /** @type {any} */ env, /** @type {any} */ platform) {
  if (!SOCIAL_PLATFORMS.has(platform)) {
    return errorResponse(404, 'platform_not_supported', 'Unsupported social platform.');
  }
  if (platform !== 'youtube') {
    return oauthScaffoldResponse(platform, env);
  }
  if (!socialProviderReady('youtube', env)) {
    return oauthScaffoldResponse('youtube', env);
  }

  let /** @type {any} */
body;
  try {
    ensureJsonRequest(request);
    ({ data: body } = await readJson(request));
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_json', error.message || 'Invalid request body');
  }

  const uid = normalizeUid(body.uid);
  const refreshToken = String(body.refreshToken || '').trim();
  if (!uid && !refreshToken) {
    return errorResponse(400, 'invalid_request', 'Either uid or refreshToken is required.');
  }

  const stored = uid ? await getStoredSocialToken(env, uid, 'youtube').catch(() => null) : null;
  const chosenRefresh = refreshToken || stored?.refreshToken || '';
  if (!chosenRefresh) {
    return errorResponse(400, 'missing_refresh_token', 'refreshToken is required.');
  }

  const cfg = socialProviderConfig('youtube', env);
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: chosenRefresh,
      grant_type: 'refresh_token'
    }).toString()
  });
  const tokenBody = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok) {
    return errorResponse(400, 'oauth_refresh_failed', tokenBody.error_description || tokenBody.error || 'Refresh token exchange failed.');
  }

  const expiresAt = tokenBody.expires_in
    ? new Date(Date.now() + Number(tokenBody.expires_in) * 1000).toISOString()
    : null;

  if (uid) {
    await upsertSocialToken(env, uid, 'youtube', {
      accessToken: tokenBody.access_token,
      refreshToken: chosenRefresh,
      tokenType: tokenBody.token_type || 'Bearer',
      scope: tokenBody.scope || stored?.scope || '',
      expiresAt
    });
  }

  return json({
    ok: true,
    platform: 'youtube',
    accessToken: tokenBody.access_token || null,
    expiresIn: tokenBody.expires_in || null,
    tokenType: tokenBody.token_type || 'Bearer',
    persisted: !!uid
  });
}

async function handleYouTubeUpload(
  /** @type {Request} */ request,
  /** @type {any} */ env,
  /** @type {string} */ uid,
  /** @type {any} */ payload
) {
  const title = parseBoundedString(payload.title || 'EONAPP Upload', 'title', 100, false) || 'EONAPP Upload';
  const description = parseBoundedString(payload.description || '', 'description', 5000, false);
  const privacyStatus = ['private', 'public', 'unlisted'].includes(String(payload.privacyStatus || '').toLowerCase())
    ? String(payload.privacyStatus).toLowerCase()
    : 'private';
  const mediaUrl = parseBoundedString(payload.mediaUrl || '', 'mediaUrl', 1200, false);
  const tags = Array.isArray(payload.tags)
    ? payload.tags.map((/** @type {any} */ tag) => String(tag || '').trim().slice(0, 60)).filter(Boolean).slice(0, 25)
    : [];

  const token = await refreshYouTubeTokenIfNeeded(env, uid);
  if (!token?.accessToken) {
    return errorResponse(401, 'oauth_not_connected', 'YouTube OAuth not connected for this uid.');
  }

  if (!mediaUrl) {
    const jobId = `yt-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    await saveSocialUploadJob(env, {
      jobId,
      uid,
      platform: 'youtube',
      status: 'awaiting_media',
      request: { title, description, privacyStatus, tags },
      response: { note: 'Provide mediaUrl to start upload.' }
    });
    return json({
      ok: true,
      platform: 'youtube',
      jobId,
      status: 'awaiting_media',
      note: 'OAuth is connected. Include mediaUrl in request body to perform direct upload.'
    });
  }

  const mediaRes = await fetch(mediaUrl);
  if (!mediaRes.ok) {
    return errorResponse(400, 'invalid_media_url', `Failed to fetch mediaUrl. HTTP ${mediaRes.status}`);
  }
  const mediaBuffer = await mediaRes.arrayBuffer();
  const mediaBytes = new Uint8Array(mediaBuffer);
  const mediaType = String(mediaRes.headers.get('content-type') || 'application/octet-stream').split(';')[0].trim();

  const initRes = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=resumable', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token.accessToken}`,
      'content-type': 'application/json; charset=utf-8',
      'x-upload-content-type': mediaType,
      'x-upload-content-length': String(mediaBytes.byteLength)
    },
    body: JSON.stringify({
      snippet: { title, description, tags },
      status: { privacyStatus }
    })
  });

  const uploadUrl = initRes.headers.get('location') || '';
  if (!initRes.ok || !uploadUrl) {
    const failText = await initRes.text().catch(() => '');
    return errorResponse(400, 'youtube_resumable_init_failed', failText.slice(0, 280) || `Init failed with HTTP ${initRes.status}`);
  }

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'content-type': mediaType
    },
    body: mediaBytes
  });
  const uploadBody = await uploadRes.json().catch(() => ({}));
  if (!uploadRes.ok) {
    return errorResponse(400, 'youtube_upload_failed', normalizeText(uploadBody?.error?.message || `Upload failed with HTTP ${uploadRes.status}`, 280));
  }

  const jobId = `yt-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  await saveSocialUploadJob(env, {
    jobId,
    uid,
    platform: 'youtube',
    status: 'uploaded',
    request: { title, description, privacyStatus, tags, mediaUrl },
    response: uploadBody
  });

  return json({
    ok: true,
    platform: 'youtube',
    jobId,
    status: 'uploaded',
    videoId: uploadBody?.id || null,
    response: uploadBody
  });
}

/**
 * @param {any} request
 * @param {any} env
 * @param {any} platform
 */
async function handleSocialUpload(/** @type {any} */ request, /** @type {any} */ env, /** @type {any} */ platform) {
  if (!SOCIAL_UPLOAD_PLATFORMS.has(platform)) {
    return errorResponse(404, 'platform_not_supported', 'Unsupported social upload platform.');
  }
  let /** @type {any} */
body;
  try {
    ensureJsonRequest(request);
    ({ data: body } = await readJson(request));
  } catch (/** @type {any} */
error) {
    return errorResponse(error.status || 400, error.code || 'invalid_json', error.message || 'Invalid request body');
  }

  const uid = normalizeUid(body.uid);
  if (!uid) {
    return errorResponse(400, 'invalid_uid', 'uid is required for social uploads.');
  }

  if (platform === 'youtube') {
    return handleYouTubeUpload(request, env, uid, body);
  }

  const token = await getStoredSocialToken(env, uid, platform).catch(() => null);
  if (!token) {
    return errorResponse(401, 'oauth_not_connected', `${platform} OAuth not connected for this uid.`);
  }

  const jobId = `${platform}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  await saveSocialUploadJob(env, {
    jobId,
    uid,
    platform,
    status: 'scaffold_ready',
    request: body,
    response: {
      note: `${platform} upload endpoint contract is active. Direct media publish logic is scaffolded and can be added without changing route shape.`
    }
  });

  return json({
    ok: true,
    platform,
    uid,
    jobId,
    status: 'scaffold_ready',
    note: `${platform} upload scaffold ready with OAuth + encrypted token retrieval. Implement provider-specific media publish next.`
  });
}

export default {
  async fetch(/** @type {any} */ request, /** @type {any} */ env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    let /** @type {any} */
response;

    try {
      if (request.method === 'OPTIONS' && path.startsWith('/api/')) {
        const rateLimit = await enforceRateLimit(request, env, 'api-options', 60, 60);
        if (!rateLimit.allowed) {
          response = errorResponse(429, 'rate_limit_exceeded', 'Too many requests. Please retry shortly.');
          return finalizeResponse(response, request, env);
        }
        return finalizeResponse(new Response(null, { status: 204 }), request, env);
      }

      if (request.method === 'GET' && path === '/api/health') {
        const rateLimit = await enforceRateLimit(request, env, 'health-read', 60, 60);
        if (!rateLimit.allowed) {
          response = errorResponse(429, 'rate_limit_exceeded', 'Too many requests. Please retry shortly.');
          return finalizeResponse(response, request, env);
        }
        response = await handleHealth(env);
        return finalizeResponse(response, request, env);
      }

      if (request.method === 'GET' && path.startsWith('/api/v1/vault/')) {
        const rateLimit = await enforceRateLimit(request, env, 'vault-read', 30, 60);
        if (!rateLimit.allowed) {
          response = errorResponse(429, 'rate_limit_exceeded', 'Too many requests. Please retry shortly.');
          return finalizeResponse(response, request, env);
        }
        const uid = normalizeUid(path.slice('/api/v1/vault/'.length));
        if (!uid) {
          response = errorResponse(400, 'invalid_uid', 'Vault uid is required.');
          return finalizeResponse(response, request, env);
        }
        response = await handleVaultSummary(request, env, uid);
        return finalizeResponse(response, request, env);
      }

      if (request.method === 'POST' && path === '/api/v1/admin/publish-epoch') {
        const rateLimit = await enforceRateLimit(request, env, 'admin-publish-epoch', 10, 60);
        if (!rateLimit.allowed) {
          response = errorResponse(429, 'rate_limit_exceeded', 'Too many admin requests. Please retry shortly.');
          return finalizeResponse(response, request, env);
        }
        response = await handlePublishEpoch(request, env);
        return finalizeResponse(response, request, env);
      }

      if (request.method === 'POST' && path === '/api/v1/admin/close-epoch') {
        const rateLimit = await enforceRateLimit(request, env, 'admin-close-epoch', 10, 60);
        if (!rateLimit.allowed) {
          response = errorResponse(429, 'rate_limit_exceeded', 'Too many admin requests. Please retry shortly.');
          return finalizeResponse(response, request, env);
        }
        response = await handleCloseEpoch(request, env);
        return finalizeResponse(response, request, env);
      }

      if (request.method === 'POST' && path === '/api/v1/admin/sync-entitlement') {
        const rateLimit = await enforceRateLimit(request, env, 'admin-sync-entitlement', 12, 60);
        if (!rateLimit.allowed) {
          response = errorResponse(429, 'rate_limit_exceeded', 'Too many admin requests. Please retry shortly.');
          return finalizeResponse(response, request, env);
        }
        response = await handleSyncEntitlement(request, env);
        return finalizeResponse(response, request, env);
      }

      if (request.method === 'POST' && path === '/api/v1/agent/commands/ingest') {
        const rateLimit = await enforceRateLimit(request, env, 'agent-command-ingest', 30, 60);
        if (!rateLimit.allowed) {
          response = errorResponse(429, 'rate_limit_exceeded', 'Too many command ingests. Please retry shortly.');
          return finalizeResponse(response, request, env);
        }
        response = await handleRemoteCommandIngest(request, env);
        return finalizeResponse(response, request, env);
      }

      if (request.method === 'GET' && path === '/api/v1/operator/approvals') {
        const rateLimit = await enforceRateLimit(request, env, 'operator-approvals-list', 30, 60);
        if (!rateLimit.allowed) {
          response = errorResponse(429, 'rate_limit_exceeded', 'Too many operator requests. Please retry shortly.');
          return finalizeResponse(response, request, env);
        }
        response = await handleOperatorApprovalsList(request, env);
        return finalizeResponse(response, request, env);
      }

      if (request.method === 'GET' && path === '/api/v1/operator/jobs') {
        const rateLimit = await enforceRateLimit(request, env, 'operator-jobs-list', 30, 60);
        if (!rateLimit.allowed) {
          response = errorResponse(429, 'rate_limit_exceeded', 'Too many operator requests. Please retry shortly.');
          return finalizeResponse(response, request, env);
        }
        response = await handleOperatorJobsList(request, env);
        return finalizeResponse(response, request, env);
      }

      if (request.method === 'POST' && path === '/api/v1/operator/jobs/retry-sweep') {
        const rateLimit = await enforceRateLimit(request, env, 'operator-retry-sweep', 20, 60);
        if (!rateLimit.allowed) {
          response = errorResponse(429, 'rate_limit_exceeded', 'Too many retry sweep requests. Please retry shortly.');
          return finalizeResponse(response, request, env);
        }
        response = await handleOperatorRetrySweep(request, env);
        return finalizeResponse(response, request, env);
      }

      if (request.method === 'POST' && path.startsWith('/api/v1/operator/approvals/')) {
        const rateLimit = await enforceRateLimit(request, env, 'operator-approval-decision', 25, 60);
        if (!rateLimit.allowed) {
          response = errorResponse(429, 'rate_limit_exceeded', 'Too many approval decisions. Please retry shortly.');
          return finalizeResponse(response, request, env);
        }
        const match = path.match(/^\/api\/v1\/operator\/approvals\/([^/]+)\/(approve|reject)$/i);
        if (!match) {
          response = errorResponse(404, 'approval_route_not_found', 'Approval route not found.');
          return finalizeResponse(response, request, env);
        }
        response = await handleOperatorApprovalDecision(request, env, match[1], match[2] === 'approve' ? 'approved' : 'rejected');
        return finalizeResponse(response, request, env);
      }

      if (request.method === 'POST' && path === '/api/v1/swap/offers/publish') {
        const rateLimit = await enforceRateLimit(request, env, 'swap-publish', 20, 60);
        if (!rateLimit.allowed) {
          response = errorResponse(429, 'rate_limit_exceeded', 'Too many requests. Please retry shortly.');
          return finalizeResponse(response, request, env);
        }
        response = await handleSwapPublish(request, env);
        return finalizeResponse(response, request, env);
      }

      if (request.method === 'POST' && path === '/api/v1/swap/offers/verify') {
        const rateLimit = await enforceRateLimit(request, env, 'swap-verify', 30, 60);
        if (!rateLimit.allowed) {
          response = errorResponse(429, 'rate_limit_exceeded', 'Too many requests. Please retry shortly.');
          return finalizeResponse(response, request, env);
        }
        response = await handleSwapVerify(request, env);
        return finalizeResponse(response, request, env);
      }

      if (request.method === 'POST' && path === '/api/v1/swap/offers/reconcile') {
        const rateLimit = await enforceRateLimit(request, env, 'swap-reconcile', 20, 60);
        if (!rateLimit.allowed) {
          response = errorResponse(429, 'rate_limit_exceeded', 'Too many requests. Please retry shortly.');
          return finalizeResponse(response, request, env);
        }
        response = await handleSwapReconcile(request, env);
        return finalizeResponse(response, request, env);
      }

      if (request.method === 'POST' && path === '/api/v1/swap/receipts/redeem') {
        const rateLimit = await enforceRateLimit(request, env, 'swap-redeem', 20, 60);
        if (!rateLimit.allowed) {
          response = errorResponse(429, 'rate_limit_exceeded', 'Too many requests. Please retry shortly.');
          return finalizeResponse(response, request, env);
        }
        response = await handleSwapRedeem(request, env);
        return finalizeResponse(response, request, env);
      }

      if (path.startsWith('/api/v1/social/oauth/')) {
        const parts = path.split('/').filter(Boolean);
        const platform = parts[4] || '';
        const action = parts[5] || '';

        const rateLimit = await enforceRateLimit(request, env, `social-oauth-${platform || 'unknown'}`, 30, 60);
        if (!rateLimit.allowed) {
          response = errorResponse(429, 'rate_limit_exceeded', 'Too many social auth requests. Please retry shortly.');
          return finalizeResponse(response, request, env);
        }

        if (request.method === 'GET' && action === 'start') {
          response = await handleSocialOauthStart(request, env, platform);
          return finalizeResponse(response, request, env);
        }
        if (request.method === 'GET' && action === 'callback') {
          response = await handleSocialOauthCallback(request, env, platform);
          return finalizeResponse(response, request, env);
        }
        if (request.method === 'GET' && action === 'status') {
          response = await handleSocialOauthStatus(request, env, platform);
          return finalizeResponse(response, request, env);
        }
        if (request.method === 'POST' && action === 'token') {
          response = await handleSocialOauthToken(request, env, platform);
          return finalizeResponse(response, request, env);
        }

        response = errorResponse(404, 'social_oauth_route_not_found', 'Social OAuth route not found.');
        return finalizeResponse(response, request, env);
      }

      if (path.startsWith('/api/v1/social/upload/')) {
        const parts = path.split('/').filter(Boolean);
        const platform = parts[4] || '';

        const rateLimit = await enforceRateLimit(request, env, `social-upload-${platform || 'unknown'}`, 20, 60);
        if (!rateLimit.allowed) {
          response = errorResponse(429, 'rate_limit_exceeded', 'Too many social upload requests. Please retry shortly.');
          return finalizeResponse(response, request, env);
        }

        if (request.method === 'POST') {
          response = await handleSocialUpload(request, env, platform);
          return finalizeResponse(response, request, env);
        }

        response = errorResponse(404, 'social_upload_route_not_found', 'Social upload route not found.');
        return finalizeResponse(response, request, env);
      }

      if (request.method === 'POST' && path === '/api/v1/rewards/qualify-referral') {
        const rateLimit = await enforceRateLimit(request, env, 'rewards-qualify-referral', 25, 60);
        if (!rateLimit.allowed) {
          response = errorResponse(429, 'rate_limit_exceeded', 'Too many qualification requests. Please retry shortly.');
          return finalizeResponse(response, request, env);
        }
        response = await handleReferralQualification(request, env);
        return finalizeResponse(response, request, env);
      }

      if (request.method === 'POST' && path === '/api/v1/rewards/evaluate-claim-risk') {
        const rateLimit = await enforceRateLimit(request, env, 'rewards-claim-risk', 25, 60);
        if (!rateLimit.allowed) {
          response = errorResponse(429, 'rate_limit_exceeded', 'Too many claim risk checks. Please retry shortly.');
          return finalizeResponse(response, request, env);
        }
        response = await handleRewardClaimRiskEval(request, env);
        return finalizeResponse(response, request, env);
      }

      response = errorResponse(404, 'not_found', 'Route not found.');
      return finalizeResponse(response, request, env);
    } catch (/** @type {any} */
error) {
      logInternalError('worker_fetch', error);
      if (isD1Error(error)) {
        response = serviceUnavailableResponse();
      } else {
        response = errorResponse(500, 'internal_error', 'Internal server error.');
      }
      return finalizeResponse(response, request, env);
    }
  }
};

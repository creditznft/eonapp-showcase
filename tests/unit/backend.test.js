'use strict';
// Unit tests for pure helper functions extracted from platform-backend/src/index.js
// Runner: node --test   (Node.js built-in test runner, no external dependencies)

const test = require('node:test');
const assert = require('node:assert/strict');

// ── Constants (mirrored from index.js) ───────────────────────────────────────

const SAFE_UID_RE = /^(g_[0-9a-f]{48}|eon_[0-9a-f]{12}|[a-z0-9][a-z0-9_-]{3,79})$/i;
const DECIMAL_AMOUNT_RE = /^\d+(?:\.\d+)?$/;
const HEX_ROOT_RE = /^0x[a-f0-9]{64}$/i;
const WALLET_RE = /^0x[a-f0-9]{40}$/i;
const CLIENT_NONCE_RE = /^[a-z0-9_-]{16,120}$/i;
const MAX_ENTITLEMENT_CENTS = 1_000_000_000;

// ── Inline implementations extracted from platform-backend/src/index.js ──────

function normalizeUid(value = '') {
  const normalized = String(value || '').trim().toLowerCase().slice(0, 80);
  return SAFE_UID_RE.test(normalized) ? normalized : '';
}

function normalizeText(value = '', maxLength = 160) {
  return String(value || '').trim().slice(0, maxLength);
}

function parseBoundedString(value, fieldName, maxLength, required = false) {
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

function parseDecimalAmount(value, fieldName, options = {}) {
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

function normalizeAmountString(value, fallback = '0') {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const normalized = String(value).trim().slice(0, 80);
  return DECIMAL_AMOUNT_RE.test(normalized) ? normalized : fallback;
}

function normalizeMerkleRoot(value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  return HEX_ROOT_RE.test(normalized) ? normalized : '';
}

function normalizeWalletAddress(value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  return WALLET_RE.test(normalized) ? normalized : '';
}

function normalizeNonce(value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  return CLIENT_NONCE_RE.test(normalized) ? normalized : '';
}

function normalizeLifecycleStatus(value = '', fallback = 'published') {
  const normalized = String(value || '').trim().toLowerCase();
  return ['published', 'expired', 'swept', 'invalidated'].includes(normalized) ? normalized : fallback;
}

function isExpiredIso(isoTime) {
  const parsed = Date.parse(isoTime || '');
  return Number.isFinite(parsed) ? parsed <= Date.now() : true;
}

function normalizeInteger(value, min = 0, max = MAX_ENTITLEMENT_CENTS) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, Math.floor(number)));
}

function buildCorsHeaders(request, env) {
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
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (!allowedOrigins.length) {
    return {};
  }
  const allowAll = allowedOrigins.includes('*');
  const allowedOrigin = allowAll
    ? '*'
    : allowedOrigins.includes(origin)
      ? origin
      : '';
  if (!allowedOrigin) {
    return {};
  }
  return {
    'access-control-allow-origin': allowedOrigin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type, x-eon-signature, x-eon-ts, x-eon-nonce',
    'access-control-max-age': '86400',
    vary: allowAll
      ? 'Access-Control-Request-Headers, Access-Control-Request-Method'
      : 'Origin, Access-Control-Request-Headers, Access-Control-Request-Method'
  };
}

// ── Test helpers ──────────────────────────────────────────────────────────────

function makeRequest(url, headerMap = {}) {
  return {
    url,
    headers: {
      get(name) { return Object.prototype.hasOwnProperty.call(headerMap, name.toLowerCase()) ? headerMap[name.toLowerCase()] : null; }
    }
  };
}

// ── normalizeUid ──────────────────────────────────────────────────────────────

test('normalizeUid: valid g_ prefix (48 hex chars) returns lowercase uid', () => {
  const uid = 'g_' + 'a'.repeat(48);
  assert.equal(normalizeUid(uid), uid);
});

test('normalizeUid: valid eon_ prefix (12 hex chars) returns lowercase uid', () => {
  const uid = 'eon_' + 'b'.repeat(12);
  assert.equal(normalizeUid(uid), uid);
});

test('normalizeUid: valid generic uid (alphanumeric, 4-80 chars) is accepted', () => {
  assert.equal(normalizeUid('user1234'), 'user1234');
});

test('normalizeUid: valid uid with hyphens and underscores is accepted', () => {
  assert.equal(normalizeUid('user-name_ok'), 'user-name_ok');
});

test('normalizeUid: too-short generic uid (3 chars) returns empty string', () => {
  assert.equal(normalizeUid('abc'), '');
});

test('normalizeUid: uid with invalid characters returns empty string', () => {
  assert.equal(normalizeUid('user@domain.com'), '');
});

test('normalizeUid: empty string returns empty string', () => {
  assert.equal(normalizeUid(''), '');
});

test('normalizeUid: null returns empty string', () => {
  assert.equal(normalizeUid(null), '');
});

test('normalizeUid: undefined returns empty string', () => {
  assert.equal(normalizeUid(undefined), '');
});

test('normalizeUid: uppercase input is lowercased', () => {
  assert.equal(normalizeUid('USER1234'), 'user1234');
});

test('normalizeUid: leading/trailing whitespace is trimmed before validation', () => {
  assert.equal(normalizeUid('  user1234  '), 'user1234');
});

// ── normalizeText ─────────────────────────────────────────────────────────────

test('normalizeText: trims leading and trailing whitespace', () => {
  assert.equal(normalizeText('  hello world  '), 'hello world');
});

test('normalizeText: respects custom maxLength', () => {
  assert.equal(normalizeText('abcde', 3), 'abc');
});

test('normalizeText: default maxLength is 160', () => {
  const long = 'x'.repeat(200);
  assert.equal(normalizeText(long).length, 160);
});

test('normalizeText: null returns empty string', () => {
  assert.equal(normalizeText(null), '');
});

test('normalizeText: empty string returns empty string', () => {
  assert.equal(normalizeText(''), '');
});

// ── parseBoundedString ────────────────────────────────────────────────────────

test('parseBoundedString: returns trimmed string within bounds', () => {
  assert.equal(parseBoundedString('  hello  ', 'field', 20), 'hello');
});

test('parseBoundedString: optional empty string returns empty string', () => {
  assert.equal(parseBoundedString('', 'field', 10, false), '');
});

test('parseBoundedString: required empty value throws with code invalid_string', () => {
  const err = assert.throws(() => parseBoundedString('', 'myField', 10, true));
  const thrown = (() => { try { parseBoundedString('', 'myField', 10, true); } catch (e) { return e; } })();
  assert.equal(thrown.code, 'invalid_string');
  assert.equal(thrown.status, 400);
});

test('parseBoundedString: value exceeding maxLength throws with code invalid_string_length', () => {
  const thrown = (() => { try { parseBoundedString('abcdef', 'myField', 3, false); } catch (e) { return e; } })();
  assert.equal(thrown.code, 'invalid_string_length');
  assert.equal(thrown.status, 400);
});

test('parseBoundedString: null treated as empty, not required → returns empty string', () => {
  assert.equal(parseBoundedString(null, 'field', 10, false), '');
});

// ── parseDecimalAmount ────────────────────────────────────────────────────────

test('parseDecimalAmount: valid integer string returns normalized and number', () => {
  const result = parseDecimalAmount('42', 'amount');
  assert.equal(result.normalized, '42');
  assert.equal(result.number, 42);
});

test('parseDecimalAmount: valid decimal string returns correct float', () => {
  const result = parseDecimalAmount('3.14', 'price');
  assert.equal(result.normalized, '3.14');
  assert.equal(result.number, 3.14);
});

test('parseDecimalAmount: null with not-required returns fallback', () => {
  const result = parseDecimalAmount(null, 'amount', { fallback: '5' });
  assert.equal(result.normalized, '5');
  assert.equal(result.number, 5);
});

test('parseDecimalAmount: empty string with not-required returns default fallback 0', () => {
  const result = parseDecimalAmount('', 'amount');
  assert.equal(result.normalized, '0');
  assert.equal(result.number, 0);
});

test('parseDecimalAmount: null with required throws with code invalid_number', () => {
  const thrown = (() => { try { parseDecimalAmount(null, 'amount', { required: true }); } catch (e) { return e; } })();
  assert.equal(thrown.code, 'invalid_number');
  assert.equal(thrown.status, 400);
});

test('parseDecimalAmount: non-numeric string throws with code invalid_number', () => {
  const thrown = (() => { try { parseDecimalAmount('abc', 'amount'); } catch (e) { return e; } })();
  assert.equal(thrown.code, 'invalid_number');
});

test('parseDecimalAmount: value below min throws with code invalid_number', () => {
  const thrown = (() => { try { parseDecimalAmount('5', 'amount', { min: 10 }); } catch (e) { return e; } })();
  assert.equal(thrown.code, 'invalid_number');
});

test('parseDecimalAmount: value above max throws with code invalid_number', () => {
  const thrown = (() => { try { parseDecimalAmount('999', 'amount', { max: 100 }); } catch (e) { return e; } })();
  assert.equal(thrown.code, 'invalid_number');
});

// ── normalizeWalletAddress ────────────────────────────────────────────────────

test('normalizeWalletAddress: valid 0x + 40 hex chars returns lowercase address', () => {
  const addr = '0x' + 'a'.repeat(40);
  assert.equal(normalizeWalletAddress(addr), addr);
});

test('normalizeWalletAddress: uppercase address is lowercased', () => {
  const upper = '0x' + 'A'.repeat(40);
  const lower = '0x' + 'a'.repeat(40);
  assert.equal(normalizeWalletAddress(upper), lower);
});

test('normalizeWalletAddress: address without 0x prefix returns empty string', () => {
  assert.equal(normalizeWalletAddress('a'.repeat(40)), '');
});

test('normalizeWalletAddress: too-short address returns empty string', () => {
  assert.equal(normalizeWalletAddress('0x' + 'a'.repeat(39)), '');
});

test('normalizeWalletAddress: non-hex chars in address returns empty string', () => {
  assert.equal(normalizeWalletAddress('0x' + 'g'.repeat(40)), '');
});

test('normalizeWalletAddress: empty string returns empty string', () => {
  assert.equal(normalizeWalletAddress(''), '');
});

// ── normalizeMerkleRoot ───────────────────────────────────────────────────────

test('normalizeMerkleRoot: valid 0x + 64 hex chars returns lowercase hash', () => {
  const root = '0x' + 'f'.repeat(64);
  assert.equal(normalizeMerkleRoot(root), root);
});

test('normalizeMerkleRoot: uppercase hex is lowercased', () => {
  const root = '0x' + 'A'.repeat(64);
  assert.equal(normalizeMerkleRoot(root), '0x' + 'a'.repeat(64));
});

test('normalizeMerkleRoot: wrong length (63 hex chars) returns empty string', () => {
  assert.equal(normalizeMerkleRoot('0x' + 'a'.repeat(63)), '');
});

test('normalizeMerkleRoot: missing 0x prefix returns empty string', () => {
  assert.equal(normalizeMerkleRoot('a'.repeat(64)), '');
});

test('normalizeMerkleRoot: empty string returns empty string', () => {
  assert.equal(normalizeMerkleRoot(''), '');
});

// ── normalizeNonce ────────────────────────────────────────────────────────────

test('normalizeNonce: valid 16-char alphanumeric nonce is accepted', () => {
  const nonce = 'abcdef1234567890';
  assert.equal(normalizeNonce(nonce), nonce);
});

test('normalizeNonce: nonce with hyphens and underscores is accepted', () => {
  const nonce = 'abc-def_123-4567';
  assert.equal(normalizeNonce(nonce), nonce);
});

test('normalizeNonce: uppercase nonce is lowercased', () => {
  const upper = 'ABCDEF1234567890';
  assert.equal(normalizeNonce(upper), 'abcdef1234567890');
});

test('normalizeNonce: too-short nonce (15 chars) returns empty string', () => {
  assert.equal(normalizeNonce('a'.repeat(15)), '');
});

test('normalizeNonce: too-long nonce (121 chars) returns empty string', () => {
  assert.equal(normalizeNonce('a'.repeat(121)), '');
});

test('normalizeNonce: nonce with invalid characters returns empty string', () => {
  assert.equal(normalizeNonce('nonce@with!special'), '');
});

test('normalizeNonce: empty string returns empty string', () => {
  assert.equal(normalizeNonce(''), '');
});

// ── normalizeLifecycleStatus ──────────────────────────────────────────────────

test('normalizeLifecycleStatus: "published" is returned as-is', () => {
  assert.equal(normalizeLifecycleStatus('published'), 'published');
});

test('normalizeLifecycleStatus: "expired" is returned as-is', () => {
  assert.equal(normalizeLifecycleStatus('expired'), 'expired');
});

test('normalizeLifecycleStatus: "swept" is returned as-is', () => {
  assert.equal(normalizeLifecycleStatus('swept'), 'swept');
});

test('normalizeLifecycleStatus: "invalidated" is returned as-is', () => {
  assert.equal(normalizeLifecycleStatus('invalidated'), 'invalidated');
});

test('normalizeLifecycleStatus: uppercase "PUBLISHED" is lowercased and accepted', () => {
  assert.equal(normalizeLifecycleStatus('PUBLISHED'), 'published');
});

test('normalizeLifecycleStatus: unknown value returns default fallback "published"', () => {
  assert.equal(normalizeLifecycleStatus('pending'), 'published');
});

test('normalizeLifecycleStatus: empty string returns default fallback "published"', () => {
  assert.equal(normalizeLifecycleStatus(''), 'published');
});

test('normalizeLifecycleStatus: custom fallback is used for invalid value', () => {
  assert.equal(normalizeLifecycleStatus('bad', 'expired'), 'expired');
});

// ── isExpiredIso ──────────────────────────────────────────────────────────────

test('isExpiredIso: a date well in the past returns true', () => {
  assert.equal(isExpiredIso('2000-01-01T00:00:00.000Z'), true);
});

test('isExpiredIso: a date well in the future returns false', () => {
  assert.equal(isExpiredIso('2099-12-31T23:59:59.000Z'), false);
});

test('isExpiredIso: invalid date string returns true', () => {
  assert.equal(isExpiredIso('not-a-date'), true);
});

test('isExpiredIso: empty string returns true', () => {
  assert.equal(isExpiredIso(''), true);
});

test('isExpiredIso: null returns true', () => {
  assert.equal(isExpiredIso(null), true);
});

// ── normalizeInteger ──────────────────────────────────────────────────────────

test('normalizeInteger: normal integer is returned as-is', () => {
  assert.equal(normalizeInteger(42, 0, 1000), 42);
});

test('normalizeInteger: float is floored', () => {
  assert.equal(normalizeInteger(9.9, 0, 100), 9);
});

test('normalizeInteger: value below min returns min', () => {
  assert.equal(normalizeInteger(-5, 0, 100), 0);
});

test('normalizeInteger: value above max returns max', () => {
  assert.equal(normalizeInteger(200, 0, 100), 100);
});

test('normalizeInteger: NaN returns min', () => {
  assert.equal(normalizeInteger(NaN, 0, 100), 0);
});

test('normalizeInteger: string "50" is converted to number', () => {
  assert.equal(normalizeInteger('50', 0, 100), 50);
});

test('normalizeInteger: Infinity returns min', () => {
  assert.equal(normalizeInteger(Infinity, 0, 100), 0);
});

// ── buildCorsHeaders ──────────────────────────────────────────────────────────

test('buildCorsHeaders: admin path always returns empty object', () => {
  const req = makeRequest('https://api.example.com/api/v1/admin/users', { origin: 'https://app.example.com' });
  const result = buildCorsHeaders(req, { CORS_ALLOWED_ORIGINS: 'https://app.example.com' });
  assert.deepEqual(result, {});
});

test('buildCorsHeaders: missing origin header returns empty object', () => {
  const req = makeRequest('https://api.example.com/api/v1/claims');
  const result = buildCorsHeaders(req, { CORS_ALLOWED_ORIGINS: 'https://app.example.com' });
  assert.deepEqual(result, {});
});

test('buildCorsHeaders: no CORS_ALLOWED_ORIGINS configured returns empty object', () => {
  const req = makeRequest('https://api.example.com/api/v1/claims', { origin: 'https://app.example.com' });
  const result = buildCorsHeaders(req, {});
  assert.deepEqual(result, {});
});

test('buildCorsHeaders: matching origin returns full CORS headers', () => {
  const req = makeRequest('https://api.example.com/api/v1/claims', { origin: 'https://app.example.com' });
  const result = buildCorsHeaders(req, { CORS_ALLOWED_ORIGINS: 'https://app.example.com' });
  assert.equal(result['access-control-allow-origin'], 'https://app.example.com');
  assert.equal(result['access-control-allow-methods'], 'GET, POST, OPTIONS');
  assert.equal(result['access-control-max-age'], '86400');
});

test('buildCorsHeaders: wildcard * in allowed origins returns * as allow-origin', () => {
  const req = makeRequest('https://api.example.com/api/v1/claims', { origin: 'https://any-site.com' });
  const result = buildCorsHeaders(req, { CORS_ALLOWED_ORIGINS: '*' });
  assert.equal(result['access-control-allow-origin'], '*');
});

test('buildCorsHeaders: non-matching origin returns empty object', () => {
  const req = makeRequest('https://api.example.com/api/v1/claims', { origin: 'https://evil.com' });
  const result = buildCorsHeaders(req, { CORS_ALLOWED_ORIGINS: 'https://app.example.com' });
  assert.deepEqual(result, {});
});

test('buildCorsHeaders: vary header differs for wildcard vs specific origin', () => {
  const wildcardReq = makeRequest('https://api.example.com/api/data', { origin: 'https://any.com' });
  const specificReq = makeRequest('https://api.example.com/api/data', { origin: 'https://app.example.com' });
  const wildcardResult = buildCorsHeaders(wildcardReq, { CORS_ALLOWED_ORIGINS: '*' });
  const specificResult = buildCorsHeaders(specificReq, { CORS_ALLOWED_ORIGINS: 'https://app.example.com' });
  assert.ok(wildcardResult.vary.includes('Access-Control-Request-Headers'));
  assert.ok(!wildcardResult.vary.includes('Origin'));
  assert.ok(specificResult.vary.includes('Origin'));
});

// ── normalizeAmountString ─────────────────────────────────────────────────────

test('normalizeAmountString: valid decimal string is returned unchanged', () => {
  assert.equal(normalizeAmountString('123.45'), '123.45');
});

test('normalizeAmountString: invalid string returns fallback', () => {
  assert.equal(normalizeAmountString('not-a-number'), '0');
});

test('normalizeAmountString: null returns fallback', () => {
  assert.equal(normalizeAmountString(null), '0');
});

test('normalizeAmountString: empty string returns fallback', () => {
  assert.equal(normalizeAmountString('', '1'), '1');
});

test('normalizeAmountString: custom fallback is used', () => {
  assert.equal(normalizeAmountString(null, '100'), '100');
});

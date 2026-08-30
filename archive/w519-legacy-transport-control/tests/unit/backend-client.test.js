'use strict';
const vm   = require('node:vm');
const fs   = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const SRC = path.resolve(__dirname, '..', '..', 'assets', 'js', 'utils', 'backend-client.js');
const rawSrc = fs.readFileSync(SRC, 'utf8');
const strippedSrc = rawSrc
  .replace(/^import\s+[\s\S]*?\s+from\s+['"][^'"]+['"];?\s*/gm, '')
  .replace(/^export\s+\{[^}]+\};?\s*/gm, '')
  .replace(/^export (const|let|var|function|async function|class) /gm, '$1 ');
const exportedNames = [...rawSrc.matchAll(/^export (?:const|let|var|function|async function|class) (\w+)/gm)]
  .map((m) => m[1]);
const suffix = exportedNames.map((n) => `exports.${n} = ${n};`).join('\n');
const importStubs = `
const publishP2POffer = async () => ({ ok: false, error: 'stubbed-p2p-offline' });
const lookupP2POffer = async () => ({ ok: false, error: 'stubbed-p2p-miss' });
const acceptP2POffer = async () => ({ ok: false, error: 'stubbed-p2p-offline' });
const redeemP2PReceipt = async () => ({ ok: false, error: 'stubbed-p2p-offline' });
const generateOfferCode = () => '';
const generateReceiptCode = () => '';
`;
const wrappedSrc = `const exports = {};\n${importStubs}\n${strippedSrc}\n${suffix}\nexports`;

function makeMockResponse(data, { ok = true, status = 200, contentType = 'application/json' } = {}) {
  const body = JSON.stringify(data);
  const resp = {
    ok,
    status,
    headers: { get: (key) => (key === 'content-type' ? contentType : null) },
    text: () => Promise.resolve(body),
  };
  resp.clone = () => ({ ...resp, text: () => Promise.resolve(body) });
  return resp;
}

function loadModule({ hostname = 'localhost', apiBase = '', fetchImpl = null } = {}) {
  const calls = [];

  const capturingFetch = async (url, opts) => {
    calls.push({ url, opts });
    if (fetchImpl) return fetchImpl(url, opts);
    return makeMockResponse({ status: 'ok', result: {} });
  };

  const ctx = vm.createContext({
    window: {
      __EON_API_BASE__: apiBase,
      location: { hostname },
      setTimeout: (_fn, _ms) => 1,
      clearTimeout: () => {},
      crypto: {
        getRandomValues(buf) {
          for (let i = 0; i < buf.length; i++) buf[i] = (i * 37) % 255;
          return buf;
        }
      }
    },
    fetch: capturingFetch,
    AbortController: class {
      constructor() { this.signal = { aborted: false }; }
      abort() { this.signal.aborted = true; }
    },
    URL,
    Promise,
    JSON,
    Object,
    String,
    Number,
    Array,
    Error,
  });

  const mod = vm.runInContext(wrappedSrc, ctx);
  return { mod, calls };
}

// ── getApiBase ───────────────────────────────────────────────────────────────

test('getApiBase returns empty string for non-eonapp.ch host with no configured base', () => {
  const { mod } = loadModule({ hostname: 'localhost' });
  assert.equal(mod.getApiBase(), '');
});

test('getApiBase returns /api for eonapp.ch host', () => {
  const { mod } = loadModule({ hostname: 'eonapp.ch' });
  assert.equal(mod.getApiBase(), '/api');
});

test('getApiBase returns /api for www.eonapp.ch host', () => {
  const { mod } = loadModule({ hostname: 'www.eonapp.ch' });
  assert.equal(mod.getApiBase(), '/api');
});

test('getApiBase uses configured https __EON_API_BASE__', () => {
  const { mod } = loadModule({ hostname: 'localhost', apiBase: 'https://api.example.com' });
  assert.equal(mod.getApiBase(), 'https://api.example.com');
});

test('getApiBase rejects http base for non-localhost (not https)', () => {
  const { mod } = loadModule({ hostname: 'localhost', apiBase: 'http://remote.example.com' });
  assert.equal(mod.getApiBase(), '');
});

test('getApiBase accepts http base for localhost dev', () => {
  const { mod } = loadModule({ hostname: 'localhost', apiBase: 'http://localhost:3000' });
  assert.equal(mod.getApiBase(), 'http://localhost:3000');
});

// ── hasConfiguredBackend ─────────────────────────────────────────────────────

test('hasConfiguredBackend returns false when no backend configured', () => {
  const { mod } = loadModule({ hostname: 'example.com' });
  assert.equal(mod.hasConfiguredBackend(), false);
});

test('hasConfiguredBackend returns true for eonapp.ch (resolves /api)', () => {
  const { mod } = loadModule({ hostname: 'eonapp.ch' });
  assert.equal(mod.hasConfiguredBackend(), true);
});

test('hasConfiguredBackend returns true when explicit https base is set', () => {
  const { mod } = loadModule({ hostname: 'example.com', apiBase: 'https://api.example.com' });
  assert.equal(mod.hasConfiguredBackend(), true);
});

// ── fetchBackendHealth ───────────────────────────────────────────────────────

test('fetchBackendHealth throws when no backend configured', async () => {
  const { mod } = loadModule({ hostname: 'example.com' });
  await assert.rejects(
    () => mod.fetchBackendHealth(),
    /No edge backend configured/
  );
});

test('fetchBackendHealth calls fetch with /health path', async () => {
  const { mod, calls } = loadModule({ hostname: 'eonapp.ch' });
  await mod.fetchBackendHealth();
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.endsWith('/health'), `Expected URL ending with /health, got ${calls[0].url}`);
});

test('fetchBackendHealth sends accept: application/json header', async () => {
  const { mod, calls } = loadModule({ hostname: 'eonapp.ch' });
  await mod.fetchBackendHealth();
  assert.equal(calls[0].opts.headers.accept, 'application/json');
});

test('fetchBackendHealth returns parsed JSON data', async () => {
  const { mod } = loadModule({
    hostname: 'eonapp.ch',
    fetchImpl: async () => makeMockResponse({ alive: true, version: '1.0.0' })
  });
  const result = await mod.fetchBackendHealth();
  assert.equal(result.alive, true);
  assert.equal(result.version, '1.0.0');
});

test('fetchBackendHealth throws on non-ok HTTP response (503)', async () => {
  const { mod } = loadModule({
    hostname: 'eonapp.ch',
    fetchImpl: async () => makeMockResponse({ code: 'unavailable' }, { ok: false, status: 503 })
  });
  await assert.rejects(
    () => mod.fetchBackendHealth(),
    (err) => {
      assert.equal(err.status, 503);
      return true;
    }
  );
});

test('fetchBackendHealth propagates fetch network error', async () => {
  const { mod } = loadModule({
    hostname: 'eonapp.ch',
    fetchImpl: async () => { throw new Error('net::ERR_FAILED'); }
  });
  await assert.rejects(
    () => mod.fetchBackendHealth(),
    /Backend request failed to reach the server/
  );
});

// ── fetchVaultSummary ────────────────────────────────────────────────────────

test('fetchVaultSummary throws when no backend configured', async () => {
  const { mod } = loadModule({ hostname: 'example.com' });
  await assert.rejects(
    () => mod.fetchVaultSummary('g_' + 'a'.repeat(48)),
    /No edge backend configured/
  );
});

test('fetchVaultSummary throws when uid is invalid', async () => {
  const { mod } = loadModule({ hostname: 'eonapp.ch' });
  await assert.rejects(
    () => mod.fetchVaultSummary('!!!invalid!!!'),
    /valid vault uid/
  );
});

test('fetchVaultSummary calls fetch with encoded uid in URL path', async () => {
  const uid = 'g_' + 'b'.repeat(48);
  const { mod, calls } = loadModule({ hostname: 'eonapp.ch' });
  await mod.fetchVaultSummary(uid);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.includes(encodeURIComponent(uid)), `URL should include encoded uid`);
});

// ── publishSwapOffer ─────────────────────────────────────────────────────────

test('publishSwapOffer throws when uid is missing', async () => {
  const { mod } = loadModule({ hostname: 'eonapp.ch' });
  await assert.rejects(
    () => mod.publishSwapOffer({ uid: '', offerCode: 'OFFER123' }),
    /valid uid is required/
  );
});

test('publishSwapOffer throws when offerCode is missing', async () => {
  const { mod } = loadModule({ hostname: 'eonapp.ch' });
  await assert.rejects(
    () => mod.publishSwapOffer({ uid: 'g_' + 'c'.repeat(48), offerCode: '' }),
    /offer code is required/
  );
});

test('publishSwapOffer sends POST with JSON content-type', async () => {
  const { mod, calls } = loadModule({ hostname: 'eonapp.ch' });
  await mod.publishSwapOffer({ uid: 'g_' + 'a'.repeat(48), offerCode: 'OFFER123' });
  assert.equal(calls[0].opts.method, 'POST');
  assert.equal(calls[0].opts.headers['content-type'], 'application/json');
});

test('publishSwapOffer sends uid and offerCode in request body', async () => {
  const uid = 'g_' + 'a'.repeat(48);
  const { mod, calls } = loadModule({ hostname: 'eonapp.ch' });
  await mod.publishSwapOffer({ uid, offerCode: 'OFFER123' });
  const body = JSON.parse(calls[0].opts.body);
  assert.equal(body.uid, uid);
  assert.equal(body.offerCode, 'OFFER123');
});

// ── verifySwapOffer ──────────────────────────────────────────────────────────

test('verifySwapOffer throws when offerCode is missing', async () => {
  const { mod } = loadModule({ hostname: 'eonapp.ch' });
  await assert.rejects(
    () => mod.verifySwapOffer({ offerCode: '' }),
    /offer code is required/
  );
});

test('verifySwapOffer calls /v1/swap/offers/verify endpoint', async () => {
  const { mod, calls } = loadModule({ hostname: 'eonapp.ch' });
  await mod.verifySwapOffer({ offerCode: 'VERIFY_CODE_X' });
  assert.ok(calls[0].url.includes('/v1/swap/offers/verify'));
});

// ── reconcileSwapAcceptance ──────────────────────────────────────────────────

test('reconcileSwapAcceptance throws when uid is missing', async () => {
  const { mod } = loadModule({ hostname: 'eonapp.ch' });
  await assert.rejects(
    () => mod.reconcileSwapAcceptance({ uid: '', offerCode: 'OC', receiptCode: 'RC' }),
    /valid uid is required/
  );
});

test('reconcileSwapAcceptance throws when offer or receipt codes are missing', async () => {
  const { mod } = loadModule({ hostname: 'eonapp.ch' });
  await assert.rejects(
    () => mod.reconcileSwapAcceptance({ uid: 'g_' + 'a'.repeat(48), offerCode: '', receiptCode: '' }),
    /Offer and receipt codes are required/
  );
});

// ── reconcileSwapReceiptRedeem ───────────────────────────────────────────────

test('reconcileSwapReceiptRedeem throws when uid is missing', async () => {
  const { mod } = loadModule({ hostname: 'eonapp.ch' });
  await assert.rejects(
    () => mod.reconcileSwapReceiptRedeem({ uid: '', receiptCode: 'RC123' }),
    /valid uid is required/
  );
});

test('reconcileSwapReceiptRedeem throws when receiptCode is missing', async () => {
  const { mod } = loadModule({ hostname: 'eonapp.ch' });
  await assert.rejects(
    () => mod.reconcileSwapReceiptRedeem({ uid: 'g_' + 'a'.repeat(48), receiptCode: '' }),
    /receipt code is required/
  );
});

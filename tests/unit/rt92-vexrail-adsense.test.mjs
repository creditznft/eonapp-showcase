import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { applyBillingMigrations, applyIdentityMigrations, applyTrustMigrations } from '../helpers/eon-d1-test-migrations.mjs';
import { createSession } from '../../functions/_shared/eon-auth.js';
import { getVexrailProfitabilityGovernorConfig } from '../../functions/_shared/eon-profitability-governor.js';
import { SERVER_MANAGED_AI_PROVIDER_CONTRACTS } from '../../config/ai-api-contracts.mjs';
import { GOOGLE_ADSENSE_ACCOUNT, GOOGLE_ADSENSE_ADS_TXT_LINE, injectGoogleAdsenseAccountMeta } from '../../scripts/adsense-site-verification.mjs';
import { estimateVexrailTokenUnits, evaluateVexrailNetworkPolicy, getVexrailConfig, inspectVexrailSensitiveData, normalizeVexrailRequest, onRequestGet, onRequestPost, VEXRAIL_UPSTREAM } from '../../functions/api/ai/vexrail.js';
import { discoverVexrailModelIds } from '../../functions/_shared/eon-vexrail-model-router.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const DAY_MS = 24 * 60 * 60 * 1000;
const DYNAMIC_MODEL_ID = 'rt92-dynamic-test-model';
const DYNAMIC_ECONOMICS_RAW = JSON.stringify({ version: 1, verified: true, models: {
  [DYNAMIC_MODEL_ID]: {
    input_micros_per_1m_tokens: 10,
    output_micros_per_1m_tokens: 20,
    quality_score: 95,
    classes: ['*'],
    streaming: true
  }
}});
const dynamicModelListResponse = () => new Response(JSON.stringify({ object: 'list', data: [{ id: DYNAMIC_MODEL_ID, object: 'model' }] }), { status: 200, headers: { 'content-type': 'application/json' } });

class D1Statement {
  constructor(database, sql, args = []) { this.database = database; this.sql = sql; this.args = args; }
  bind(...args) { return new D1Statement(this.database, this.sql, args); }
  run() { return this.database.prepare(this.sql).run(...this.args); }
  first() { return this.database.prepare(this.sql).get(...this.args) || null; }
  all() { return { results: this.database.prepare(this.sql).all(...this.args) }; }
}
function makeD1(kind) {
  const sqlite = new DatabaseSync(':memory:');
  if (kind === 'identity') applyIdentityMigrations(sqlite);
  else if (kind === 'trust') applyTrustMigrations(sqlite);
  else applyBillingMigrations(sqlite);
  return { sqlite, prepare(sql) { return new D1Statement(sqlite, sql); } };
}

async function makeContext({
  paid = false,
  signedIn = true,
  method = 'GET',
  body = null,
  authRollout = 'testing',
  environment = 'preview',
  ip = '203.0.113.42',
  country = 'US',
  asn = 64500,
  asOrganization = 'Example Residential ISP',
  botManagement = null,
  geoMode = environment === 'production' ? 'selected_countries' : 'testing',
  countries = 'US,CA,GB,AU,DE,CH',
  globalDailyCap = 1000,
  countryDailyCap = 400,
  networkHourlyCap = 80,
  networkDailyCap = 300,
  freeDailyCap = 60,
  paidSponsoredOptIn = true,
  paidFairUseHourlyCap = 30,
  paidDailyCap = 100,
  freeDailyTokenCap = 80_000,
  paidDailyTokenCap = 120_000,
  countryDailyTokenCap = 750_000,
  globalDailyTokenCap = 2_000_000,
  requireCfMetadata = environment === 'production',
  blockedAsns = '',
  botScoreMin = 30,
  turnstileMode = 'off',
  turnstileSiteKey = '1x-test-site-key',
  turnstileSecret = 'test-turnstile-secret',
  turnstileHostnames = 'eonapp.ch',
  guestOneShot = false,
  guestNetworkDailyCap = 5,
  guestMaxOutputTokens = 768,
  guestCookieDays = 30
} = {}) {
  const identity = makeD1('identity');
  const billing = makeD1('billing');
  const trust = makeD1('trust');
  const accountId = paid ? 'account_paid_vexrail' : 'account_free_vexrail';
  const env = {
    EON_ENVIRONMENT: environment,
    APP_ORIGIN: 'https://eonapp.ch',
    GOOGLE_REDIRECT_URI: 'https://eonapp.ch/api/auth/google/callback',
    GOOGLE_OAUTH_CLIENT_ID: 'client.apps.googleusercontent.com',
    GOOGLE_OAUTH_CLIENT_SECRET: 'test-google-secret',
    EON_AUTH_SUBJECT_PEPPER: 'test-subject-pepper',
    EON_SESSION_SIGNING_KEY: 'test-session-signing-key',
    EON_OAUTH_FLOW_SIGNING_KEY: 'test-flow-signing-key',
    EON_AUTH_ROLLOUT: authRollout,
    EON_IDENTITY_DB: identity,
    EON_BILLING_DB: billing,
    EON_TRUST_DB: trust,
    EON_TRUST_RATE_LIMIT_SALT: 'rt92-vexrail-test-rate-limit-salt-2026',
    EON_VEXRAIL_ROLLOUT: environment === 'production' ? 'production' : 'testing',
    EON_VEXRAIL_GEO_MODE: geoMode,
    EON_VEXRAIL_COUNTRIES: countries,
    EON_VEXRAIL_PAID_SPONSORED_OPT_IN: paidSponsoredOptIn ? 'true' : 'false',
    EON_VEXRAIL_GUEST_ONE_SHOT: guestOneShot ? 'true' : 'false',
    EON_VEXRAIL_GUEST_NETWORK_DAILY_CAP: String(guestNetworkDailyCap),
    EON_VEXRAIL_GUEST_MAX_OUTPUT_TOKENS: String(guestMaxOutputTokens),
    EON_VEXRAIL_GUEST_COOKIE_DAYS: String(guestCookieDays),
    EON_VEXRAIL_GLOBAL_DAILY_CAP: String(globalDailyCap),
    EON_VEXRAIL_COUNTRY_DAILY_CAP: String(countryDailyCap),
    EON_VEXRAIL_NETWORK_HOURLY_CAP: String(networkHourlyCap),
    EON_VEXRAIL_NETWORK_DAILY_CAP: String(networkDailyCap),
    EON_VEXRAIL_FREE_DAILY_CAP: String(freeDailyCap),
    EON_VEXRAIL_PAID_FAIR_USE_HOURLY_CAP: String(paidFairUseHourlyCap),
    EON_VEXRAIL_PAID_DAILY_CAP: String(paidDailyCap),
    EON_VEXRAIL_FREE_DAILY_TOKEN_CAP: String(freeDailyTokenCap),
    EON_VEXRAIL_PAID_DAILY_TOKEN_CAP: String(paidDailyTokenCap),
    EON_VEXRAIL_COUNTRY_DAILY_TOKEN_CAP: String(countryDailyTokenCap),
    EON_VEXRAIL_GLOBAL_DAILY_TOKEN_CAP: String(globalDailyTokenCap),
    EON_VEXRAIL_REQUIRE_CF_METADATA: requireCfMetadata ? 'true' : 'false',
    EON_VEXRAIL_BLOCKED_ASNS: blockedAsns,
    EON_VEXRAIL_BOT_SCORE_MIN: String(botScoreMin),
    EON_VEXRAIL_TURNSTILE_MODE: turnstileMode,
    EON_VEXRAIL_TURNSTILE_SITE_KEY: turnstileSiteKey,
    EON_VEXRAIL_TURNSTILE_SECRET: turnstileSecret,
    EON_VEXRAIL_TURNSTILE_HOSTNAMES: turnstileHostnames,
    VEXRAIL_SECRET_KEY: 'test-server-secret',
    VEXRAIL_PUBLISHABLE_KEY: 'test-publishable-value',
    EON_VEXRAIL_MODEL_ECONOMICS_JSON: DYNAMIC_ECONOMICS_RAW
  };
  if (paid) billing.sqlite.prepare(`INSERT INTO eon_entitlements (account_id, tier_id, status, source_provider, source_event_id, updated_at) VALUES (?, 'plus', 'active', 'dodo', 'evt_paid', ?)`).run(accountId, Date.now());
  const headers = { origin: 'https://eonapp.ch', 'sec-fetch-site': 'same-origin', 'cf-connecting-ip': ip };
  if (signedIn) {
    const session = await createSession({ database: identity, sessionKey: env.EON_SESSION_SIGNING_KEY }, accountId);
    headers.cookie = `__Host-eon_session=${session.sessionId}`;
  }
  if (body !== null) headers['content-type'] = 'application/json';
  // Unit tests focus on policy/ledger behavior rather than repeatedly exercising
  // live catalogue discovery. Prime the same server-side discovery cache that
  // Production uses, with a synthetic model that is covered by verified economics.
  await discoverVexrailModelIds(getVexrailConfig(env), async () => dynamicModelListResponse(), Date.now());
  const request = new Request('https://eonapp.ch/api/ai/vexrail', { method, headers, body: body === null ? undefined : JSON.stringify(body) });
  Object.defineProperty(request, 'cf', { value: { country, asn, asOrganization, ...(botManagement ? { botManagement } : {}) }, configurable: true });
  return { request, env, waitUntil() {}, passThroughOnException() {} };
}

function nextPost(context, body, { ip = '203.0.113.42', country = 'US', asn = 64500, botManagement = null } = {}) {
  const request = new Request('https://eonapp.ch/api/ai/vexrail', {
    method: 'POST',
    headers: {
      origin: 'https://eonapp.ch',
      'sec-fetch-site': 'same-origin',
      'content-type': 'application/json',
      'cf-connecting-ip': ip,
      cookie: context.request.headers.get('cookie') || ''
    },
    body: JSON.stringify(body)
  });
  Object.defineProperty(request, 'cf', { value: { country, asn, asOrganization: 'Example Residential ISP', ...(botManagement ? { botManagement } : {}) }, configurable: true });
  return { ...context, request };
}

function okVexrailResponse(content = 'ok') {
  return new Response(JSON.stringify({ id: 'req_1', choices: [{ message: { content } }] }), { status: 200, headers: { 'content-type': 'application/json' } });
}

const normalBody = () => ({ messages: [{ role: 'user', content: 'hello sponsored Gemini' }] });

test('Vexrail config is server-held, keeps guest one-shot opt-in disabled by default and exposes conservative launch controls', () => {
  const disabled = getVexrailConfig({});
  assert.equal(disabled.configured, false);
  assert.equal(disabled.signedInRequired, true);
  const ready = getVexrailConfig({ EON_ENVIRONMENT: 'preview', EON_VEXRAIL_ROLLOUT: 'testing', EON_VEXRAIL_TURNSTILE_MODE: 'off', VEXRAIL_SECRET_KEY: 'secret', VEXRAIL_PUBLISHABLE_KEY: 'publishable', EON_VEXRAIL_MODEL_ECONOMICS_JSON: DYNAMIC_ECONOMICS_RAW });
  assert.equal(ready.configured, true);
  assert.equal(ready.dynamicModelRouting, true);
  assert.equal(ready.economicsVerified, true);
  assert.equal(ready.economicsModelCount, 1);
  assert.equal('model' in ready, false);
  assert.equal(ready.paidFairUseHourlyCap, 30);
  assert.equal(ready.freeDailyCap, 60);
  assert.equal(ready.paidDailyCap, 100);
  assert.equal(ready.networkHourlyCap, 80);
  assert.equal(ready.countryDailyCap, 400);
  assert.equal(ready.globalDailyCap, 1000);
  assert.equal(ready.freeDailyTokenCap, 80_000);
  assert.equal(ready.paidDailyTokenCap, 120_000);
  assert.equal(ready.countryDailyTokenCap, 750_000);
  assert.equal(ready.globalDailyTokenCap, 2_000_000);
  assert.equal(ready.guestOneShotEnabled, false);
  assert.equal(ready.guestNetworkDailyCap, 5);
  assert.equal(ready.guestMaxOutputTokens, 768);
});

test('Production config fails closed without Turnstile authority', () => {
  const cfg = getVexrailConfig({ EON_ENVIRONMENT: 'production', EON_VEXRAIL_ROLLOUT: 'production', EON_VEXRAIL_GEO_MODE: 'selected_countries', EON_VEXRAIL_COUNTRIES: 'US', VEXRAIL_SECRET_KEY: 's', VEXRAIL_PUBLISHABLE_KEY: 'p', EON_VEXRAIL_MODEL_ECONOMICS_JSON: DYNAMIC_ECONOMICS_RAW });
  assert.equal(cfg.configured, false);
  assert.ok(cfg.missing.includes('EON_VEXRAIL_TURNSTILE_SITE_KEY'));
  assert.ok(cfg.missing.includes('EON_VEXRAIL_TURNSTILE_SECRET'));
});

test('request normalizer strips browser model, BYOK keys, tools and grounding controls', () => {
  const normalized = normalizeVexrailRequest({ model: 'browser-model', apiKey: 'private', tools: [{ google_search: {} }], grounding: true, messages: [{ role: 'user', content: 'hello' }], max_tokens: 99999, sponsoredOptIn: true, turnstileToken: 'human-token' });
  assert.equal(normalized.ok, true);
  assert.equal('model' in normalized.payload, false);
  assert.equal(normalized.payload.max_tokens, 2048);
  assert.equal(normalized.sponsoredOptIn, true);
  assert.equal(normalized.turnstileToken, 'human-token');
  assert.equal('apiKey' in normalized.payload, false);
  assert.equal('tools' in normalized.payload, false);
  assert.equal('grounding' in normalized.payload, false);
  assert.equal('turnstileToken' in normalized.payload, false);
});


test('sensitive-data guard detects coarse categories in every model-visible role without returning matched values', () => {
  const email = 'alice.private@example.com';
  const card = '4111 1111 1111 1111';
  const inspected = inspectVexrailSensitiveData([
    { role: 'system', content: `Selected memory contact is ${email}` },
    { role: 'user', content: `My card is ${card}` }
  ]);
  assert.equal(inspected.ok, false);
  assert.ok(inspected.categories.includes('email'));
  assert.ok(inspected.categories.includes('payment_card'));
  assert.equal(JSON.stringify(inspected).includes(email), false);
  assert.equal(JSON.stringify(inspected).includes(card), false);
});

test('token-equivalent estimator scales with context and reserves output budget', () => {
  const small = estimateVexrailTokenUnits({ messages: [{ role: 'user', content: 'hello' }], max_tokens: 128 });
  const large = estimateVexrailTokenUnits({ messages: [{ role: 'user', content: 'x'.repeat(4000) }], max_tokens: 128 });
  assert.ok(small >= 128);
  assert.ok(large > small);
});

test('anonymous users are denied Sponsored AI and never become a credit-spending guest class', async () => {
  const response = await onRequestGet(await makeContext({ signedIn: false }));
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.eligible, false);
  assert.equal(payload.signedIn, false);
  assert.equal(payload.signedInRequired, true);
  assert.equal(payload.reason, 'vexrail_sign_in_required');
  assert.equal(payload.accessClass, 'sign_in_required');
});


test('anonymous visitor gets one guest Sponsored AI candidate when explicitly enabled', async () => {
  const response = await onRequestGet(await makeContext({ signedIn: false, guestOneShot: true }));
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.signedIn, false);
  assert.equal(payload.guestOneShotEnabled, true);
  assert.equal(payload.guestOneShotAvailable, true);
  assert.equal(payload.eligible, false);
  assert.equal(payload.accessClass, 'guest_one_shot');
  assert.equal(payload.reason, 'guest_one_shot_available');
  assert.equal(payload.signedInRequiredForContinuedUse, true);
});

test('guest one-shot succeeds once, caps output, sets signed HttpOnly marker, then returns to sign-in gate', async () => {
  const context = await makeContext({ signedIn: false, guestOneShot: true, method: 'POST', body: { ...normalBody(), guestOneShot: true, max_tokens: 2048 } });
  const originalFetch = globalThis.fetch;
  let captured = null;
  globalThis.fetch = async (_url, options = {}) => { captured = JSON.parse(String(options.body || '{}')); return okVexrailResponse('smart first answer'); };
  try {
    const response = await onRequestPost(context);
    assert.equal(response.status, 200);
    assert.equal(captured.max_tokens, 768);
    assert.equal(response.headers.get('x-eon-guest-one-shot'), 'consumed');
    const cookie = response.headers.get('set-cookie') || '';
    assert.match(cookie, /__Host-eon_vexrail_guest=v1\./);
    assert.match(cookie, /HttpOnly/);
    const followup = await makeContext({ signedIn: false, guestOneShot: true });
    followup.request = new Request('https://eonapp.ch/api/ai/vexrail', { headers: { origin: 'https://eonapp.ch', 'sec-fetch-site': 'same-origin', 'cf-connecting-ip': '203.0.113.42', cookie: cookie.split(';')[0] } });
    Object.defineProperty(followup.request, 'cf', { value: { country: 'US', asn: 64500, asOrganization: 'Example Residential ISP' }, configurable: true });
    const status = await (await onRequestGet(followup)).json();
    assert.equal(status.guestOneShotAvailable, false);
    assert.equal(status.reason, 'vexrail_guest_one_shot_used');
    assert.equal(status.accessClass, 'guest_used');
  } finally { globalThis.fetch = originalFetch; }
});

test('Production guest one-shot permits bounded YELLOW learning traffic before economics are reconciled', async () => {
  const context = await makeContext({ signedIn: false, guestOneShot: true, environment: 'production', authRollout: 'public', turnstileMode: 'off', method: 'POST', body: { ...normalBody(), guestOneShot: true } });
  const originalFetch = globalThis.fetch; let called = false; globalThis.fetch = async () => { called = true; return okVexrailResponse(); };
  try {
    const response = await onRequestPost(context);
    assert.equal(response.status, 200);
    assert.equal(called, true);
    assert.equal(response.headers.get('x-eon-economics-state'), 'YELLOW');
  } finally { globalThis.fetch = originalFetch; }
});

test('Production guest one-shot stops when the YELLOW learning budget is exhausted', async () => {
  const context = await makeContext({ signedIn: false, guestOneShot: true, environment: 'production', authRollout: 'public', turnstileMode: 'off', method: 'POST', body: { ...normalBody(), guestOneShot: true } });
  const now = Date.now();
  const dayStartedAt = Math.floor(now / DAY_MS) * DAY_MS;
  context.env.EON_VEXRAIL_PROFIT_GOVERNOR_MODE = 'enforce';
  context.env.EON_VEXRAIL_LEARNING_PROMPT_BUDGET = '1';
  context.env.EON_TRUST_DB.sqlite.prepare(`INSERT INTO eon_profitability_daily (
    day_started_at, provider, country, request_class, ai_prompt_count, updated_at
  ) VALUES (?, 'vexrail', 'US', 'simple_chat', 1, ?)`)
    .run(dayStartedAt, now);
  const originalFetch = globalThis.fetch; let called = false; globalThis.fetch = async () => { called = true; return okVexrailResponse(); };
  try {
    const response = await onRequestPost(context);
    assert.equal(response.status, 403);
    const payload = await response.json();
    assert.equal(payload.error, 'vexrail_guest_profitability_unavailable');
    assert.equal(payload.economicsState, 'RED');
    assert.equal(called, false);
  } finally { globalThis.fetch = originalFetch; }
});


test('Production guest one-shot reaches Vexrail only after reconciled country/request-class economics are GREEN', async () => {
  const context = await makeContext({ signedIn: false, guestOneShot: true, environment: 'production', authRollout: 'public', turnstileMode: 'off', method: 'POST', body: { ...normalBody(), guestOneShot: true } });
  const now = Date.now();
  const dayStartedAt = Math.floor(now / DAY_MS) * DAY_MS;
  context.env.EON_TRUST_DB.sqlite.prepare(`INSERT INTO eon_profitability_daily (
    day_started_at, provider, country, request_class, vexrail_revenue_micros, vexrail_cost_micros,
    ai_prompt_count, revenue_reconciled, vexrail_cost_reconciled, updated_at
  ) VALUES (?, 'vexrail', 'US', 'simple_chat', 1500000, 1000000, 250, 1, 1, ?)`)
    .run(dayStartedAt, now);
  const originalFetch = globalThis.fetch;
  let called = 0;
  globalThis.fetch = async () => { called += 1; return okVexrailResponse('profitable guest answer'); };
  try {
    const response = await onRequestPost(context);
    assert.equal(response.status, 200);
    assert.equal(called, 1);
    assert.equal(response.headers.get('x-eon-economics-state'), 'GREEN');
    assert.equal(response.headers.get('x-eon-guest-one-shot'), 'consumed');
  } finally { globalThis.fetch = originalFetch; }
});

test('disabled or broken identity fails Sponsored AI closed in Preview and Production', async () => {
  for (const environment of ['preview', 'production']) {
    const context = await makeContext({ environment, authRollout: 'disabled', signedIn: false, turnstileMode: 'off' });
    const payload = await (await onRequestGet(context)).json();
    assert.equal(payload.eligible, false);
    assert.equal(payload.reason, 'vexrail_identity_unavailable');
  }
});

test('signed-in FREE is eligible in pilot market while paid is ad-free by default with explicit Sponsored AI opt-in', async () => {
  const free = await (await onRequestGet(await makeContext())).json();
  assert.equal(free.eligible, true);
  assert.equal(free.accessClass, 'signed_in_free');
  assert.equal(free.paidAdFree, false);
  assert.equal(free.groundingForwarded, false);
  const paid = await (await onRequestGet(await makeContext({ paid: true }))).json();
  assert.equal(paid.eligible, false);
  assert.equal(paid.eligibleByOptIn, true);
  assert.equal(paid.sponsoredOptInRequired, true);
  assert.equal(paid.paidAdFree, true);
  assert.equal(paid.accessClass, 'paid_opt_in');
});

test('same profitable-country policy applies to FREE and paid opt-in', async () => {
  for (const paid of [false, true]) {
    const response = await onRequestGet(await makeContext({ paid, environment: 'production', authRollout: 'public', country: 'IN', turnstileMode: 'off' }));
    const payload = await response.json();
    assert.equal(payload.eligible, false);
    assert.equal(payload.eligibleByOptIn, false);
    assert.equal(payload.reason, 'vexrail_geo_unavailable');
  }
});

test('network policy uses server-trusted Cloudflare ASN and optional Bot Management without pretending to detect hidden residential IPs', () => {
  const config = getVexrailConfig({ EON_ENVIRONMENT: 'production', EON_VEXRAIL_ROLLOUT: 'production', EON_VEXRAIL_GEO_MODE: 'selected_countries', EON_VEXRAIL_COUNTRIES: 'US', EON_VEXRAIL_BLOCKED_ASNS: '64599', EON_VEXRAIL_TURNSTILE_MODE: 'off', VEXRAIL_SECRET_KEY: 's', VEXRAIL_PUBLISHABLE_KEY: 'p', EON_VEXRAIL_MODEL_ECONOMICS_JSON: DYNAMIC_ECONOMICS_RAW });
  const request = { cf: { country: 'US', asn: 64599, asOrganization: 'Known Test Host' } };
  assert.equal(evaluateVexrailNetworkPolicy(config, request, { EON_ENVIRONMENT: 'production' }).reason, 'vexrail_network_restricted');
  const automated = { cf: { country: 'US', asn: 64500, botManagement: { score: 5, verifiedBot: false, jsDetection: { passed: true } } } };
  assert.equal(evaluateVexrailNetworkPolicy(config, automated, { EON_ENVIRONMENT: 'production' }).reason, 'vexrail_automated_traffic');
  const human = { cf: { country: 'US', asn: 64500, botManagement: { score: 92, verifiedBot: false, jsDetection: { passed: true } } } };
  assert.equal(evaluateVexrailNetworkPolicy(config, human, { EON_ENVIRONMENT: 'production' }).allowed, true);
});

test('Production can require Cloudflare country+ASN metadata before billing or Vexrail contact', async () => {
  const context = await makeContext({ environment: 'production', authRollout: 'public', turnstileMode: 'off', asn: 0 });
  const payload = await (await onRequestGet(context)).json();
  assert.equal(payload.eligible, false);
  assert.equal(payload.reason, 'vexrail_network_unverified');
});

test('same-origin enforcement rejects cross-site Sponsored AI POST before upstream', async () => {
  const context = await makeContext({ method: 'POST', body: normalBody() });
  context.request = new Request('https://eonapp.ch/api/ai/vexrail', { method: 'POST', headers: { origin: 'https://evil.example', 'sec-fetch-site': 'cross-site', 'content-type': 'application/json' }, body: JSON.stringify(normalBody()) });
  const originalFetch = globalThis.fetch; let called = false; globalThis.fetch = async () => { called = true; return okVexrailResponse(); };
  try { const response = await onRequestPost(context); assert.equal(response.status, 403); assert.equal(called, false); } finally { globalThis.fetch = originalFetch; }
});

test('paid Sponsored AI remains explicit opt-in before any upstream request', async () => {
  const context = await makeContext({ paid: true, method: 'POST', body: normalBody() });
  const originalFetch = globalThis.fetch; let called = false; globalThis.fetch = async () => { called = true; return okVexrailResponse(); };
  try { const response = await onRequestPost(context); assert.equal(response.status, 403); assert.equal((await response.json()).error, 'vexrail_paid_opt_in_required'); assert.equal(called, false); } finally { globalThis.fetch = originalFetch; }
});


test('sensitive user data is blocked before publisher-credit consumption or Vexrail contact', async () => {
  const sensitive = 'My email is alice.private@example.com and my password is: SuperSecret123';
  const context = await makeContext({ method: 'POST', body: { messages: [{ role: 'user', content: sensitive }] } });
  const originalFetch = globalThis.fetch; let called = false; globalThis.fetch = async () => { called = true; return okVexrailResponse(); };
  try {
    const response = await onRequestPost(context);
    const payload = await response.json();
    assert.equal(response.status, 422);
    assert.equal(payload.error, 'vexrail_sensitive_data_blocked');
    assert.ok(payload.categories.includes('email'));
    assert.ok(payload.categories.includes('secret'));
    assert.equal(JSON.stringify(payload).includes('alice.private@example.com'), false);
    assert.equal(JSON.stringify(payload).includes('SuperSecret123'), false);
    assert.equal(called, false);
    const rows = context.env.EON_TRUST_DB.sqlite.prepare('SELECT COUNT(*) AS count FROM eon_trust_submission_limits').get();
    assert.equal(Number(rows?.count || 0), 0);
  } finally { globalThis.fetch = originalFetch; }
});

test('token-weighted account budget blocks oversized daily exposure even when request caps have room', async () => {
  const context = await makeContext({ method: 'POST', body: normalBody(), freeDailyCap: 1000, networkHourlyCap: 1000, networkDailyCap: 1000, countryDailyCap: 1000, globalDailyCap: 1000, freeDailyTokenCap: 100 });
  const originalFetch = globalThis.fetch; let called = false; globalThis.fetch = async () => { called = true; return okVexrailResponse(); };
  try {
    const response = await onRequestPost(context);
    assert.equal(response.status, 429);
    assert.equal((await response.json()).error, 'vexrail_account_token_budget_limited');
    assert.equal(called, false);
  } finally { globalThis.fetch = originalFetch; }
});

test('publisher-side conversation id is salted and hashed upstream while client continuity id is echoed', async () => {
  const clientConversationId = 'client-conversation-1234';
  const context = await makeContext({ method: 'POST', body: { ...normalBody(), conversationId: clientConversationId } });
  const originalFetch = globalThis.fetch; let capturedHeader = '';
  globalThis.fetch = async (_url, options = {}) => { capturedHeader = String(options?.headers?.['x-conversation-id'] || ''); return okVexrailResponse(); };
  try {
    const response = await onRequestPost(context);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-conversation-id'), clientConversationId);
    assert.match(capturedHeader, /^eon-[a-f0-9]{48}$/);
    assert.notEqual(capturedHeader, clientConversationId);
    assert.equal(capturedHeader.includes('account_free_vexrail'), false);
  } finally { globalThis.fetch = originalFetch; }
});


test('aggregate economics ledger records admitted demand and provider usage without user identifiers or text', async () => {
  const context = await makeContext({ method: 'POST', body: normalBody() });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ id: 'req_usage', usage: { prompt_tokens: 12, completion_tokens: 7, total_tokens: 19 }, choices: [{ message: { content: 'ok' } }] }), { status: 200, headers: { 'content-type': 'application/json' } });
  try {
    const response = await onRequestPost(context);
    assert.equal(response.status, 200);
    const row = context.env.EON_TRUST_DB.sqlite.prepare('SELECT * FROM eon_vexrail_economic_daily WHERE country = ? AND access_class = ?').get('US', 'signed_in_free');
    assert.equal(Number(row?.admitted_requests || 0), 1);
    assert.equal(Number(row?.upstream_accepted || 0), 1);
    assert.ok(Number(row?.estimated_token_units || 0) > 0);
    assert.equal(Number(row?.provider_prompt_tokens || 0), 12);
    assert.equal(Number(row?.provider_completion_tokens || 0), 7);
    assert.equal(Number(row?.provider_total_tokens || 0), 19);
    const serialized = JSON.stringify(row);
    assert.equal(serialized.includes('account_free_vexrail'), false);
    assert.equal(serialized.includes('203.0.113.42'), false);
    assert.equal(serialized.includes('hello sponsored Gemini'), false);
  } finally { globalThis.fetch = originalFetch; }
});

test('missing economics ledger fails closed before Sponsored AI can spend publisher credits', async () => {
  const context = await makeContext({ method: 'POST', body: normalBody() });
  context.env.EON_TRUST_DB.sqlite.exec('DROP TABLE eon_vexrail_economic_daily');
  const originalFetch = globalThis.fetch; let called = false; globalThis.fetch = async () => { called = true; return okVexrailResponse(); };
  try {
    const status = await onRequestGet(context);
    const statusPayload = await status.json();
    assert.equal(statusPayload.eligible, false);
    assert.equal(statusPayload.reason, 'vexrail_economics_ledger_unavailable');
    const response = await onRequestPost(context);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, 'vexrail_economics_ledger_unavailable');
    assert.equal(called, false);
  } finally { globalThis.fetch = originalFetch; }
});

test('FREE hourly account cap remains 20', async () => {
  const context = await makeContext({ method: 'POST', body: normalBody(), freeDailyCap: 1000, networkHourlyCap: 1000, networkDailyCap: 1000, countryDailyCap: 1000, globalDailyCap: 1000 });
  const originalFetch = globalThis.fetch; let calls = 0; globalThis.fetch = async () => { calls++; return okVexrailResponse(); };
  try {
    for (let i = 0; i < 20; i++) assert.equal((await onRequestPost(nextPost(context, normalBody()))).status, 200);
    const limited = await onRequestPost(nextPost(context, normalBody()));
    assert.equal(limited.status, 429); assert.equal((await limited.json()).error, 'vexrail_rate_limited'); assert.equal(calls, 20);
  } finally { globalThis.fetch = originalFetch; }
});

test('FREE daily account cap blocks sustained use even when hourly ceiling has room', async () => {
  const context = await makeContext({ method: 'POST', body: normalBody(), freeDailyCap: 3, networkHourlyCap: 1000, networkDailyCap: 1000, countryDailyCap: 1000, globalDailyCap: 1000 });
  const originalFetch = globalThis.fetch; let calls = 0; globalThis.fetch = async () => { calls++; return okVexrailResponse(); };
  try {
    for (let i = 0; i < 3; i++) assert.equal((await onRequestPost(nextPost(context, normalBody()))).status, 200);
    const limited = await onRequestPost(nextPost(context, normalBody()));
    assert.equal(limited.status, 429); assert.equal((await limited.json()).error, 'vexrail_account_daily_limited'); assert.equal(calls, 3);
  } finally { globalThis.fetch = originalFetch; }
});

test('paid Sponsored AI uses separate conservative hourly and daily fair-use limits', async () => {
  const context = await makeContext({ paid: true, method: 'POST', paidFairUseHourlyCap: 2, paidDailyCap: 10, networkHourlyCap: 1000, networkDailyCap: 1000, countryDailyCap: 1000, globalDailyCap: 1000, body: { ...normalBody(), sponsoredOptIn: true } });
  const originalFetch = globalThis.fetch; let calls = 0; globalThis.fetch = async () => { calls++; return okVexrailResponse(); };
  try {
    for (let i = 0; i < 2; i++) assert.equal((await onRequestPost(nextPost(context, { ...normalBody(), sponsoredOptIn: true }))).status, 200);
    const limited = await onRequestPost(nextPost(context, { ...normalBody(), sponsoredOptIn: true }));
    assert.equal(limited.status, 429); assert.equal((await limited.json()).error, 'vexrail_paid_fair_use_limited'); assert.equal(calls, 2);
  } finally { globalThis.fetch = originalFetch; }
});

test('cross-account network ceiling protects against account-farm and proxy-exit abuse', async () => {
  const context = await makeContext({ method: 'POST', networkHourlyCap: 2, freeDailyCap: 1000, networkDailyCap: 1000, countryDailyCap: 1000, globalDailyCap: 1000, body: normalBody() });
  const originalFetch = globalThis.fetch; let calls = 0; globalThis.fetch = async () => { calls++; return okVexrailResponse(); };
  try {
    assert.equal((await onRequestPost(nextPost(context, normalBody()))).status, 200);
    assert.equal((await onRequestPost(nextPost(context, normalBody()))).status, 200);
    const limited = await onRequestPost(nextPost(context, normalBody()));
    assert.equal(limited.status, 429); assert.equal((await limited.json()).error, 'vexrail_network_rate_limited'); assert.equal(calls, 2);
  } finally { globalThis.fetch = originalFetch; }
});

test('per-country circuit breaker prevents one market from consuming the global wallet', async () => {
  const context = await makeContext({ method: 'POST', countryDailyCap: 2, freeDailyCap: 1000, networkHourlyCap: 1000, networkDailyCap: 1000, globalDailyCap: 1000, body: normalBody() });
  const originalFetch = globalThis.fetch; let calls = 0; globalThis.fetch = async () => { calls++; return okVexrailResponse(); };
  try {
    assert.equal((await onRequestPost(nextPost(context, normalBody()))).status, 200);
    assert.equal((await onRequestPost(nextPost(context, normalBody()))).status, 200);
    const limited = await onRequestPost(nextPost(context, normalBody()));
    assert.equal(limited.status, 429); assert.equal((await limited.json()).error, 'vexrail_country_budget_limited'); assert.equal(calls, 2);
  } finally { globalThis.fetch = originalFetch; }
});

test('global circuit breaker is authoritative after narrower controls pass', async () => {
  const context = await makeContext({ method: 'POST', globalDailyCap: 2, freeDailyCap: 1000, networkHourlyCap: 1000, networkDailyCap: 1000, countryDailyCap: 1000, body: normalBody() });
  const originalFetch = globalThis.fetch; let calls = 0; globalThis.fetch = async () => { calls++; return okVexrailResponse(); };
  try {
    assert.equal((await onRequestPost(nextPost(context, normalBody()))).status, 200);
    assert.equal((await onRequestPost(nextPost(context, normalBody()))).status, 200);
    const limited = await onRequestPost(nextPost(context, normalBody()));
    assert.equal(limited.status, 429); assert.equal((await limited.json()).error, 'vexrail_global_budget_limited'); assert.equal(calls, 2);
  } finally { globalThis.fetch = originalFetch; }
});

test('Production Turnstile missing token blocks before Vexrail upstream', async () => {
  const context = await makeContext({ environment: 'production', authRollout: 'public', method: 'POST', turnstileMode: 'required', body: normalBody() });
  const originalFetch = globalThis.fetch; let calls = 0; globalThis.fetch = async () => { calls++; return okVexrailResponse(); };
  try { const response = await onRequestPost(context); assert.equal(response.status, 403); assert.equal((await response.json()).error, 'vexrail_human_verification_required'); assert.equal(calls, 0); } finally { globalThis.fetch = originalFetch; }
});

test('Production Turnstile is validated server-side before Vexrail and never forwarded upstream', async () => {
  const context = await makeContext({ environment: 'production', authRollout: 'public', method: 'POST', turnstileMode: 'required', body: { ...normalBody(), turnstileToken: 'valid-human-token' } });
  const originalFetch = globalThis.fetch; const seen = [];
  globalThis.fetch = async (url, options = {}) => {
    seen.push({ url: String(url), options, body: String(options.body || '') });
    if (String(url).includes('/turnstile/v0/siteverify')) return new Response(JSON.stringify({ success: true, action: 'sponsored_gemini', hostname: 'eonapp.ch' }), { status: 200, headers: { 'content-type': 'application/json' } });
    return okVexrailResponse();
  };
  try {
    const response = await onRequestPost(context); assert.equal(response.status, 200); assert.equal(seen.length, 2);
    const vexrailCall = seen.find((entry) => entry.url === VEXRAIL_UPSTREAM); assert.ok(vexrailCall);
    assert.equal(vexrailCall.body.includes('valid-human-token'), false);
  } finally { globalThis.fetch = originalFetch; }
});

test('invalid Turnstile action or hostname fails closed before Vexrail', async () => {
  for (const result of [{ success: true, action: 'other', hostname: 'eonapp.ch' }, { success: true, action: 'sponsored_gemini', hostname: 'evil.example' }]) {
    const context = await makeContext({ environment: 'production', authRollout: 'public', method: 'POST', turnstileMode: 'required', body: { ...normalBody(), turnstileToken: 'bad-human-token' } });
    const originalFetch = globalThis.fetch; let vexrailCalls = 0;
    globalThis.fetch = async (url) => String(url).includes('/turnstile/') ? new Response(JSON.stringify(result), { status: 200, headers: { 'content-type': 'application/json' } }) : (vexrailCalls++, okVexrailResponse());
    try { const response = await onRequestPost(context); assert.equal(response.status, 403); assert.equal(vexrailCalls, 0); } finally { globalThis.fetch = originalFetch; }
  }
});

test('POST forwards only bounded payload with server publisher headers', async () => {
  const context = await makeContext({ method: 'POST', body: { model: 'attacker-model', apiKey: 'private-key', tools: [{ google_search: {} }], grounding: true, messages: [{ role: 'user', content: 'hello' }], sponsoredOptIn: true } });
  const originalFetch = globalThis.fetch; let captured = null;
  globalThis.fetch = async (url, options = {}) => { captured = { url: String(url), options, body: JSON.parse(String(options.body || '{}')) }; return okVexrailResponse(); };
  try {
    const response = await onRequestPost(context); assert.equal(response.status, 200); assert.equal(captured.url, VEXRAIL_UPSTREAM);
    assert.equal(captured.options.headers['x-secret-key'], 'test-server-secret'); assert.equal(captured.body.model, DYNAMIC_MODEL_ID);
    for (const key of ['apiKey', 'tools', 'grounding', 'turnstileToken', 'sponsoredOptIn', 'sponsored_opt_in']) assert.equal(key in captured.body, false);
  } finally { globalThis.fetch = originalFetch; }
});

test('malformed request consumes no Trust budget', async () => {
  const context = await makeContext({ method: 'POST', body: { messages: [] } });
  const before = context.env.EON_TRUST_DB.sqlite.prepare('SELECT COUNT(*) AS count FROM eon_trust_submission_limits').get();
  const response = await onRequestPost(context); const after = context.env.EON_TRUST_DB.sqlite.prepare('SELECT COUNT(*) AS count FROM eon_trust_submission_limits').get();
  assert.equal(response.status, 400); assert.equal((await response.json()).error, 'vexrail_invalid_request'); assert.equal(Number(before?.count || 0), 0); assert.equal(Number(after?.count || 0), 0);
});

test('rate-limit ledger stores only salted hashes, never raw account or network identifiers', async () => {
  const ip = '198.51.100.222';
  const context = await makeContext({ method: 'POST', ip, body: normalBody() });
  const originalFetch = globalThis.fetch; globalThis.fetch = async () => okVexrailResponse();
  try {
    assert.equal((await onRequestPost(context)).status, 200);
    const rows = context.env.EON_TRUST_DB.sqlite.prepare('SELECT bucket_key FROM eon_trust_submission_limits').all();
    assert.ok(rows.length >= 5);
    assert.equal(JSON.stringify(rows).includes(ip), false);
    assert.equal(JSON.stringify(rows).includes('account_free_vexrail'), false);
  } finally { globalThis.fetch = originalFetch; }
});

test('SSE streaming remains proxied without publisher credential exposure', async () => {
  const context = await makeContext({ method: 'POST', body: { messages: [{ role: 'user', content: 'stream' }], stream: true } });
  const originalFetch = globalThis.fetch; globalThis.fetch = async () => new Response('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\ndata: [DONE]\n\n', { status: 200, headers: { 'content-type': 'text/event-stream' } });
  try { const response = await onRequestPost(context); assert.equal(response.status, 200); assert.match(response.headers.get('content-type') || '', /text\/event-stream/); assert.doesNotMatch(await response.text(), /test-server-secret|test-publishable-value/); } finally { globalThis.fetch = originalFetch; }
});

test('upstream error body is not leaked', async () => {
  const context = await makeContext({ method: 'POST', body: normalBody() });
  const originalFetch = globalThis.fetch; globalThis.fetch = async () => new Response('private provider diagnostic', { status: 500 });
  try { const response = await onRequestPost(context); assert.equal(response.status, 500); const payload = await response.json(); assert.equal(payload.error, 'vexrail_upstream_500'); assert.equal(JSON.stringify(payload).includes('private provider diagnostic'), false); } finally { globalThis.fetch = originalFetch; }
});

test('Trust or billing authority failure keeps Sponsored AI unavailable', async () => {
  const trustMissing = await makeContext(); delete trustMissing.env.EON_TRUST_RATE_LIMIT_SALT;
  assert.equal((await (await onRequestGet(trustMissing)).json()).reason, 'vexrail_rate_limit_unavailable');
  const billingMissing = await makeContext(); delete billingMissing.env.EON_BILLING_DB;
  assert.equal((await (await onRequestGet(billingMissing)).json()).reason, 'vexrail_billing_unavailable');
});

test('client Sponsored AI control supports one eligible guest bootstrap, then signed-in continuation, and Turnstile', () => {
  const catalog = read('assets/js/chat/ai-provider-catalog.js');
  const runtime = read('assets/js/chat/ai-runtime.js');
  const chat = read('assets/js/chat-page.js');
  assert.equal(SERVER_MANAGED_AI_PROVIDER_CONTRACTS.vexrail.browserRoute, '/api/ai/vexrail');
  assert.equal(SERVER_MANAGED_AI_PROVIDER_CONTRACTS.vexrail.monetization.byokCredentialForwarding, false);
  assert.match(catalog, /eligible unsigned visitor may receive one automatic first Sponsored AI answer/);
  assert.match(runtime, /guestSponsoredBootstrap/);
  assert.match(runtime, /guestOneShotAvailable/);
  assert.match(runtime, /payload\.guestOneShot = true/);
  assert.match(chat, /allowGuestSponsoredBootstrap: true/);
  assert.match(chat, /Sign in to keep using Sponsored AI/);
  assert.match(chat, /chat-use-sponsored-gemini/);
  assert.match(chat, /Sign in with Google to use Sponsored AI/);
  assert.match(chat, /Your paid plan remains ad-free by default\. Switch EONBOT to Sponsored AI/);
  assert.match(runtime, /VEXRAIL_TURNSTILE_SCRIPT/);
  assert.match(runtime, /\/api\/ai\/vexrail-readiness/);
  assert.match(runtime, /dynamicCoverageReady/);
  assert.match(runtime, /dynamicRoutingVerified/);
  assert.match(runtime, /action: 'sponsored_gemini'/);
  assert.match(runtime, /body\.turnstileToken = turnstileToken/);
  assert.match(runtime, /payload\.turnstileToken = turnstileToken/);
  assert.match(runtime, /resolveEonSponsoredAiContext/);
  assert.match(runtime, /memoryLimit: isSponsoredVexrail \? sponsoredContext\.memoryLimit : cappedBudget\.memoryLimit/);
  assert.match(runtime, /memoryCardFilter: isSponsoredVexrail \? sponsoredContext\.memoryCardFilter : undefined/);
  assert.match(runtime, /recentOutcomeContext: isSponsoredVexrail \? sponsoredContext\.recentOutcomeContext : undefined/);
  assert.match(runtime, /resolveEonSponsoredAiResearchPacket/);
  assert.match(runtime, /const queuedClientResearchPacket = isForgeCodeTask \? null : consumeEonClientResearchPacket/);
  assert.match(runtime, /never claim autonomous browsing, hidden web access/);
  assert.match(chat, /chat-sponsored-context-policy/);
  assert.match(chat, /Share selected context/);
  assert.match(chat, /Memory Off always wins/);
  assert.match(chat, /client-only Research Ledger/);
  assert.match(chat, /max 3 bounded sources/);
  assert.match(runtime, /vexrail_paid_fair_use_limited/);
  assert.match(runtime, /vexrail_network_rate_limited/);
  assert.match(runtime, /vexrail_country_budget_limited/);
  assert.match(runtime, /vexrail_global_budget_limited/);
});

test('Local AI and BYOK remain unsponsored and cannot be forwarded through Vexrail', () => {
  const route = read('functions/api/ai/vexrail.js');
  const providerContract = read('assets/js/ai-kernel/eon-provider-execution-contract.js');
  const privacy = read('privacy.html');
  assert.match(route, /byokCredentialAccepted: false/);
  assert.match(route, /groundingForwarded: false/);
  assert.match(providerContract, /device-local/);
  assert.match(providerContract, /direct-to-provider/);
  assert.match(privacy, /BYOK provider credentials are never forwarded to Vexrail/);
  assert.match(privacy, /Local AI stays on the selected local runtime/);
});

test('Wrangler policy keeps dynamic server-only model routing, signed-in launch gates and Production circuit breakers', () => {
  const wrangler = read('wrangler.jsonc');
  assert.doesNotMatch(wrangler, /EON_VEXRAIL_GUEST_ENABLED/);
  assert.doesNotMatch(wrangler, /\bVEXRAIL_MODEL\b/);
  assert.match(wrangler, /"EON_VEXRAIL_COUNTRIES": "US,CA,GB,DE,IN"/);
  assert.match(wrangler, /"EON_VEXRAIL_COUNTRIES": "[^"\n]*\bIN\b/);
  assert.doesNotMatch(wrangler, /"EON_VEXRAIL_PAID_FAIR_USE_HOURLY_CAP": "30"/);
  assert.doesNotMatch(wrangler, /"EON_VEXRAIL_FREE_DAILY_TOKEN_CAP": "80000"/);
  assert.doesNotMatch(wrangler, /"EON_VEXRAIL_PAID_DAILY_TOKEN_CAP": "120000"/);
  assert.doesNotMatch(wrangler, /"EON_VEXRAIL_COUNTRY_DAILY_TOKEN_CAP": "750000"/);
  assert.doesNotMatch(wrangler, /"EON_VEXRAIL_GLOBAL_DAILY_TOKEN_CAP": "2000000"/);
  assert.match(wrangler, /"EON_VEXRAIL_TURNSTILE_MODE": "required"/);
  assert.match(wrangler, /"EON_VEXRAIL_REQUIRE_CF_METADATA": "true"/);
});

test('CSP permits only the Turnstile script origin required by Sponsored AI human verification', () => {
  const headers = read('_headers');
  const localAiContract = read('config/local-ai-browser-contract.mjs');
  assert.match(localAiContract, /script-src[^\n]*https:\/\/challenges\.cloudflare\.com/, 'The CSP generator must retain Turnstile for regenerated Chat headers.');
  assert.match(headers, /script-src[^\n]*https:\/\/challenges\.cloudflare\.com/);
  for (const route of ['/', '/index.html', '/chat', '/chat/', '/chat.html']) {
    const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(headers, new RegExp(`${escapedRoute}\\n  ! Content-Security-Policy\\n  Content-Security-Policy:[^\\n]*https://challenges\\.cloudflare\\.com`), `${route} must not override Turnstile out of the Chat CSP.`);
  }
});

test('AdSense meta helper is validated and idempotent', () => {
  const input = '<html><head><title>EON</title></head><body></body></html>';
  const twice = injectGoogleAdsenseAccountMeta(injectGoogleAdsenseAccountMeta(input));
  assert.equal(GOOGLE_ADSENSE_ACCOUNT, 'ca-pub-6759380023085970');
  assert.equal((twice.match(/name="google-adsense-account"/g) || []).length, 1);
  assert.throws(() => injectGoogleAdsenseAccountMeta(input, 'bad-account'), /Invalid Google AdSense account identifier/);
});

test('AdSense verification remains source-tracked while display JS stays off', () => {
  assert.equal(read('ads.txt').trim(), GOOGLE_ADSENSE_ADS_TXT_LINE);
  assert.equal(read('public/ads.txt').trim(), GOOGLE_ADSENSE_ADS_TXT_LINE);
  assert.equal(read('public/21a049158b88ba5753ef69b45659efd9.html').trim(), '21a049158b88ba5753ef69b45659efd9');
  const html = fs.readdirSync(root).filter((name) => name.endsWith('.html')).map((name) => read(name)).join('\n');
  assert.doesNotMatch(html, /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/);
});

test('economic limits use one-day windows where intended', () => {
  assert.equal(DAY_MS, 86_400_000);
  const route = read('functions/api/ai/vexrail.js');
  assert.match(route, /vexrail_account_daily/);
  assert.match(route, /vexrail_network_daily/);
  assert.match(route, /vexrail_country_daily/);
  assert.match(route, /vexrail_global_daily/);
  assert.match(route, /vexrail_free_token_daily/);
  assert.match(route, /vexrail_country_token_daily/);
  assert.match(route, /vexrail_global_token_daily/);
});

test('RT92 Wrangler consolidation retains Production Vexrail policy through tested source defaults', () => {
  const config = getVexrailConfig({
    EON_ENVIRONMENT: 'production', APP_ORIGIN: 'https://eonapp.ch', EON_VEXRAIL_ROLLOUT: 'production',
    VEXRAIL_SECRET_KEY: 'secret', VEXRAIL_PUBLISHABLE_KEY: 'publishable', EON_VEXRAIL_MODEL_ECONOMICS_JSON: DYNAMIC_ECONOMICS_RAW,
    EON_VEXRAIL_PROFIT_GOVERNOR_MODE: 'enforce', EON_VEXRAIL_LEARNING_PROMPT_BUDGET: '100',
    EON_VEXRAIL_GUEST_ONE_SHOT: 'true', EON_VEXRAIL_GEO_MODE: 'selected_countries', EON_VEXRAIL_COUNTRIES: 'US,CA,GB,DE',
    EON_VEXRAIL_PAID_SPONSORED_OPT_IN: 'true', EON_VEXRAIL_REQUIRE_CF_METADATA: 'true', EON_VEXRAIL_TURNSTILE_MODE: 'required',
    EON_VEXRAIL_TURNSTILE_SITE_KEY: 'site', EON_VEXRAIL_TURNSTILE_SECRET: 'turnstile-secret'
  });
  const governor = getVexrailProfitabilityGovernorConfig({ EON_VEXRAIL_PROFIT_GOVERNOR_MODE: 'enforce', EON_VEXRAIL_LEARNING_PROMPT_BUDGET: '100' });
  assert.deepEqual(governor, { mode: 'enforce', targetRatio: 1.25, minimumPrompts: 200, windowDays: 7, learningLossBudgetMicros: 0, learningPromptBudget: 100 });
  assert.deepEqual({ guestOneShotEnabled: config.guestOneShotEnabled, guestNetworkDailyCap: config.guestNetworkDailyCap, guestMaxOutputTokens: config.guestMaxOutputTokens, guestCookieDays: config.guestCookieDays, globalDailyCap: config.globalDailyCap, countryDailyCap: config.countryDailyCap, networkHourlyCap: config.networkHourlyCap, networkDailyCap: config.networkDailyCap, freeDailyCap: config.freeDailyCap, paidFairUseHourlyCap: config.paidFairUseHourlyCap, paidDailyCap: config.paidDailyCap, freeDailyTokenCap: config.freeDailyTokenCap, paidDailyTokenCap: config.paidDailyTokenCap, countryDailyTokenCap: config.countryDailyTokenCap, globalDailyTokenCap: config.globalDailyTokenCap, botScoreMin: config.botScoreMin, requireCfMetadata: config.requireCfMetadata, turnstileMode: config.turnstileMode, geoMode: config.geoMode, countries: config.countries }, { guestOneShotEnabled: true, guestNetworkDailyCap: 5, guestMaxOutputTokens: 768, guestCookieDays: 30, globalDailyCap: 1000, countryDailyCap: 400, networkHourlyCap: 80, networkDailyCap: 300, freeDailyCap: 60, paidFairUseHourlyCap: 30, paidDailyCap: 100, freeDailyTokenCap: 80000, paidDailyTokenCap: 120000, countryDailyTokenCap: 750000, globalDailyTokenCap: 2000000, botScoreMin: 30, requireCfMetadata: true, turnstileMode: 'required', geoMode: 'selected_countries', countries: ['CA', 'DE', 'GB', 'US'] });
});

test('RT92 Wrangler consolidation keeps Preview non-default caps while removed values use source defaults', () => {
  const config = getVexrailConfig({ EON_ENVIRONMENT: 'preview', EON_VEXRAIL_ROLLOUT: 'testing', VEXRAIL_SECRET_KEY: 'secret', VEXRAIL_PUBLISHABLE_KEY: 'publishable', EON_VEXRAIL_MODEL_ECONOMICS_JSON: DYNAMIC_ECONOMICS_RAW, EON_VEXRAIL_GUEST_ONE_SHOT: 'true', EON_VEXRAIL_GEO_MODE: 'testing', EON_VEXRAIL_PAID_SPONSORED_OPT_IN: 'true', EON_VEXRAIL_COUNTRY_DAILY_TOKEN_CAP: '300000', EON_VEXRAIL_GLOBAL_DAILY_TOKEN_CAP: '500000', EON_VEXRAIL_GLOBAL_DAILY_CAP: '5000', EON_VEXRAIL_REQUIRE_CF_METADATA: 'false', EON_VEXRAIL_TURNSTILE_MODE: 'off' });
  assert.deepEqual({ mode: config.profitabilityGovernor.mode, targetRatio: config.profitabilityGovernor.targetRatio, minimumPrompts: config.profitabilityGovernor.minimumPrompts, windowDays: config.profitabilityGovernor.windowDays, learningPromptBudget: config.profitabilityGovernor.learningPromptBudget, learningLossBudgetMicros: config.profitabilityGovernor.learningLossBudgetMicros, guestNetworkDailyCap: config.guestNetworkDailyCap, guestMaxOutputTokens: config.guestMaxOutputTokens, guestCookieDays: config.guestCookieDays, countryDailyTokenCap: config.countryDailyTokenCap, globalDailyTokenCap: config.globalDailyTokenCap, globalDailyCap: config.globalDailyCap, botScoreMin: config.botScoreMin }, { mode: 'observe', targetRatio: 1.25, minimumPrompts: 200, windowDays: 7, learningPromptBudget: 50, learningLossBudgetMicros: 0, guestNetworkDailyCap: 5, guestMaxOutputTokens: 768, guestCookieDays: 30, countryDailyTokenCap: 300000, globalDailyTokenCap: 500000, globalDailyCap: 5000, botScoreMin: 30 });
  const source = read('wrangler.jsonc');
  const production = source.match(/"production":\s*\{\s*"vars":\s*\{([\s\S]*?)\n\s*\},\s*\n\s*"d1_databases"/)?.[1] || '';
  const preview = source.match(/"preview":\s*\{\s*"vars":\s*\{([\s\S]*?)\n\s*\},\s*\n\s*"d1_databases"/)?.[1] || '';
  for (const key of ['EON_VEXRAIL_AI_COVERAGE_TARGET','EON_VEXRAIL_PROFIT_MIN_PROMPTS','EON_VEXRAIL_PROFIT_WINDOW_DAYS','EON_VEXRAIL_LEARNING_LOSS_BUDGET_MICROS','EON_VEXRAIL_GUEST_NETWORK_DAILY_CAP','EON_VEXRAIL_GUEST_MAX_OUTPUT_TOKENS','EON_VEXRAIL_GUEST_COOKIE_DAYS','EON_VEXRAIL_PAID_FAIR_USE_HOURLY_CAP','EON_VEXRAIL_FREE_DAILY_CAP','EON_VEXRAIL_PAID_DAILY_CAP','EON_VEXRAIL_NETWORK_HOURLY_CAP','EON_VEXRAIL_NETWORK_DAILY_CAP','EON_VEXRAIL_COUNTRY_DAILY_CAP','EON_VEXRAIL_FREE_DAILY_TOKEN_CAP','EON_VEXRAIL_PAID_DAILY_TOKEN_CAP','EON_VEXRAIL_COUNTRY_DAILY_TOKEN_CAP','EON_VEXRAIL_GLOBAL_DAILY_TOKEN_CAP','EON_VEXRAIL_BOT_SCORE_MIN','EON_VEXRAIL_GLOBAL_DAILY_CAP']) assert.doesNotMatch(production, new RegExp(`"${key}"`));
  for (const key of ['EON_VEXRAIL_PROFIT_GOVERNOR_MODE','EON_VEXRAIL_AI_COVERAGE_TARGET','EON_VEXRAIL_PROFIT_MIN_PROMPTS','EON_VEXRAIL_PROFIT_WINDOW_DAYS','EON_VEXRAIL_LEARNING_PROMPT_BUDGET','EON_VEXRAIL_LEARNING_LOSS_BUDGET_MICROS','EON_VEXRAIL_GUEST_NETWORK_DAILY_CAP','EON_VEXRAIL_GUEST_MAX_OUTPUT_TOKENS','EON_VEXRAIL_GUEST_COOKIE_DAYS','EON_VEXRAIL_PAID_FAIR_USE_HOURLY_CAP','EON_VEXRAIL_FREE_DAILY_CAP','EON_VEXRAIL_PAID_DAILY_CAP','EON_VEXRAIL_NETWORK_HOURLY_CAP','EON_VEXRAIL_NETWORK_DAILY_CAP','EON_VEXRAIL_COUNTRY_DAILY_CAP','EON_VEXRAIL_FREE_DAILY_TOKEN_CAP','EON_VEXRAIL_PAID_DAILY_TOKEN_CAP','EON_VEXRAIL_BOT_SCORE_MIN']) assert.doesNotMatch(preview, new RegExp(`"${key}"`));
});

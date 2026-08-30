import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { applyBillingMigrations, applyIdentityMigrations } from '../helpers/eon-d1-test-migrations.mjs';
import { createSession } from '../../functions/_shared/eon-auth.js';
import { captureEonGrowthAttribution, parseEonGrowthAttribution, readEonGrowthFirstTouch, EON_GROWTH_EVENTS } from '../../assets/js/growth/eon-growth-attribution.js';
import { classifyGrowthUserAgent, EON_GROWTH_EVENT_NAMES, EON_PUBLIC_GROWTH_EVENT_NAMES, normalizeGrowthAttribution, recordGrowthAccountLifecycle, recordGrowthEvent } from '../../functions/_shared/eon-growth-attribution.js';
import { onRequestPost as growthEventPost } from '../../functions/api/growth/event.js';

function d1(sqlite) {
  const api = {
    prepare(sql) {
      const stmt = sqlite.prepare(sql);
      return {
        bind(...args) {
          return {
            async run() { const info = stmt.run(...args); return { success: true, meta: { changes: Number(info?.changes || 0) } }; },
            async first() { return stmt.get(...args) || null; },
            async all() { return { results: stmt.all(...args) }; }
          };
        },
        async run() { const info = stmt.run(); return { success: true, meta: { changes: Number(info?.changes || 0) } }; },
        async first() { return stmt.get() || null; },
        async all() { return { results: stmt.all() }; }
      };
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {
        const output = [];
        for (const statement of statements) output.push(await statement.run());
        sqlite.exec('COMMIT');
        return output;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    }
  };
  return api;
}

function applyTrust(sqlite) {
  for (const file of [
    'migrations/trust/0001_trust_support_incident_authority.sql',
    'migrations/trust/0002_vexrail_economic_aggregate.sql',
    'migrations/trust/0003_growth_profitability_authority.sql',
    'migrations/trust/0004_growth_operational_events.sql'
  ]) sqlite.exec(readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8'));
}

test('RT92 growth attribution captures official-style PPCmate macros without prompt or IP data', () => {
  const parsed = parseEonGrowthAttribution('https://eonapp.ch/?utm_source=ppcmate&utm_medium=programmatic&utm_campaign=42&utm_content=99&utm_term=native-zone&ppc_click_id=click-123&ppc_country=CAN&ppc_os=Windows&ppc_ssp=ssp-a&ppc_tracking_id=t-7', 1000);
  assert.equal(parsed.source, 'ppcmate');
  assert.equal(parsed.campaign, '42');
  assert.equal(parsed.creative, '99');
  assert.equal(parsed.placement, 'native-zone');
  assert.equal(parsed.clickId, 'click-123');
  assert.equal(parsed.ppcCountry, 'CAN');
  assert.equal(parsed.ppcOs, 'Windows');
  assert.equal(parsed.ppcSsp, 'ssp-a');
  assert.equal(parsed.ppcTrackingId, 't-7');
  assert.ok(EON_GROWTH_EVENTS.includes('first_prompt'));
  assert.equal('prompt' in parsed, false);
  assert.equal('ip' in parsed, false);
});

test('RT95 attribution retains a privacy-safe first touch while normalizing campaign sources', () => {
  const store = new Map();
  const environment = {
    location: { href: 'https://eonapp.ch/?utm_source=Clickadilla&utm_medium=cpc&utm_campaign=de_test_01' },
    sessionStorage: { getItem: (key) => store.get(`s:${key}`) || null, setItem: (key, value) => store.set(`s:${key}`, value) },
    localStorage: { getItem: (key) => store.get(`l:${key}`) || null, setItem: (key, value) => store.set(`l:${key}`, value) }
  };
  const session = captureEonGrowthAttribution(environment);
  assert.equal(session.source, 'clickadilla');
  assert.equal(session.campaign, 'de_test_01');
  assert.equal(readEonGrowthFirstTouch(environment).source, 'clickadilla');
  environment.location.href = 'https://eonapp.ch/';
  assert.equal(captureEonGrowthAttribution(environment).campaign, 'de_test_01', 'a direct revisit keeps the current session attribution');
  environment.location.href = 'https://eonapp.ch/?utm_source=ppcmate&utm_medium=cpc&utm_campaign=de_test_02';
  assert.equal(captureEonGrowthAttribution(environment).campaign, 'de_test_02', 'a new campaign updates the current session attribution');
  assert.equal(readEonGrowthFirstTouch(environment).campaign, 'de_test_01', 'first touch is immutable across later campaigns');
  assert.equal(parseEonGrowthAttribution('https://eonapp.ch/').source, 'direct');
  assert.equal(EON_GROWTH_EVENT_NAMES.has('vexrail_response_success'), true);
  assert.equal(EON_PUBLIC_GROWTH_EVENT_NAMES.has('vexrail_response_success'), false);
  assert.equal(EON_PUBLIC_GROWTH_EVENT_NAMES.has('paid_subscription'), false);
  assert.equal(JSON.stringify(session).includes('prompt'), false);
});

test('RT92 growth server normalization is bounded and UA classification is coarse', () => {
  const normalized = normalizeGrowthAttribution({ source: 'ppcmate<script>', campaign: 'abc 123', clickId: 'id!@#$%^&*()' });
  assert.equal(normalized.source.includes('<'), false);
  assert.ok(normalized.source.length <= 120);
  assert.ok(normalized.clickId.length <= 120);
  const ua = classifyGrowthUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151.0 Safari/537.36');
  assert.deepEqual(ua, { deviceClass: 'desktop', osFamily: 'windows', browserFamily: 'chrome' });
});

test('RT97 Trust migration v4 preserves aggregate acquisition/profitability authorities and expands operational event names', () => {
  const sqlite = new DatabaseSync(':memory:');
  try {
    applyTrust(sqlite);
    const authority = sqlite.prepare("SELECT schema_version,migration_name FROM eon_schema_authority WHERE domain='trust'").get();
    assert.equal(authority.schema_version, 4);
    assert.equal(authority.migration_name, '0004_growth_operational_events.sql');
    for (const table of ['eon_growth_event_daily','eon_growth_click_attribution','eon_growth_subject_cohort','eon_growth_lifecycle_receipts','eon_profitability_daily','eon_vexrail_model_daily']) {
      assert.ok(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table));
    }
  } finally { sqlite.close(); }
});

test('RT92 guest first_prompt is stored only as aggregate dimensions and HMAC click continuity', async () => {
  const sqlite = new DatabaseSync(':memory:');
  try {
    applyTrust(sqlite);
    const request = new Request('https://eonapp.ch/api/growth/event', { method: 'POST', headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/151.0' } });
    Object.defineProperty(request, 'cf', { value: { country: 'CA' } });
    const result = await recordGrowthEvent(d1(sqlite), { event: 'first_prompt', attribution: { source: 'ppcmate', campaign: 'c1', creative: 'a1', clickId: 'raw-click-id' } }, request, { EON_TRUST_RATE_LIMIT_SALT: 'x'.repeat(40) }, 1_800_000_000_000);
    assert.equal(result.ok, true);
    assert.equal(result.signedIn, false);
    const row = sqlite.prepare('SELECT event_name,source,campaign,creative,country,event_count FROM eon_growth_event_daily').get();
    assert.deepEqual({ ...row }, { event_name: 'first_prompt', source: 'ppcmate', campaign: 'c1', creative: 'a1', country: 'CA', event_count: 1 });
    const click = sqlite.prepare('SELECT click_hash,first_prompt_count FROM eon_growth_click_attribution').get();
    assert.notEqual(click.click_hash, 'raw-click-id');
    assert.equal(click.first_prompt_count, 1);
    assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM eon_growth_subject_cohort').get().n, 0);
  } finally { sqlite.close(); }
});


test('RT92 growth event endpoint rejects cross-origin writes before touching telemetry', async () => {
  const request = new Request('https://eonapp.ch/api/growth/event', {
    method: 'POST',
    headers: { origin: 'https://evil.example', 'sec-fetch-site': 'cross-site', 'content-type': 'application/json' },
    body: JSON.stringify({ event: 'landing_view', attribution: { source: 'ppcmate' } })
  });
  const response = await growthEventPost({ request, env: {} });
  assert.equal(response.status, 403);
  const body = await response.json();
  assert.equal(body.error, 'same_origin_required');
});

test('RT92 public growth endpoint refuses server-authoritative lifecycle events', async () => {
  const sqlite = new DatabaseSync(':memory:');
  try {
    applyTrust(sqlite);
    const request = new Request('https://eonapp.ch/api/growth/event', {
      method: 'POST',
      headers: { origin: 'https://eonapp.ch', 'sec-fetch-site': 'same-origin', 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.8' },
      body: JSON.stringify({ event: 'paid_subscription', attribution: { source: 'ppcmate' } })
    });
    const response = await growthEventPost({ request, env: { EON_TRUST_DB: d1(sqlite), EON_TRUST_RATE_LIMIT_SALT: 'y'.repeat(40) } });
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error, 'growth_event_server_only');
    assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM eon_growth_event_daily WHERE event_name='paid_subscription'").get().n, 0);
  } finally { sqlite.close(); }
});

test('RT95 browser cannot forge server-authoritative Vexrail transport or revenue evidence', async () => {
  const sqlite = new DatabaseSync(':memory:');
  try {
    applyTrust(sqlite);
    const request = new Request('https://eonapp.ch/api/growth/event', {
      method: 'POST', headers: { origin: 'https://eonapp.ch', 'sec-fetch-site': 'same-origin', 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.80' },
      body: JSON.stringify({ event: 'vexrail_response_success', attribution: { source: 'ppcmate' }, response: 'never-record-this', revenue_micros: 999999 })
    });
    const response = await growthEventPost({ request, env: { EON_TRUST_DB: d1(sqlite), EON_TRUST_RATE_LIMIT_SALT: 'v'.repeat(40) } });
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error, 'growth_event_server_only');
    assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM eon_growth_event_daily WHERE event_name='vexrail_response_success'").get().n, 0);
  } finally { sqlite.close(); }
});


test('RT92 signup attribution is accepted only for a fresh authenticated account and deduped', async () => {
  const trustSqlite = new DatabaseSync(':memory:');
  const identitySqlite = new DatabaseSync(':memory:');
  try {
    applyTrust(trustSqlite);
    applyIdentityMigrations(identitySqlite);
    const identityDb = d1(identitySqlite);
    const now = Date.now();
    identitySqlite.prepare(`INSERT INTO eon_identity_accounts(account_id,identity_ref_hmac,email_verified,consent_version,created_at,last_login_at,consent_at) VALUES(?,?,?,?,?,?,?)`)
      .run('acct_growth_new', 'hmac-ref', 1, 'v1', now, now, now);
    const session = await createSession({ database: identityDb, sessionKey: 'signup-session-key'.repeat(3) }, 'acct_growth_new');
    const env = {
      APP_ORIGIN: 'https://eonapp.ch', GOOGLE_REDIRECT_URI: 'https://eonapp.ch/api/auth/google/callback',
      GOOGLE_OAUTH_CLIENT_ID: 'client.apps.googleusercontent.com', GOOGLE_OAUTH_CLIENT_SECRET: 'secret',
      EON_AUTH_SUBJECT_PEPPER: 'pepper', EON_SESSION_SIGNING_KEY: 'signup-session-key'.repeat(3),
      EON_OAUTH_FLOW_SIGNING_KEY: 'flow-key'.repeat(8), EON_AUTH_ROLLOUT: 'testing', EON_IDENTITY_DB: identityDb,
      EON_TRUST_DB: d1(trustSqlite), EON_TRUST_RATE_LIMIT_SALT: 'z'.repeat(40)
    };
    const makeRequest = () => new Request('https://eonapp.ch/api/growth/event', {
      method: 'POST', headers: { origin: 'https://eonapp.ch', 'sec-fetch-site': 'same-origin', 'content-type': 'application/json',
        'cf-connecting-ip': '203.0.113.9', cookie: `__Host-eon_session=${session.sessionId}` },
      body: JSON.stringify({ event: 'signup', attribution: { source: 'ppcmate', campaign: 'c-signup', clickId: 'click-signup' } })
    });
    const first = await growthEventPost({ request: makeRequest(), env });
    assert.equal(first.status, 200);
    const second = await growthEventPost({ request: makeRequest(), env });
    assert.equal(second.status, 200);
    assert.equal(trustSqlite.prepare("SELECT event_count FROM eon_growth_event_daily WHERE event_name='signup'").get().event_count, 1);
    assert.equal(trustSqlite.prepare('SELECT signup_count FROM eon_growth_click_attribution').get().signup_count, 1);
  } finally { trustSqlite.close(); identitySqlite.close(); }
});

test('RT92 derived second-session and D7 retention stay attributed to the original acquisition cohort', async () => {
  const trustSqlite = new DatabaseSync(':memory:');
  const identitySqlite = new DatabaseSync(':memory:');
  try {
    applyTrust(trustSqlite);
    applyIdentityMigrations(identitySqlite);
    const identityDb = d1(identitySqlite);
    const firstSeen = Date.parse('2026-08-01T12:00:00Z');
    identitySqlite.prepare(`INSERT INTO eon_identity_accounts(account_id,identity_ref_hmac,email_verified,consent_version,created_at,last_login_at,consent_at) VALUES(?,?,?,?,?,?,?)`)
      .run('acct_growth_retention', 'hmac-retention', 1, 'v1', firstSeen, firstSeen, firstSeen);
    const session = await createSession({ database: identityDb, sessionKey: 'retention-session-key'.repeat(3) }, 'acct_growth_retention');
    const env = {
      APP_ORIGIN: 'https://eonapp.ch', GOOGLE_REDIRECT_URI: 'https://eonapp.ch/api/auth/google/callback',
      GOOGLE_OAUTH_CLIENT_ID: 'client.apps.googleusercontent.com', GOOGLE_OAUTH_CLIENT_SECRET: 'secret',
      EON_AUTH_SUBJECT_PEPPER: 'pepper', EON_SESSION_SIGNING_KEY: 'retention-session-key'.repeat(3),
      EON_OAUTH_FLOW_SIGNING_KEY: 'flow-key'.repeat(8), EON_AUTH_ROLLOUT: 'testing', EON_IDENTITY_DB: identityDb,
      EON_TRUST_RATE_LIMIT_SALT: 'r'.repeat(40)
    };
    const makeRequest = (country = 'CA') => {
      const request = new Request('https://eonapp.ch/api/growth/event', {
        method: 'POST', headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/151.0', cookie: `__Host-eon_session=${session.sessionId}` }
      });
      Object.defineProperty(request, 'cf', { value: { country } });
      return request;
    };
    const trustDb = d1(trustSqlite);
    const acquired = await recordGrowthEvent(trustDb, {
      event: 'landing_view', attribution: { source: 'ppcmate', medium: 'native', campaign: 'campaign-retain', creative: 'creative-retain', placement: 'zone-retain' }
    }, makeRequest('CA'), env, firstSeen);
    assert.equal(acquired.ok, true);
    const returnedAt = firstSeen + (8 * 24 * 60 * 60 * 1000);
    const returned = await recordGrowthEvent(trustDb, { event: 'landing_view', attribution: {} }, makeRequest('US'), env, returnedAt);
    assert.equal(returned.ok, true);
    const second = trustSqlite.prepare("SELECT source,campaign,creative,placement,country,event_count FROM eon_growth_event_daily WHERE event_name='second_session'").get();
    assert.deepEqual({ ...second }, { source: 'ppcmate', campaign: 'campaign-retain', creative: 'creative-retain', placement: 'zone-retain', country: 'CA', event_count: 1 });
    const d7 = trustSqlite.prepare("SELECT source,campaign,creative,placement,country,event_count FROM eon_growth_event_daily WHERE event_name='7_day_return'").get();
    assert.deepEqual({ ...d7 }, { source: 'ppcmate', campaign: 'campaign-retain', creative: 'creative-retain', placement: 'zone-retain', country: 'CA', event_count: 1 });
    const ledger = trustSqlite.prepare("SELECT source,campaign,creative,placement,country,d7_return_count FROM eon_profitability_daily WHERE d7_return_count>0").get();
    assert.deepEqual({ ...ledger }, { source: 'ppcmate', campaign: 'campaign-retain', creative: 'creative-retain', placement: 'zone-retain', country: 'CA', d7_return_count: 1 });
  } finally { trustSqlite.close(); identitySqlite.close(); }
});


test('RT92 authoritative account lifecycle events are one-time, atomic and retain the original acquisition device cohort', async () => {
  const trustSqlite = new DatabaseSync(':memory:');
  const identitySqlite = new DatabaseSync(':memory:');
  try {
    applyTrust(trustSqlite);
    applyIdentityMigrations(identitySqlite);
    const identityDb = d1(identitySqlite);
    const now = Date.parse('2026-08-17T10:00:00Z');
    identitySqlite.prepare(`INSERT INTO eon_identity_accounts(account_id,identity_ref_hmac,email_verified,consent_version,created_at,last_login_at,consent_at) VALUES(?,?,?,?,?,?,?)`)
      .run('acct_growth_paid', 'hmac-paid', 1, 'v1', now, now, now);
    const session = await createSession({ database: identityDb, sessionKey: 'paid-session-key'.repeat(3) }, 'acct_growth_paid');
    const env = {
      APP_ORIGIN: 'https://eonapp.ch', GOOGLE_REDIRECT_URI: 'https://eonapp.ch/api/auth/google/callback',
      GOOGLE_OAUTH_CLIENT_ID: 'client.apps.googleusercontent.com', GOOGLE_OAUTH_CLIENT_SECRET: 'secret',
      EON_AUTH_SUBJECT_PEPPER: 'pepper', EON_SESSION_SIGNING_KEY: 'paid-session-key'.repeat(3),
      EON_OAUTH_FLOW_SIGNING_KEY: 'flow-key'.repeat(8), EON_AUTH_ROLLOUT: 'testing', EON_IDENTITY_DB: identityDb,
      EON_TRUST_RATE_LIMIT_SALT: 'p'.repeat(40)
    };
    const request = new Request('https://eonapp.ch/api/growth/event', { headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/151.0', cookie: `__Host-eon_session=${session.sessionId}`
    }});
    Object.defineProperty(request, 'cf', { value: { country: 'CA' } });
    const trustDb = d1(trustSqlite);
    await recordGrowthEvent(trustDb, { event: 'landing_view', attribution: { source: 'ppcmate', medium: 'native', campaign: 'paid-campaign', creative: 'paid-creative', placement: 'paid-zone' } }, request, env, now);
    const first = await recordGrowthAccountLifecycle(trustDb, 'paid_subscription', 'acct_growth_paid', env, now + 5000);
    const duplicate = await recordGrowthAccountLifecycle(trustDb, 'paid_subscription', 'acct_growth_paid', env, now + 6000);
    assert.equal(first.ok, true);
    assert.equal(first.skipped, false);
    assert.equal(duplicate.skipped, true);
    const event = trustSqlite.prepare("SELECT source,campaign,creative,placement,country,device_class,os_family,browser_family,event_count FROM eon_growth_event_daily WHERE event_name='paid_subscription'").get();
    assert.deepEqual({ ...event }, { source: 'ppcmate', campaign: 'paid-campaign', creative: 'paid-creative', placement: 'paid-zone', country: 'CA', device_class: 'desktop', os_family: 'windows', browser_family: 'chrome', event_count: 1 });
    const ledger = trustSqlite.prepare('SELECT user_cohort,paid_subscription_count FROM eon_profitability_daily WHERE paid_subscription_count>0').get();
    assert.deepEqual({ ...ledger }, { user_cohort: 'paid', paid_subscription_count: 1 });
    assert.equal(trustSqlite.prepare("SELECT COUNT(*) AS n FROM eon_growth_lifecycle_receipts WHERE event_name='paid_subscription'").get().n, 1);
    assert.equal(JSON.stringify([...trustSqlite.prepare('SELECT * FROM eon_growth_lifecycle_receipts').iterate()]).includes('acct_growth_paid'), false);
  } finally { trustSqlite.close(); identitySqlite.close(); }
});

test('RT92 signed-in first_prompt derives qualified_free_user only from server billing eligibility and dedupes it', async () => {
  const trustSqlite = new DatabaseSync(':memory:');
  const identitySqlite = new DatabaseSync(':memory:');
  const billingSqlite = new DatabaseSync(':memory:');
  try {
    applyTrust(trustSqlite);
    applyIdentityMigrations(identitySqlite);
    applyBillingMigrations(billingSqlite);
    const identityDb = d1(identitySqlite);
    const now = Date.now();
    identitySqlite.prepare(`INSERT INTO eon_identity_accounts(account_id,identity_ref_hmac,email_verified,consent_version,created_at,last_login_at,consent_at) VALUES(?,?,?,?,?,?,?)`)
      .run('acct_growth_free', 'hmac-free', 1, 'v1', now, now, now);
    const session = await createSession({ database: identityDb, sessionKey: 'free-session-key'.repeat(3) }, 'acct_growth_free');
    const env = {
      APP_ORIGIN: 'https://eonapp.ch', GOOGLE_REDIRECT_URI: 'https://eonapp.ch/api/auth/google/callback',
      GOOGLE_OAUTH_CLIENT_ID: 'client.apps.googleusercontent.com', GOOGLE_OAUTH_CLIENT_SECRET: 'secret',
      EON_AUTH_SUBJECT_PEPPER: 'pepper', EON_SESSION_SIGNING_KEY: 'free-session-key'.repeat(3),
      EON_OAUTH_FLOW_SIGNING_KEY: 'flow-key'.repeat(8), EON_AUTH_ROLLOUT: 'testing', EON_IDENTITY_DB: identityDb,
      EON_BILLING_DB: d1(billingSqlite), EON_BILLING_ROLLOUT: 'testing',
      DODO_PAYMENTS_API_KEY: 'test', DODO_WEBHOOK_SECRET: 'test', EON_ENTITLEMENT_SIGNING_KEY: 'test',
      DODO_PRODUCT_PLUS: 'p_plus', DODO_PRODUCT_STUDIO: 'p_studio', DODO_PRODUCT_POWER: 'p_power', DODO_PRODUCT_MAX: 'p_max',
      EON_TRUST_DB: d1(trustSqlite), EON_TRUST_RATE_LIMIT_SALT: 'q'.repeat(40)
    };
    const makeRequest = () => new Request('https://eonapp.ch/api/growth/event', {
      method: 'POST', headers: { origin: 'https://eonapp.ch', 'sec-fetch-site': 'same-origin', 'content-type': 'application/json',
        'cf-connecting-ip': '203.0.113.19', 'user-agent': 'Mozilla/5.0 (Mac OS X) Safari/605.1.15', cookie: `__Host-eon_session=${session.sessionId}` },
      body: JSON.stringify({ event: 'first_prompt', attribution: { source: 'ppcmate', campaign: 'qualified-campaign' } })
    });
    assert.equal((await growthEventPost({ request: makeRequest(), env })).status, 200);
    assert.equal((await growthEventPost({ request: makeRequest(), env })).status, 200);
    assert.equal(trustSqlite.prepare("SELECT event_count FROM eon_growth_event_daily WHERE event_name='qualified_free_user'").get().event_count, 1);
    assert.equal(trustSqlite.prepare('SELECT qualified_free_user_count FROM eon_profitability_daily WHERE qualified_free_user_count>0').get().qualified_free_user_count, 1);
  } finally { trustSqlite.close(); identitySqlite.close(); billingSqlite.close(); }
});

async function signGrowthBillingWebhook({ id, timestamp, payload, secret }) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${payload}`));
  let binary = '';
  for (const byte of new Uint8Array(signature)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function makeGrowthBillingWebhook(payload, secret, id) {
  const raw = JSON.stringify(payload);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = await signGrowthBillingWebhook({ id, timestamp, payload: raw, secret });
  return new Request('https://eonapp.ch/api/billing/webhooks/dodo', {
    method: 'POST', headers: { 'content-type': 'application/json', 'webhook-id': id, 'webhook-timestamp': timestamp, 'webhook-signature': signature }, body: raw
  });
}

test('RT92 verified Dodo webhook derives trial and paid funnel milestones without duplicate inflation or entitlement coupling', async () => {
  const { processDodoWebhook } = await import('../../assets/js/billing/eon-dodo-live-runtime.js');
  const billingSqlite = new DatabaseSync(':memory:');
  const trustSqlite = new DatabaseSync(':memory:');
  try {
    applyBillingMigrations(billingSqlite);
    applyTrust(trustSqlite);
    const env = {
      EON_BILLING_ROLLOUT: 'testing', EON_BILLING_DB: d1(billingSqlite), EON_TRUST_DB: d1(trustSqlite),
      DODO_PAYMENTS_API_KEY: 'test_api', DODO_WEBHOOK_SECRET: 'whsec_growth_test', EON_ENTITLEMENT_SIGNING_KEY: 'entitlement_test',
      DODO_PRODUCT_PLUS: 'p_plus', DODO_PRODUCT_STUDIO: 'p_studio', DODO_PRODUCT_POWER: 'p_power', DODO_PRODUCT_MAX: 'p_max',
      DODO_PRODUCT_PRO: 'p_pro', DODO_PRODUCT_ULTRA: 'p_ultra', DODO_PRODUCT_ULTIMATE: 'p_ultimate',
      EON_PREMIUM_CHECKOUT_ROLLOUT: 'testing',
      EON_TRUST_RATE_LIMIT_SALT: 'b'.repeat(40)
    };
    const trialPayload = { type: 'subscription.active', timestamp: new Date().toISOString(), data: {
      product_id: 'p_plus', trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: { eon_account_id: 'acct_trial', eon_tier_id: 'plus' }
    }};
    const trialRequest = await makeGrowthBillingWebhook(trialPayload, env.DODO_WEBHOOK_SECRET, 'wh_trial_growth_1');
    const trial = await processDodoWebhook({ request: trialRequest, env });
    assert.equal(trial.ok, true);
    assert.equal(trial.growthLifecycle?.event, 'trial_start');
    assert.equal(billingSqlite.prepare("SELECT access_status FROM eon_billing_lifecycle WHERE account_id='acct_trial'").get().access_status, 'trialing');

    const paidPayload = { type: 'subscription.active', timestamp: new Date().toISOString(), data: {
      product_id: 'p_studio', metadata: { eon_account_id: 'acct_paid_webhook', eon_tier_id: 'studio' }
    }};
    const paidRequest = await makeGrowthBillingWebhook(paidPayload, env.DODO_WEBHOOK_SECRET, 'wh_paid_growth_1');
    const paid = await processDodoWebhook({ request: paidRequest, env });
    assert.equal(paid.ok, true);
    assert.equal(paid.growthLifecycle?.event, 'paid_subscription');
    const duplicateRequest = await makeGrowthBillingWebhook(paidPayload, env.DODO_WEBHOOK_SECRET, 'wh_paid_growth_1');
    const duplicate = await processDodoWebhook({ request: duplicateRequest, env });
    assert.equal(duplicate.ok, true);
    assert.equal(duplicate.duplicate, true);
    assert.equal(duplicate.growthLifecycle?.skipped, true);
    assert.equal(trustSqlite.prepare("SELECT event_count FROM eon_growth_event_daily WHERE event_name='trial_start'").get().event_count, 1);
    assert.equal(trustSqlite.prepare("SELECT event_count FROM eon_growth_event_daily WHERE event_name='paid_subscription'").get().event_count, 1);
    assert.equal(trustSqlite.prepare("SELECT SUM(paid_subscription_count) AS n FROM eon_profitability_daily").get().n, 1);
  } finally { billingSqlite.close(); trustSqlite.close(); }
});

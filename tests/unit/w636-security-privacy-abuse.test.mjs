import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { applyBillingMigrations } from '../helpers/eon-d1-test-migrations.mjs';
import { fileURLToPath } from 'node:url';
import {
  EON_REQUEST_LIMITS,
  readBoundedJson,
  readBoundedText,
  safeDodoUrl
} from '../../functions/_shared/eon-request-security.js';
import {
  applyDodoWebhookToD1,
  buildBillingStatusPayload,
  createDodoCheckoutSession
} from '../../assets/js/billing/eon-dodo-live-runtime.js';
import { validateW636SecurityPrivacyAbuseContract } from '../../config/w636-security-privacy-abuse-contract.mjs';
import { inspectW636SecurityPrivacyAbuse } from '../../scripts/w636-security-privacy-abuse-gate.mjs';
import { securityHeaders } from '../../functions/_shared/eon-auth.js';
import { exportKeyBackup, importKeyBackup, storeQuantumSafeKey, getQuantumSafeStatus } from '../../assets/js/utils/quantum-safe-keys.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

class D1Statement {
  constructor(database, sql, args = []) { this.database = database; this.sql = sql; this.args = args; }
  bind(...args) { return new D1Statement(this.database, this.sql, args); }
  run() { return this.database.prepare(this.sql).run(...this.args); }
  first() { return this.database.prepare(this.sql).get(...this.args) || null; }
  all() { return { results: this.database.prepare(this.sql).all(...this.args) }; }
}
function migratedBillingDatabase() {
  const sqlite = new DatabaseSync(':memory:');
  applyBillingMigrations(sqlite);
  return {
    sqlite,
    prepare(sql) { return new D1Statement(sqlite, sql); },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try { const output = statements.map((row) => row.run()); sqlite.exec('COMMIT'); return output; }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    }
  };
}

function statement({ first = null } = {}) {
  return {
    bind() { return this; },
    async run() { return { success: true }; },
    async first() { return typeof first === 'function' ? first() : first; }
  };
}

function checkoutDatabase() {
  return {
    prepare() { return statement(); },
    async batch() { return []; }
  };
}

const configuredEnv = (database = checkoutDatabase()) => ({
  EON_BILLING_ROLLOUT: 'testing',
  EON_BILLING_DB: database,
  DODO_PAYMENTS_API_KEY: 'test-only-key',
  DODO_WEBHOOK_SECRET: 'test-only-webhook-secret',
  EON_ENTITLEMENT_SIGNING_KEY: 'test-only-entitlement-key',
  DODO_PRODUCT_PLUS: 'p_plus',
  DODO_PRODUCT_STUDIO: 'p_studio',
  DODO_PRODUCT_POWER: 'p_power',
  DODO_PRODUCT_MAX: 'p_max',
  DODO_PRODUCT_PRO: 'p_pro',
  DODO_PRODUCT_ULTRA: 'p_ultra'
});

test('W636 canonical contract and source gate pass without claiming production certification', () => {
  assert.equal(validateW636SecurityPrivacyAbuseContract().ok, true);
  const result = inspectW636SecurityPrivacyAbuse({ writeArtifact: false });
  assert.equal(result.ok, true, result.checks.filter((row) => !row.pass).map((row) => `${row.id}: ${row.detail}`).join('\n'));
  assert.equal(result.productionCertified, false);
  assert.match(result.limitations.join(' '), /penetration|Cloudflare|Dodo/i);
});

test('W646 trusted dynamic UI uses the bundled DOMPurify dependency in fresh browser contexts', () => {
  const source = fs.readFileSync(path.join(root, 'assets/js/utils/safe-html.js'), 'utf8');
  assert.match(source, /import DOMPurifyLib from 'dompurify'/);
  assert.match(source, /if \(DOMPurifyLib\?\.sanitize\)/);
  assert.match(source, /if \(appWin\.DOMPurify\?\.sanitize\)/);
  assert.ok(source.indexOf('if (DOMPurifyLib?.sanitize)') < source.indexOf('if (appWin.DOMPurify?.sanitize)'));
  assert.match(source, /if \(isAiOutput === 'ui' && !getPurify\(\)\)/);
  assert.match(source, /'select', 'option', 'textarea'/);
});

test('W636 bounded request parsing rejects unsupported, malformed and oversized bodies', async () => {
  const unsupported = await readBoundedJson(new Request('https://eonapp.ch/api', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{}' }));
  assert.deepEqual({ ok: unsupported.ok, status: unsupported.status, error: unsupported.error }, { ok: false, status: 415, error: 'unsupported_media_type' });

  const malformed = await readBoundedJson(new Request('https://eonapp.ch/api', { method: 'POST', headers: { 'content-type': 'application/problem+json' }, body: '{' }));
  assert.equal(malformed.status, 400);
  assert.equal(malformed.error, 'invalid_json');

  const declared = await readBoundedText(new Request('https://eonapp.ch/api', { method: 'POST', headers: { 'content-length': '100' }, body: 'x' }), { maxBytes: 10 });
  assert.equal(declared.status, 413);

  const streamed = await readBoundedText(new Request('https://eonapp.ch/api', { method: 'POST', body: 'x'.repeat(128) }), { maxBytes: 64 });
  assert.equal(streamed.status, 413);

  const invalidLength = await readBoundedText({ headers: new Headers({ 'content-length': '12oops' }), body: null }, { maxBytes: 64 });
  assert.equal(invalidLength.error, 'invalid_content_length');

  const primitive = await readBoundedJson(new Request('https://eonapp.ch/api', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '[]' }));
  assert.equal(primitive.error, 'json_object_required');

  const invalidUtf8 = await readBoundedText(new Request('https://eonapp.ch/api', { method: 'POST', body: new Uint8Array([0xc3, 0x28]) }), { maxBytes: 64 });
  assert.equal(invalidUtf8.error, 'invalid_utf8');
  assert.equal(EON_REQUEST_LIMITS.providerWebhook, 256 * 1024);
});

test('W636 external checkout URL validation is HTTPS and Dodo-host bound', () => {
  assert.equal(safeDodoUrl('https://checkout.dodopayments.com/session/abc'), 'https://checkout.dodopayments.com/session/abc');
  assert.equal(safeDodoUrl('http://checkout.dodopayments.com/session/abc'), '');
  assert.equal(safeDodoUrl('https://dodopayments.com.evil.example/session/abc'), '');
  assert.equal(safeDodoUrl('https://user:pass@checkout.dodopayments.com/session/abc'), '');
});

test('W636 checkout refuses an untrusted provider URL and suppresses provider session ids', async () => {
  const database = migratedBillingDatabase();
  const result = await createDodoCheckoutSession({
    request: new Request('https://eonapp.ch/api/billing/checkout', { method: 'POST' }),
    env: configuredEnv(database),
    accountId: 'private-account',
    input: { tier: 'plus', idempotencyKey: 'checkout:plus:w636-safe' },
    fetchImpl: async () => new Response(JSON.stringify({ checkout_url: 'https://dodopayments.com.evil.example/x', session_id: 'provider-private-session' }), { status: 200, headers: { 'content-type': 'application/json' } })
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'untrusted_checkout_url');
  assert.doesNotMatch(JSON.stringify(result), /provider-private-session/);
  database.sqlite.close();
});

test('W636 public billing status suppresses private account and provider identifiers', () => {
  const status = buildBillingStatusPayload(configuredEnv(), 'private-account-id', {
    tier_id: 'studio',
    status: 'active',
    provider_customer_ref: 'customer-private',
    provider_subscription_ref: 'subscription-private'
  });
  assert.equal(status.account.signedIn, true);
  assert.equal(status.account.accountId, undefined);
  assert.doesNotMatch(JSON.stringify(status), /private-account-id|customer-private|subscription-private/);
});

test('W636 duplicate webhook ids are cryptographically bound to the original payload', async () => {
  const database = migratedBillingDatabase();
  database.sqlite.prepare(`INSERT INTO eon_billing_events (provider_event_id, provider, raw_event_type, event_type, occurred_at, processed_at, payload_hash, processing_status) VALUES (?, 'dodo', ?, ?, ?, ?, ?, 'processed')`)
    .run('evt_same', 'subscription.active', 'subscription_active', Date.now(), Date.now(), 'definitely-not-the-new-hash');
  const result = await applyDodoWebhookToD1(database, {
    providerEventId: 'evt_same',
    rawEventType: 'subscription.active',
    eventType: 'subscription_active',
    accountId: 'acct',
    tierId: 'plus',
    occurredAt: Date.now()
  }, '{"different":true}');
  assert.equal(result.ok, false);
  assert.equal(result.conflict, true);
  assert.equal(result.status, 'webhook_id_payload_mismatch');
  database.sqlite.close();
});


test('W636 JSON API headers deny framing, cross-origin embedding and ambient device permissions', () => {
  const headers = securityHeaders();
  assert.equal(headers['x-frame-options'], 'DENY');
  assert.equal(headers['cross-origin-resource-policy'], 'same-origin');
  assert.match(headers['permissions-policy'], /camera=\(\).*microphone=\(\).*geolocation=\(\)/);
});


test('W636 retires the misleading legacy quantum-safe write/export surface', async () => {
  await assert.rejects(() => storeQuantumSafeKey(), (error) => error?.code === 'legacy-provider-key-store-retired');
  await assert.rejects(() => exportKeyBackup(), (error) => error?.code === 'legacy-provider-key-export-retired');
  await assert.rejects(() => importKeyBackup(), (error) => error?.code === 'legacy-provider-key-import-retired');
  const status = await getQuantumSafeStatus();
  assert.equal(status.postQuantumReady, false);
  assert.equal(status.writable, false);
  assert.equal(status.exportable, false);
  assert.equal(status.legacyMigrationOnly, true);
});

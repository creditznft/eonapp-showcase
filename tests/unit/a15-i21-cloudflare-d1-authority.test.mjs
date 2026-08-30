import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import {
  EON_D1_SCHEMA_AUTHORITY,
  assertD1SchemaAuthority,
  clearD1SchemaAuthorityCache,
  getD1SchemaAuthorityTruth,
  readD1SchemaAuthority
} from '../../assets/js/infrastructure/eon-d1-schema-authority.js';
import { ensureBillingSchema } from '../../assets/js/billing/eon-dodo-live-runtime.js';
import { ensureReferralSchema } from '../../assets/js/referrals/eon-referral-server-runtime.js';
import { readPublicServiceStatus } from '../../assets/js/trust/eon-trust-support-ledger.js';
import {
  applyBillingMigrations,
  applyIdentityMigrations,
  applyReferralMigrations,
  applyTrustMigrations
} from '../helpers/eon-d1-test-migrations.mjs';
import { getCloudflareReleaseAuthorityTruth, readCloudflareReleaseAuthority } from '../../functions/_shared/eon-cloudflare-release-authority.js';

class Statement {
  constructor(db, sql, args = []) { this.db = db; this.sql = sql; this.args = args; }
  bind(...args) { return new Statement(this.db, this.sql, args); }
  run() { return this.db.prepare(this.sql).run(...this.args); }
  first() { return this.db.prepare(this.sql).get(...this.args) || null; }
  all() { return { results: this.db.prepare(this.sql).all(...this.args) }; }
}
function makeD1(apply) {
  const sqlite = new DatabaseSync(':memory:');
  if (apply) apply(sqlite);
  return { sqlite, prepare(sql) { return new Statement(sqlite, sql); } };
}

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('A15 I21 source-controlled Pages config repeats non-inheritable variables and D1 bindings', () => {
  const config = JSON.parse(read('wrangler.jsonc'));
  assert.equal(config.pages_build_output_dir, './dist');
  assert.equal('main' in config, false);
  const expectedBindings = Object.values(EON_D1_SCHEMA_AUTHORITY).map((item) => item.binding).sort();
  for (const environment of ['preview', 'production']) {
    const expected = expectedBindings;
    assert.deepEqual(config.env[environment].d1_databases.map((item) => item.binding).sort(), expected);
    assert.equal(config.env[environment].vars.EON_RELEASE_AUTHORITY_ID, 'a15-i21-v1');
    assert.equal(config.env[environment].d1_databases.every((item) => item.migrations_dir), true);
  }
  assert.doesNotMatch(JSON.stringify(config.env.preview), /REPLACE_WITH_/);
  assert.doesNotMatch(JSON.stringify(config.env.production), /REPLACE_WITH_/);
  const previewTrust = config.env.preview.d1_databases.find((item) => item.binding === 'EON_TRUST_DB');
  const productionTrust = config.env.production.d1_databases.find((item) => item.binding === 'EON_TRUST_DB');
  assert.equal(previewTrust.database_name, 'eonapp-trust-preview');
  assert.equal(productionTrust.database_name, 'eonapp-trust');
  assert.notEqual(previewTrust.database_id, productionTrust.database_id);
});

test('A15 I21 all four ordered migration domains produce exact schema receipts', async () => {
  const fixtures = [
    ['identity', applyIdentityMigrations], ['billing', applyBillingMigrations],
    ['referrals', applyReferralMigrations], ['trust', applyTrustMigrations]
  ];
  for (const [domain, apply] of fixtures) {
    const db = makeD1(apply);
    const receipt = await assertD1SchemaAuthority(db, domain);
    assert.equal(receipt.ok, true);
    assert.equal(receipt.version, EON_D1_SCHEMA_AUTHORITY[domain].version);
    const row = await readD1SchemaAuthority(db, domain);
    assert.equal(row.actualVersion, EON_D1_SCHEMA_AUTHORITY[domain].version);
    assert.match(row.migrationName, /\.sql$/);
    db.sqlite.close();
  }
});

test('A15 I21 missing, older and newer schema versions fail closed', async () => {
  const missing = makeD1();
  await assert.rejects(() => assertD1SchemaAuthority(missing, 'billing'), /billing_schema_authority_unavailable/);
  missing.sqlite.close();

  for (const version of [0, 3]) {
    const db = makeD1(applyBillingMigrations);
    db.sqlite.prepare("UPDATE eon_schema_authority SET schema_version=? WHERE domain='billing'").run(version);
    clearD1SchemaAuthorityCache(db);
    await assert.rejects(() => assertD1SchemaAuthority(db, 'billing'), new RegExp(`expected_2_actual_${version}`));
    db.sqlite.close();
  }
});

test('A15 I21 billing, referral and trust runtime refuse an unmigrated database', async () => {
  const billing = makeD1();
  const referrals = makeD1();
  const trust = makeD1();
  await assert.rejects(() => ensureBillingSchema(billing), /billing_schema_authority_unavailable/);
  await assert.rejects(() => ensureReferralSchema(referrals), /referrals_schema_authority_unavailable/);
  await assert.rejects(() => readPublicServiceStatus(trust), /trust_schema_authority_unavailable/);
  billing.sqlite.close(); referrals.sqlite.close(); trust.sqlite.close();
});

test('A15 I21 operator release status is redacted and ready only for exact source authority plus all schemas', async () => {
  const env = {
    EON_ENVIRONMENT: 'preview', EON_RELEASE_AUTHORITY_ID: 'a15-i21-v1',
    EON_IDENTITY_DB: makeD1(applyIdentityMigrations), EON_BILLING_DB: makeD1(applyBillingMigrations),
    EON_REFERRALS_DB: makeD1(applyReferralMigrations), EON_TRUST_DB: makeD1(applyTrustMigrations)
  };
  const status = await readCloudflareReleaseAuthority(env);
  assert.equal(status.ready, true);
  assert.equal(status.schemasReady, true);
  assert.equal(status.databaseIdsExposed, false);
  assert.equal(status.secretsExposed, false);
  assert.equal(JSON.stringify(status).includes('database_id'), false);
  env.EON_RELEASE_AUTHORITY_ID = 'wrong';
  assert.equal((await readCloudflareReleaseAuthority(env)).ready, false);
  for (const db of [env.EON_IDENTITY_DB, env.EON_BILLING_DB, env.EON_REFERRALS_DB, env.EON_TRUST_DB]) db.sqlite.close();
});

test('A15 I21 truth prohibits request-time DDL and unresolved deployment claims', () => {
  const schemaTruth = getD1SchemaAuthorityTruth();
  const releaseTruth = getCloudflareReleaseAuthorityTruth();
  assert.equal(schemaTruth.requestTimeDdl, false);
  assert.equal(schemaTruth.exactVersionRequired, true);
  assert.equal(releaseTruth.unresolvedPlaceholdersBlockDeployment, true);
  assert.equal(releaseTruth.databaseIdentifiersReturnedToBrowser, false);
  const runtime = [
    'assets/js/billing/eon-billing-command-ledger.js', 'assets/js/billing/eon-dodo-live-runtime.js',
    'assets/js/referrals/eon-referral-server-runtime.js', 'assets/js/trust/eon-trust-support-ledger.js',
    'functions/_shared/eon-auth.js'
  ].map(read).join('\n');
  assert.doesNotMatch(runtime, /\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|VIEW)\b/i);
});

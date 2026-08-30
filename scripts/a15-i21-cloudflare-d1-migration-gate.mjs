import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { EON_D1_SCHEMA_AUTHORITY } from '../assets/js/infrastructure/eon-d1-schema-authority.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(path.join(ROOT, file), 'utf8');
const digest = (value) => createHash('sha256').update(value).digest('hex');
const errors = [];
const config = JSON.parse(read('wrangler.jsonc'));
const authority = JSON.parse(read('config/cloudflare/eon-pages-source-authority.json'));
const expectedBindings = authority.bindings.map((item) => item.binding).sort();
// Preview is intentionally isolated from Production while still exercising the
// same complete D1 binding surface as a production candidate.
const expectedPreviewBindings = ['EON_BILLING_DB', 'EON_IDENTITY_DB', 'EON_REFERRALS_DB', 'EON_TRUST_DB'];
const requiredVars = ['EON_ENVIRONMENT', 'EON_RELEASE_AUTHORITY_ID', 'APP_ORIGIN', 'GOOGLE_REDIRECT_URI', 'EON_AUTH_ROLLOUT', 'EON_BILLING_ROLLOUT', 'EON_REFERRAL_ROLLOUT'];

if (config.pages_build_output_dir !== './dist' || config.main) errors.push('pages-config-not-source-authority');
if (config.compatibility_date !== authority.compatibilityDate) errors.push('compatibility-date-mismatch');
for (const environment of ['preview', 'production']) {
  const block = config.env?.[environment];
  if (!block) { errors.push(`environment-missing:${environment}`); continue; }
  for (const variable of requiredVars) if (!(variable in (block.vars || {}))) errors.push(`environment-var-missing:${environment}:${variable}`);
  const bindings = (block.d1_databases || []).map((item) => item.binding).sort();
  const expectedEnvironmentBindings = environment === 'preview' ? expectedPreviewBindings : expectedBindings;
  if (JSON.stringify(bindings) !== JSON.stringify(expectedEnvironmentBindings)) errors.push(`environment-bindings-mismatch:${environment}`);
  for (const item of block.d1_databases || []) {
    const expected = authority.bindings.find((candidate) => candidate.binding === item.binding);
    if (!expected || item.migrations_dir !== expected.migrationsDir) errors.push(`migration-dir-mismatch:${environment}:${item.binding}`);
  }
}
const unresolvedPlaceholders = [];
for (const environment of ['preview', 'production']) {
  for (const item of config.env?.[environment]?.d1_databases || []) if (/REPLACE_WITH_/.test(item.database_id || '')) unresolvedPlaceholders.push(`${environment}:${item.binding}`);
  for (const [key, value] of Object.entries(config.env?.[environment]?.vars || {})) if (/REPLACE_WITH_/.test(String(value))) unresolvedPlaceholders.push(`${environment}:var:${key}`);
}
if (unresolvedPlaceholders.length) errors.push(`unresolved-placeholders:${unresolvedPlaceholders.join(',')}`);

const runtimeFiles = [
  'assets/js/billing/eon-billing-command-ledger.js', 'assets/js/billing/eon-dodo-live-runtime.js',
  'assets/js/referrals/eon-referral-server-runtime.js', 'assets/js/trust/eon-trust-support-ledger.js',
  'functions/_shared/eon-auth.js', 'functions/_shared/eon-cloudflare-release-authority.js'
];
for (const file of runtimeFiles) if (/\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|VIEW)\b/i.test(read(file))) errors.push(`request-time-ddl:${file}`);

const migrationManifest = [];
const stagedMigrationManifest = [];
const migrationVersion = (name = '') => { const match = String(name).match(/^(\d+)/); return match ? Number(match[1]) : 0; };
const premiumProductionActive = config.env?.production?.vars?.EON_PREMIUM_CHECKOUT_ROLLOUT === 'production';
const PREMIUM_BILLING_MIGRATION = '0003_premium_software_grants.sql';
for (const [domain, expected] of Object.entries(EON_D1_SCHEMA_AUTHORITY)) {
  const dir = path.join(ROOT, expected.migrationsDir);
  const files = existsSync(dir) ? readdirSync(dir).filter((name) => /^\d+.*\.sql$/.test(name)).sort() : [];
  if (!files.length) { errors.push(`migrations-missing:${domain}`); continue; }
  const coreActiveFiles = files.filter((name) => migrationVersion(name) <= expected.version);
  const premiumBillingFiles = domain === 'billing' && premiumProductionActive && files.includes(PREMIUM_BILLING_MIGRATION) ? [PREMIUM_BILLING_MIGRATION] : [];
  const activeFiles = [...new Set([...coreActiveFiles, ...premiumBillingFiles])].sort();
  const stagedFiles = files.filter((name) => !activeFiles.includes(name));
  if (!coreActiveFiles.length || migrationVersion(coreActiveFiles.at(-1)) !== expected.version) errors.push(`active-migration-version-mismatch:${domain}`);
  for (const name of stagedFiles) {
    const relative = path.posix.join(expected.migrationsDir, name);
    const source = read(relative);
    stagedMigrationManifest.push({ domain, binding: expected.binding, file: relative, version: migrationVersion(name), bytes: Buffer.byteLength(source), sha256: digest(source) });
  }
  const sqlite = new DatabaseSync(':memory:');
  try {
    for (const name of activeFiles) {
      const relative = path.posix.join(expected.migrationsDir, name);
      const source = read(relative);
      sqlite.exec(source);
      migrationManifest.push({ domain, binding: expected.binding, file: relative, bytes: Buffer.byteLength(source), sha256: digest(source) });
    }
    const row = sqlite.prepare('SELECT domain, schema_version, migration_name FROM eon_schema_authority WHERE domain=?').get(domain);
    if (!row || Number(row.schema_version) !== expected.version) errors.push(`schema-version-mismatch:${domain}`);
    if (row && row.migration_name !== coreActiveFiles.at(-1)) errors.push(`schema-migration-name-mismatch:${domain}`);
    if (domain === 'billing' && premiumProductionActive) {
      const premium = sqlite.prepare('SELECT domain, schema_version, migration_name FROM eon_schema_authority WHERE domain=?').get('premium_billing');
      if (!premium || Number(premium.schema_version) !== 1 || premium.migration_name !== PREMIUM_BILLING_MIGRATION) errors.push('schema-version-mismatch:premium_billing');
    }
  } catch (error) {
    errors.push(`migration-apply-failed:${domain}:${String(error?.message || error)}`);
  } finally { sqlite.close(); }
}

for (const secret of authority.requiredSecrets || []) {
  if (JSON.stringify(config).includes(secret) && Object.prototype.hasOwnProperty.call(config.vars || {}, secret)) errors.push(`secret-committed:${secret}`);
}
const manifestCore = {
  schema: 'eonapp.a15.i21.d1-migration-manifest.v1', generatedAt: new Date().toISOString(),
  releaseAuthorityId: authority.releaseAuthorityId, migrations: migrationManifest, stagedMigrations: stagedMigrationManifest,
  requestTimeDdl: false, unresolvedPlaceholders, externalConfigReady: unresolvedPlaceholders.length === 0, productionAuthorized: false
};
const manifest = { ...manifestCore, digest: digest(JSON.stringify(manifestCore)) };
const manifestPath = path.join(ROOT, 'config/cloudflare/generated/eon-d1-migration-manifest.json');
mkdirSync(path.dirname(manifestPath), { recursive: true });
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const core = {
  schema: 'eonapp.a15.i21.cloudflare-d1-gate-receipt.v1', generatedAt: new Date().toISOString(), wave: 'I21',
  status: errors.length ? 'fail' : 'pass', sourceControlledPagesConfig: true, exactSchemaVersionsRequired: true,
  requestTimeDdl: false, migrationCount: migrationManifest.length, stagedMigrationCount: stagedMigrationManifest.length, migrationManifestDigest: manifest.digest,
  unresolvedPlaceholders, externalConfigReady: unresolvedPlaceholders.length === 0, previewDeployed: false, productionAuthorized: false, productionDeployed: false,
  recoveryRehearsalPerformed: false, databaseIdsStoredInReceipt: false, secretValuesStoredInReceipt: false, errors
};
const receipt = { ...core, digest: digest(JSON.stringify(core)) };
const receiptPath = path.join(ROOT, 'docs/institutional/a15/evidence/A15_I21_CLOUDFLARE_D1_GATE_RECEIPT.json');
mkdirSync(path.dirname(receiptPath), { recursive: true });
writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[A15 I21] ${receipt.status.toUpperCase()}: ${migrationManifest.length} active migrations; ${stagedMigrationManifest.length} future staged; request-time DDL prohibited; deployment remains fail-closed.`);
if (errors.length) { errors.forEach((error) => console.error(`[A15 I21] ${error}`)); process.exitCode = 1; }

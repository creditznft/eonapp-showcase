/** A15 I21 — one fail-closed D1 schema-version authority. */
export const EON_D1_SCHEMA_AUTHORITY = Object.freeze({
  identity: Object.freeze({ binding: 'EON_IDENTITY_DB', version: 6, migrationsDir: 'identity/migrations' }),
  billing: Object.freeze({ binding: 'EON_BILLING_DB', version: 2, migrationsDir: 'migrations/billing' }),
  referrals: Object.freeze({ binding: 'EON_REFERRALS_DB', version: 5, migrationsDir: 'migrations/referrals' }),
  trust: Object.freeze({ binding: 'EON_TRUST_DB', version: 4, migrationsDir: 'migrations/trust' })
});

const cache = new WeakMap();
function normalizeDomain(value = '') { return String(value || '').trim().toLowerCase(); }
function expectedFor(domain = '') {
  const normalized = normalizeDomain(domain);
  const expected = EON_D1_SCHEMA_AUTHORITY[normalized];
  if (!expected) throw new Error('d1_schema_domain_unknown');
  return { domain: normalized, ...expected };
}

export function clearD1SchemaAuthorityCache(database) {
  if (database && typeof database === 'object') cache.delete(database);
}

export async function readD1SchemaAuthority(database, domain = '') {
  if (!database?.prepare) throw new Error('d1_schema_database_missing');
  const expected = expectedFor(domain);
  try {
    const row = await database.prepare(`
      SELECT domain, schema_version, migration_name, applied_at
      FROM eon_schema_authority
      WHERE domain = ?
      LIMIT 1
    `).bind(expected.domain).first();
    return Object.freeze({
      ok: Boolean(row),
      domain: expected.domain,
      binding: expected.binding,
      expectedVersion: expected.version,
      actualVersion: Number(row?.schema_version || 0),
      migrationName: String(row?.migration_name || ''),
      appliedAt: Number(row?.applied_at || 0),
      reason: row ? '' : 'schema_authority_missing'
    });
  } catch {
    return Object.freeze({ ok: false, domain: expected.domain, binding: expected.binding, expectedVersion: expected.version, actualVersion: 0, migrationName: '', appliedAt: 0, reason: 'schema_authority_unavailable' });
  }
}

export async function assertD1SchemaAuthority(database, domain = '') {
  if (!database?.prepare) throw new Error('d1_schema_database_missing');
  const expected = expectedFor(domain);
  let databaseCache = cache.get(database);
  if (!databaseCache) { databaseCache = new Map(); cache.set(database, databaseCache); }
  if (databaseCache.get(expected.domain) === expected.version) return Object.freeze({ ok: true, cached: true, ...expected });
  const status = await readD1SchemaAuthority(database, expected.domain);
  if (!status.ok) throw new Error(`${expected.domain}_${status.reason}`);
  if (status.actualVersion !== expected.version) throw new Error(`${expected.domain}_schema_version_mismatch_expected_${expected.version}_actual_${status.actualVersion}`);
  databaseCache.set(expected.domain, expected.version);
  return Object.freeze({ ok: true, cached: false, ...expected, migrationName: status.migrationName, appliedAt: status.appliedAt });
}

export function getD1SchemaAuthorityTruth() {
  return Object.freeze({
    schema: 'eonapp.a15.i21.d1-schema-authority.v1',
    requestTimeDdl: false,
    migrationsOnly: true,
    exactVersionRequired: true,
    missingOrNewerSchemaFailsClosed: true,
    domains: Object.freeze(Object.keys(EON_D1_SCHEMA_AUTHORITY))
  });
}

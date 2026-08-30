# A15 I21 Cloudflare Pages and D1 migration runbook

## Scope

This runbook governs the source-controlled Cloudflare Pages configuration and the four isolated D1 authorities: Identity, Billing, Referrals and Trust. It does not authorize Preview or Production deployment.

## Non-negotiable controls

1. `wrangler.jsonc` is the intended source authority. Dashboard-only changes are drift until reconciled into source.
2. Preview and Production repeat every non-inheritable variable and D1 binding explicitly.
3. Database IDs and secrets are never committed. The `REPLACE_WITH_...` values deliberately block deployment from this checkpoint.
4. All schema changes occur through ordered SQL migrations. Pages Functions must never issue `CREATE`, `ALTER` or `DROP` statements during a request.
5. Every request touching D1 verifies the exact `eon_schema_authority` version and fails closed when it is absent, older or newer.
6. Identity, Billing, Referrals and Trust remain separate databases. A binding name is not a database migration target.

## Owner reconciliation before Preview

1. Export or inspect the current Cloudflare Pages project configuration and compare it with `wrangler.jsonc`.
2. Record the exact Preview and Production database IDs privately.
3. Replace placeholders only in the controlled deployment workspace or configure the deployment process to inject the exact IDs. Never place secrets in the file.
4. Confirm the production database names and bindings match the source authority manifest.
5. Confirm all required secrets exist through Cloudflare secret configuration. Do not print secret values.

## Migration rehearsal

For each environment and each database, in dependency order:

1. Create a D1 backup or record the available Time Travel restore point.
2. Apply migrations to the immutable database name/ID, not merely a binding label.
3. Query `eon_schema_authority` and verify the exact version:
   - identity: 2
   - billing: 1
   - referrals: 3
   - trust: 1
4. Run the operator-only `/api/trust/schema-status` check.
5. Run Identity, Billing, Referral and Trust hostile-journey tests.
6. Rehearse restoration into a separate recovery database and verify record counts/digests.
7. Preserve a sanitized migration receipt containing database name, migration filenames/digests, schema version, timestamp and recovery target—never the database ID or secrets.

## Rollback rule

Application rollback is allowed only to a release compatible with the active schema. Database rollback uses the rehearsed restore/Time Travel path, never reverse DDL from a user request. If compatibility cannot be proven, stop promotion and keep the prior healthy release active.

## Current checkpoint truth

- Source configuration: present.
- Ordered migrations: present.
- Request-time DDL: prohibited and gated.
- Exact database IDs: unresolved.
- Required secrets: not inspected or stored by this source run.
- Preview deployment: not attempted.
- Production deployment: not authorized or attempted.

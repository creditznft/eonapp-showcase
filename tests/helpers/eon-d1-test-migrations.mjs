import { readFileSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url);

function applyMigrations(sqlite, paths = []) {
  for (const path of paths) sqlite.exec(readFileSync(new URL(path, ROOT), 'utf8'));
  return sqlite;
}

export function applyIdentityMigrations(sqlite) {
  return applyMigrations(sqlite, [
    'identity/migrations/0001_eon_identity.sql',
    'identity/migrations/0002_identity_schema_authority.sql',
    'identity/migrations/0003_push_subscription_authority.sql',
    'identity/migrations/0004_notification_retention_reminders.sql',
    'identity/migrations/0005_notification_scale_indexes.sql',
    'identity/migrations/0006_notification_policy_authority.sql'
  ]);
}

export function applyBillingMigrations(sqlite) {
  return applyMigrations(sqlite, [
    'migrations/billing/0001_billing_command_entitlement_authority.sql',
    'migrations/billing/0002_billing_payment_reference_authority.sql'
  ]);
}

export function applyPremiumBillingMigration(sqlite) {
  return applyMigrations(sqlite, ['migrations/billing/0003_premium_software_grants.sql']);
}

export function applyReferralMigrations(sqlite) {
  return applyMigrations(sqlite, [
    'migrations/referrals/0001_referral_authority.sql',
    'migrations/referrals/0002_referral_operational_views.sql',
    'migrations/referrals/0003_referral_schema_authority.sql',
    'migrations/referrals/0004_rewarded_sponsor_eonkeys.sql',
    'migrations/referrals/0005_rewarded_sponsor_runtime.sql'
  ]);
}

export function applyTrustMigrations(sqlite) {
  return applyMigrations(sqlite, [
    'migrations/trust/0001_trust_support_incident_authority.sql',
    'migrations/trust/0002_vexrail_economic_aggregate.sql',
    'migrations/trust/0003_growth_profitability_authority.sql'
  ]);
}

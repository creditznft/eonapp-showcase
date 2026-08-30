-- RT92 billing hardening: retain provider payment -> EON account ownership so
-- refund/dispute webhooks can reconcile even when their payload omits EON metadata.
CREATE TABLE IF NOT EXISTS eon_billing_payment_refs (
  payment_ref TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  tier_id TEXT NOT NULL,
  provider_subscription_ref TEXT,
  provider_customer_ref TEXT,
  source_event_id TEXT NOT NULL,
  occurred_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_eon_billing_payment_refs_account
  ON eon_billing_payment_refs(account_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_eon_billing_payment_refs_subscription
  ON eon_billing_payment_refs(provider_subscription_ref, occurred_at DESC);

INSERT INTO eon_schema_authority(domain, schema_version, migration_name, applied_at)
VALUES ('billing', 2, '0002_billing_payment_reference_authority.sql', unixepoch() * 1000)
ON CONFLICT(domain) DO UPDATE SET
  schema_version=excluded.schema_version,
  migration_name=excluded.migration_name,
  applied_at=excluded.applied_at;

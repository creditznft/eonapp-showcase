-- RT92 premium software-capability authority.
-- This migration deliberately does NOT change the existing `billing` schema
-- authority version. Premium software grants are a separate axis in the same
-- EON billing D1, allowing Ultimate to coexist with a recurring capacity tier.
CREATE TABLE IF NOT EXISTS eon_software_grants (
  grant_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  bundle_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('active','revoked')),
  source_provider TEXT NOT NULL,
  source_event_id TEXT NOT NULL,
  source_order_ref TEXT NOT NULL,
  source_payment_ref TEXT,
  issued_at INTEGER NOT NULL,
  revoked_at INTEGER,
  revocation_reason TEXT,
  updated_at INTEGER NOT NULL,
  UNIQUE(source_provider, source_order_ref)
);
CREATE INDEX IF NOT EXISTS idx_eon_software_grants_account_status
  ON eon_software_grants(account_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_eon_software_grants_payment
  ON eon_software_grants(source_payment_ref, updated_at DESC);

CREATE TABLE IF NOT EXISTS eon_software_grant_events (
  provider_event_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  raw_event_type TEXT NOT NULL,
  event_type TEXT NOT NULL,
  account_id TEXT,
  bundle_id TEXT,
  source_order_ref TEXT,
  source_payment_ref TEXT,
  occurred_at INTEGER NOT NULL,
  processed_at INTEGER NOT NULL,
  payload_hash TEXT NOT NULL,
  processing_status TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_eon_software_grant_events_account
  ON eon_software_grant_events(account_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_eon_software_grant_events_payment
  ON eon_software_grant_events(source_payment_ref, occurred_at DESC);

INSERT INTO eon_schema_authority(domain, schema_version, migration_name, applied_at)
VALUES ('premium_billing', 1, '0003_premium_software_grants.sql', unixepoch() * 1000)
ON CONFLICT(domain) DO UPDATE SET
  schema_version=excluded.schema_version,
  migration_name=excluded.migration_name,
  applied_at=excluded.applied_at;

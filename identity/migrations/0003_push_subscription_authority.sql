-- Institutional AI V2 — optional Web Push subscription custody for signed-in devices.
-- Stores no prompt, chat, project, Creator artifact, provider key, raw email, or notification body.
-- The browser PushSubscription JSON is encrypted by the application before persistence.
CREATE TABLE IF NOT EXISTS eon_push_subscriptions (
  subscription_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  endpoint_hash TEXT NOT NULL UNIQUE,
  encrypted_subscription TEXT NOT NULL,
  encryption_iv TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_success_at INTEGER,
  last_failure_at INTEGER,
  disabled_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_eon_push_subscriptions_account_id
  ON eon_push_subscriptions(account_id);
CREATE INDEX IF NOT EXISTS idx_eon_push_subscriptions_active
  ON eon_push_subscriptions(account_id, disabled_at, updated_at);

INSERT INTO eon_schema_authority(domain, schema_version, migration_name, applied_at)
VALUES ('identity', 3, '0003_push_subscription_authority.sql', unixepoch() * 1000)
ON CONFLICT(domain) DO UPDATE SET
  schema_version=excluded.schema_version,
  migration_name=excluded.migration_name,
  applied_at=excluded.applied_at;

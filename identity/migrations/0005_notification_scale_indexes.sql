-- RT86 — scale indexes for minute-level Web Push reminder release + bounded cleanup.
-- No notification body, prompt, project name, provider key or marketing profile is stored.
-- Retire superseded broad indexes before the high-volume path goes live.
-- The partial indexes below cover the live queries with less write amplification.
DROP INDEX IF EXISTS idx_eon_push_reminders_due;
DROP INDEX IF EXISTS idx_eon_push_reminders_account;
DROP INDEX IF EXISTS idx_eon_push_subscriptions_account_id;

CREATE INDEX IF NOT EXISTS idx_eon_push_reminders_pending_due
  ON eon_push_reminders(due_at, attempt_count, last_attempt_at)
  WHERE delivered_at IS NULL AND cancelled_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_eon_push_reminders_terminal_cleanup
  ON eon_push_reminders(updated_at)
  WHERE delivered_at IS NOT NULL OR cancelled_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_eon_push_subscriptions_disabled_cleanup
  ON eon_push_subscriptions(updated_at)
  WHERE disabled_at IS NOT NULL;

INSERT INTO eon_schema_authority(domain, schema_version, migration_name, applied_at)
VALUES ('identity', 5, '0005_notification_scale_indexes.sql', unixepoch() * 1000)
ON CONFLICT(domain) DO UPDATE SET
  schema_version=excluded.schema_version,
  migration_name=excluded.migration_name,
  applied_at=excluded.applied_at;

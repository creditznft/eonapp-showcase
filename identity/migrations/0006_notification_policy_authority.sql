-- RT92 — explicit return-reminder quiet-hours, expiry and frequency-cap authority.
-- This migration stores only coarse delivery policy. It does not store prompt text,
-- project names, notification bodies, marketing profiles or raw click identifiers.
ALTER TABLE eon_push_reminders ADD COLUMN quiet_hours_enabled INTEGER NOT NULL DEFAULT 0 CHECK (quiet_hours_enabled IN (0, 1));
ALTER TABLE eon_push_reminders ADD COLUMN quiet_start_minute INTEGER NOT NULL DEFAULT 1320 CHECK (quiet_start_minute BETWEEN 0 AND 1439);
ALTER TABLE eon_push_reminders ADD COLUMN quiet_end_minute INTEGER NOT NULL DEFAULT 480 CHECK (quiet_end_minute BETWEEN 0 AND 1439);
ALTER TABLE eon_push_reminders ADD COLUMN timezone_offset_minutes INTEGER NOT NULL DEFAULT 0 CHECK (timezone_offset_minutes BETWEEN -840 AND 840);
ALTER TABLE eon_push_reminders ADD COLUMN expires_at INTEGER;

CREATE TABLE IF NOT EXISTS eon_push_reminder_daily_policy (
  account_id TEXT NOT NULL,
  day_started_at INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('return-reminder')),
  scheduled_count INTEGER NOT NULL DEFAULT 0 CHECK (scheduled_count BETWEEN 0 AND 3),
  last_scheduled_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (account_id, day_started_at, kind)
);

CREATE INDEX IF NOT EXISTS idx_eon_push_reminder_daily_policy_cleanup
  ON eon_push_reminder_daily_policy(updated_at);

INSERT INTO eon_schema_authority(domain, schema_version, migration_name, applied_at)
VALUES ('identity', 6, '0006_notification_policy_authority.sql', unixepoch() * 1000)
ON CONFLICT(domain) DO UPDATE SET
  schema_version=excluded.schema_version,
  migration_name=excluded.migration_name,
  applied_at=excluded.applied_at;

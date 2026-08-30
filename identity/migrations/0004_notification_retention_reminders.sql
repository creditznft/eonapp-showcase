-- Institutional AI V2 — explicit, content-free return reminder schedule.
-- Reminders contain only an internal EONAPP route and due time. No project names,
-- prompts, media, user-authored body text or marketing profile is stored.
CREATE TABLE IF NOT EXISTS eon_push_reminders (
  reminder_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('return-reminder')),
  route TEXT NOT NULL,
  due_at INTEGER NOT NULL,
  consent_version TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at INTEGER,
  delivered_at INTEGER,
  cancelled_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_eon_push_reminders_due
  ON eon_push_reminders(due_at, delivered_at, cancelled_at);
CREATE INDEX IF NOT EXISTS idx_eon_push_reminders_account
  ON eon_push_reminders(account_id, delivered_at, cancelled_at, due_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_eon_push_reminders_one_pending_per_account
  ON eon_push_reminders(account_id)
  WHERE delivered_at IS NULL AND cancelled_at IS NULL;

INSERT INTO eon_schema_authority(domain, schema_version, migration_name, applied_at)
VALUES ('identity', 4, '0004_notification_retention_reminders.sql', unixepoch() * 1000)
ON CONFLICT(domain) DO UPDATE SET
  schema_version=excluded.schema_version,
  migration_name=excluded.migration_name,
  applied_at=excluded.applied_at;

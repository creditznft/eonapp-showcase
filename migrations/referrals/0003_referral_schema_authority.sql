-- A15 I21 referral schema completion and exact version receipt.
CREATE TABLE IF NOT EXISTS eon_referral_milestone_challenges (
  challenge_id TEXT PRIMARY KEY,
  invitee_account_id TEXT NOT NULL,
  milestone TEXT NOT NULL,
  challenge_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ready',
  required_steps_version INTEGER NOT NULL DEFAULT 1,
  started_at INTEGER NOT NULL,
  not_before INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  completed_at INTEGER,
  receipt_id TEXT,
  result_status TEXT,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS eon_referral_milestone_steps (
  challenge_id TEXT NOT NULL,
  invitee_account_id TEXT NOT NULL,
  milestone TEXT NOT NULL,
  step TEXT NOT NULL,
  step_index INTEGER NOT NULL,
  recorded_at INTEGER NOT NULL,
  PRIMARY KEY (challenge_id, step)
);
CREATE INDEX IF NOT EXISTS idx_eon_referral_milestone_step_account ON eon_referral_milestone_steps(invitee_account_id, milestone, recorded_at);
CREATE INDEX IF NOT EXISTS idx_eon_referral_milestone_challenge_account ON eon_referral_milestone_challenges(invitee_account_id, milestone, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_eon_referral_milestone_challenge_expiry ON eon_referral_milestone_challenges(status, expires_at);
CREATE TABLE IF NOT EXISTS eon_schema_authority (
  domain TEXT PRIMARY KEY,
  schema_version INTEGER NOT NULL,
  migration_name TEXT NOT NULL,
  applied_at INTEGER NOT NULL
);
INSERT INTO eon_schema_authority(domain, schema_version, migration_name, applied_at)
VALUES ('referrals', 3, '0003_referral_schema_authority.sql', unixepoch() * 1000)
ON CONFLICT(domain) DO UPDATE SET schema_version=excluded.schema_version, migration_name=excluded.migration_name, applied_at=excluded.applied_at;

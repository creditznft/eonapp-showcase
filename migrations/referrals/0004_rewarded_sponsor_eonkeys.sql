-- RT92 monetization — server-authoritative rewarded sponsor sessions.
-- Sponsor EONKEYS are non-cash/non-transferable and may only be issued after
-- a provider-specific server verifier records a qualifying rewarded completion.
-- Ordinary display impressions/clicks are never reward authority.

CREATE TABLE IF NOT EXISTS eon_sponsor_reward_sessions (
  session_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  offer_id TEXT NOT NULL,
  surface TEXT NOT NULL,
  world_id TEXT,
  status TEXT NOT NULL,
  proof_hash TEXT,
  grant_id TEXT,
  issued_at INTEGER NOT NULL,
  started_at INTEGER,
  completed_at INTEGER,
  expires_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_eon_sponsor_reward_proof_once
  ON eon_sponsor_reward_sessions(provider, proof_hash)
  WHERE proof_hash IS NOT NULL AND proof_hash <> '';

CREATE INDEX IF NOT EXISTS idx_eon_sponsor_reward_account
  ON eon_sponsor_reward_sessions(account_id, status, issued_at);

CREATE INDEX IF NOT EXISTS idx_eon_sponsor_reward_expiry
  ON eon_sponsor_reward_sessions(expires_at, status);

INSERT INTO eon_schema_authority (domain, schema_version, migration_name, applied_at)
VALUES ('referrals', 4, '0004_rewarded_sponsor_eonkeys.sql', unixepoch() * 1000)
ON CONFLICT(domain) DO UPDATE SET
  schema_version = excluded.schema_version,
  migration_name = excluded.migration_name,
  applied_at = excluded.applied_at;
